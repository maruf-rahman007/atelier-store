import "server-only";

import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";

/*
 * Order reads, always scoped to the signed-in customer. Not cached: an order's
 * status changes when Stripe reports a payment, and the pages that show it
 * must see that straight away.
 */

export async function getOrdersForUser(userId: string) {
  return db.query.orders.findMany({
    where: eq(orders.userId, userId),
    orderBy: desc(orders.createdAt),
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
