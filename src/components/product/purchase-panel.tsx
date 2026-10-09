"use client";

import { useId, useState } from "react";
import {
  isOneSize,
  productStock,
  stockLabel,
  stockLevel,
  type Product,
  type StockLevel,
} from "@/lib/products";

const stockTone: Record<StockLevel, string> = {
  "in-stock": "bg-success",
  "low-stock": "bg-danger",
  "out-of-stock": "bg-line-strong",
};

function StockStatus({ stock, prefix }: { stock: number; prefix?: string }) {
  return (
    <p className="flex items-center gap-2 text-small">
      <span
        aria-hidden="true"
        className={`size-2 rounded-full ${stockTone[stockLevel(stock)]}`}
      />
      {prefix && <span className="text-ink-muted">{prefix}</span>}
      {stockLabel(stock)}
    </p>
  );
}

/* Size selection, stock state and the add-to-bag action. The bag itself is
 * not built yet, so adding only confirms the selection. */
export function PurchasePanel({ product }: { product: Product }) {
  const sizeLegendId = useId();
  const messageId = useId();
  const oneSize = isOneSize(product);
  const totalStock = productStock(product);
  const soldOut = totalStock === 0;

  const [selected, setSelected] = useState<string | null>(
    oneSize ? product.sizes[0].label : null,
  );
  const [message, setMessage] = useState<{
    tone: "error" | "success";
    text: string;
  } | null>(null);

  const selectedSize = product.sizes.find((size) => size.label === selected);

  const addToBag = () => {
    if (!selectedSize) {
      setMessage({
        tone: "error",
        text: "Select a size to add this to your bag.",
      });
      document
        .querySelector<HTMLInputElement>(
          `input[name="${sizeLegendId}"]:not(:disabled)`,
        )
        ?.focus();
      return;
    }
    setMessage({
      tone: "success",
      text: oneSize
        ? "Added to your bag."
        : `Size ${selectedSize.label} added to your bag.`,
    });
  };

  return (
    <div className="flex flex-col gap-6">
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
                    name={sizeLegendId}
                    value={size.label}
                    disabled={unavailable}
                    checked={selected === size.label}
                    onChange={() => {
                      setSelected(size.label);
                      setMessage(null);
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
          type="button"
          className="btn btn-primary btn-lg btn-block"
          onClick={addToBag}
          disabled={soldOut}
        >
          {soldOut ? "Out of stock" : "Add to bag"}
        </button>
        <p
          id={messageId}
          role="status"
          className={`mt-3 text-small empty:mt-0 ${message?.tone === "error" ? "text-danger" : "text-ink"}`}
        >
          {message?.text}
        </p>
      </div>
    </div>
  );
}
