import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminGate } from "../admin-gate";
import {
  AdminEmptyState,
  AdminPageHeader,
  AdminPageSkeleton,
} from "../admin-ui";

export const metadata: Metadata = {
  title: "Orders | Admin | Atelier Store",
};

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <AdminGate path="/admin/orders">
        <AdminPageHeader
          title="Orders"
          intro="Every customer’s orders, newest first."
        />
        <AdminEmptyState>
          The order list and order details arrive in a later step.
        </AdminEmptyState>
      </AdminGate>
    </Suspense>
  );
}
