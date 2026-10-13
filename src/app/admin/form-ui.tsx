"use client";

import { useId, type ReactNode } from "react";

/* Form controls for admin pages, styled like the auth forms. */

export const inputClass =
  "h-12 w-full border border-line-strong bg-canvas px-4 text-body-lg placeholder:text-ink-subtle transition-colors duration-150 hover:border-ink focus-visible:border-ink read-only:bg-surface read-only:text-ink-muted aria-invalid:border-danger aria-invalid:hover:border-danger";

export const textareaClass = `${inputClass} h-auto min-h-32 py-3 leading-relaxed`;

export type FieldControlProps = {
  id: string;
  "aria-invalid"?: true;
  "aria-describedby"?: string;
};

/*
 * Label, control, hint and error with the ids wired up. `children` renders
 * the control from the props it should spread.
 */
export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: ReactNode;
  error?: string;
  children: (control: FieldControlProps) => ReactNode;
}) {
  const id = useId();
  const describedBy = [error && `${id}-error`, hint && `${id}-hint`]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-small font-medium">
        {label}
      </label>
      {children({
        id,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": describedBy || undefined,
      })}
      <FieldMessages id={id} hint={hint} error={error} />
    </div>
  );
}

/* For a group of controls (a fieldset with its own legend). */
export function FieldMessages({
  id,
  hint,
  error,
}: {
  id: string;
  hint?: ReactNode;
  error?: string;
}) {
  return (
    <>
      {error && (
        <p id={`${id}-error`} className="text-small text-danger">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-caption text-ink-subtle">
          {hint}
        </p>
      )}
    </>
  );
}

/* Result of the last submit: polite for success, an alert for errors. */
export function FormStatus({
  status,
  message,
  className = "",
}: {
  status: "idle" | "success" | "error";
  message?: string;
  className?: string;
}) {
  return (
    <p
      role={status === "error" ? "alert" : "status"}
      className={`text-small empty:hidden ${status === "error" ? "text-danger" : "text-success"} ${className}`}
    >
      {status !== "idle" ? message : null}
    </p>
  );
}
