import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth/session";
import { AccountNav, AccountNavLink } from "./account-nav";

/*
 * Shell for every /account page. The navigation is static so it prerenders;
 * each page checks the session itself (requireUser) behind its own Suspense
 * boundary, so the layout never blocks on the request.
 */
export default function AccountLayout({ children }: LayoutProps<"/account">) {
  return (
    <main className="flex-1">
      <div className="container-page section-sm grid gap-8 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-16">
        <aside>
          <p className="eyebrow hidden text-ink-muted lg:mb-8 lg:block">
            Your account
          </p>
          <AccountNav
            extra={
              <Suspense fallback={null}>
                <AdminLink />
              </Suspense>
            }
          />
        </aside>
        <div className="min-w-0 max-w-3xl">{children}</div>
      </div>
    </main>
  );
}

async function AdminLink() {
  const user = await getCurrentUser();
  if (user?.role !== "admin") return null;
  return <AccountNavLink href="/admin">Store admin</AccountNavLink>;
}
