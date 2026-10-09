import Link from "next/link";
import { Wordmark } from "@/components/wordmark";
import { footerNav } from "@/lib/catalog";

export function SiteFooter() {
  return (
    <footer className="border-t bg-surface">
      <div className="container-page section-sm">
        <div className="grid gap-10 md:grid-cols-[2fr_repeat(3,1fr)]">
          <div className="max-w-narrow">
            <Wordmark className="text-title" />
            <p className="mt-3 text-small text-ink-muted">
              Clothing, leather goods and jewellery, made in small runs and
              built to last.
            </p>
          </div>

          {footerNav.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h2 className="text-small font-medium">{group.title}</h2>
              <ul className="mt-4 flex flex-col gap-2.5 text-small text-ink-muted">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="link-quiet">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t pt-6 text-caption text-ink-subtle sm:flex-row sm:justify-between">
          <p>© 2026 Atelier Store</p>
          <p>Shipping to the United States, prices in USD</p>
        </div>
      </div>
    </footer>
  );
}
