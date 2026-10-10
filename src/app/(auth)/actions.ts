"use server";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth, safeNext } from "@/lib/auth/session";

export type AuthFormState = {
  error?: string;
  /* Echoed back so the form keeps what was typed (never the password). */
  name?: string;
  email?: string;
};

const field = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
};

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof APIError && error.body?.message) {
    return error.body.message;
  }
  console.error(error);
  return fallback;
}

export async function signUp(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const name = field(formData, "name");
  const email = field(formData, "email");
  const password = formData.get("password");

  if (!name || !email || typeof password !== "string" || !password) {
    return { error: "Enter your name, email and a password.", name, email };
  }

  try {
    /* nextCookies() sets the session cookie on this action's response. */
    await (await getAuth()).api.signUpEmail({
      body: { name, email, password },
      headers: await headers(),
    });
  } catch (error) {
    return {
      error: errorMessage(error, "We couldn’t create your account. Try again."),
      name,
      email,
    };
  }

  redirect(safeNext(formData.get("next")));
}

export async function signIn(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = field(formData, "email");
  const password = formData.get("password");

  if (!email || typeof password !== "string" || !password) {
    return { error: "Enter your email and password.", email };
  }

  try {
    await (await getAuth()).api.signInEmail({
      body: { email, password },
      headers: await headers(),
    });
  } catch (error) {
    return {
      error: errorMessage(error, "We couldn’t sign you in. Try again."),
      email,
    };
  }

  redirect(safeNext(formData.get("next")));
}

export async function signOut() {
  await (await getAuth()).api.signOut({ headers: await headers() });
  redirect("/");
}
