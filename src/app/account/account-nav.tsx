"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { signOut } from "@/app/(auth)/actions";

const items = [
  { label: "Overview", href: "/account" },
  { label: "Orders", href: "/account/orders" },
  { label: "Account details", href: "/account/details" },
] as const;

/* Overview matches only itself; other sections also own their sub-pages. */
const isCurrent = (pathname: string, href: string) =>
  pathname === href || (href !== "/account" && pathname.startsWith(`${href}/`));

/*
 * Section navigation: a scrollable tab row on small screens, a sidebar from
 * lg. `extra` holds role-dependent links streamed in by the layout.
 */
export function AccountNav({ extra }: { extra?: ReactNode }) {
  return (
    <nav
      aria-label="Account"
      className="-mx-gutter border-b lg:mx-0 lg:border-b-0"
    >
      <ul className="flex gap-7 overflow-x-auto px-gutter [scrollbar-width:none] lg:flex-col lg:gap-5 lg:overflow-visible lg:px-0">
        {/* On pages with an id in the URL (an order) the pathname isn't known
         * while the shell prerenders, so the links render first without a
         * current item. */}
        <Suspense fallback={<NavItems pathname={null} />}>
          <CurrentNavItems />
        </Suspense>
        {extra}
        <li className="shrink-0 lg:mt-4 lg:border-t lg:pt-8">
          <form action={signOut}>
            <button
              type="submit"
              className="link-nav py-4 text-ink-muted hover:text-ink lg:py-0"
            >
              Sign out
            </button>
          </form>
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

/* Same item styling, for links the server adds by role. */
export function AccountNavLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <li className="shrink-0">
      <Link href={href} className="link-nav inline-block py-4 lg:py-0">
        {children}
      </Link>
    </li>
  );
}
