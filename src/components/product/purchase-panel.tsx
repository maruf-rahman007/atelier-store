"use client";

import Link from "next/link";
import { useActionState, useId, useState, type FormEvent } from "react";
import { addToBag, type BagActionState } from "@/app/bag/actions";
import { SpinnerIcon } from "@/components/icons";
import { StockStatus } from "@/components/product/stock-status";
import {
  isOneSize,
  ONE_SIZE,
  productStock,
  type Product,
} from "@/lib/products";

/* Size selection, stock state and the add-to-bag form. The stock shown here
 * comes from the cached product and can be a little old; addToBag checks live
 * stock and current price on the server. */
export function PurchasePanel({ product }: { product: Product }) {
  const sizeLegendId = useId();
  const messageId = useId();
  const oneSize = isOneSize(product);
  const totalStock = productStock(product);
  const soldOut = totalStock === 0;

  const [selected, setSelected] = useState<string | null>(
    oneSize ? product.sizes[0].label : null,
  );
  const [sizeError, setSizeError] = useState(false);
  const [state, formAction, pending] = useActionState<
    BagActionState,
    FormData
  >(addToBag, { status: "idle" });

  const selectedSize = product.sizes.find((size) => size.label === selected);
  /* Server messages belong to the size they were about; with no selection
   * (a submit before hydration) the latest one is shown. */
  const result =
    state.status !== "idle" && (selected === null || state.size === selected)
      ? state
      : undefined;

  const checkSize = (event: FormEvent<HTMLFormElement>) => {
    if (selectedSize) return;
    event.preventDefault();
    setSizeError(true);
    event.currentTarget
      .querySelector<HTMLInputElement>('input[name="size"]:not(:disabled)')
      ?.focus();
  };

  return (
    <form
      action={formAction}
      onSubmit={checkSize}
      className="flex flex-col gap-6"
    >
      <input type="hidden" name="slug" value={product.slug} />
      {oneSize && <input type="hidden" name="size" value={ONE_SIZE} />}
      {!oneSize && (
        <fieldset aria-describedby={messageId}>
          <legend id={sizeLegendId} className="text-small font-medium">
            Size
          </legend>
          <div className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(3.5rem,1fr))] gap-1">
            {product.sizes.map((size) => {
              const unavailable = size.stock === 0;
              return (
                <label key={size.label} className="relative">
                  <input
                    type="radio"
                    name="size"
                    value={size.label}
                    disabled={unavailable}
                    checked={selected === size.label}
                    onChange={() => {
                      setSelected(size.label);
                      setSizeError(false);
                    }}
                    className="peer sr-only"
                    aria-label={
                      unavailable ? `${size.label}, out of stock` : size.label
                    }
                  />
                  <span className="flex h-12 cursor-pointer items-center justify-center border text-small transition-colors duration-150 hover:border-ink peer-checked:border-ink peer-checked:bg-ink peer-checked:text-canvas peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink peer-disabled:cursor-not-allowed peer-disabled:border-line peer-disabled:bg-[linear-gradient(to_top_right,transparent_calc(50%-0.5px),var(--color-line)_50%,transparent_calc(50%+0.5px))] peer-disabled:text-ink-subtle">
                    {size.label}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      {selectedSize && !oneSize ? (
        <StockStatus
          stock={selectedSize.stock}
          prefix={`Size ${selectedSize.label}:`}
        />
      ) : (
        <StockStatus stock={totalStock} />
      )}

      <div>
        <button
          type="submit"
          className="btn btn-primary btn-lg btn-block"
          disabled={soldOut || pending}
        >
          {soldOut ? (
            "Out of stock"
          ) : pending ? (
            <>
              <SpinnerIcon width={16} height={16} />
              Adding…
            </>
          ) : (
            "Add to bag"
          )}
        </button>
        <p
          id={messageId}
          role="status"
          className={`mt-3 text-small empty:mt-0 ${sizeError || result?.status === "error" ? "text-danger" : "text-ink"}`}
        >
          {sizeError ? (
            "Select a size to add this to your bag."
          ) : result ? (
            <>
              {result.message}
              {result.status === "success" && (
                <>
                  {" "}
                  <Link href="/bag" className="link">
                    View bag
                  </Link>
                </>
              )}
            </>
          ) : null}
        </p>
      </div>
    </form>
  );
}
