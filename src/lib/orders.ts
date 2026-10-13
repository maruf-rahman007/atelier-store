import "server-only";

import { randomUUID } from "node:crypto";
import { and, eq, isNull, lt, sql } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import type Stripe from "stripe";
import { db } from "@/db";
import { orderItems, orders, type ShippingAddress } from "@/db/schema";
import type { BagLine, BagProduct } from "@/lib/bag";
import { env } from "@/lib/env";
import { ONE_SIZE } from "@/lib/products";
import { getStripe } from "@/lib/stripe";

/*
 * Order lifecycle for Stripe Checkout. Prices, totals and stock come only from
 * the database; payment state comes only from Stripe (a verified webhook or a
 * server-side session lookup), never from the browser.
 *
 * Stock is held by reserve_order_stock() when checkout starts and given back
 * by release_order_stock() when the session expires or is cancelled. Both are
 * idempotent Postgres functions (drizzle/0003_order_stock_functions.sql).
 */

/* Stripe's minimum session lifetime is 30 minutes; a minute's margin keeps
 * the request valid however long it takes to arrive. */
const CHECKOUT_HOLD_SECONDS = 31 * 60;
/* A pending order with no Stripe session this old was abandoned mid-start. */
const ORPHAN_AFTER_MS = 10 * 60 * 1000;
const SHIPPING_CENTS = 0;
/* Labels these sessions in the Stripe Dashboard. */
const INTEGRATION_IDENTIFIER = "atelier-checkout-qkzvhmtd";

type PendingOrder = { id: number; publicId: string };

async function callStockFunction(
  name: "reserve_order_stock" | "release_order_stock",
  orderId: number,
) {
  const result = await db.execute<{ ok: boolean }>(
    name === "reserve_order_stock"
      ? sql`select reserve_order_stock(${orderId}) as ok`
      : sql`select release_order_stock(${orderId}) as ok`,
  );
  return result.rows[0]?.ok === true;
}

/*
 * Creates a pending order from bag lines that were just checked against live
 * stock and prices, then holds the stock. Returns null (with the order marked
 * cancelled) if the hold fails because something sold out in between.
 */
export async function createPendingOrder(
  user: { id: string; email: string },
  lines: BagLine[],
  products: Map<string, BagProduct>,
): Promise<PendingOrder | null> {
  if (lines.length === 0 || lines.some((line) => line.status !== "ok")) {
    throw new Error("Only fully in-stock bag lines can be ordered");
  }
  const subtotalCents = lines.reduce(
    (sum, line) => sum + line.priceCents * line.quantity,
    0,
  );
  const [order] = await db
    .insert(orders)
    .values({
      publicId: randomUUID(),
      userId: user.id,
      subtotalCents,
      shippingCents: SHIPPING_CENTS,
      totalCents: subtotalCents + SHIPPING_CENTS,
      email: user.email,
    })
    .returning({ id: orders.id, publicId: orders.publicId });

  await db.insert(orderItems).values(
    lines.map((line) => ({
      orderId: order.id,
      productId: products.get(line.slug)?.id ?? null,
      productSlug: line.slug,
      productName: line.name,
      colour: line.colour,
      size: line.size,
      unitPriceCents: line.priceCents,
      quantity: line.quantity,
    })),
  );

  if (!(await callStockFunction("reserve_order_stock", order.id))) {
    await db
      .update(orders)
      .set({ status: "cancelled" })
      .where(and(eq(orders.id, order.id), eq(orders.status, "pending")));
    return null;
  }
  revalidateTag("products", "max");
  return order;
}

/* Creates the hosted Checkout Session for a pending order, from the order's
 * own rows, and records its id. Releases the hold if Stripe fails. */
