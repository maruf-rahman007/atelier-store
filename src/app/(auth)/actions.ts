"use server";

import { parseSetCookieHeader, toCookieOptions } from "better-auth/cookies";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth, safeNext } from "@/lib/auth/session";
import {
  validateAuthForm,
  type AuthField,
  type AuthMode,
  type FieldErrors,
} from "@/lib/auth/validation";

export type AuthFormState = {
  /* Problem with the submission as a whole (wrong credentials, rate limit). */
  formError?: string;
  fieldErrors?: FieldErrors;
  /* Echoed back so the form keeps what was typed (never the password). */
  values?: { name?: string; email?: string };
};

type AuthResult =
  | { ok: true }
  | { ok: false; status: number; code?: string; retryAfter?: number };

/*
 * Sign-in and sign-up go through Better Auth's HTTP router rather than
 * auth.api so they get its rate limiting (3 attempts / 10s per IP) and origin
 * check; direct auth.api calls skip both. The browser's headers (Origin,
 * X-Forwarded-For, cookies) are passed on, and the Set-Cookie headers in the
 * response are copied onto this action's response.
 */
async function callAuth(
  path: "/sign-in/email" | "/sign-up/email",
  body: Record<string, string>,
): Promise<AuthResult> {
  const auth = await getAuth();
  const requestHeaders = new Headers(await headers());
  requestHeaders.set("content-type", "application/json");
  requestHeaders.delete("content-length");

  const response = await auth.handler(
    new Request(new URL(`/api/auth${path}`, auth.options.baseURL), {
      method: "POST",
      headers: requestHeaders,
      body: JSON.stringify(body),
    }),
  );

  const setCookie = response.headers.get("set-cookie");
  if (setCookie) {
    const cookieStore = await cookies();
    parseSetCookieHeader(setCookie).forEach((attributes, name) => {
      if (name) cookieStore.set(name, attributes.value, toCookieOptions(attributes));
    });
  }

  if (response.ok) return { ok: true };
  const data = (await response.json().catch(() => null)) as {
    code?: string;
  } | null;
  const retryAfter = Number(response.headers.get("x-retry-after"));
  return {
    ok: false,
    status: response.status,
    code: data?.code,
    retryAfter: Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : undefined,
  };
}

/* Better Auth error → message on the field it concerns, or the whole form. */
function describeFailure(
  mode: AuthMode,
  result: Extract<AuthResult, { ok: false }>,
): Pick<AuthFormState, "formError" | "fieldErrors"> {
  if (result.status === 429) {
    const wait = result.retryAfter
      ? `${result.retryAfter} ${result.retryAfter === 1 ? "second" : "seconds"}`
      : "a moment";
    return { formError: `Too many attempts. Wait ${wait} and try again.` };
  }

  switch (result.code) {
    case "INVALID_EMAIL_OR_PASSWORD":
      return {
        formError:
          "That email and password don’t match an account. Check them and try again.",
      };
    case "USER_ALREADY_EXISTS":
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return {
        fieldErrors: {
          email: "An account with this email already exists. Sign in instead.",
        },
      };
    case "INVALID_EMAIL":
      return {
        fieldErrors: { email: "Enter an email address like name@example.com." },
      };
    case "PASSWORD_TOO_SHORT":
    case "PASSWORD_TOO_LONG":
      return {
        fieldErrors: {
          password: "Choose a password between 8 and 128 characters.",
        },
      };
    case "INVALID_ORIGIN":
      return { formError: "This form expired. Reload the page and try again." };
  }

  console.error(`[auth] ${mode} failed`, result);
  return {
    formError:
      mode === "sign-up"
        ? "We couldn’t create your account just now. Please try again."
        : "We couldn’t sign you in just now. Please try again.",
  };
}

const read = (formData: FormData, field: AuthField) => {
  const value = formData.get(field);
  return typeof value === "string" ? value : "";
};

async function submit(mode: AuthMode, formData: FormData): Promise<AuthFormState> {
  const name = read(formData, "name").trim();
  const email = read(formData, "email").trim().toLowerCase();
  const password = read(formData, "password");
  const values = mode === "sign-up" ? { name, email } : { email };

  const fieldErrors = validateAuthForm(mode, { name, email, password });
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors, values };

  const result =
    mode === "sign-up"
      ? await callAuth("/sign-up/email", { name, email, password })
      : await callAuth("/sign-in/email", { email, password });

  if (!result.ok) return { ...describeFailure(mode, result), values };

  redirect(safeNext(formData.get("next")));
}

export async function signUp(_prev: AuthFormState, formData: FormData) {
  return submit("sign-up", formData);
}

export async function signIn(_prev: AuthFormState, formData: FormData) {
  return submit("sign-in", formData);
}

export async function signOut() {
  /* No rate limit needed here; auth.api sets cookies via nextCookies(). */
  await (await getAuth()).api.signOut({ headers: await headers() });
  redirect("/");
}
