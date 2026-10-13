import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth/session";
import { formatPrice, stockLabel, stockLevel } from "@/lib/products";
import {
  getAdminProducts,
  type AdminProductSummary,
} from "@/lib/queries/admin-products";
import { getCategories } from "@/lib/queries/products";
import { AdminGate } from "../admin-gate";
import { AdminEmptyState, AdminPageHeader, AdminPageSkeleton } from "../admin-ui";

export const metadata: Metadata = {
  title: "Products | Admin | Atelier Store",
};

export default function AdminProductsPage({
  searchParams,
}: PageProps<"/admin/products">) {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <AdminGate path="/admin/products">
        <AdminPageHeader
          title="Products"
          intro="Every product in the catalogue, with its price, category and stock."
          action={
            <Link href="/admin/products/new" className="btn btn-primary">
              New product
            </Link>
          }
        />
        <ProductsTable searchParams={searchParams} />
      </AdminGate>
    </Suspense>
  );
}

async function ProductsTable({
  searchParams,
}: Pick<PageProps<"/admin/products">, "searchParams">) {
  await requireAdmin("/admin/products");
  const { category } = await searchParams;
  const categories = await getCategories();
  const selected = categories.find((c) => c.slug === category);
  const products = await getAdminProducts(selected?.slug);

  return (
    <div className="mt-10">
      <nav aria-label="Filter by category" className="-mx-gutter overflow-x-auto px-gutter lg:mx-0 lg:px-0">
        <ul className="flex gap-6 whitespace-nowrap">
          {[{ slug: undefined, name: "All" }, ...categories].map((item) => (
            <li key={item.slug ?? "all"}>
              <Link
                href={item.slug ? `/admin/products?category=${item.slug}` : "/admin/products"}
                aria-current={item.slug === selected?.slug ? "page" : undefined}
                className="link-nav inline-block py-2"
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {products.length === 0 ? (
        <AdminEmptyState>
          {selected ? "No products in this category yet." : "No products yet."}
        </AdminEmptyState>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[44rem] border-t text-left text-small">
            <caption className="sr-only">
              Products{selected ? ` in ${selected.name}` : ""}
            </caption>
            <thead className="text-ink-muted">
              <tr className="border-b">
                <th scope="col" className="py-3 pr-6 font-medium">Product</th>
                <th scope="col" className="py-3 pr-6 font-medium">Category</th>
                <th scope="col" className="py-3 pr-6 text-right font-medium">Price</th>
                <th scope="col" className="py-3 font-medium">Availability</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <ProductRow key={product.slug} product={product} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ProductRow({ product }: { product: AdminProductSummary }) {
  const total = product.stock.reduce((sum, row) => sum + row.quantity, 0);
  const soldOut = product.stock.filter((row) => row.quantity === 0);
  const image = product.images[0];

  return (
    <tr className="border-b align-middle">
      <td className="py-3 pr-6">
        <div className="flex items-center gap-4">
          <div className="media-frame aspect-product w-12 shrink-0">
            {image && (
              <Image src={image.src} alt="" width={48} height={64} sizes="48px" />
            )}
          </div>
          <div className="min-w-0">
            <Link
              href={`/admin/products/${product.slug}`}
              className="text-body font-medium link-quiet"
            >
              {product.name}
            </Link>
            <p className="text-ink-muted">
              {product.colour}
              {product.isNew && <span className="text-accent"> · New</span>}
            </p>
          </div>
        </div>
      </td>
      <td className="py-3 pr-6">{product.category.name}</td>
      <td className="py-3 pr-6 text-right tabular-nums">
        {formatPrice(product.priceCents)}
      </td>
      <td className="py-3">
        <span className={stockLevel(total) === "out-of-stock" ? "text-danger" : undefined}>
          {total === 0 ? "Out of stock" : `${total} in stock`}
        </span>
        {total > 0 && soldOut.length > 0 && (
          <span className="block text-ink-muted">
            Sold out: {soldOut.map((row) => row.size).join(", ")}
          </span>
        )}
        {total > 0 && soldOut.length === 0 && stockLevel(total) === "low-stock" && (
          <span className="block text-accent">{stockLabel(total)}</span>
        )}
      </td>
    </tr>
  );
}
