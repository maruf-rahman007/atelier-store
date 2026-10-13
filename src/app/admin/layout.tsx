import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminOnly } from "./admin-gate";
import { AdminNav } from "./admin-nav";

export const metadata: Metadata = {
  title: "Admin | Atelier Store",
  robots: { index: false },
};

/*
 * Shell for every /admin page. It does no access control: layouts don't
 * re-render on navigation and don't guard Server Actions. Each page wraps its
 * content in <AdminGate> and each action calls requireAdmin(). The navigation
 * streams in only for admins so the area isn't advertised to anyone else.
 */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <main className="flex-1">
      <div className="container-page section-sm grid gap-8 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-16">
        <aside>
          <Suspense fallback={null}>
            <AdminOnly>
              <p className="eyebrow hidden text-ink-muted lg:mb-8 lg:block">
                Store admin
              </p>
              <AdminNav />
            </AdminOnly>
          </Suspense>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </main>
  );
}