export async function startStripeCheckout(order: PendingOrder) {
  const row = await db.query.orders.findFirst({
    where: eq(orders.id, order.id),
    with: { items: true },
  });
  if (!row) throw new Error(`Order ${order.id} not found`);

  const appUrl = env.APP_URL;
  const expiresAt = Math.floor(Date.now() / 1000) + CHECKOUT_HOLD_SECONDS;

  let session: Stripe.Checkout.Session;
  try {
    session = await getStripe().checkout.sessions.create(
      {
        mode: "payment",
        /* Payment methods come from the Dashboard settings. Delayed ones
         * (bank debits) complete the session unpaid; the stock stays held
         * until checkout.session.async_payment_succeeded or _failed. */
        integration_identifier: INTEGRATION_IDENTIFIER,
        line_items: row.items.map((item) => ({
          quantity: item.quantity,
          price_data: {
            currency: "usd",
            unit_amount: item.unitPriceCents,
            product_data: {
              name: item.productName,
              description:
                item.size === ONE_SIZE
                  ? item.colour
                  : `${item.colour} · Size ${item.size}`,
            },
          },
        })),
        customer_email: row.email,
        shipping_address_collection: { allowed_countries: ["US"] },
        client_reference_id: row.publicId,
        metadata: { order_id: row.publicId },
        payment_intent_data: { metadata: { order_id: row.publicId } },
        expires_at: expiresAt,
        success_url: `${appUrl}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}/checkout/cancel?order=${row.publicId}`,
      },
      { idempotencyKey: `checkout-session:${row.publicId}` },
    );
  } catch (error) {
    await endUnpaidOrder(order.id, "cancelled");
    throw error;
  }

  await db
    .update(orders)
    .set({
      stripeCheckoutSessionId: session.id,
      expiresAt: new Date(session.expires_at * 1000),
    })
    .where(eq(orders.id, order.id));

  if (!session.url) throw new Error(`Session ${session.id} has no URL`);
  return session.url;
}

/*
 * Ends a pending order that won't be paid and gives its stock back. Safe to
 * call repeatedly: the status only moves from pending, and the stock function
 * releases at most once and never for a paid order.
 */
export async function endUnpaidOrder(
  orderId: number,
  status: "expired" | "cancelled",
) {
  await db
    .update(orders)
    .set({ status })
    .where(
      and(
        eq(orders.id, orderId),
        eq(orders.status, "pending"),
        eq(orders.paymentStatus, "unpaid"),
      ),
    );
  if (await callStockFunction("release_order_stock", orderId)) {
    revalidateTag("products", "max");
  }
}

function shippingAddress(
  session: Stripe.Checkout.Session,
): ShippingAddress | null {
  const details = session.collected_information?.shipping_details;
  if (!details) return null;
  const { address } = details;
  return {
    name: details.name,
    line1: address.line1,
    line2: address.line2,
    city: address.city,
    state: address.state,
    postalCode: address.postal_code,
    country: address.country,
  };
}

/*
 * Applies a Checkout Session's outcome to its order. Only the webhook calls
 * this, with the session from a signature-verified Stripe event; the browser's
 * return to the success URL never records a payment. Idempotent: every write
 * is conditional on the order's current state, so duplicate or late events
 * change nothing.
 */
export async function syncCheckoutSession(session: Stripe.Checkout.Session) {
  const publicId = session.metadata?.order_id ?? session.client_reference_id;
  if (!publicId) return;
  const order = await db.query.orders.findFirst({
    where: eq(orders.publicId, publicId),
  });
  if (!order) return;
  if (
    order.stripeCheckoutSessionId &&
    order.stripeCheckoutSessionId !== session.id
  ) {
    return;
  }

  if (session.status === "expired") {
    await endUnpaidOrder(order.id, "expired");
    return;
  }
  if (session.status !== "complete" || session.payment_status !== "paid") {
    return;
  }
  /* Already recorded (a repeated event, or the webhook and return page both
   * confirming the same payment). */
  if (order.paymentStatus !== "unpaid") return;

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

  const mismatch =
    session.currency !== "usd"
      ? `Currency ${session.currency} instead of usd`
      : session.amount_total !== order.totalCents
        ? `Charged ${session.amount_total} cents for an order of ${order.totalCents}`
        : !paymentIntentId
          ? "Paid session has no payment intent"
          : order.status !== "pending" || order.stockReleasedAt
            ? `Paid after the order was ${order.status} and its stock released`
            : null;

  if (mismatch) {
    /* Money arrived but doesn't fit the order: keep any held stock and flag
     * it for a person to resolve (refund or fulfil). */
    const flagged = await db
      .update(orders)
      .set({ status: "requires_review", reviewReason: mismatch })
      .where(
        and(
          eq(orders.id, order.id),
          eq(orders.paymentStatus, "unpaid"),
          isNull(orders.reviewReason),
        ),
      )
      .returning({ id: orders.id });
    if (flagged.length > 0) {
      console.error(`Order ${order.publicId} needs review: ${mismatch}`);
    }
    return;
  }

  await db
    .update(orders)
    .set({
      status: "placed",
      paymentStatus: "paid",
      paidAt: new Date(),
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId: paymentIntentId,
      email: session.customer_details?.email ?? order.email,
      shippingAddress: shippingAddress(session),
    })
    .where(
      and(
        eq(orders.id, order.id),
        eq(orders.status, "pending"),
        eq(orders.paymentStatus, "unpaid"),
      ),
    );
}

