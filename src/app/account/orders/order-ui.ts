import type { OrderSummary } from "@/lib/queries/orders";

/* Short reference shown to customers; the full public id is in the URL. */
export const orderReference = (publicId: string) =>
  publicId.slice(0, 8).toUpperCase();

export const formatOrderDate = (date: Date) =>
  new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(date);

/* Payment status decides "paid"; order status covers everything else. */
export function orderStatusLabel(
  order: Pick<OrderSummary, "status" | "paymentStatus">,
) {
  if (order.paymentStatus === "refunded") return "Refunded";
  if (order.paymentStatus === "paid") {
    return order.status === "requires_review" ? "Paid, under review" : "Paid";
  }
  switch (order.status) {
    case "pending":
      return "Awaiting payment";
    case "expired":
      return "Not completed";
    case "cancelled":
      return "Cancelled";
    case "requires_review":
      return "Under review";
    default:
      return "Placed";
  }
}
