import type { Metadata } from "next";
import { CollectionHeader, ProductGrid } from "@/components/collection";
import { getNewArrivals } from "@/lib/queries/products";

export const metadata: Metadata = {
  title: "New arrivals | Atelier Store",
  description:
    "The latest pieces from the workshop: clothing, leather goods and jewellery, made in small runs.",
};

export default async function NewArrivalsPage() {
  const products = await getNewArrivals();

  return (
    <main className="flex-1">
      <CollectionHeader title="New arrivals">
        <p className="max-w-[40ch] text-body-lg text-ink-muted">
          The latest pieces from the workshop, added as each small run is
          finished.
        </p>
      </CollectionHeader>
      <ProductGrid
        id="new-arrivals-count"
        products={products}
        empty={{
          message: "Nothing new just yet. The next run is in the workshop.",
          action: { label: "Back to the homepage", href: "/" },
        }}
      />
    </main>
  );
}
