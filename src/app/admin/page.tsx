import type { Metadata } from "next";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth/session";
import { refreshCatalogue } from "./actions";

export const metadata: Metadata = {
  title: "Admin | Atelier Store",
  robots: { index: false },
};

export default function AdminPage() {
  return (
    <main className="flex-1">
      <div className="container-content section-sm">
        <p className="eyebrow text-ink-muted">Admin</p>
        <Suspense
          fallback={<div aria-hidden className="mt-3 h-12 w-1/2 animate-pulse bg-surface" />}
        >
          <AdminDashboard />
        </Suspense>
      </div>
    </main>
  );
}

async function AdminDashboard() {
  const user = await requireAdmin();

  return (
    <>
      <h1 className="mt-3 text-headline">Store admin</h1>
      <p className="mt-3 text-body-lg text-ink-muted">
        Signed in as {user.email}.
      </p>

      <section className="mt-10 border-t pt-8">
        <h2 className="text-title">Catalogue cache</h2>
        <p className="mt-2 max-w-[60ch] text-body text-ink-muted">
          Product pages are cached. After re-seeding or editing products in the
          database, refresh the cache so the storefront shows the changes.
        </p>
        <form action={refreshCatalogue} className="mt-6">
          <button type="submit" className="btn btn-secondary">
            Refresh catalogue
          </button>
        </form>
      </section>
    </>
  );
}
