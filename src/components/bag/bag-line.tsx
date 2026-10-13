"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState } from "react";
import {
  removeBagLine,
  updateBagLine,
  type BagActionState,
} from "@/app/bag/actions";
import { useBagActivity, useTrackPending } from "@/components/bag/bag-activity";
import { SpinnerIcon } from "@/components/icons";
import { StockStatus } from "@/components/product/stock-status";
import { MAX_LINE_QUANTITY, type BagLine as BagLineData } from "@/lib/bag";
import { formatPrice, ONE_SIZE, stockLevel } from "@/lib/products";

const idle: BagActionState = { status: "idle" };

/* One bag row. Quantity changes and removal are plain forms posting to
 * Server Actions, so they work before hydration; the server re-checks stock
 * and the page re-renders from the updated cookie. */
export function BagLine({ line }: { line: BagLineData }) {
  const [updateState, updateAction, updating] = useActionState(
    updateBagLine,
    idle,
  );
  const [removeState, removeAction, removing] = useActionState(
    removeBagLine,
    idle,
  );
  useTrackPending(updating || removing);
  /* Locked while checkout starts, so the order matches what's on screen. */
  const { checkingOut } = useBagActivity();
  const pending = updating || removing || checkingOut;
  const soldOut = line.status === "out-of-stock";
  const atLimit = !soldOut && line.quantity >= line.maxQuantity;
  const href = `/products/${line.slug}`;
  const error =
    removeState.status === "error"
      ? removeState.message
      : updateState.status === "error"
        ? updateState.message
        : undefined;

  const lineFields = (
    <>
      <input type="hidden" name="slug" value={line.slug} />
      <input type="hidden" name="size" value={line.size} />
    </>
  );

  return (
    <li
      className={`grid grid-cols-[5.5rem_minmax(0,1fr)] gap-4 border-b py-6 transition-opacity duration-200 sm:grid-cols-[7.5rem_minmax(0,1fr)] sm:gap-6 ${removing ? "opacity-50" : ""}`}
      aria-busy={pending}
    >
      <Link
        href={href}
        className="media-frame aspect-product block"
        tabIndex={-1}
        aria-hidden="true"
      >
        {line.image && (
          <Image
            src={line.image.src}
            alt=""
            fill
            sizes="(min-width: 640px) 7.5rem, 5.5rem"
            className={`object-cover ${soldOut ? "opacity-50 grayscale" : ""}`}
          />
        )}
      </Link>

      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex items-start justify-between gap-4 text-small">
          <div className="min-w-0">
            <h3 className="font-medium">
              <Link href={href} className="link-quiet">
                {line.name}
              </Link>
            </h3>
            <p className="text-ink-subtle">
              {line.colour}
              {line.size !== ONE_SIZE && ` · Size ${line.size}`}
            </p>
            <p className="mt-1 text-ink-muted">
              {formatPrice(line.priceCents)}
              {line.quantity > 1 && " each"}
            </p>
          </div>
          {soldOut ? (
            <p className="shrink-0 text-right text-ink-subtle">Not included</p>
          ) : (
            <p className="shrink-0 text-right tabular-nums">
              <span className="sr-only">Line total: </span>
              {formatPrice(line.priceCents * line.quantity)}
            </p>
          )}
        </div>

        <StockNotice line={line} />

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          {!soldOut && (
            <form
              action={updateAction}
              className="flex items-center border"
              aria-label={`Quantity of ${line.name}`}
            >
              {lineFields}
              <button
                type="submit"
                name="quantity"
                value={line.quantity - 1}
                disabled={pending || line.quantity <= 1}
                className="btn btn-ghost btn-icon disabled:opacity-40"
                aria-label={`Decrease quantity of ${line.name}`}
              >
                <span aria-hidden="true">−</span>
              </button>
              <output
                className="flex w-8 justify-center text-small tabular-nums"
                aria-live="polite"
              >
                {updating ? (
                  <SpinnerIcon width={14} height={14} aria-label="Updating" />
                ) : (
                  <>
                    <span className="sr-only">Quantity </span>
                    {line.quantity}
                  </>
                )}
              </output>
              <button
                type="submit"
                name="quantity"
                value={line.quantity + 1}
                disabled={pending || atLimit}
                className="btn btn-ghost btn-icon disabled:opacity-40"
                aria-label={`Increase quantity of ${line.name}`}
              >
                <span aria-hidden="true">+</span>
              </button>
            </form>
          )}
          <form action={removeAction}>
            {lineFields}
            <button
              type="submit"
              disabled={pending}
              className="link text-small text-ink-muted disabled:opacity-40"
            >
              {removing ? "Removing…" : "Remove"}
              <span className="sr-only"> {line.name}</span>
            </button>
          </form>
        </div>

        {atLimit && (
          <p className="-mt-2 text-caption text-ink-subtle">
            {line.maxQuantity === line.stock
              ? "That’s all we have in stock."
              : `You can add up to ${MAX_LINE_QUANTITY} of each piece.`}
          </p>
        )}

        <p role="status" className="text-small text-danger empty:hidden">
          {error}
        </p>
      </div>
    </li>
  );
}

/* What the customer needs to know about stock for this line, if anything. */
function StockNotice({ line }: { line: BagLineData }) {
  switch (line.status) {
    case "out-of-stock":
      return (
        <div className="flex flex-col gap-1">
          <StockStatus stock={0} />
          <p className="text-small text-ink-muted">
            This sold out after you added it. Remove it to continue.
          </p>
        </div>
      );
    case "reduced":
      return (
        <p className="w-fit border border-danger px-3 py-2 text-small text-danger">
          Only {line.stock} left, so we’ve changed your quantity from{" "}
          {line.requested} to {line.quantity}.
        </p>
      );
    case "ok":
      return stockLevel(line.stock) === "low-stock" ? (
        <StockStatus stock={line.stock} />
      ) : null;
  }
}
