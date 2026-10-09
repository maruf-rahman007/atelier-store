import Image from "next/image";
import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { ProductRail } from "@/components/product-rail";
import {
  categories,
  featuredCollections,
  newArrivalSlugs,
  services,
  spotlight,
  story,
} from "@/lib/catalog";
import { getProductsBySlugs } from "@/lib/queries/products";

export async function NewArrivals() {
  const products = await getProductsBySlugs(newArrivalSlugs);

  return (
    <section aria-labelledby="new-arrivals-title" className="section">
      <ProductRail
        id="new-arrivals-title"
        title="New arrivals"
        link={{ label: "View all", href: "/collections/new" }}
        products={products}
      />
    </section>
  );
}

export function FeaturedCollections() {
  return (
    <section aria-label="Collections" className="mx-auto max-w-page">
      <ul className="grid gap-1 md:grid-cols-2">
        {featuredCollections.map((collection) => (
          <li key={collection.slug}>
            <Link
              href={`/collections/${collection.slug}`}
              className="media-frame grid aspect-portrait text-canvas lg:aspect-square"
            >
              <Image
                src={collection.image.src}
                alt={collection.image.alt}
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover object-[50%_25%]"
              />
              <div className="scrim absolute inset-0" aria-hidden="true" />
              <div className="relative flex flex-col justify-end p-gutter">
                <h2 className="text-display">{collection.title}</h2>
                <p className="mt-4 max-w-[32ch] text-body">
                  {collection.description}
                </p>
                <span className="link-cta mt-6 self-start">
                  Shop {collection.title.toLowerCase()}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export async function Spotlight() {
  const products = await getProductsBySlugs(spotlight.productSlugs);

  return (
    <section aria-labelledby="spotlight-title" className="section">
      <div className="container-page grid-editorial gap-y-10">
        <div className="col-span-4 md:col-span-6 lg:col-span-7">
          <div className="md:sticky md:top-[calc(var(--header-height)+1.5rem)]">
            <div className="media-frame aspect-portrait">
              <Image
                src={spotlight.image.src}
                alt={spotlight.image.alt}
                fill
                sizes="(min-width: 1024px) 58vw, (min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>

        <div className="col-span-4 md:col-span-6 lg:col-span-5">
          <h2 id="spotlight-title" className="text-headline">
            {spotlight.title}
          </h2>
          <p className="mt-4 max-w-[40ch] text-body text-ink-muted">
            {spotlight.description}
          </p>
          <Link href={spotlight.href} className="btn btn-primary mt-6">
            {spotlight.actionLabel}
          </Link>

          <ul className="mt-10 grid grid-cols-2 gap-x-1 gap-y-8 md:gap-x-4">
            {products.map((product) => (
              <li key={product.slug}>
                <ProductCard
                  product={product}
                  sizes="(min-width: 1024px) 20vw, (min-width: 768px) 25vw, 50vw"
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function Story() {
  const [main, detail] = story.images;

  return (
    <section aria-labelledby="story-title" className="section bg-surface">
      <div className="container-page grid-editorial gap-y-10">
        <div className="col-span-4 flex flex-col justify-between gap-10 md:order-1 md:col-span-5 lg:col-span-4">
          <div className="media-frame hidden aspect-product w-2/3 md:block">
            <Image
              src={detail.src}
              alt={detail.alt}
              fill
              sizes="(min-width: 1024px) 20vw, 28vw"
              className="object-cover"
            />
          </div>
          <div>
            <h2 id="story-title" className="text-headline">
              {story.title}
            </h2>
            {story.body.map((paragraph) => (
              <p
                key={paragraph}
                className="mt-4 max-w-[42ch] text-body-lg text-ink-muted"
              >
                {paragraph}
              </p>
            ))}
            <Link href={story.href} className="link-cta mt-8 inline-block">
              {story.linkLabel}
            </Link>
          </div>
        </div>

        <div className="order-first col-span-4 md:order-2 md:col-span-7 lg:col-span-7 lg:col-start-6">
          <div className="media-frame aspect-portrait lg:aspect-square">
            <Image
              src={main.src}
              alt={main.alt}
              fill
              sizes="(min-width: 768px) 58vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export function Categories() {
  return (
    <section aria-labelledby="categories-title" className="section">
      <h2 id="categories-title" className="container-page text-title">
        Shop by category
      </h2>
      <ul className="container-page mt-6 grid grid-cols-2 gap-x-1 gap-y-6 md:grid-cols-4 md:gap-x-4">
        {categories.map((category) => (
          <li key={category.slug}>
            <Link href={`/collections/${category.slug}`} className="group block">
              <div className="media-frame aspect-product">
                <Image
                  src={category.image.src}
                  alt={category.image.alt}
                  fill
                  sizes="(min-width: 768px) 25vw, 50vw"
                  className="object-cover"
                />
              </div>
              <h3 className="mt-3 text-body underline decoration-transparent decoration-1 underline-offset-4 transition-[text-decoration-color] duration-200 group-hover:decoration-current">
                {category.title}
              </h3>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Services() {
  return (
    <section aria-labelledby="services-title" className="border-t">
      <div className="container-page section-sm">
        <h2 id="services-title" className="sr-only">
          Client services
        </h2>
        <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service) => (
            <li key={service.title}>
              <h3 className="text-body font-medium">{service.title}</h3>
              <p className="mt-2 max-w-[36ch] text-small text-ink-muted">
                {service.body}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
