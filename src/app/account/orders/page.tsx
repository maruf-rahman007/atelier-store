import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth/session";
import { getOrdersForUser } from "@/lib/queries/orders";
import { OrderList, OrderListSkeleton } from "./order-list";

export const metadata: Metadata = {
  title: "Your orders | Atelier Store",
  robots: { index: false },
};

export default function OrdersPage() {
  return (
    <>
      <h1 className="text-headline">Orders</h1>
      <div className="mt-12">
        <Suspense fallback={<OrderListSkeleton />}>
          <Orders />
        </Suspense>
      </div>
    </>
  );
}

async function Orders() {
  const user = await requireUser("/account/orders");
  const orders = await getOrdersForUser(user.id);

  if (orders.length === 0) {
    return (
      <div className="border-t pt-6">
        <p className="text-body-lg text-ink-muted">
          You haven’t placed an order yet.
        </p>
        <Link href="/collections/new" className="btn btn-primary mt-8">
          Shop new arrivals
        </Link>
      </div>
    );
  }
  return <OrderList orders={orders} />;
}
