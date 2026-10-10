"use client";

import Link from "next/link";
import {
  useActionState,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentProps,
  type FormEvent,
  type ReactNode,
} from "react";
import { EyeIcon, EyeOffIcon, SpinnerIcon } from "@/components/icons";
import {
  fieldsFor,
  NAME_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  validateAuthForm,
  validateField,
  type AuthField,
  type AuthMode,
  type FieldErrors,
} from "@/lib/auth/validation";
import { signIn, signUp, type AuthFormState } from "./actions";

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

/*
 * Validation runs in three places: on blur (once a field has been left), as
 * you type while a field shows an error (so it clears as soon as it's fixed),
 * and on submit, which stops the request and focuses the first problem. The
 * Server Action re-validates with the same rules and adds what only it knows
 * (wrong password, email taken, rate limit).
 */
export function AuthForm({ mode, next }: { mode: AuthMode; next?: string }) {
  const { action, submit, pending, switchPrompt, switchLabel, switchHref } =
    copy[mode];
  const [state, formAction, isPending] = useActionState<
    AuthFormState,
    FormData
  >(action, {});

  const formRef = useRef<HTMLFormElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  /* Seeded from state: without JS the server's response is the first state. */
  const [errors, setErrors] = useState<FieldErrors>(state.fieldErrors ?? {});
  const [formError, setFormError] = useState(state.formError);

  /* Adopt each later server response as the visible errors. */
  const [handledState, setHandledState] = useState(state);
  if (state !== handledState) {
    setHandledState(state);
    setErrors(state.fieldErrors ?? {});
    setFormError(state.formError);
  }

  /* After a failed submit, move focus to the first problem so keyboard and
   * screen reader users land on it. */
  useEffect(() => {
    if (state.fieldErrors) {
      focusFirstInvalid(formRef.current, mode, state.fieldErrors);
    } else if (state.formError) {
      alertRef.current?.focus();
    }
  }, [state, mode]);

  const check = (field: AuthField, value: string) =>
    setErrors((current) => {
      const error = validateField(mode, field, value);
      if (current[field] === error) return current;
      return { ...current, [field]: error };
    });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (isPending) {
      event.preventDefault();
      return;
    }
    const data = new FormData(event.currentTarget);
    const found = validateAuthForm(mode, {
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      password: String(data.get("password") ?? ""),
    });
    setFormError(undefined);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      event.preventDefault();
      focusFirstInvalid(event.currentTarget, mode, found);
    }
  }

  const fieldProps = (field: AuthField) => ({
    name: field,
    error: errors[field],
    readOnly: isPending,
    onBlur: (event: { currentTarget: HTMLInputElement }) => {
      /* Don't flag an empty field the user just tabbed through. */
      if (event.currentTarget.value || errors[field]) {
        check(field, event.currentTarget.value);
      }
    },
    onChange: (event: { currentTarget: HTMLInputElement }) => {
      if (errors[field]) check(field, event.currentTarget.value);
      if (formError) setFormError(undefined);
    },
  });

  const switchQuery = next ? `?next=${encodeURIComponent(next)}` : "";

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={handleSubmit}
      noValidate
      aria-busy={isPending}
      className="flex flex-col gap-6"
    >
      {next && <input type="hidden" name="next" value={next} />}

      <div
        ref={alertRef}
        role="alert"
        tabIndex={-1}
        className="border border-danger px-4 py-3 text-small text-danger outline-none empty:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger"
      >
        {formError}
      </div>

      {mode === "sign-up" && (
        <TextField
          label="Name"
          type="text"
          autoComplete="name"
          maxLength={NAME_MAX_LENGTH}
          defaultValue={state.values?.name}
          {...fieldProps("name")}
        />
      )}

      <TextField
        label="Email"
        type="email"
        inputMode="email"
        autoComplete={mode === "sign-up" ? "email" : "username"}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        defaultValue={state.values?.email}
        {...fieldProps("email")}
      />

      <PasswordField
        label="Password"
        autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
        maxLength={PASSWORD_MAX_LENGTH}
        hint={
          mode === "sign-up"
            ? `At least ${PASSWORD_MIN_LENGTH} characters.`
            : undefined
        }
        {...fieldProps("password")}
      />

      <button
        type="submit"
        className="btn btn-primary btn-lg btn-block mt-2"
      >
        {isPending && <SpinnerIcon width={16} height={16} />}
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

function focusFirstInvalid(
  form: HTMLFormElement | null,
  mode: AuthMode,
  errors: FieldErrors,
) {
  const first = fieldsFor(mode).find((field) => errors[field]);
  if (!first) return;
  const input = form?.elements.namedItem(first);
  if (input instanceof HTMLInputElement) input.focus();
}

const inputClass =
  "h-12 w-full border border-line-strong bg-canvas px-4 text-body-lg placeholder:text-ink-subtle transition-colors duration-150 hover:border-ink focus-visible:border-ink read-only:bg-surface read-only:text-ink-muted aria-invalid:border-danger aria-invalid:hover:border-danger";

type TextFieldProps = Omit<ComponentProps<"input">, "className"> & {
  label: string;
  hint?: string;
  error?: string;
  /* Rendered inside the field box, after the input (e.g. a toggle). */
  trailing?: ReactNode;
};

function TextField({ label, hint, error, trailing, ...input }: TextFieldProps) {
  const id = useId();
  const describedBy = [error && `${id}-error`, hint && `${id}-hint`]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-small font-medium">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          required
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          className={`${inputClass} ${trailing ? "pr-14" : ""}`}
          {...input}
        />
        {trailing}
      </div>
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
    </div>
  );
}

function PasswordField(props: Omit<TextFieldProps, "type" | "trailing">) {
  const [visible, setVisible] = useState(false);
  return (
    <TextField
      {...props}
      type={visible ? "text" : "password"}
      autoCapitalize="none"
      autoCorrect="off"
      spellCheck={false}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="btn btn-ghost btn-icon absolute inset-y-0 right-0.5 my-auto"
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      }
    />
  );
}

/* Static stand-in while the session and URL are read. Matches the form's
 * height so the page doesn't jump when it streams in. */
export function AuthFormSkeleton({ mode }: { mode: AuthMode }) {
  return (
    <div
      aria-hidden
      className="flex motion-safe:animate-pulse flex-col gap-6"
    >
      {fieldsFor(mode).map((field) => (
        <div key={field} className="flex flex-col gap-2">
          <div className="h-5 w-20 bg-surface" />
          <div className="h-12 bg-surface" />
        </div>
      ))}
      <div className="mt-2 h-14 bg-surface" />
    </div>
  );
}
