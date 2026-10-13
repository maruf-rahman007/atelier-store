"use client";

import { useActionState, useEffect } from "react";
import { startCheckout, type CheckoutState } from "@/app/checkout/actions";
import { useBagActivity } from "@/components/bag/bag-activity";
import { SpinnerIcon } from "@/components/icons";

/* Posts to startCheckout, which re-checks stock and prices, holds the stock
 * and sends the customer to Stripe. The subtotal shown on the page goes along
 * only so the server can tell if prices changed in the meantime. */
export function CheckoutForm({
  subtotalCents,
  blocked,
  signedIn,
}: {
  subtotalCents: number;
  /* Sold-out lines must be removed first; the summary says why. */
  blocked: boolean;
  signedIn: boolean;
}) {
  const [state, formAction, pending] = useActionState<CheckoutState, FormData>(
    startCheckout,
    { status: "idle" },
  );
  const { setCheckingOut, editing } = useBagActivity();
  /* Lock the lines on submit, before the pending render; unlock when the
   * action returns (on success the page has moved on to Stripe). */
  useEffect(() => {
    if (!pending) setCheckingOut(false);
  }, [pending, setCheckingOut]);

  return (
    <form
      action={formAction}
      onSubmit={() => setCheckingOut(true)}
      className="mt-6"
      aria-busy={pending}
    >
      <input type="hidden" name="expectedSubtotalCents" value={subtotalCents} />
      <button
        type="submit"
        className="btn btn-primary btn-lg btn-block"
        disabled={blocked || editing || pending}
      >
        {pending ? (
          <>
            <SpinnerIcon width={16} height={16} />
            Preparing secure checkout…
          </>
        ) : signedIn ? (
          "Checkout"
        ) : (
          "Sign in to check out"
        )}
      </button>
      <p role="status" className="sr-only">
        {pending ? "Checking stock and preparing checkout." : ""}
      </p>
      {state.status === "error" && !pending && (
        <p
          role="alert"
          className="mt-3 border border-danger px-3 py-2 text-small text-danger"
        >
          {state.message}
        </p>
      )}
      <p className="mt-3 text-caption text-ink-subtle">
        {pending
          ? "Taking you to Stripe. Please don’t close this page."
          : "You’ll pay on Stripe’s secure checkout page."}
      </p>
    </form>
  );
}
