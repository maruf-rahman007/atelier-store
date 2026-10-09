import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductGallery } from "@/components/product/product-gallery";
import { PurchasePanel } from "@/components/product/purchase-panel";
import { ProductRail } from "@/components/product-rail";
import { categoryHref, formatPrice, productStock } from "@/lib/products";
import {
  getProduct,
  getProductSlugs,
  getRelatedProducts,
} from "@/lib/queries/products";

/* Cache Components needs at least one param; the placeholder only keeps the
 * build working against an empty database and resolves to notFound(). */
export async function generateStaticParams() {
  const slugs = await getProductSlugs();
  if (slugs.length === 0) return [{ slug: "__placeholder__" }];
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return {};

  return {
    title: `${product.name} in ${product.colour.toLowerCase()} | Atelier Store`,
    description: product.description,
    openGraph: { images: [{ url: product.images[0].src }] },
  };
}

function Disclosure({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <details className="group border-b">
      <summary className="flex cursor-pointer list-none items-center justify-between py-4 text-small font-medium [&::-webkit-details-marker]:hidden">
        {title}
        <span aria-hidden="true" className="relative size-3">
          <span className="absolute inset-x-0 top-1/2 h-px bg-ink" />
          <span className="absolute inset-y-0 left-1/2 w-px bg-ink transition-transform duration-200 group-open:scale-y-0" />
        </span>
      </summary>
      <div className="pb-5 text-small text-ink-muted">{children}</div>
    </details>
  );
}

/* The page itself doesn't await params, so client navigations can show the
 * skeleton immediately while the product streams in. Every known slug is
 * prerendered, so direct visits get the full page as static HTML. */
export default function ProductPage({ params }: PageProps<"/products/[slug]">) {
  return (
    <main className="flex-1">
      <Suspense fallback={<ProductSkeleton />}>
        <ProductDetail params={params} />
      </Suspense>
    </main>
  );
}

function ProductSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading product">
      <div className="container-page grid-editorial gap-y-8 pb-section md:pt-6">
        <div className="col-span-4 -mx-gutter md:col-span-7 md:mx-0 lg:col-span-8">
          <div className="aspect-product bg-surface" />
        </div>
        <div className="col-span-4 flex flex-col gap-4 md:col-span-5 lg:col-span-4">
          <div className="h-3 w-24 bg-surface" />
          <div className="h-10 w-4/5 bg-surface" />
          <div className="h-4 w-20 bg-surface" />
          <div className="h-5 w-16 bg-surface" />
          <div className="mt-6 h-14 w-full bg-surface" />
        </div>
      </div>
    </div>
  );
}

async function ProductDetail({
  params,
}: {
  params: PageProps<"/products/[slug]">["params"];
}) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const category = {
    label: product.category.name,
    href: categoryHref(product.category.slug),
  };
  const stock = productStock(product);
  const related = await getRelatedProducts(product.slug, product.category.slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    color: product.colour,
    category: category.label,
    image: product.images.map((image) => image.src),
    offers: {
      "@type": "Offer",
      price: product.priceCents / 100,
      priceCurrency: "USD",
      availability:
        stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <div className="container-page grid-editorial gap-y-8 pb-section md:pt-6">
        <div className="col-span-4 md:col-span-7 lg:col-span-8">
          <ProductGallery images={product.images} />
        </div>

        <div className="col-span-4 md:col-span-5 lg:col-span-4">
          <div className="md:sticky md:top-[calc(var(--header-height)+1.5rem)]">
            <nav aria-label="Breadcrumb">
              <ol className="flex flex-wrap gap-x-2 text-caption text-ink-subtle">
                <li>
                  <Link href="/" className="link-quiet">
                    Home
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li>
                  <Link href={category.href} className="link-quiet">
                    {category.label}
                  </Link>
                </li>
              </ol>
            </nav>

            <h1 className="mt-4 text-headline">{product.name}</h1>
            <p className="mt-2 text-body text-ink-muted">{product.colour}</p>
            <div className="mt-4 flex items-baseline gap-4">
              <p className="text-body-lg">{formatPrice(product.priceCents)}</p>
              {product.isNew && (
                <p className="text-caption text-accent">New season</p>
              )}
            </div>

            <div className="mt-6">
              <PurchasePanel product={product} />
            </div>

            <p className="mt-6 max-w-[48ch] text-body text-ink-muted">
              {product.description}
            </p>

            <div className="mt-8 border-t">
              <Disclosure title="Details and care">
                <ul className="flex flex-col gap-1.5">
                  {product.details.map((detail) => (
                    <li key={detail}>{detail}</li>
                  ))}
                </ul>
              </Disclosure>
              <Disclosure title="Delivery and returns">
                <p>
                  Free delivery in 2–4 working days, in our signature box. You
                  have 30 days to return unworn pieces, free of charge.
                </p>
              </Disclosure>
              <Disclosure title="Repairs and aftercare">
                <p>
                  Leather goods and shoes can be sent back to the workshop for
                  cleaning, re-dyeing and repair for as long as you own them.
                </p>
              </Disclosure>
            </div>
          </div>
        </div>
      </div>

      <section aria-labelledby="related-title" className="section border-t">
        <ProductRail
          id="related-title"
          title="You may also like"
          link={{
            label: `View all ${category.label.toLowerCase()}`,
            href: category.href,
          }}
          products={related}
        />
      </section>
    </>
  );
}
