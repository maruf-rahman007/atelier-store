import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth/session";
import { formatPrice } from "@/lib/products";
import { getOrdersForUser } from "@/lib/queries/orders";
import { AccountPageSkeleton } from "../account-ui";
import { formatOrderDate, orderReference, orderStatusLabel } from "./order-ui";

export const metadata: Metadata = {
  title: "Your orders | Atelier Store",
  robots: { index: false },
};

export default function OrdersPage() {
  return (
    <Suspense fallback={<AccountPageSkeleton />}>
      <Orders />
    </Suspense>
  );
}

async function Orders() {
  const user = await requireUser("/account/orders");
  /* Checkouts that never started payment aren't orders to the customer. */
  const orders = (await getOrdersForUser(user.id)).filter(
    (order) => order.status !== "cancelled" || order.paymentStatus !== "unpaid",
  );

  return (
    <>
      <h1 className="text-headline">Orders</h1>
      {orders.length === 0 ? (
        <div className="mt-12 border-t pt-6">
          <p className="text-body-lg text-ink-muted">
            You haven’t placed an order yet.
          </p>
          <Link href="/collections/new" className="btn btn-primary mt-8">
            Shop new arrivals
          </Link>
        </div>
      ) : (
        <ul className="mt-12 border-t">
          {orders.map((order) => {
            const count = order.items.reduce((sum, item) => sum + item.quantity, 0);
            return (
              <li key={order.publicId} className="border-b">
                <Link
                  href={`/account/orders/${order.publicId}`}
                  className="group grid gap-1 py-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-baseline sm:gap-6"
                >
                  <span className="min-w-0">
                    <span className="block font-medium group-hover:underline">
                      Order {orderReference(order.publicId)}
                    </span>
                    <span className="block text-small text-ink-muted">
                      {formatOrderDate(order.createdAt)} · {count}{" "}
                      {count === 1 ? "item" : "items"}
                    </span>
                  </span>
                  <span className="flex gap-4 text-small sm:justify-end">
                    <span className="text-ink-muted">
                      {orderStatusLabel(order)}
                    </span>
                    <span className="tabular-nums">
                      {formatPrice(order.totalCents)}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
