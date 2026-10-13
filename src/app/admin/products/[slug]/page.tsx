import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { priceInputValue } from "@/lib/admin/product-validation";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminProduct } from "@/lib/queries/admin-products";
import { getCategories } from "@/lib/queries/products";
import { AdminGate } from "../../admin-gate";
import { AdminPageHeader, AdminPageSkeleton, AdminSection } from "../../admin-ui";
import { ProductForm } from "../product-form";
import { StockEditor } from "../stock-editor";

export const metadata: Metadata = {
  title: "Edit product | Admin | Atelier Store",
};

export default function EditProductPage({
  params,
}: PageProps<"/admin/products/[slug]">) {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <Gated params={params} />
    </Suspense>
  );
}

/* The slug is only needed for the sign-in return path; nothing is read
 * until AdminGate has checked the role. */
async function Gated({ params }: Pick<PageProps<"/admin/products/[slug]">, "params">) {
  const { slug } = await params;
  return (
    <AdminGate path={`/admin/products/${encodeURIComponent(slug)}`}>
      <EditProduct slug={slug} />
    </AdminGate>
  );
}

async function EditProduct({ slug }: { slug: string }) {
  await requireAdmin("/admin/products");
  const [product, categories] = await Promise.all([
    getAdminProduct(slug),
    getCategories(),
  ]);
  if (!product) notFound();

  return (
    <>
      <p className="text-small">
        <Link href="/admin/products" className="link-quiet text-ink-muted">
          ← All products
        </Link>
      </p>
      <div className="mt-4">
        <AdminPageHeader
          title={product.name}
          intro={`${product.colour} · ${product.category.name}`}
          action={
            <Link href={`/products/${product.slug}`} className="link-cta">
              View in store
            </Link>
          }
        />
      </div>

      <div className="mt-12 flex flex-col gap-16">
        <AdminSection title="Availability">
          <p className="mb-6 max-w-[60ch] text-body text-ink-muted">
            Stock per size. A size at 0 shows as sold out; the product is
            unavailable when every size is at 0. Stock held by open checkouts
            is already taken off these numbers.
          </p>
          <StockEditor
            slug={product.slug}
            stock={product.stock.map((row) => ({
              size: row.size,
              quantity: row.quantity,
            }))}
          />
        </AdminSection>

        <div className="border-t pt-6">
          <ProductForm
            mode="edit"
            version={product.version}
            categories={categories}
            initial={{
              name: product.name,
              slug: product.slug,
              colour: product.colour,
              category: product.category.slug,
              price: priceInputValue(product.priceCents),
              description: product.description,
              details: product.details.join("\n"),
              images: product.images,
              sizes: [],
              isNew: product.isNew,
            }}
          />
        </div>
      </div>
    </>
  );
}
