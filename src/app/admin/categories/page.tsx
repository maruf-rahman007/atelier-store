import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminGate } from "../admin-gate";
import {
  AdminEmptyState,
  AdminPageHeader,
  AdminPageSkeleton,
} from "../admin-ui";

export const metadata: Metadata = {
  title: "Categories | Admin | Atelier Store",
};

export default function AdminCategoriesPage() {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <AdminGate path="/admin/categories">
        <AdminPageHeader
          title="Categories"
          intro="The categories products are grouped into, in navigation order."
        />
        <AdminEmptyState>
          Category management arrives in a later step.
        </AdminEmptyState>
      </AdminGate>
    </Suspense>
  );
}
