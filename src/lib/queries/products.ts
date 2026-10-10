import "server-only";

import {
  asc,
  desc,
  eq,
  inArray,
  ne,
  sql,
  type AnyColumn,
  type SQL,
} from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/db";
import { categories, products, productStock } from "@/db/schema";
import type { Product, ProductCategory } from "@/lib/products";

/* Product reads for Server Components. Cached and tagged "products", so a
 * future admin or stock update can call revalidateTag("products"). */

function findProducts(config: {
  where?: SQL;
  orderBy?: (SQL | AnyColumn)[];
  limit?: number;
}) {
  return db.query.products.findMany({
    ...config,
    with: {
      category: { columns: { slug: true, name: true } },
      stock: {
        columns: { size: true, quantity: true },
        orderBy: asc(productStock.position),
      },
    },
  });
}

type ProductRow = Awaited<ReturnType<typeof findProducts>>[number];

function toProduct(row: ProductRow): Product {
  return {
    slug: row.slug,
    name: row.name,
    colour: row.colour,
    priceCents: row.priceCents,
    category: row.category,
    description: row.description,
    details: row.details,
    sizes: row.stock.map((s) => ({ label: s.size, stock: s.quantity })),
    images: row.images,
    isNew: row.isNew,
  };
}

export async function getProduct(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag("products");

  const [row] = await findProducts({
    where: eq(products.slug, slug),
    limit: 1,
  });
  return row ? toProduct(row) : undefined;
}

/* Hand-picked products, returned in the order given. */
export async function getProductsBySlugs(slugs: string[]) {
  "use cache";
  cacheLife("hours");
  cacheTag("products");

  if (slugs.length === 0) return [];
  const rows = await findProducts({ where: inArray(products.slug, slugs) });
  const bySlug = new Map(rows.map((row) => [row.slug, toProduct(row)]));
  return slugs
    .map((slug) => bySlug.get(slug))
    .filter((product): product is Product => product !== undefined);
}

/* Relational queries rewrite every column reference to the root table's
 * alias, so the subquery uses its own alias instead of column objects. */
function inCategory(categorySlug: string) {
  return sql`${products.categoryId} = (select c.id from ${categories} c where c.slug = ${categorySlug})`;
}

/* Same category first, then other products, excluding the current one. */
export async function getRelatedProducts(
  slug: string,
  categorySlug: string,
  limit = 8,
) {
  "use cache";
  cacheLife("hours");
  cacheTag("products");

  const rows = await findProducts({
    where: ne(products.slug, slug),
    orderBy: [sql`${inCategory(categorySlug)} desc`, asc(products.id)],
    limit,
  });
  return rows.map(toProduct);
}

export async function getCategoryProducts(categorySlug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag("products");

  const rows = await findProducts({
    where: inCategory(categorySlug),
    orderBy: [asc(products.id)],
  });
  return rows.map(toProduct);
}

/* Most recently added first; id breaks ties between products added together. */
export async function getNewArrivals(limit = 24) {
  "use cache";
  cacheLife("hours");
  cacheTag("products");

  const rows = await findProducts({
    orderBy: [desc(products.createdAt), desc(products.id)],
    limit,
  });
  return rows.map(toProduct);
}

export async function getProductSlugs() {
  "use cache";
  cacheLife("hours");
  cacheTag("products");

  const rows = await db
    .select({ slug: products.slug })
    .from(products)
    .orderBy(asc(products.id));
  return rows.map((row) => row.slug);
}

/* Ordered as in navigation. */
export async function getCategories(): Promise<ProductCategory[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("products");

  return db
    .select({ slug: categories.slug, name: categories.name })
    .from(categories)
    .orderBy(asc(categories.position), asc(categories.id));
}
