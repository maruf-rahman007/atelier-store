import type { OrderSummary } from "@/lib/queries/orders";

/* Short reference shown to customers; the full public id is in the URL. */
export const orderReference = (publicId: string) =>
  publicId.slice(0, 8).toUpperCase();

export const formatOrderDate = (date: Date) =>
  new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(date);

export const paymentStatusLabel = (
  paymentStatus: OrderSummary["paymentStatus"],
) =>
  ({ unpaid: "Unpaid", paid: "Paid", refunded: "Refunded" })[paymentStatus];

/* What happened to the order itself, when that adds to the payment status.
 * Placed orders need no note. */
export function orderProgressNote(status: OrderSummary["status"]) {
  switch (status) {
    case "pending":
      return "Awaiting payment";
    case "expired":
      return "Not completed";
    case "cancelled":
      return "Cancelled";
    case "requires_review":
      return "Under review";
    default:
      return null;
  }
}

export const orderStateLabel = (status: OrderSummary["status"]) =>
  orderProgressNote(status) ?? "Placed";
