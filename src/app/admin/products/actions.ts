"use server";

import { and, eq, sql } from "drizzle-orm";
import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { categories, products, productStock } from "@/db/schema";
import {
  parseStockQuantity,
  readProductForm,
  STOCK_QUANTITY_ERROR,
  validateNewSize,
  validateProductForm,
  validateSizes,
  type ProductFieldErrors,
  type ProductFormValues,
} from "@/lib/admin/product-validation";
import { requireAdmin } from "@/lib/auth/session";
import { isValidSize, isValidSlug } from "@/lib/bag";

/*
 * Product management. Every action checks the admin role first (Server
 * Actions are public endpoints, whatever the page shows), validates the form
 * with the same rules the browser used, and refreshes the "products" cache
 * tag after a write so the storefront shows it straight away. Prices and
 * stock are read live by the bag and checkout, so an edit can't be charged
 * at a stale price: checkout refuses a bag whose subtotal changed.
 */

export type ProductFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  formError?: string;
  fieldErrors?: ProductFieldErrors;
  /* Echoed back so the form keeps what was typed. */
  values?: ProductFormValues;
};

export type StockActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

const text = (formData: FormData, field: string) => {
  const value = formData.get(field);
  return typeof value === "string" ? value : "";
};

/* Postgres error code (e.g. 23505 unique violation) from a driver error,
 * which Drizzle may wrap in a DrizzleQueryError. */
function pgErrorCode(error: unknown): string | undefined {
  for (let current = error, depth = 0; current && depth < 4; depth++) {
    if (typeof current !== "object") return;
    const { code, cause } = current as { code?: unknown; cause?: unknown };
    if (typeof code === "string" && /^[0-9A-Z]{5}$/.test(code)) return code;
    current = cause;
  }
}

/* A product's internal id by slug, inside the same statement. */
const productIdBySlug = (slug: string) =>
  sql`(select p.id from ${products} p where p.slug = ${slug})`;

async function findCategoryId(slug: string) {
  const [row] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);
  return row?.id;
}

const missingCategory = "That category no longer exists. Choose another.";

export async function createProduct(
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireAdmin("/admin/products/new");

  const values = readProductForm(formData);
  const { errors, product } = validateProductForm(values, { withSlug: true });
  const { error: sizesError, sizes } = validateSizes(values.sizes);
  if (sizesError) errors.sizes = sizesError;
  if (!product || !sizes) return { status: "error", fieldErrors: errors, values };

  const categoryId = await findCategoryId(product.categorySlug);
  if (!categoryId) {
    return { status: "error", fieldErrors: { category: missingCategory }, values };
  }

  /* neon-http has no interactive transactions; a batch runs as one, so the
   * product never exists without its stock rows. */
  try {
    await db.batch([
      db.insert(products).values({
        slug: product.slug,
        name: product.name,
        colour: product.colour,
        description: product.description,
        details: product.details,
        images: product.images,
        priceCents: product.priceCents,
        categoryId,
        isNew: product.isNew,
      }),
      db.insert(productStock).values(
        sizes.map((size, position) => ({
          productId: productIdBySlug(product.slug),
          size: size.label,
          quantity: size.quantity,
          position,
        })),
      ),
    ]);
  } catch (error) {
    if (pgErrorCode(error) === "23505") {
      return {
        status: "error",
        fieldErrors: { slug: "Another product already uses this slug." },
        values,
      };
    }
    console.error("[admin] createProduct failed", error);
    return {
      status: "error",
      formError: "We couldn’t create the product. Please try again.",
      values,
    };
  }

  updateTag("products");
  redirect(`/admin/products/${product.slug}`);
}

/*
 * Saves the product details. The slug is fixed. `version` is the updated_at
 * the form was loaded with: the update only applies if nobody saved in
 * between, so two admins can't silently overwrite each other.
 */
export async function updateProduct(
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireAdmin("/admin/products");

  const slug = text(formData, "slug");
  const version = text(formData, "version");
  if (!isValidSlug(slug) || !version || Number.isNaN(Date.parse(version))) {
    return {
      status: "error",
      formError: "This form is out of date. Reload the page and try again.",
    };
  }

  const values = { ...readProductForm(formData), slug };
  const { errors, product } = validateProductForm(values, { withSlug: false });
  if (!product) return { status: "error", fieldErrors: errors, values };

  const categoryId = await findCategoryId(product.categorySlug);
  if (!categoryId) {
    return { status: "error", fieldErrors: { category: missingCategory }, values };
  }

  const updated = await db
    .update(products)
    .set({
      name: product.name,
      colour: product.colour,
      description: product.description,
      details: product.details,
      images: product.images,
      priceCents: product.priceCents,
      categoryId,
      isNew: product.isNew,
    })
    .where(
      and(
        eq(products.slug, slug),
        sql`${products.updatedAt} = ${version}::timestamptz`,
      ),
    )
    .returning({ slug: products.slug });

  if (updated.length === 0) {
    const [exists] = await db
      .select({ slug: products.slug })
      .from(products)
      .where(eq(products.slug, slug))
      .limit(1);
    return {
      status: "error",
      formError: exists
        ? "Someone else saved this product while you were editing. Your changes weren’t saved: copy them, reload the page and apply them again."
        : "This product no longer exists.",
      values,
    };
  }

  updateTag("products");
  return { status: "success", message: "Changes saved." };
}

