"use client";

import { useActionState } from "react";
import { startCheckout, type CheckoutState } from "@/app/checkout/actions";
import { SpinnerIcon } from "@/components/icons";

/* Posts to startCheckout, which re-checks stock and prices, holds the stock
 * and sends the customer to Stripe. The subtotal shown on the page goes along
 * only so the server can tell if prices changed in the meantime. */
export function CheckoutForm({
  subtotalCents,
  disabled,
}: {
  subtotalCents: number;
  disabled: boolean;
}) {
  const [state, formAction, pending] = useActionState<CheckoutState, FormData>(
    startCheckout,
    { status: "idle" },
  );

  return (
    <form action={formAction} className="mt-6">
      <input type="hidden" name="expectedSubtotalCents" value={subtotalCents} />
      <button
        type="submit"
        className="btn btn-primary btn-lg btn-block"
        disabled={disabled || pending}
      >
        {pending ? (
          <>
            <SpinnerIcon width={16} height={16} />
            Starting checkout…
          </>
        ) : (
          "Checkout"
        )}
      </button>
      <p
        role="status"
        className="mt-3 text-small text-danger empty:mt-0"
      >
        {state.status === "error" ? state.message : null}
      </p>
    </form>
  );
}
