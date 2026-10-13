import { eq } from "drizzle-orm";
import type Stripe from "stripe";
import { db } from "@/db";
import { stripeEvents } from "@/db/schema";
import { env } from "@/lib/env";
import { failCheckoutSession, syncCheckoutSession } from "@/lib/orders";
import { getStripe } from "@/lib/stripe";

/*
 * Stripe webhook: the authoritative source of payment outcomes. Events are
 * accepted only with a valid signature over the raw body. Each event id is
 * recorded so repeats return early; the handlers are idempotent anyway, so an
 * event that failed part-way is simply processed again on Stripe's retry.
 *
 * Subscribe the endpoint to checkout.session.completed,
 * checkout.session.async_payment_succeeded,
 * checkout.session.async_payment_failed and checkout.session.expired.
 */
export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      await request.text(),
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    );
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  const [seen] = await db
    .insert(stripeEvents)
    .values({ id: event.id, type: event.type })
    .onConflictDoUpdate({
      target: stripeEvents.id,
      set: { type: event.type },
    })
    .returning({ processedAt: stripeEvents.processedAt });
  if (seen?.processedAt) return Response.json({ received: true, duplicate: true });

  try {
    switch (event.type) {
      /* syncCheckoutSession only records a payment when the session says
       * payment_status "paid"; a delayed payment completes the session unpaid
       * and is recorded on async_payment_succeeded. A declined card isn't an
       * event here: the customer stays on Stripe's page and can retry until
       * the session expires. */
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
      case "checkout.session.expired":
        await syncCheckoutSession(event.data.object);
        break;
      case "checkout.session.async_payment_failed":
        await failCheckoutSession(event.data.object);
        break;
      default:
        break;
    }
  } catch (error) {
    console.error(`Stripe webhook ${event.id} (${event.type}) failed`, error);
    return new Response("Webhook handler failed", { status: 500 });
  }

  await db
    .update(stripeEvents)
    .set({ processedAt: new Date() })
    .where(eq(stripeEvents.id, event.id));
  return Response.json({ received: true });
}
