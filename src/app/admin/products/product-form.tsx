"use client";

import {
  useActionState,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { SpinnerIcon } from "@/components/icons";
import {
  ALT_MAX_LENGTH,
  COLOUR_MAX_LENGTH,
  DESCRIPTION_MAX_LENGTH,
  MAX_IMAGES,
  MAX_SIZES,
  MAX_STOCK_QUANTITY,
  PRODUCT_NAME_MAX_LENGTH,
  PRODUCT_SLUG_MAX_LENGTH,
  productFieldOrder,
  readProductForm,
  SIZE_LABEL_MAX_LENGTH,
  slugify,
  validateProductForm,
  validateSizes,
  type ProductField,
  type ProductFieldErrors,
  type ProductFormValues,
} from "@/lib/admin/product-validation";
import { ONE_SIZE, type ProductCategory } from "@/lib/products";
import {
  Field,
  FieldMessages,
  FormStatus,
  inputClass,
  textareaClass,
} from "../form-ui";
import {
  createProduct,
  updateProduct,
  type ProductFormState,
} from "./actions";

type Props = {
  categories: ProductCategory[];
  initial: ProductFormValues;
} & ({ mode: "create" } | { mode: "edit"; version: string });

type Row<T> = T & { key: number };

let nextRowKey = 0;
const withKeys = <T,>(rows: T[]): Row<T>[] =>
  rows.map((row) => ({ ...row, key: nextRowKey++ }));

const emptyImage = { src: "", alt: "" };
const emptySize = { label: "", quantity: "0" };
const sizePresets = {
  "XS–XL": ["XS", "S", "M", "L", "XL"],
  "One size": [ONE_SIZE],
};

/*
 * Create and edit form for a product's details. The same rules run here on
 * submit (stopping the request and focusing the first problem) and again in
 * the Server Action, which is the real check. Sizes and their stock are set
 * here only when creating; afterwards they're managed on the product page.
 */
export function ProductForm(props: Props) {
  const { mode, categories, initial } = props;
  const [state, formAction, isPending] = useActionState<
    ProductFormState,
    FormData
  >(mode === "create" ? createProduct : updateProduct, { status: "idle" });

  const formRef = useRef<HTMLFormElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  /* Seeded from state: without JS the server's response is the first state. */
  const shown = state.values ?? initial;
  const [errors, setErrors] = useState<ProductFieldErrors>(
    state.fieldErrors ?? {},
  );
  const [formError, setFormError] = useState(state.formError);
  const [images, setImages] = useState(() =>
    withKeys(shown.images.length > 0 ? shown.images : [emptyImage]),
  );
  const [sizes, setSizes] = useState(() =>
    withKeys(shown.sizes.length > 0 ? shown.sizes : [emptySize]),
  );
  const [slug, setSlug] = useState(shown.slug);
  const [slugEdited, setSlugEdited] = useState(shown.slug !== "");

  /* Adopt each later server response: its errors, and on failure the rows
   * that were sent, since the form resets after every submit. */
  const [handledState, setHandledState] = useState(state);
  if (state !== handledState) {
    setHandledState(state);
    setErrors(state.fieldErrors ?? {});
    setFormError(state.formError);
    if (state.values) {
      setImages(withKeys(state.values.images.length > 0 ? state.values.images : [emptyImage]));
      setSizes(withKeys(state.values.sizes.length > 0 ? state.values.sizes : [emptySize]));
      setSlug(state.values.slug);
    } else if (state.status === "success") {
      /* The page re-rendered with what was saved; show that. */
      setImages(withKeys(initial.images.length > 0 ? initial.images : [emptyImage]));
    }
  }

  useEffect(() => {
    if (state.fieldErrors && Object.keys(state.fieldErrors).length > 0) {
      focusFirstInvalid(formRef.current, state.fieldErrors);
    } else if (state.formError) {
      alertRef.current?.focus();
    }
  }, [state]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (isPending) {
      event.preventDefault();
      return;
    }
    const values = readProductForm(new FormData(event.currentTarget));
    const found = validateProductForm(values, {
      withSlug: mode === "create",
    }).errors;
    if (mode === "create") {
      const sizesError = validateSizes(values.sizes).error;
      if (sizesError) found.sizes = sizesError;
    }
    setFormError(undefined);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      event.preventDefault();
      focusFirstInvalid(event.currentTarget, found);
    }
  }

  /* Editing a field clears its error; the next submit checks again. */
  function handleChange(event: FormEvent<HTMLFormElement>) {
    const field = (event.target as HTMLElement)
      .closest<HTMLElement>("[data-field]")
      ?.dataset.field as ProductField | undefined;
    if (field && errors[field]) {
      setErrors((current) => {
        const next = { ...current };
        delete next[field];
        return next;
      });
    }
    if (formError) setFormError(undefined);
  }

  const imagesId = useId();
  const sizesId = useId();

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={handleSubmit}
      onChange={handleChange}
      noValidate
      aria-busy={isPending}
      className="flex max-w-3xl flex-col gap-10"
    >
      {props.mode === "edit" && (
        <>
          <input type="hidden" name="slug" value={initial.slug} />
          <input type="hidden" name="version" value={props.version} />
        </>
      )}

      <div
        ref={alertRef}
        role="alert"
        tabIndex={-1}
        className="border border-danger px-4 py-3 text-small text-danger outline-none empty:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger"
      >
        {formError}
      </div>

      <fieldset className="flex flex-col gap-6">
        <legend className="mb-6 text-title">Details</legend>

        <div data-field="name">
          <Field label="Name" error={errors.name}>
            {(control) => (
              <input
                {...control}
                name="name"
                type="text"
                required
                maxLength={PRODUCT_NAME_MAX_LENGTH}
                defaultValue={shown.name}
                readOnly={isPending}
                onChange={(event) => {
                  if (mode === "create" && !slugEdited) {
                    setSlug(slugify(event.currentTarget.value));
                  }
                }}
                className={inputClass}
              />
            )}
          </Field>
        </div>

        {mode === "create" ? (
          <div data-field="slug">
            <Field
              label="URL slug"
              error={errors.slug}
              hint={`Used in the product’s address: /products/${slug || "…"}. It can’t be changed later.`}
            >
              {(control) => (
                <input
                  {...control}
                  name="slug"
                  type="text"
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  maxLength={PRODUCT_SLUG_MAX_LENGTH}
                  value={slug}
                  readOnly={isPending}
                  onChange={(event) => {
                    setSlug(event.currentTarget.value);
                    setSlugEdited(event.currentTarget.value !== "");
                  }}
                  className={inputClass}
                />
              )}
            </Field>
          </div>
        ) : (
          <div>
            <p className="text-small font-medium">URL slug</p>
            <p className="mt-2 text-body-lg break-all">{initial.slug}</p>
            <p className="mt-2 text-caption text-ink-subtle">
              Fixed once created: bags, orders and links refer to it.
            </p>
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-2">
          <div data-field="colour">
            <Field label="Colour" error={errors.colour}>
              {(control) => (
                <input
                  {...control}
                  name="colour"
                  type="text"
                  required
                  maxLength={COLOUR_MAX_LENGTH}
                  defaultValue={shown.colour}
                  readOnly={isPending}
                  className={inputClass}
                />
              )}
            </Field>
          </div>

          <div data-field="category">
            <Field label="Category" error={errors.category}>
              {(control) => (
                <select
                  {...control}
                  name="category"
                  required
                  defaultValue={shown.category}
                  disabled={isPending}
                  className={`${inputClass} appearance-auto`}
                >
                  <option value="" disabled>
                    Choose a category
                  </option>
                  {categories.map((category) => (
                    <option key={category.slug} value={category.slug}>
                      {category.name}
                    </option>
                  ))}
                </select>
              )}
            </Field>
          </div>

          <div data-field="price">
            <Field
              label="Price (USD)"
              error={errors.price}
              hint="Whole dollars or dollars and cents, like 120 or 89.50."
            >
              {(control) => (
                <input
                  {...control}
                  name="price"
                  type="text"
                  inputMode="decimal"
                  required
                  defaultValue={shown.price}
                  readOnly={isPending}
                  className={`${inputClass} tabular-nums`}
                />
              )}
            </Field>
          </div>

          <label className="flex items-center gap-3 self-center sm:mt-7">
            <input
              type="checkbox"
              name="isNew"
              defaultChecked={shown.isNew}
              disabled={isPending}
              className="size-5 accent-ink"
            />
            <span className="text-body">Show in New arrivals</span>
          </label>
        </div>

        <div data-field="description">
          <Field label="Description" error={errors.description}>
            {(control) => (
              <textarea
                {...control}
                name="description"
                required
                rows={4}
                maxLength={DESCRIPTION_MAX_LENGTH}
                defaultValue={shown.description}
                readOnly={isPending}
                className={textareaClass}
              />
            )}
          </Field>
        </div>

        <div data-field="details">
          <Field
            label="Details (optional)"
            error={errors.details}
            hint="One per line, like “100% merino wool” or “Dry clean only”."
          >
            {(control) => (
              <textarea
                {...control}
                name="details"
                rows={4}
                defaultValue={shown.details}
                readOnly={isPending}
                className={textareaClass}
              />
            )}
          </Field>
        </div>
      </fieldset>

      <fieldset
        data-field="images"
        aria-describedby={errors.images ? `${imagesId}-error` : `${imagesId}-hint`}
        className="flex flex-col gap-4"
      >
        <legend className="mb-2 text-title">Images</legend>
        <FieldMessages
          id={imagesId}
          error={errors.images}
          hint="Unsplash photo URLs (https://images.unsplash.com/photo-…). The first image is used on product cards."
        />
        <ol className="flex flex-col gap-4">
          {images.map((image, index) => (
            <li
              key={image.key}
              className="grid gap-3 border-t pt-4 sm:grid-cols-[minmax(0,3fr)_minmax(0,2fr)_auto] sm:items-end"
            >
              <label className="flex flex-col gap-2">
                <span className="text-small font-medium">
                  Image {index + 1} URL{index === 0 && " (card image)"}
                </span>
                <input
                  name="imageSrc"
                  type="url"
                  inputMode="url"
                  autoCapitalize="none"
                  spellCheck={false}
                  defaultValue={image.src}
                  readOnly={isPending}
                  aria-invalid={errors.images ? true : undefined}
                  className={inputClass}
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-small font-medium">Alt text</span>
                <input
                  name="imageAlt"
                  type="text"
                  maxLength={ALT_MAX_LENGTH}
                  defaultValue={image.alt}
                  readOnly={isPending}
                  aria-invalid={errors.images ? true : undefined}
                  className={inputClass}
                />
              </label>
              <button
                type="button"
                disabled={isPending || images.length === 1}
                onClick={() =>
                  setImages((rows) => rows.filter((row) => row.key !== image.key))
                }
                className="btn btn-ghost btn-sm justify-self-start disabled:opacity-40"
              >
                Remove
                <span className="sr-only"> image {index + 1}</span>
              </button>
            </li>
          ))}
        </ol>
        {images.length < MAX_IMAGES && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => setImages((rows) => [...rows, ...withKeys([emptyImage])])}
            className="btn btn-secondary btn-sm self-start"
          >
            Add image
          </button>
        )}
      </fieldset>

      {mode === "create" && (
        <fieldset
          data-field="sizes"
          aria-describedby={errors.sizes ? `${sizesId}-error` : `${sizesId}-hint`}
          className="flex flex-col gap-4"
        >
          <legend className="mb-2 text-title">Sizes and stock</legend>
          <FieldMessages
            id={sizesId}
            error={errors.sizes}
            hint={`Each size and how many are available. Use “${ONE_SIZE}” on its own for bags and jewellery.`}
          />
          <div className="flex flex-wrap gap-2">
            {Object.entries(sizePresets).map(([label, preset]) => (
              <button
                key={label}
                type="button"
                disabled={isPending}
                onClick={() =>
                  setSizes(withKeys(preset.map((size) => ({ label: size, quantity: "0" }))))
                }
                className="btn btn-ghost btn-sm border border-line"
              >
                Use {label}
              </button>
            ))}
          </div>
          <ol className="flex flex-col gap-3">
            {sizes.map((size, index) => (
              <li
                key={size.key}
                className="grid grid-cols-[minmax(0,1fr)_7rem_auto] items-end gap-3"
              >
                <label className="flex flex-col gap-2">
                  <span className="text-small font-medium">Size</span>
                  <input
                    name="sizeLabel"
                    type="text"
                    maxLength={SIZE_LABEL_MAX_LENGTH}
                    defaultValue={size.label}
                    readOnly={isPending}
                    aria-invalid={errors.sizes ? true : undefined}
                    className={inputClass}
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-small font-medium">Stock</span>
                  <input
                    name="sizeQuantity"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={MAX_STOCK_QUANTITY}
                    step={1}
                    defaultValue={size.quantity}
                    readOnly={isPending}
                    aria-invalid={errors.sizes ? true : undefined}
                    className={`${inputClass} tabular-nums`}
                  />
                </label>
                <button
                  type="button"
                  disabled={isPending || sizes.length === 1}
                  onClick={() =>
                    setSizes((rows) => rows.filter((row) => row.key !== size.key))
                  }
                  className="btn btn-ghost btn-sm disabled:opacity-40"
                >
                  Remove
                  <span className="sr-only"> size {index + 1}</span>
                </button>
              </li>
            ))}
          </ol>
          {sizes.length < MAX_SIZES && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => setSizes((rows) => [...rows, ...withKeys([emptySize])])}
              className="btn btn-secondary btn-sm self-start"
            >
              Add size
            </button>
          )}
        </fieldset>
      )}

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t pt-6">
        <button type="submit" className="btn btn-primary">
          {isPending && <SpinnerIcon width={16} height={16} />}
          {mode === "create"
            ? isPending
              ? "Creating…"
              : "Create product"
            : isPending
              ? "Saving…"
              : "Save changes"}
        </button>
        <FormStatus status={state.status === "success" ? "success" : "idle"} message={state.message} />
      </div>
    </form>
  );
}

function focusFirstInvalid(
  form: HTMLFormElement | null,
  errors: ProductFieldErrors,
) {
  const first = productFieldOrder.find((field) => errors[field]);
  if (!first || !form) return;
  form
    .querySelector<HTMLElement>(
      `[data-field="${first}"] :is(input, select, textarea):not([type="hidden"])`,
    )
    ?.focus();
}
