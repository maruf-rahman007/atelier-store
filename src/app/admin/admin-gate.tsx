import type { ReactNode } from "react";
import { getCurrentUser, requireAdmin } from "@/lib/auth/session";

/*
 * Wraps the content of every admin page, inside the page's own <Suspense>.
 * Nothing under it renders (or fetches) until the role check passes: signed-
 * out visitors are sent to sign in and back to `path`, everyone else who
 * isn't an admin gets a 404. Server Actions don't pass through pages, so each
 * one calls requireAdmin() itself as well.
 */
export async function AdminGate({
  path,
  children,
}: {
  path: string;
  children: ReactNode;
}) {
  await requireAdmin(path);
  return children;
}

/* For the layout's navigation: renders only for admins and never redirects,
 * so the page's own AdminGate decides where non-admins go. This only keeps
 * the admin area unadvertised; it isn't the access check. */
export async function AdminOnly({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  return user?.role === "admin" ? children : null;
}
