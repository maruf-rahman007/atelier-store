/*
 * Product types and pure helpers, safe to import from Client Components.
 * Database reads live in ./queries/products.
 */

import type { ProductImage } from "@/db/schema/catalog";

export type Picture = ProductImage;

export type SizeOption = {
  label: string;
  stock: number;
};

export type ProductCategory = {
  slug: string;
  name: string;
};

export type Product = {
  slug: string;
  name: string;
  colour: string;
  priceCents: number; // US cents
  category: ProductCategory;
  description: string;
  details: string[];
  /* One-size products have a single "One size" entry. */
  sizes: SizeOption[];
  /* First image is the card and hero image. */
  images: Picture[];
  isNew: boolean;
};

export type StockLevel = "in-stock" | "low-stock" | "out-of-stock";

export const ONE_SIZE = "One size";
const LOW_STOCK_THRESHOLD = 3;

export function unsplash(id: string) {
  return `https://images.unsplash.com/photo-${id}?w=2400&q=80`;
}

export function categoryHref(slug: string) {
  return `/collections/${slug}`;
}

const priceFormat = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  trailingZeroDisplay: "stripIfInteger",
});

export function formatPrice(cents: number) {
  return priceFormat.format(cents / 100);
}

export function isOneSize(product: Product) {
  return product.sizes.length === 1 && product.sizes[0].label === ONE_SIZE;
}

export function stockLevel(stock: number): StockLevel {
  if (stock <= 0) return "out-of-stock";
  if (stock <= LOW_STOCK_THRESHOLD) return "low-stock";
  return "in-stock";
}

export function productStock(product: Product) {
  return product.sizes.reduce((sum, size) => sum + size.stock, 0);
}

export function stockLabel(stock: number) {
  switch (stockLevel(stock)) {
    case "out-of-stock":
      return "Out of stock";
    case "low-stock":
      return `Only ${stock} left`;
    case "in-stock":
      return "In stock";
  }
}
