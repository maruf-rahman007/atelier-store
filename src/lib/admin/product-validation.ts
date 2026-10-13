/*
 * Pure rules for the admin product forms, shared by the forms (instant
 * feedback) and the admin Server Actions (the real check). Safe to import
 * from Client Components. Parsing takes FormData so both sides read the same
 * fields the same way.
 */

import { ONE_SIZE, type Picture } from "@/lib/products";

export const PRODUCT_NAME_MAX_LENGTH = 120;
export const PRODUCT_SLUG_MAX_LENGTH = 100;
export const COLOUR_MAX_LENGTH = 60;
export const DESCRIPTION_MAX_LENGTH = 2000;
export const DETAIL_MAX_LENGTH = 200;
export const MAX_DETAILS = 12;
export const ALT_MAX_LENGTH = 200;
export const MAX_IMAGES = 8;
export const SIZE_LABEL_MAX_LENGTH = 40; // matches MAX_SIZE_LENGTH in src/lib/bag.ts
export const MAX_SIZES = 20;
export const MAX_STOCK_QUANTITY = 9999;
/* $999,999.99 keeps every total well inside a Postgres integer. */
const MAX_PRICE_CENTS = 99_999_999;

/* Taken by the /admin/products/new route. */
const RESERVED_SLUGS = new Set(["new"]);
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PRICE_PATTERN = /^\d{1,6}(?:\.\d{1,2})?$/;

export type ProductField =
  | "name"
  | "slug"
  | "colour"
  | "category"
  | "price"
  | "description"
  | "details"
  | "images"
  | "sizes";

export type ProductFieldErrors = Partial<Record<ProductField, string>>;

export type ProductInput = {
  name: string;
  slug: string;
  colour: string;
  categorySlug: string;
  priceCents: number;
  description: string;
  details: string[];
  images: Picture[];
  isNew: boolean;
};

export type SizeInput = { label: string; quantity: number };

/* What the form sends, as typed, so a failed submit can be shown again. */
export type ProductFormValues = {
  name: string;
  slug: string;
  colour: string;
  category: string;
  price: string;
  description: string;
  details: string;
  images: { src: string; alt: string }[];
  sizes: { label: string; quantity: string }[];
  isNew: boolean;
};

/* Field order on the page, for focusing the first problem. */
export const productFieldOrder: ProductField[] = [
  "name",
  "slug",
  "colour",
  "category",
  "price",
  "description",
  "details",
  "images",
  "sizes",
];

const text = (formData: FormData, field: string) => {
  const value = formData.get(field);
  return typeof value === "string" ? value : "";
};

const texts = (formData: FormData, field: string) =>
  formData.getAll(field).map((value) => (typeof value === "string" ? value : ""));

export function readProductForm(formData: FormData): ProductFormValues {
  const srcs = texts(formData, "imageSrc");
  const alts = texts(formData, "imageAlt");
  const labels = texts(formData, "sizeLabel");
  const quantities = texts(formData, "sizeQuantity");
  return {
    name: text(formData, "name"),
    slug: text(formData, "slug"),
    colour: text(formData, "colour"),
    category: text(formData, "category"),
    price: text(formData, "price"),
    description: text(formData, "description"),
    details: text(formData, "details"),
    images: srcs.map((src, i) => ({ src, alt: alts[i] ?? "" })),
    sizes: labels.map((label, i) => ({ label, quantity: quantities[i] ?? "" })),
    isNew: formData.get("isNew") === "on",
  };
}

/* Lowercase words joined by hyphens, for suggesting a slug from the name. */
export function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, PRODUCT_SLUG_MAX_LENGTH)
    .replace(/-+$/, "");
}

export function validateSlug(value: string): string | undefined {
  const slug = value.trim();
  if (!slug) return "Enter a URL slug.";
  if (slug.length > PRODUCT_SLUG_MAX_LENGTH)
    return `Use ${PRODUCT_SLUG_MAX_LENGTH} characters or fewer.`;
  if (!SLUG_PATTERN.test(slug))
    return "Use lowercase letters, numbers and single hyphens, like wool-coat.";
  if (RESERVED_SLUGS.has(slug)) return "That slug is reserved. Choose another.";
  return;
}

/* "120" or "120.5" or "120.50" dollars → 12050 cents, without float maths. */
export function parsePrice(value: string): number | undefined {
  const price = value.trim().replace(/^\$/, "");
  if (!PRICE_PATTERN.test(price)) return;
  const [dollars, fraction = ""] = price.split(".");
  const cents = Number(dollars) * 100 + Number(fraction.padEnd(2, "0"));
  return cents <= MAX_PRICE_CENTS ? cents : undefined;
}

/* Cents → the plain number shown in the price input ("120" or "120.50"). */
export function priceInputValue(cents: number) {
  return cents % 100 === 0
    ? String(cents / 100)
    : `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, "0")}`;
}

/* Must match images.remotePatterns in next.config.ts, or next/image refuses
 * to load it. */
export function isAllowedImageUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname === "images.unsplash.com" &&
      url.pathname.startsWith("/photo-")
    );
  } catch {
    return false;
  }
}

export function parseStockQuantity(value: string): number | undefined {
  const trimmed = value.trim();
  if (!/^\d{1,4}$/.test(trimmed)) return;
  const quantity = Number(trimmed);
  return quantity <= MAX_STOCK_QUANTITY ? quantity : undefined;
}

export const STOCK_QUANTITY_ERROR = `Enter a whole number from 0 to ${MAX_STOCK_QUANTITY}.`;

