import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { requireUser } from "@/lib/auth/session";

/*
 * Stripe sends the customer here after paying. Reaching this URL proves
 * nothing and changes nothing: the session id only finds the customer's order
 * to show. Payment is recorded by the webhook alone; until it arrives the
 * order page says the payment is being confirmed.
 */
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");
  if (!sessionId || !/^cs_[A-Za-z0-9_]+$/.test(sessionId)) redirect("/bag");
  /* Signed out (e.g. the session lapsed while paying): come back here. */
  const user = await requireUser(`/checkout/return?session_id=${sessionId}`);

  const order = await db.query.orders.findFirst({
    where: and(
      eq(orders.stripeCheckoutSessionId, sessionId),
      eq(orders.userId, user.id),
    ),
    columns: { publicId: true },
  });
  redirect(order ? `/account/orders/${order.publicId}` : "/account/orders");
}
