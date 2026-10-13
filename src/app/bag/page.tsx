import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { BagList } from "@/components/bag/bag-list";
import { CheckoutForm } from "@/components/bag/checkout-form";
import { bagCount, bagSubtotalCents, buildBagLines } from "@/lib/bag";
import { readBag } from "@/lib/bag-cookie";
import { categoryHref, formatPrice } from "@/lib/products";
import { getBagProducts } from "@/lib/queries/bag";
import { getCategories } from "@/lib/queries/products";

export const metadata: Metadata = {
  title: "Your bag | Atelier Store",
  robots: { index: false },
};

/* The heading is static; the contents read the bag cookie and live prices
 * and stock, so they stream in behind Suspense. */
export default function BagPage({ searchParams }: PageProps<"/bag">) {
  return (
    <main className="flex-1">
      <div className="container-page pb-section pt-6 md:pt-10">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap gap-x-2 text-caption text-ink-subtle">
            <li>
              <Link href="/" className="link-quiet">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page">Bag</li>
          </ol>
        </nav>
        <h1 className="mt-6 text-display">Your bag</h1>

        <Suspense fallback={<BagSkeleton />}>
          <BagContents searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

async function BagContents({
  searchParams,
}: Pick<PageProps<"/bag">, "searchParams">) {
  const cancelled = (await searchParams).checkout === "cancelled";
  const items = await readBag();
  const products = await getBagProducts(items.map((item) => item.slug));
  const lines = buildBagLines(items, products);

  if (lines.length === 0) return <EmptyBag />;

  const purchasable = lines.filter((line) => line.status !== "out-of-stock");
  const soldOut = lines.length - purchasable.length;
  const count = bagCount(purchasable);
  const subtotal = bagSubtotalCents(lines);

  return (
    <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16">
      {cancelled && (
        <p role="status" className="border-y py-4 text-small lg:col-span-2">
          Checkout cancelled. Nothing was charged, and your bag is as you left
          it.
        </p>
      )}
      <BagList lines={lines} />

      <section
        aria-labelledby="bag-summary"
        className="self-start border-t pt-6 lg:sticky lg:top-[calc(var(--header-height)+1.5rem)]"
      >
        <h2 id="bag-summary" className="text-title">
          Summary
        </h2>
        <dl className="mt-6 flex flex-col gap-3 text-small">
          <div className="flex justify-between gap-4">
            <dt className="text-ink-muted">
              Subtotal ({count} {count === 1 ? "item" : "items"})
            </dt>
            <dd className="tabular-nums">{formatPrice(subtotal)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-muted">Delivery</dt>
            <dd>Free</dd>
          </div>
        </dl>
        {soldOut > 0 && (
          <p className="mt-4 text-small text-danger">
            {soldOut === 1
              ? "1 sold-out piece isn’t included."
              : `${soldOut} sold-out pieces aren’t included.`}{" "}
            Remove {soldOut === 1 ? "it" : "them"} before checkout.
          </p>
        )}
        <CheckoutForm subtotalCents={subtotal} disabled={soldOut > 0} />
        <p className="mt-6 text-caption text-ink-subtle">
          Prices and availability are checked again at checkout. Adding to your
          bag doesn’t reserve a piece; starting checkout holds them for 30
          minutes.
        </p>
        <Link href="/collections/new" className="btn btn-secondary btn-block mt-4">
          Continue shopping
        </Link>
      </section>
    </div>
  );
}

async function EmptyBag() {
  const categories = await getCategories();
  return (
    <div className="mt-10 border-t pt-10">
      <p className="text-title">Your bag is empty</p>
      <p className="mt-3 max-w-[48ch] text-body-lg text-ink-muted">
        New pieces arrive in small runs each season. Anything you add will
        stay here for 30 days on this device.
      </p>
      <Link href="/collections/new" className="btn btn-primary mt-8">
        Shop new arrivals
      </Link>
      {categories.length > 0 && (
        <nav aria-label="Shop by category" className="mt-12">
          <p className="eyebrow text-ink-muted">Or browse</p>
          <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
            {categories.map((category) => (
              <li key={category.slug}>
                <Link href={categoryHref(category.slug)} className="link-nav">
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}

function BagSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading your bag"
      className="mt-10 grid gap-10 motion-safe:animate-pulse lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16"
    >
      <div className="border-t">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-4 border-b py-6 sm:grid-cols-[7.5rem_minmax(0,1fr)] sm:gap-6"
          >
            <div className="aspect-product bg-surface" />
            <div className="flex flex-col gap-2">
              <div className="h-5 w-2/3 bg-surface" />
              <div className="h-4 w-1/3 bg-surface" />
              <div className="mt-4 h-11 w-32 bg-surface" />
            </div>
          </div>
        ))}
      </div>
      <div className="border-t pt-6">
        <div className="h-7 w-32 bg-surface" />
        <div className="mt-6 h-5 w-full bg-surface" />
      </div>
    </div>
  );
}
