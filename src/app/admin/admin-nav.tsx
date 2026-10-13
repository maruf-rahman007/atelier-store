"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

const items = [
  { label: "Overview", href: "/admin" },
  { label: "Products", href: "/admin/products" },
  { label: "Stock", href: "/admin/stock" },
  { label: "Categories", href: "/admin/categories" },
  { label: "Orders", href: "/admin/orders" },
] as const;

/* Overview matches only itself; other sections also own their sub-pages. */
const isCurrent = (pathname: string, href: string) =>
  pathname === href || (href !== "/admin" && pathname.startsWith(`${href}/`));

/*
 * Section navigation: a scrollable tab row on small screens, a sidebar from
 * lg. Same pattern as the account navigation.
 */
export function AdminNav() {
  return (
    <nav
      aria-label="Store admin"
      className="-mx-gutter border-b lg:mx-0 lg:border-b-0"
    >
      <ul className="flex gap-7 overflow-x-auto px-gutter [scrollbar-width:none] lg:flex-col lg:gap-5 lg:overflow-visible lg:px-0">
        <Suspense fallback={<NavItems pathname={null} />}>
          <CurrentNavItems />
        </Suspense>
        <li className="shrink-0 lg:mt-4 lg:border-t lg:pt-8">
          <Link
            href="/account"
            className="link-nav inline-block py-4 text-ink-muted hover:text-ink lg:py-0"
          >
            Your account
          </Link>
        </li>
        <li className="shrink-0">
          <Link
            href="/"
            className="link-nav inline-block py-4 text-ink-muted hover:text-ink lg:py-0"
          >
            Back to store
          </Link>
        </li>
      </ul>
    </nav>
  );
}

function CurrentNavItems() {
  return <NavItems pathname={usePathname()} />;
}

function NavItems({ pathname }: { pathname: string | null }) {
  return items.map((item) => (
    <li key={item.href} className="shrink-0">
      <Link
        href={item.href}
        aria-current={
          pathname && isCurrent(pathname, item.href) ? "page" : undefined
        }
        className="link-nav inline-block py-4 lg:py-0"
      >
        {item.label}
      </Link>
    </li>
  ));
}
