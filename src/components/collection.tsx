import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import type { NavItem } from "@/lib/catalog";
import type { Product } from "@/lib/products";

/* Shared parts of product listing pages (new arrivals, categories). */

export function CollectionHeader({
  title,
  children,
}: {
  title: string;
  /* Shown beside the title from md up, below it on mobile. */
  children?: React.ReactNode;
}) {
  return (
    <div className="container-page pb-section-sm pt-6 md:pt-10">
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap gap-x-2 text-caption text-ink-subtle">
          <li>
            <Link href="/" className="link-quiet">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page">{title}</li>
        </ol>
      </nav>

      <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-10">
        <h1 className="text-display md:shrink-0">{title}</h1>
        {children}
      </div>
    </div>
  );
}

export function ProductGrid({
  id,
  products,
  summary,
  empty,
}: {
  id: string;
  products: Product[];
  /* Replaces the default "N pieces" line above the grid. */
  summary?: React.ReactNode;
  /* Without it, an empty grid renders nothing. */
  empty?: { message: string; action: NavItem };
}) {
  if (products.length === 0) {
    if (!empty) return null;
    return (
      <div className="container-page pb-section">
        <div className="flex flex-col items-start gap-6 border-t pt-8">
          <p className="max-w-[40ch] text-body-lg text-ink-muted">
            {empty.message}
          </p>
          <Link href={empty.action.href} className="btn btn-primary">
            {empty.action.label}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <section aria-labelledby={id} className="pb-section">
      <div className="container-page">
        <p id={id} className="border-t py-4 text-small text-ink-subtle">
          {summary ??
            `${products.length} ${products.length === 1 ? "piece" : "pieces"}`}
        </p>
      </div>
      <ul className="container-page grid-products mt-2">
        {products.map((product) => (
          <li key={product.slug}>
            <ProductCard
              product={product}
              sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function CollectionSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading collection">
      <div className="container-page pb-section-sm pt-6 md:pt-10">
        <div className="h-3 w-28 bg-surface" />
        <div className="mt-6 h-12 w-3/5 bg-surface md:h-16 md:w-2/5" />
      </div>
      <ProductGridSkeleton />
    </div>
  );
}

export function ProductGridSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading products">
      <div className="container-page pb-section">
        <div className="border-t py-4">
          <div className="h-4 w-16 bg-surface" />
        </div>
        <div className="grid-products mt-2">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i}>
              <div className="aspect-product bg-surface" />
              <div className="mt-3 h-4 w-3/4 bg-surface" />
              <div className="mt-2 h-4 w-1/3 bg-surface" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
