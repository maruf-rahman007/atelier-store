import Link from "next/link";
import { AccountIcon, BagIcon, SearchIcon } from "@/components/icons";
import { MobileMenu } from "@/components/mobile-menu";
import { Wordmark } from "@/components/wordmark";
import { primaryNav } from "@/lib/catalog";

export function SiteHeader() {
  return (
    <>
      <p className="flex h-9 items-center justify-center bg-ink px-gutter text-center text-caption text-canvas">
        Free delivery and returns on every order
      </p>

      <header className="header-bar">
        <div className="container-page grid h-full grid-cols-[1fr_auto_1fr] items-center gap-4">
          <div className="flex items-center gap-1 lg:gap-8">
            <MobileMenu items={primaryNav} />
            <nav aria-label="Primary" className="hidden lg:block">
              <ul className="flex gap-7">
                {primaryNav.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="link-nav">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <Link
              href="/search"
              className="btn btn-ghost btn-icon lg:hidden"
              aria-label="Search"
            >
              <SearchIcon />
            </Link>
          </div>

          <Wordmark className="text-[1.375rem] lg:text-[1.75rem]" />

          <div className="flex items-center justify-end gap-1">
            <Link
              href="/search"
              className="btn btn-ghost btn-icon hidden lg:inline-flex"
              aria-label="Search"
            >
              <SearchIcon />
            </Link>
            <Link
              href="/account"
              className="btn btn-ghost btn-icon"
              aria-label="Account"
            >
              <AccountIcon />
            </Link>
            <Link
              href="/bag"
              className="btn btn-ghost btn-icon"
              aria-label="Shopping bag, 0 items"
            >
              <BagIcon />
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}
