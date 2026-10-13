import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { removeOrderedFromBag } from "@/lib/bag";
import { readBag, writeBag } from "@/lib/bag-cookie";
import { requireUser } from "@/lib/auth/session";
import { claimBagClear, syncCheckoutSession } from "@/lib/orders";
import { getStripe } from "@/lib/stripe";

/*
 * Stripe sends the customer here after paying. Reaching this URL proves
 * nothing: the session id is only used to look the session up from Stripe
 * server-side, and the order is updated from what Stripe reports (the same
 * code the webhook runs). Then the ordered pieces leave the bag, once.
 */
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");
  if (!sessionId || !/^cs_[A-Za-z0-9_]+$/.test(sessionId)) redirect("/bag");
  /* Signed out (e.g. the session lapsed while paying): come back here. */
  const user = await requireUser(`/checkout/return?session_id=${sessionId}`);

  const find = () =>
    db.query.orders.findFirst({
      where: and(
        eq(orders.stripeCheckoutSessionId, sessionId),
        eq(orders.userId, user.id),
      ),
      columns: { id: true, publicId: true, paymentStatus: true },
      with: { items: { columns: { productSlug: true, size: true, quantity: true } } },
    });

  let order = await find();
  if (!order) redirect("/account/orders");

  if (order.paymentStatus === "unpaid") {
    try {
      await syncCheckoutSession(
        await getStripe().checkout.sessions.retrieve(sessionId),
      );
      order = (await find()) ?? order;
    } catch (error) {
      /* The webhook will still settle it; the order page shows "confirming". */
      console.error(`Couldn’t confirm session ${sessionId}`, error);
    }
  }

  if (order.paymentStatus === "paid" && (await claimBagClear(order.id))) {
    await writeBag(
      removeOrderedFromBag(
        await readBag(),
        order.items.map((item) => ({
          slug: item.productSlug,
          size: item.size,
          quantity: item.quantity,
        })),
      ),
    );
  }
  redirect(`/account/orders/${order.publicId}`);
}
