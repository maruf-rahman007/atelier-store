"use server";

import {
  isValidQuantity,
  isValidSize,
  isValidSlug,
  lineKey,
  MAX_BAG_COOKIE_LENGTH,
  MAX_LINE_QUANTITY,
  reconcileBag,
  serializeBag,
  type BagItem,
  type BagProduct,
} from "@/lib/bag";
import { readBag, writeBag } from "@/lib/bag-cookie";
import { ONE_SIZE } from "@/lib/products";
import { getBagProducts } from "@/lib/queries/bag";

export type BagActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  /* The line the message is about, so the UI can show it in the right place. */
  slug?: string;
  size?: string;
};

/*
 * The client sends only a slug, a size and (for updates) a quantity. Every
 * action re-reads the bag cookie, loads current prices and live stock from
 * the database, validates against that, and writes the cookie back with any
 * vanished lines dropped and quantities reduced to stock.
 */

const read = (formData: FormData, field: string) => {
  const value = formData.get(field);
  return typeof value === "string" ? value : undefined;
};

function readLine(formData: FormData) {
  const slug = read(formData, "slug");
  const size = read(formData, "size");
  if (!isValidSlug(slug) || !isValidSize(size)) return null;
  return { slug, size };
}

const invalid: BagActionState = {
  status: "error",
  message: "We couldn’t update your bag. Reload the page and try again.",
};

const unavailable = (slug: string, size: string): BagActionState => ({
  status: "error",
  message: "This piece is no longer available.",
  slug,
  size,
});

const sizeLabel = (size: string) => (size === ONE_SIZE ? "" : ` in size ${size}`);

async function loadBag() {
  const items = await readBag();
  return { items, products: await getBagProducts(items.map((i) => i.slug)) };
}

async function saveBag(items: BagItem[], products: Map<string, BagProduct>) {
  const next = reconcileBag(items, products);
  if (serializeBag(next).length > MAX_BAG_COOKIE_LENGTH) return false;
  await writeBag(next);
  return true;
}

function findItem(items: BagItem[], slug: string, size: string) {
  const key = lineKey(slug, size);
  return items.find((item) => lineKey(item.slug, item.size) === key);
}

export async function addToBag(
  _prev: BagActionState,
  formData: FormData,
): Promise<BagActionState> {
  const line = readLine(formData);
  if (!line) return invalid;
  const { slug, size } = line;

  const items = await readBag();
  const products = await getBagProducts([...items.map((i) => i.slug), slug]);
  const stock = products.get(slug)?.stock.get(size);
  if (stock === undefined) return unavailable(slug, size);
  if (stock === 0) {
    return {
      status: "error",
      message: `Sorry, this has just sold out${sizeLabel(size)}.`,
      slug,
      size,
    };
  }

  const existing = findItem(items, slug, size);
  const inBag = existing?.quantity ?? 0;
  const limit = Math.min(stock, MAX_LINE_QUANTITY);
  if (inBag + 1 > limit) {
    return {
      status: "error",
      message:
        stock > MAX_LINE_QUANTITY
          ? `You can add up to ${MAX_LINE_QUANTITY} of each piece.`
          : stock === 1
            ? "You already have the last one in your bag."
            : `Only ${stock} available${sizeLabel(size)}, and they’re all in your bag.`,
      slug,
      size,
    };
  }

  const next = existing
    ? items.map((item) =>
        item === existing ? { ...item, quantity: inBag + 1 } : item,
      )
    : [...items, { slug, size, quantity: 1 }];

  if (!(await saveBag(next, products))) {
    return {
      status: "error",
      message: "Your bag is full. Remove something to add this.",
      slug,
      size,
    };
  }
  return {
    status: "success",
    message: `Added to your bag${sizeLabel(size)}.`,
    slug,
    size,
  };
}

export async function updateBagLine(
  _prev: BagActionState,
  formData: FormData,
): Promise<BagActionState> {
  const line = readLine(formData);
  const quantity = Number(read(formData, "quantity"));
  if (!line || !Number.isInteger(quantity) || quantity < 1) return invalid;
  const { slug, size } = line;

  const { items, products } = await loadBag();
  const existing = findItem(items, slug, size);
  if (!existing) return invalid;

  const stock = products.get(slug)?.stock.get(size);
  if (stock === undefined) return unavailable(slug, size);
  if (!isValidQuantity(quantity) || quantity > stock) {
    return {
      status: "error",
      message:
        stock === 0
          ? "This size is out of stock."
          : `Only ${Math.min(stock, MAX_LINE_QUANTITY)} available.`,
      slug,
      size,
    };
  }

  await saveBag(
    items.map((item) => (item === existing ? { ...item, quantity } : item)),
    products,
  );
  return { status: "success", slug, size };
}

export async function removeBagLine(
  _prev: BagActionState,
  formData: FormData,
): Promise<BagActionState> {
  const line = readLine(formData);
  if (!line) return invalid;
  const { slug, size } = line;

  const { items, products } = await loadBag();
  const key = lineKey(slug, size);
  await saveBag(
    items.filter((item) => lineKey(item.slug, item.size) !== key),
    products,
  );
  return { status: "success", message: "Removed from your bag.", slug, size };
}
