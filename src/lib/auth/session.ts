import "server-only";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";

export type Role = "customer" | "admin";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: Date;
};

/* Auth loads on first use, like the /api/auth handler, so builds and the
 * storefront work without the auth env vars set. */
export const getAuth = () => import("./server").then((mod) => mod.auth);

/*
 * The only place server code reads the session. It reads request headers, so
 * callers must sit behind <Suspense> and never inside "use cache". React's
 * cache() dedupes the lookup within one request.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  /* Stop any prerender pass (build or runtime) before auth loads or the
   * session query starts; otherwise the in-flight query is aborted when the
   * pass ends and Better Auth logs it as a server error. */
  await connection();
  const requestHeaders = await headers();
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) return null;
  const { id, name, email, role, createdAt } = session.user;
  return {
    id,
    name,
    email,
    role: role === "admin" ? "admin" : "customer",
    createdAt,
  };
});

/* Signed-in user, or a redirect to sign in and back to `returnTo`. */
export async function requireUser(returnTo = "/account") {
  const user = await getCurrentUser();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(returnTo)}`);
  return user;
}

/* Admin user. Others get a 404 so the area isn't advertised. Call this at the
 * top of every admin page, Server Action and Route Handler. */
export async function requireAdmin(returnTo = "/admin") {
  const user = await requireUser(returnTo);
  if (user.role !== "admin") notFound();
  return user;
}

/* Same-origin path to return to after auth; anything else falls back. */
export function safeNext(value: unknown, fallback = "/account") {
  return typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.startsWith("/\\")
    ? value
    : fallback;
}
