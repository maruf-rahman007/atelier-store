"use server";

import { redirect } from "next/navigation";
import {
  bagSubtotalCents,
  buildBagLines,
  reconcileBag,
} from "@/lib/bag";
import { readBag, writeBag } from "@/lib/bag-cookie";
import { requireUser } from "@/lib/auth/session";
import {
  createPendingOrder,
  endOpenCheckouts,
  releaseOrphanedOrders,
  startStripeCheckout,
} from "@/lib/orders";
import { getBagProducts } from "@/lib/queries/bag";

export type CheckoutState = {
  status: "idle" | "error";
  message?: string;
};

/*
 * Starts Stripe Checkout for the current bag. The form sends only the
 * subtotal the customer was shown, and that is used only to notice that
 * prices changed. What is charged is computed here from live database prices,
 * and stock is held before the customer is sent to Stripe.
 */
export async function startCheckout(
  _prev: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  const user = await requireUser("/bag");
  const shownSubtotal = Number(formData.get("expectedSubtotalCents"));

  /* One open checkout per customer; also tidy up any abandoned starts. */
  await endOpenCheckouts(user.id);
  await releaseOrphanedOrders();

  const items = await readBag();
  const products = await getBagProducts(items.map((item) => item.slug));
  const lines = buildBagLines(items, products);
  if (lines.length === 0) redirect("/bag");

  /* Writing the reconciled bag re-renders the page with current stock. */
  async function changed(message: string): Promise<CheckoutState> {
    await writeBag(reconcileBag(items, products));
    return { status: "error", message };
  }

  if (lines.some((line) => line.status === "out-of-stock")) {
    return changed("Remove sold-out pieces before checking out.");
  }
  if (lines.some((line) => line.status === "reduced")) {
    return changed(
      "Some quantities were reduced to what’s in stock. Check your bag and try again.",
    );
  }
  if (bagSubtotalCents(lines) !== shownSubtotal) {
    return changed(
      "Prices have changed since you opened your bag. Check the new total and try again.",
    );
  }

  const order = await createPendingOrder(user, lines, products);
  if (!order) {
    const fresh = await getBagProducts(items.map((item) => item.slug));
    await writeBag(reconcileBag(items, fresh));
    return {
      status: "error",
      message:
        "Something in your bag sold out just now. Check your bag and try again.",
    };
  }

  let url: string;
  try {
    url = await startStripeCheckout(order);
  } catch (error) {
    console.error("Couldn’t start Stripe Checkout", error);
    return {
      status: "error",
      message: "We couldn’t start checkout. Nothing was charged; please try again.",
    };
  }
  redirect(url);
}
