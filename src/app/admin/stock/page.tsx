import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminGate } from "../admin-gate";
import {
  AdminEmptyState,
  AdminPageHeader,
  AdminPageSkeleton,
} from "../admin-ui";

export const metadata: Metadata = {
  title: "Stock | Admin | Atelier Store",
};

export default function AdminStockPage() {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <AdminGate path="/admin/stock">
        <AdminPageHeader
          title="Stock"
          intro="Live stock for every product and size."
        />
        <AdminEmptyState>
          Stock levels and quantity updates arrive in a later step.
        </AdminEmptyState>
      </AdminGate>
    </Suspense>
  );
}
