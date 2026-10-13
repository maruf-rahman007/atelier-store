import Link from "next/link";
import { formatPrice } from "@/lib/products";
import type { OrderSummary } from "@/lib/queries/orders";
import {
  formatOrderDate,
  orderProgressNote,
  orderReference,
  paymentStatusLabel,
} from "./order-ui";

/*
 * One row per order, each linking to its detail page. Stacked on small
 * screens; order, payment and total line up as columns from sm.
 */
export function OrderList({ orders }: { orders: OrderSummary[] }) {
  return (
    <ul className="border-t">
      {orders.map((order) => {
        const count = order.items.reduce((sum, item) => sum + item.quantity, 0);
        const note = orderProgressNote(order.status);
        return (
          <li key={order.publicId} className="border-b">
            <Link
              href={`/account/orders/${order.publicId}`}
              className="group grid grid-cols-[minmax(0,1fr)_auto] gap-x-6 gap-y-1 py-6 sm:grid-cols-[minmax(0,1fr)_10rem_6rem] sm:items-baseline"
            >
              <span className="col-span-2 min-w-0 sm:col-span-1">
                <span className="block font-medium group-hover:underline">
                  Order {orderReference(order.publicId)}
                </span>
                <span className="block text-small text-ink-muted">
                  {formatOrderDate(order.createdAt)} · {count}{" "}
                  {count === 1 ? "item" : "items"}
                </span>
              </span>
              <span className="text-small">
                <span className="sr-only">Payment: </span>
                {paymentStatusLabel(order.paymentStatus)}
                {note && <span className="text-ink-muted"> · {note}</span>}
              </span>
              <span className="text-right text-small tabular-nums">
                <span className="sr-only">Total: </span>
                {formatPrice(order.totalCents)}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/* Same row rhythm as OrderList so streaming in doesn't shift layout. */
export function OrderListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <ul aria-hidden className="border-t motion-safe:animate-pulse">
      {Array.from({ length: rows }, (_, i) => (
        <li
          key={i}
          className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-6 gap-y-1 border-b py-6 sm:grid-cols-[minmax(0,1fr)_10rem_6rem]"
        >
          <span className="col-span-2 sm:col-span-1">
            <span className="block h-6 w-36 bg-surface" />
            <span className="mt-1 block h-5 w-48 max-w-full bg-surface" />
          </span>
          <span className="h-5 w-16 bg-surface" />
          <span className="ml-auto h-5 w-14 bg-surface" />
        </li>
      ))}
    </ul>
  );
}
