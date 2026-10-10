/*
 * Shopping bag types and pure helpers, safe to import from Client Components.
 *
 * The bag lives in an httpOnly cookie (src/lib/bag-cookie.ts) that holds only
 * references: product slug, size and quantity. Names, prices and stock always
 * come from the database (src/lib/queries/bag.ts), so a tampered cookie can't
 * change what anything costs.
 */

import type { Picture } from "@/lib/products";

export type BagItem = {
  slug: string;
  size: string;
  quantity: number;
};

/* Current catalogue data for a product in the bag. */
export type BagProduct = {
  slug: string;
  name: string;
  colour: string;
  priceCents: number;
  image: Picture | undefined;
  /* Live stock by size label. */
  stock: Map<string, number>;
};

export type BagLineStatus = "ok" | "reduced" | "out-of-stock";

export type BagLine = {
  slug: string;
  size: string;
  name: string;
  colour: string;
  image: Picture | undefined;
  priceCents: number;
  /* Quantity charged: the requested quantity, capped at stock. */
  quantity: number;
  /* What the cookie asked for, so the page can explain a reduction. */
  requested: number;
  stock: number;
  /* Highest quantity the stepper allows. */
  maxQuantity: number;
  status: BagLineStatus;
};

export const MAX_LINE_QUANTITY = 10;
const MAX_LINES = 30;
const MAX_SLUG_LENGTH = 200;
const MAX_SIZE_LENGTH = 40;
/* Browsers drop cookies over 4 KB; leave room for the name and attributes. */
export const MAX_BAG_COOKIE_LENGTH = 3800;

export const lineKey = (slug: string, size: string) => `${slug}\u0000${size}`;

export function isValidSlug(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= MAX_SLUG_LENGTH &&
    /^[a-z0-9-]+$/.test(value)
  );
}

export function isValidSize(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= MAX_SIZE_LENGTH
  );
}

export function isValidQuantity(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= MAX_LINE_QUANTITY
  );
}

/*
 * Cookie value → bag items. Anything malformed is dropped rather than
 * failing the whole bag; duplicate lines are merged and quantities capped.
 * The cookie stores [slug, size, quantity] tuples to stay small.
 */
export function parseBag(raw: string | undefined): BagItem[] {
  if (!raw) return [];
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(data)) return [];

  const byKey = new Map<string, BagItem>();
  for (const entry of data) {
    if (!Array.isArray(entry) || entry.length !== 3) continue;
    const [slug, size, quantity] = entry as unknown[];
    if (!isValidSlug(slug) || !isValidSize(size)) continue;
    if (typeof quantity !== "number" || !Number.isInteger(quantity)) continue;
    if (quantity < 1) continue;

    const key = lineKey(slug, size);
    const existing = byKey.get(key);
    const total = (existing?.quantity ?? 0) + quantity;
    byKey.set(key, { slug, size, quantity: Math.min(total, MAX_LINE_QUANTITY) });
    if (byKey.size >= MAX_LINES) break;
  }
  return [...byKey.values()];
}

export function serializeBag(items: BagItem[]) {
  return JSON.stringify(
    items.map((item) => [item.slug, item.size, item.quantity]),
  );
}

/* Total pieces, as shown on the header bag icon. */
export function bagCount(items: { quantity: number }[]) {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

/*
 * Joins bag items with current catalogue data. Items whose product or size no
 * longer exists are dropped; quantities above stock are reduced to it; sold
 * out lines stay visible (so the customer can see what happened) but are not
 * charged.
 */
export function buildBagLines(
  items: BagItem[],
  products: Map<string, BagProduct>,
): BagLine[] {
  const lines: BagLine[] = [];
  for (const item of items) {
    const product = products.get(item.slug);
    const stock = product?.stock.get(item.size);
    if (!product || stock === undefined) continue;

    const quantity = Math.min(item.quantity, stock, MAX_LINE_QUANTITY);
    lines.push({
      slug: product.slug,
      size: item.size,
      name: product.name,
      colour: product.colour,
      image: product.image,
      priceCents: product.priceCents,
      quantity,
      requested: item.quantity,
      stock,
      maxQuantity: Math.min(stock, MAX_LINE_QUANTITY),
      status:
        stock === 0
          ? "out-of-stock"
          : quantity < item.quantity
            ? "reduced"
            : "ok",
    });
  }
  return lines;
}

/*
 * Bag items the cookie should hold after a change: only lines that still
 * exist, with quantities reduced to stock. Sold-out lines are kept until the
 * customer removes them, so they don't silently disappear.
 */
export function reconcileBag(
  items: BagItem[],
  products: Map<string, BagProduct>,
): BagItem[] {
  return buildBagLines(items, products).map((line) => ({
    slug: line.slug,
    size: line.size,
    quantity: line.status === "out-of-stock" ? line.requested : line.quantity,
  }));
}

/* Integer cents; sold-out lines aren't charged. */
export function bagSubtotalCents(lines: BagLine[]) {
  return lines.reduce(
    (sum, line) =>
      line.status === "out-of-stock" ? sum : sum + line.priceCents * line.quantity,
    0,
  );
}
