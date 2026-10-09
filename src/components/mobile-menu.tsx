"use client";

import Link from "next/link";
import { useRef } from "react";
import { CloseIcon, MenuIcon } from "@/components/icons";
import type { NavItem } from "@/lib/catalog";

/* Full-height drawer built on <dialog>, which supplies focus trapping,
 * Escape-to-close and the backdrop. */
export function MobileMenu({ items }: { items: NavItem[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const close = () => dialogRef.current?.close();

  return (
    <>
      <button
        type="button"
        className="btn btn-ghost btn-icon lg:hidden"
        aria-label="Open menu"
        aria-haspopup="dialog"
        onClick={() => dialogRef.current?.showModal()}
      >
        <MenuIcon />
      </button>

      <dialog
        ref={dialogRef}
        aria-label="Menu"
        className="fixed inset-y-0 left-0 m-0 h-dvh max-h-none w-full max-w-sm bg-canvas text-ink backdrop:bg-scrim"
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        <div className="flex h-header items-center border-b px-gutter">
          <button
            type="button"
            className="btn btn-ghost btn-icon -ml-3"
            aria-label="Close menu"
            onClick={close}
          >
            <CloseIcon />
          </button>
        </div>
        <nav aria-label="Primary" className="px-gutter py-6">
          <ul>
            {items.map((item) => (
              <li key={item.href} className="border-b">
                <Link
                  href={item.href}
                  onClick={close}
                  className="block py-4 text-title"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex flex-col gap-4 px-gutter py-6 text-small text-ink-muted">
          <Link href="/account" onClick={close} className="link-quiet">
            Sign in or create an account
          </Link>
          <Link href="/help/contact" onClick={close} className="link-quiet">
            Contact client services
          </Link>
        </div>
      </dialog>
    </>
  );
}
