import "server-only";

import { and, desc, eq, not } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";

/*
 * Order reads, always scoped to the signed-in customer. Not cached: an order's
 * status changes when Stripe reports a payment, and the pages that show it
 * must see that straight away.
 */

/* Checkouts cancelled before payment started aren't orders to the customer. */
export async function getOrdersForUser(userId: string, limit?: number) {
  return db.query.orders.findMany({
    where: and(
      eq(orders.userId, userId),
      not(and(eq(orders.status, "cancelled"), eq(orders.paymentStatus, "unpaid"))!),
    ),
    orderBy: desc(orders.createdAt),
    limit,
    columns: {
      publicId: true,
      status: true,
      paymentStatus: true,
      totalCents: true,
      createdAt: true,
    },
    with: { items: { columns: { quantity: true } } },
  });
}

export async function getOrderForUser(publicId: string, userId: string) {
  return db.query.orders.findFirst({
    where: and(eq(orders.publicId, publicId), eq(orders.userId, userId)),
    columns: {
      id: false,
      userId: false,
      stripeCheckoutSessionId: false,
      stripePaymentIntentId: false,
      reviewReason: false,
    },
    with: {
      items: {
        columns: { orderId: false, productId: false },
      },
    },
  });
}

export type OrderSummary = Awaited<ReturnType<typeof getOrdersForUser>>[number];
export type OrderDetail = NonNullable<Awaited<ReturnType<typeof getOrderForUser>>>;
