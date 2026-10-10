import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  CollectionHeader,
  CollectionSkeleton,
  ProductGrid,
} from "@/components/collection";
import { categoryHref } from "@/lib/products";
import { getCategories, getCategoryProducts } from "@/lib/queries/products";

/* Cache Components needs at least one param; the placeholder only keeps the
 * build working against an empty database and resolves to notFound(). */
export async function generateStaticParams() {
  const categories = await getCategories();
  if (categories.length === 0) return [{ slug: "__placeholder__" }];
  return categories.map(({ slug }) => ({ slug }));
}

async function getCategory(slug: string) {
  const categories = await getCategories();
  return {
    category: categories.find((category) => category.slug === slug),
    categories,
  };
}

export async function generateMetadata({
  params,
}: PageProps<"/collections/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { category } = await getCategory(slug);
  if (!category) return {};

  return {
    title: `${category.name} | Atelier Store`,
    description: `Shop ${category.name.toLowerCase()} at Atelier Store, made in small runs and built to last.`,
  };
}

/* Like the product page, params are awaited inside Suspense so client
 * navigations show the skeleton straight away. */
export default function CollectionPage({
  params,
}: PageProps<"/collections/[slug]">) {
  return (
    <main className="flex-1">
      <Suspense fallback={<CollectionSkeleton />}>
        <Collection params={params} />
      </Suspense>
    </main>
  );
}

async function Collection({
  params,
}: {
  params: PageProps<"/collections/[slug]">["params"];
}) {
  const { slug } = await params;
  const { category, categories } = await getCategory(slug);
  if (!category) notFound();

  const products = await getCategoryProducts(category.slug);

  return (
    <>
      <CollectionHeader title={category.name}>
        {/* One swipeable row on mobile; wraps beside the title from md up. */}
        <nav aria-label="Categories" className="-mx-gutter md:mx-0">
          <ul className="flex gap-x-6 gap-y-4 overflow-x-auto whitespace-nowrap px-gutter py-2 [scrollbar-width:none] md:flex-wrap md:justify-end md:overflow-visible md:p-0">
            {categories.map((item) => (
              <li key={item.slug}>
                <Link
                  href={categoryHref(item.slug)}
                  className="link-nav"
                  aria-current={item.slug === category.slug ? "page" : undefined}
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </CollectionHeader>
      <ProductGrid
        id="collection-count"
        products={products}
        empty={{
          message: `Nothing in ${category.name.toLowerCase()} just yet. New pieces arrive as each small run is finished.`,
          action: { label: "Shop new arrivals", href: "/collections/new" },
        }}
      />
    </>
  );
}