/*
 * Sets one size's stock. Checkout holds and releases stock concurrently
 * (reserve_order_stock / release_order_stock), so the update only applies
 * if the quantity is still the one the admin saw (`expected`); otherwise
 * nothing changes and the page reloads with the current figure.
 */
export async function setStockQuantity(
  _prev: StockActionState,
  formData: FormData,
): Promise<StockActionState> {
  await requireAdmin("/admin/products");

  const slug = text(formData, "slug");
  const size = text(formData, "size");
  const expected = parseStockQuantity(text(formData, "expected"));
  const quantity = parseStockQuantity(text(formData, "quantity"));
  if (!isValidSlug(slug) || !isValidSize(size) || expected === undefined) {
    return { status: "error", message: "Reload the page and try again." };
  }
  if (quantity === undefined) {
    return { status: "error", message: STOCK_QUANTITY_ERROR };
  }
  if (quantity === expected) return { status: "success", message: "No change." };

  const where = and(
    eq(productStock.productId, productIdBySlug(slug)),
    eq(productStock.size, size),
  );
  const [row] = await db
    .update(productStock)
    .set({ quantity })
    .where(and(where, eq(productStock.quantity, expected)))
    .returning({ quantity: productStock.quantity });

  if (!row) {
    const [current] = await db
      .select({ quantity: productStock.quantity })
      .from(productStock)
      .where(where)
      .limit(1);
    refresh();
    return {
      status: "error",
      message: current
        ? `Stock changed to ${current.quantity} while you were editing (a checkout or another admin). Check it and save again.`
        : "This size no longer exists.",
    };
  }

  updateTag("products");
  return { status: "success", message: `Saved: ${row.quantity} in stock.` };
}

export async function addSize(
  _prev: StockActionState,
  formData: FormData,
): Promise<StockActionState> {
  await requireAdmin("/admin/products");

  const slug = text(formData, "slug");
  const label = text(formData, "size").trim();
  const quantity = parseStockQuantity(text(formData, "quantity"));
  if (!isValidSlug(slug)) {
    return { status: "error", message: "Reload the page and try again." };
  }

  const product = await db.query.products.findFirst({
    where: eq(products.slug, slug),
    columns: { id: true },
    with: { stock: { columns: { size: true, position: true } } },
  });
  if (!product) return { status: "error", message: "This product no longer exists." };

  const error = validateNewSize(
    label,
    product.stock.map((row) => row.size),
  );
  if (error) return { status: "error", message: error };
  if (quantity === undefined) {
    return { status: "error", message: STOCK_QUANTITY_ERROR };
  }

  const position = Math.max(-1, ...product.stock.map((row) => row.position)) + 1;
  try {
    await db
      .insert(productStock)
      .values({ productId: product.id, size: label, quantity, position });
  } catch (error) {
    if (pgErrorCode(error) === "23505") {
      return { status: "error", message: `${label} is already a size.` };
    }
    throw error;
  }

  updateTag("products");
  return { status: "success", message: `Added ${label}.` };
}

/*
 * Removes a size with no stock left, never the product's last one. Bags
 * holding it drop the line on their next read. A checkout already holding
 * that size keeps its order lines (they're snapshots); if it then expires,
 * there's no row to give the stock back to, which is what removing it meant.
 */
export async function removeSize(
  _prev: StockActionState,
  formData: FormData,
): Promise<StockActionState> {
  await requireAdmin("/admin/products");

  const slug = text(formData, "slug");
  const size = text(formData, "size");
  if (!isValidSlug(slug) || !isValidSize(size)) {
    return { status: "error", message: "Reload the page and try again." };
  }

  const where = and(
    eq(productStock.productId, productIdBySlug(slug)),
    eq(productStock.size, size),
  );
  const deleted = await db
    .delete(productStock)
    .where(
      and(
        where,
        eq(productStock.quantity, 0),
        sql`(select count(*) from ${productStock} s where s.product_id = ${productStock.productId}) > 1`,
      ),
    )
    .returning({ size: productStock.size });

  if (deleted.length === 0) {
    const [current] = await db
      .select({ quantity: productStock.quantity })
      .from(productStock)
      .where(where)
      .limit(1);
    refresh();
    return {
      status: "error",
      message: !current
        ? "This size was already removed."
        : current.quantity > 0
          ? `Set ${size} to 0 before removing it; it has ${current.quantity} in stock.`
          : "A product needs at least one size.",
    };
  }

  updateTag("products");
  return { status: "success", message: `Removed ${size}.` };
}
