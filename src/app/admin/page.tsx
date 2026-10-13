import Link from "next/link";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth/session";
import { refreshCatalogue } from "./actions";
import { AdminGate } from "./admin-gate";
import { AdminPageHeader, AdminPageSkeleton, AdminSection } from "./admin-ui";

const sections = [
  {
    href: "/admin/products",
    label: "Products",
    description: "Create products and edit their details and prices.",
  },
  {
    href: "/admin/stock",
    label: "Stock",
    description: "See what’s running low and update quantities.",
  },
  {
    href: "/admin/categories",
    label: "Categories",
    description: "Add, rename and order categories.",
  },
  {
    href: "/admin/orders",
    label: "Orders",
    description: "Look up customers’ orders and their payment state.",
  },
] as const;

export default function AdminPage() {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <AdminGate path="/admin">
        <AdminOverview />
      </AdminGate>
    </Suspense>
  );
}

async function AdminOverview() {
  const user = await requireAdmin("/admin");

  return (
    <>
      <AdminPageHeader
        title="Store admin"
        intro={`Signed in as ${user.email}.`}
      />

      <div className="mt-12 flex flex-col gap-12">
        <AdminSection title="Manage">
          <ul className="border-t">
            {sections.map((section) => (
              <li key={section.href} className="border-b">
                <Link href={section.href} className="group block py-5">
                  <span className="block font-medium group-hover:underline">
                    {section.label}
                  </span>
                  <span className="block text-small text-ink-muted">
                    {section.description}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </AdminSection>

        <AdminSection title="Catalogue cache">
          <p className="max-w-[60ch] text-body text-ink-muted">
            Product pages are cached. After re-seeding or editing products in
            the database, refresh the cache so the storefront shows the
            changes.
          </p>
          <form action={refreshCatalogue} className="mt-6">
            <button type="submit" className="btn btn-secondary">
              Refresh catalogue
            </button>
          </form>
        </AdminSection>
      </div>
    </>
  );
}
