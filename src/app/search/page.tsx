import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import {
  CollectionHeader,
  ProductGrid,
  ProductGridSkeleton,
} from "@/components/collection";
import { SearchForm, SearchFormFallback } from "@/components/search-form";
import { categoryHref, normaliseQuery } from "@/lib/products";
import { getCategories, searchProducts } from "@/lib/queries/products";

export const metadata: Metadata = {
  title: "Search | Atelier Store",
  description: "Search clothing, leather goods and jewellery at Atelier Store.",
  robots: { index: false },
};

/* The header and form are static; only the results wait on the query. */
export default function SearchPage({ searchParams }: PageProps<"/search">) {
  return (
    <main className="flex-1">
      <CollectionHeader title="Search">
        <Suspense fallback={<SearchFormFallback />}>
          <SearchForm />
        </Suspense>
      </CollectionHeader>
      <Suspense fallback={<ProductGridSkeleton />}>
        <SearchResults searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function SearchResults({
  searchParams,
}: Pick<PageProps<"/search">, "searchParams">) {
  const query = normaliseQuery((await searchParams).q);
  if (!query) return <Suggestions />;

  const products = await searchProducts(query);
  if (products.length === 0) {
    return (
      <Suggestions
        message={`No results for “${query}”. Check the spelling, or try a broader word such as a colour or material.`}
      />
    );
  }

  return (
    <ProductGrid
      id="search-results"
      products={products}
      summary={
        <span role="status">
          {products.length} {products.length === 1 ? "result" : "results"} for “
          {query}”
        </span>
      }
    />
  );
}

async function Suggestions({ message }: { message?: string }) {
  const categories = await getCategories();
  const links = [
    { label: "New arrivals", href: "/collections/new" },
    ...categories.map((category) => ({
      label: category.name,
      href: categoryHref(category.slug),
    })),
  ];

  return (
    <div className="container-page pb-section">
      <div className="border-t pt-8">
        {message && (
          <p role="status" className="max-w-[48ch] text-body-lg text-ink-muted">
            {message}
          </p>
        )}
        <h2 className={`text-small font-medium ${message ? "mt-8" : ""}`}>
          Browse by category
        </h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {links.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="btn btn-secondary btn-sm">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
