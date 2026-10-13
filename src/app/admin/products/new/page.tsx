import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth/session";
import { getCategories } from "@/lib/queries/products";
import { AdminGate } from "../../admin-gate";
import { AdminEmptyState, AdminPageHeader, AdminPageSkeleton } from "../../admin-ui";
import { ProductForm } from "../product-form";

export const metadata: Metadata = {
  title: "New product | Admin | Atelier Store",
};

export default function NewProductPage() {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <AdminGate path="/admin/products/new">
        <p className="text-small">
          <Link href="/admin/products" className="link-quiet text-ink-muted">
            ← All products
          </Link>
        </p>
        <div className="mt-4">
          <AdminPageHeader title="New product" />
        </div>
        <NewProduct />
      </AdminGate>
    </Suspense>
  );
}

async function NewProduct() {
  await requireAdmin("/admin/products/new");
  const categories = await getCategories();

  if (categories.length === 0) {
    return (
      <AdminEmptyState>
        Products belong to a category. Add a category first.
      </AdminEmptyState>
    );
  }

  return (
    <div className="mt-10">
      <ProductForm
        mode="create"
        categories={categories}
        initial={{
          name: "",
          slug: "",
          colour: "",
          category: "",
          price: "",
          description: "",
          details: "",
          images: [],
          sizes: [],
          isNew: true,
        }}
      />
    </div>
  );
}
