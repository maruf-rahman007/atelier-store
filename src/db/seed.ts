/*
 * Loads the sample catalogue: `npm run db:seed`. Safe to re-run: categories
 * and products are upserted by slug, and each seeded product's stock rows are
 * replaced. Runs outside Next, so it loads env files itself and uses relative
 * imports.
 */

import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import { inArray, sql, type SQL } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import { categories, products, productStock } from "./schema";
import { seedCategories, seedProducts } from "./seed-data";

config({ path: [".env.local", ".env"], quiet: true });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const db = drizzle({ client: neon(process.env.DATABASE_URL), schema });

const categoryId = (slug: string): SQL =>
  sql`(select ${categories.id} from ${categories} where ${categories.slug} = ${slug})`;

const productId = (slug: string): SQL =>
  sql`(select ${products.id} from ${products} where ${products.slug} = ${slug})`;

const excluded = (column: string) => sql.raw(`excluded."${column}"`);

async function main() {
  const slugs = seedProducts.map((product) => product.slug);

  /* neon-http runs a batch as one non-interactive transaction. */
  await db.batch([
    db
      .insert(categories)
      .values(
        seedCategories.map((category, position) => ({ ...category, position })),
      )
      .onConflictDoUpdate({
        target: categories.slug,
        set: {
          name: excluded("name"),
          position: excluded("position"),
          updatedAt: sql`now()`,
        },
      }),

    db
      .insert(products)
      .values(
        seedProducts.map((product) => ({
          slug: product.slug,
          name: product.name,
          colour: product.colour,
          description: product.description,
          details: product.details,
          images: product.images,
          priceCents: product.price * 100,
          categoryId: categoryId(product.category),
          isNew: product.isNew ?? false,
        })),
      )
      .onConflictDoUpdate({
        target: products.slug,
        set: {
          name: excluded("name"),
          colour: excluded("colour"),
          description: excluded("description"),
          details: excluded("details"),
          images: excluded("images"),
          priceCents: excluded("price_cents"),
          categoryId: excluded("category_id"),
          isNew: excluded("is_new"),
          updatedAt: sql`now()`,
        },
      }),

    db
      .delete(productStock)
      .where(
        inArray(
          productStock.productId,
          db
            .select({ id: products.id })
            .from(products)
            .where(inArray(products.slug, slugs)),
        ),
      ),

    db.insert(productStock).values(
      seedProducts.flatMap((product) =>
        product.sizes.map((size, position) => ({
          productId: productId(product.slug),
          size: size.label,
          quantity: size.stock,
          position,
        })),
      ),
    ),
  ]);

  const [counts] = await db.execute<{
    categories: number;
    products: number;
    stock: number;
  }>(sql`select
    (select count(*)::int from ${categories}) as categories,
    (select count(*)::int from ${products}) as products,
    (select count(*)::int from ${productStock}) as stock`).then((r) => r.rows);

  console.log(
    `Seeded: ${counts.categories} categories, ${counts.products} products, ${counts.stock} stock rows.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