/* A delayed payment (bank debit) failed after the session completed: the
 * order won't be paid, so its stock goes back. */
export async function failCheckoutSession(session: Stripe.Checkout.Session) {
  if (session.payment_status === "paid") return;
  const order = await db.query.orders.findFirst({
    where: eq(orders.stripeCheckoutSessionId, session.id),
    columns: { id: true },
  });
  if (order) await endUnpaidOrder(order.id, "cancelled");
}

/*
 * Ends a customer's open checkout: expires the Stripe session so it can no
 * longer be paid, then releases the hold. If Stripe refuses (the session was
 * already completed or expired), nothing changes here; the webhook event for
 * that outcome settles the order.
 */
export async function cancelCheckout(order: {
  id: number;
  stripeCheckoutSessionId: string | null;
}) {
  if (!order.stripeCheckoutSessionId) {
    await endUnpaidOrder(order.id, "cancelled");
    return;
  }
  let expired: boolean;
  try {
    const session = await getStripe().checkout.sessions.expire(
      order.stripeCheckoutSessionId,
    );
    expired = session.status === "expired";
  } catch {
    return;
  }
  /* Stripe has confirmed the session can no longer be paid. */
  if (expired) await endUnpaidOrder(order.id, "expired");
}

/* Before a new checkout: end this customer's other open checkouts, so one
 * person never holds two sets of stock. Orders without a session are only
 * ended once they're clearly orphaned, not while another start is running. */
export async function endOpenCheckouts(userId: string) {
  const pending = await db.query.orders.findMany({
    where: and(eq(orders.userId, userId), eq(orders.status, "pending")),
    columns: { id: true, stripeCheckoutSessionId: true, createdAt: true },
  });
  const orphanBefore = Date.now() - ORPHAN_AFTER_MS;
  for (const order of pending) {
    if (order.stripeCheckoutSessionId) {
      await cancelCheckout(order);
    } else if (order.createdAt.getTime() < orphanBefore) {
      await endUnpaidOrder(order.id, "cancelled");
    }
  }
}

/* Orders of any customer abandoned before a Stripe session was created (a
 * crash between holding stock and creating the session). */
export async function releaseOrphanedOrders() {
  const orphaned = await db
    .select({ id: orders.id })
    .from(orders)
    .where(
      and(
        eq(orders.status, "pending"),
        isNull(orders.stripeCheckoutSessionId),
        lt(orders.createdAt, new Date(Date.now() - ORPHAN_AFTER_MS)),
      ),
    )
    .limit(20);
  for (const order of orphaned) await endUnpaidOrder(order.id, "cancelled");
}

/* Marks a paid order's lines as removed from the bag. True only the first
 * time, so the order page takes them out of the bag cookie once. */
export async function claimBagClear(orderId: number) {
  const claimed = await db
    .update(orders)
    .set({ bagClearedAt: new Date() })
    .where(
      and(
        eq(orders.id, orderId),
        eq(orders.paymentStatus, "paid"),
        isNull(orders.bagClearedAt),
      ),
    )
    .returning({ id: orders.id });
  return claimed.length > 0;
}
