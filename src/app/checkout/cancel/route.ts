import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { requireUser } from "@/lib/auth/session";
import { cancelCheckout } from "@/lib/orders";

/*
 * Stripe sends the customer here when they leave Checkout. The session is
 * expired straight away so the held stock goes back now rather than in 30
 * minutes. If it was paid in the meantime, the order is recorded as paid
 * instead. The bag cookie is untouched.
 */
export async function GET(request: NextRequest) {
  const user = await requireUser("/bag");
  const publicId = request.nextUrl.searchParams.get("order");
  if (!publicId) redirect("/bag");

  const order = await db.query.orders.findFirst({
    where: and(eq(orders.publicId, publicId), eq(orders.userId, user.id)),
    columns: { id: true, status: true, stripeCheckoutSessionId: true },
  });
  if (order?.status === "pending") {
    try {
      await cancelCheckout(order);
    } catch (error) {
      /* Stripe will expire it anyway and the webhook releases the stock. */
      console.error(`Couldn’t cancel checkout for order ${publicId}`, error);
    }
  }
  redirect("/bag?checkout=cancelled");
}
