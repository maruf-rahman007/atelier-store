"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn, signUp, type AuthFormState } from "./actions";

type Mode = "sign-in" | "sign-up";

const copy = {
  "sign-in": {
    action: signIn,
    submit: "Sign in",
    pending: "Signing in…",
    switchPrompt: "New to Atelier?",
    switchLabel: "Create an account",
    switchHref: "/sign-up",
  },
  "sign-up": {
    action: signUp,
    submit: "Create account",
    pending: "Creating account…",
    switchPrompt: "Already have an account?",
    switchLabel: "Sign in",
    switchHref: "/sign-in",
  },
} as const;

const inputClass =
  "h-12 w-full border border-line-strong bg-canvas px-4 text-body-lg placeholder:text-ink-subtle transition-colors duration-150 hover:border-ink focus-visible:border-ink aria-invalid:border-danger";

export function AuthForm({ mode, next }: { mode: Mode; next?: string }) {
  const { action, submit, pending, switchPrompt, switchLabel, switchHref } =
    copy[mode];
  const [state, formAction, isPending] = useActionState<
    AuthFormState,
    FormData
  >(action, {});
  const invalid = state.error ? true : undefined;
  const switchQuery = next ? `?next=${encodeURIComponent(next)}` : "";

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      {next && <input type="hidden" name="next" value={next} />}

      {mode === "sign-up" && (
        <Field label="Name">
          <input
            name="name"
            type="text"
            required
            autoComplete="name"
            defaultValue={state.name}
            aria-invalid={invalid}
            aria-describedby={invalid && "auth-error"}
            className={inputClass}
          />
        </Field>
      )}

      <Field label="Email">
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          defaultValue={state.email}
          aria-invalid={invalid}
          aria-describedby={invalid && "auth-error"}
          className={inputClass}
        />
      </Field>

      <Field
        label="Password"
        hint={mode === "sign-up" ? "At least 8 characters." : undefined}
      >
        <input
          name="password"
          type="password"
          required
          minLength={mode === "sign-up" ? 8 : undefined}
          autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
          aria-invalid={invalid}
          aria-describedby={invalid && "auth-error"}
          className={inputClass}
        />
      </Field>

      <p
        id="auth-error"
        role="alert"
        className="min-h-[1lh] text-small text-danger empty:min-h-0"
      >
        {state.error}
      </p>

      <button
        type="submit"
        className="btn btn-primary btn-lg btn-block"
        disabled={isPending}
      >
        {isPending ? pending : submit}
      </button>

      <p className="text-small text-ink-muted">
        {switchPrompt}{" "}
        <Link href={`${switchHref}${switchQuery}`} className="link text-ink">
          {switchLabel}
        </Link>
      </p>
    </form>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-small font-medium">{label}</span>
      {children}
      {hint && <span className="text-caption text-ink-subtle">{hint}</span>}
    </label>
  );
}

/* Static stand-in while the session and URL are read. */
export function AuthFormSkeleton() {
  return (
    <div aria-hidden className="flex animate-pulse flex-col gap-5">
      <div className="h-[4.5rem] bg-surface" />
      <div className="h-[4.5rem] bg-surface" />
      <div className="h-14 bg-surface" />
    </div>
  );
}
