import "server-only";

import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import type { BagProduct } from "@/lib/bag";

/*
 * Current price and live stock for the products in a bag. Deliberately not
 * "use cache": the bag must never show a stale price or allow more than is in
 * stock, and the cached product reads can be hours old.
 */
export async function getBagProducts(
  slugs: string[],
): Promise<Map<string, BagProduct>> {
  const unique = [...new Set(slugs)];
  if (unique.length === 0) return new Map();

  const rows = await db.query.products.findMany({
    where: inArray(products.slug, unique),
    columns: {
      slug: true,
      name: true,
      colour: true,
      images: true,
      priceCents: true,
    },
    with: { stock: { columns: { size: true, quantity: true } } },
  });

  return new Map(
    rows.map((row) => [
      row.slug,
      {
        slug: row.slug,
        name: row.name,
        colour: row.colour,
        priceCents: row.priceCents,
        image: row.images[0],
        stock: new Map(row.stock.map((s) => [s.size, s.quantity])),
      },
    ]),
  );
}
