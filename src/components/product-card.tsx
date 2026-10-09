import Image from "next/image";
import Link from "next/link";
import { formatPrice, productStock, type Product } from "@/lib/products";

export function ProductCard({
  product,
  sizes,
}: {
  product: Product;
  sizes: string;
}) {
  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="media-frame aspect-product">
        <Image
          src={product.images[0].src}
          alt={product.images[0].alt}
          fill
          sizes={sizes}
          className="object-cover"
        />
      </div>
      <div className="mt-3 flex flex-col gap-0.5 pr-2 text-small">
        <h3 className="underline decoration-transparent decoration-1 underline-offset-4 transition-[text-decoration-color] duration-200 group-hover:decoration-current">
          {product.name}
        </h3>
        <p className="text-ink-subtle">{product.colour}</p>
        <p className="mt-1">{formatPrice(product.priceCents)}</p>
        {productStock(product) === 0 ? (
          <p className="mt-1 text-caption text-ink-subtle">Out of stock</p>
        ) : (
          product.isNew && (
            <p className="mt-1 text-caption text-accent">New season</p>
          )
        )}
      </div>
    </Link>
  );
}
