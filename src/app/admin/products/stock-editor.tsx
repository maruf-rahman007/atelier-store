"use client";

import { useActionState, useId } from "react";
import { SpinnerIcon } from "@/components/icons";
import {
  MAX_SIZES,
  MAX_STOCK_QUANTITY,
  SIZE_LABEL_MAX_LENGTH,
} from "@/lib/admin/product-validation";
import { ONE_SIZE, stockLabel, stockLevel } from "@/lib/products";
import { FormStatus, inputClass } from "../form-ui";
import {
  addSize,
  removeSize,
  setStockQuantity,
  type StockActionState,
} from "./actions";

type StockRow = { size: string; quantity: number };

const idle: StockActionState = { status: "idle" };
const levelClass = {
  "in-stock": "text-ink-muted",
  "low-stock": "text-accent",
  "out-of-stock": "text-danger",
} as const;

/*
 * Availability is stock per size: 0 means sold out in that size. Each row
 * saves on its own and sends the quantity it was showing, so a checkout or
 * another admin changing it in the meantime is caught, not overwritten.
 */
export function StockEditor({ slug, stock }: { slug: string; stock: StockRow[] }) {
  const oneSize = stock.length === 1 && stock[0].size === ONE_SIZE;
  return (
    <div className="flex flex-col gap-8">
      <ul className="border-t">
        {stock.map((row) => (
          <StockRowForm
            key={row.size}
            slug={slug}
            row={row}
            canRemove={stock.length > 1 && row.quantity === 0}
          />
        ))}
      </ul>
      {!oneSize && stock.length < MAX_SIZES && <AddSizeForm slug={slug} />}
    </div>
  );
}

function StockRowForm({
  slug,
  row,
  canRemove,
}: {
  slug: string;
  row: StockRow;
  canRemove: boolean;
}) {
  const [state, saveAction, isSaving] = useActionState(setStockQuantity, idle);
  const [removeState, removeAction, isRemoving] = useActionState(removeSize, idle);
  const inputId = useId();
  const level = stockLevel(row.quantity);

  return (
    <li className="border-b py-4">
      <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
        <form
          action={saveAction}
          aria-busy={isSaving}
          className="flex flex-wrap items-end gap-3"
        >
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="size" value={row.size} />
          <input type="hidden" name="expected" value={row.quantity} />
          <div className="flex w-28 flex-col gap-2">
            <label htmlFor={inputId} className="text-small font-medium">
              {row.size}
            </label>
            <input
              id={inputId}
              name="quantity"
              type="number"
              inputMode="numeric"
              min={0}
              max={MAX_STOCK_QUANTITY}
              step={1}
              required
              defaultValue={row.quantity}
              readOnly={isSaving}
              className={`${inputClass} tabular-nums`}
            />
          </div>
          <button type="submit" className="btn btn-secondary btn-sm mb-1">
            {isSaving && <SpinnerIcon width={14} height={14} />}
            Save
            <span className="sr-only"> stock for {row.size}</span>
          </button>
        </form>

        <p className={`mb-3 text-small ${levelClass[level]}`}>
          {stockLabel(row.quantity)}
        </p>

        {canRemove && (
          <form action={removeAction} className="mb-1 ml-auto">
            <input type="hidden" name="slug" value={slug} />
            <input type="hidden" name="size" value={row.size} />
            <button type="submit" className="btn btn-ghost btn-sm">
              {isRemoving && <SpinnerIcon width={14} height={14} />}
              Remove size
              <span className="sr-only"> {row.size}</span>
            </button>
          </form>
        )}
      </div>
      <FormStatus status={state.status} message={state.message} className="mt-2" />
      <FormStatus
        status={removeState.status}
        message={removeState.message}
        className="mt-2"
      />
    </li>
  );
}

function AddSizeForm({ slug }: { slug: string }) {
  const [state, action, isPending] = useActionState(addSize, idle);
  const sizeId = useId();
  const quantityId = useId();

  return (
    <form action={action} aria-busy={isPending} className="flex flex-col gap-3">
      <p className="text-small font-medium">Add a size</p>
      <input type="hidden" name="slug" value={slug} />
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex w-36 flex-col gap-2">
          <label htmlFor={sizeId} className="text-small text-ink-muted">
            Size
          </label>
          <input
            id={sizeId}
            name="size"
            type="text"
            required
            maxLength={SIZE_LABEL_MAX_LENGTH}
            readOnly={isPending}
            className={inputClass}
          />
        </div>
        <div className="flex w-28 flex-col gap-2">
          <label htmlFor={quantityId} className="text-small text-ink-muted">
            Stock
          </label>
          <input
            id={quantityId}
            name="quantity"
            type="number"
            inputMode="numeric"
            min={0}
            max={MAX_STOCK_QUANTITY}
            step={1}
            required
            defaultValue={0}
            readOnly={isPending}
            className={`${inputClass} tabular-nums`}
          />
        </div>
        <button type="submit" className="btn btn-secondary btn-sm mb-1">
          {isPending && <SpinnerIcon width={14} height={14} />}
          Add size
        </button>
      </div>
      <FormStatus status={state.status} message={state.message} />
    </form>
  );
}
