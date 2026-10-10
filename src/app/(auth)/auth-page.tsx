import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getCurrentUser, safeNext } from "@/lib/auth/session";
import type { AuthMode } from "@/lib/auth/validation";
import { AuthForm, AuthFormSkeleton } from "./auth-form";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/* Shared shell for /sign-in and /sign-up: static heading, then the form once
 * the session is known (signed-in visitors are sent on). */
export function AuthPage({
  mode,
  title,
  intro,
  searchParams,
}: {
  mode: AuthMode;
  title: string;
  intro: string;
  searchParams: SearchParams;
}) {
  return (
    <main className="flex-1">
      <div className="container-content section-sm flex flex-col">
        <div className="mx-auto w-full max-w-md">
          <h1 className="text-headline">{title}</h1>
          <p className="mt-3 text-body-lg text-ink-muted">{intro}</p>
          <div className="mt-10">
            <Suspense fallback={<AuthFormSkeleton mode={mode} />}>
              <AuthGate mode={mode} searchParams={searchParams} />
            </Suspense>
          </div>
        </div>
      </div>
    </main>
  );
}

async function AuthGate({
  mode,
  searchParams,
}: {
  mode: AuthMode;
  searchParams: SearchParams;
}) {
  const { next } = await searchParams;
  const returnTo = safeNext(next);
  if (await getCurrentUser()) redirect(returnTo);
  return (
    <AuthForm mode={mode} next={returnTo === "/account" ? undefined : returnTo} />
  );
}
