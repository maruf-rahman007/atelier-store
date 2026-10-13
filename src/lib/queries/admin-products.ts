import "server-only";

import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { categories, products, productStock } from "@/db/schema";

/*
 * Product reads for the admin area. Not cached: admins must see live stock
 * and their own edits straight away. Callers check requireAdmin() first.
 */

const withCategoryAndStock = {
  category: { columns: { slug: true, name: true } },
  stock: {
    columns: { size: true, quantity: true },
    orderBy: asc(productStock.position),
  },
} as const;

/* Every product, or one category's, in catalogue order. */
export async function getAdminProducts(categorySlug?: string) {
  return db.query.products.findMany({
    where: categorySlug
      ? sql`${products.categoryId} = (select c.id from ${categories} c where c.slug = ${categorySlug})`
      : undefined,
    orderBy: asc(products.id),
    columns: {
      slug: true,
      name: true,
      colour: true,
      priceCents: true,
      images: true,
      isNew: true,
    },
    with: withCategoryAndStock,
  });
}

/* `version` is updated_at as Postgres prints it (full microseconds), which
 * the edit form sends back so a save can tell whether someone else saved
 * first. A JS Date would lose the microseconds and never match. */
export async function getAdminProduct(slug: string) {
  return db.query.products.findFirst({
    where: eq(products.slug, slug),
    columns: { id: false, categoryId: false, createdAt: false },
    extras: {
      version: sql<string>`${products.updatedAt}::text`.as("version"),
    },
    with: withCategoryAndStock,
  });
}

export type AdminProductSummary = Awaited<
  ReturnType<typeof getAdminProducts>
>[number];
export type AdminProduct = NonNullable<
  Awaited<ReturnType<typeof getAdminProduct>>
>;