export function validateSizeLabel(value: string): string | undefined {
  const label = value.trim();
  if (!label) return "Enter a size, like M or 38.";
  if (label.length > SIZE_LABEL_MAX_LENGTH)
    return `Use ${SIZE_LABEL_MAX_LENGTH} characters or fewer.`;
  return;
}

/*
 * Checks the product details. `withSlug` is for creating: the slug can't be
 * changed afterwards because bags, order lines, editorial lists and links
 * all refer to products by slug.
 */
export function validateProductForm(
  values: ProductFormValues,
  { withSlug }: { withSlug: boolean },
): { errors: ProductFieldErrors; product?: ProductInput } {
  const errors: ProductFieldErrors = {};

  const name = values.name.trim();
  if (!name) errors.name = "Enter the product name.";
  else if (name.length > PRODUCT_NAME_MAX_LENGTH)
    errors.name = `Use ${PRODUCT_NAME_MAX_LENGTH} characters or fewer.`;

  const slug = values.slug.trim();
  if (withSlug) {
    const error = validateSlug(slug);
    if (error) errors.slug = error;
  }

  const colour = values.colour.trim();
  if (!colour) errors.colour = "Enter the colour, like Camel or Navy.";
  else if (colour.length > COLOUR_MAX_LENGTH)
    errors.colour = `Use ${COLOUR_MAX_LENGTH} characters or fewer.`;

  const categorySlug = values.category.trim();
  if (!categorySlug) errors.category = "Choose a category.";

  const priceCents = parsePrice(values.price);
  if (priceCents === undefined)
    errors.price = "Enter a price in US dollars, like 120 or 89.50.";

  const description = values.description.trim();
  if (!description) errors.description = "Enter a description.";
  else if (description.length > DESCRIPTION_MAX_LENGTH)
    errors.description = `Use ${DESCRIPTION_MAX_LENGTH} characters or fewer.`;

  const details = values.details
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (details.length > MAX_DETAILS)
    errors.details = `Add up to ${MAX_DETAILS} details.`;
  else if (details.some((line) => line.length > DETAIL_MAX_LENGTH))
    errors.details = `Keep each detail to ${DETAIL_MAX_LENGTH} characters or fewer.`;

  /* Rows left completely blank are ignored. */
  const images = values.images
    .map((image) => ({ src: image.src.trim(), alt: image.alt.trim() }))
    .filter((image) => image.src || image.alt);
  if (images.length === 0)
    errors.images = "Add at least one image. The first is the card image.";
  else if (images.length > MAX_IMAGES)
    errors.images = `Add up to ${MAX_IMAGES} images.`;
  else if (images.some((image) => !isAllowedImageUrl(image.src)))
    errors.images =
      "Image URLs must start with https://images.unsplash.com/photo-.";
  else if (images.some((image) => !image.alt))
    errors.images = "Describe each image in its alt text.";
  else if (images.some((image) => image.alt.length > ALT_MAX_LENGTH))
    errors.images = `Keep alt text to ${ALT_MAX_LENGTH} characters or fewer.`;

  if (Object.keys(errors).length > 0) return { errors };
  return {
    errors,
    product: {
      name,
      slug,
      colour,
      categorySlug,
      priceCents: priceCents!,
      description,
      details,
      images,
      isNew: values.isNew,
    },
  };
}

/* The sizes a new product starts with. A "One size" product has only that
 * row; the storefront relies on it (isOneSize in src/lib/products.ts). */
export function validateSizes(rows: ProductFormValues["sizes"]): {
  error?: string;
  sizes?: SizeInput[];
} {
  const filled = rows
    .map((row) => ({ label: row.label.trim(), quantity: row.quantity.trim() }))
    .filter((row) => row.label || row.quantity);
  if (filled.length === 0) return { error: "Add at least one size." };
  if (filled.length > MAX_SIZES) return { error: `Add up to ${MAX_SIZES} sizes.` };

  const sizes: SizeInput[] = [];
  const seen = new Set<string>();
  for (const row of filled) {
    const labelError = validateSizeLabel(row.label);
    if (labelError) return { error: labelError };
    const quantity = parseStockQuantity(row.quantity);
    if (quantity === undefined)
      return { error: `Stock for ${row.label}: ${STOCK_QUANTITY_ERROR}` };
    const key = row.label.toLowerCase();
    if (seen.has(key)) return { error: `${row.label} is listed twice.` };
    seen.add(key);
    sizes.push({ label: row.label, quantity });
  }
  if (sizes.length > 1 && sizes.some((size) => size.label === ONE_SIZE))
    return { error: `“${ONE_SIZE}” can’t be combined with other sizes.` };
  return { sizes };
}

/* Adding a size to a product that already has `existing` sizes. */
export function validateNewSize(
  label: string,
  existing: string[],
): string | undefined {
  const error = validateSizeLabel(label);
  if (error) return error;
  if (existing.length >= MAX_SIZES) return `A product can have up to ${MAX_SIZES} sizes.`;
  const trimmed = label.trim();
  if (existing.some((size) => size.toLowerCase() === trimmed.toLowerCase()))
    return `${trimmed} is already a size.`;
  if (trimmed === ONE_SIZE && existing.length > 0)
    return `“${ONE_SIZE}” can’t be combined with other sizes.`;
  if (existing.includes(ONE_SIZE))
    return `This is a one-size product, so it can’t have other sizes.`;
  return;
}
