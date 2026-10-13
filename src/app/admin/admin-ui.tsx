import type { ReactNode } from "react";

/* Shared building blocks for /admin pages (server-rendered). */

export function AdminPageHeader({
  title,
  intro,
  action,
}: {
  title: string;
  intro?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
      <div className="min-w-0 max-w-3xl">
        <h1 className="text-headline">{title}</h1>
        {intro && <p className="mt-3 text-body-lg text-ink-muted">{intro}</p>}
      </div>
      {action}
    </header>
  );
}

export function AdminSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t pt-6">
      <h2 className="text-title">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function AdminEmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="mt-12 border-t pt-6">
      <p className="max-w-[60ch] text-body-lg text-ink-muted">{children}</p>
    </div>
  );
}

/* Matches a header + one section so streaming in doesn't shift layout. */
export function AdminPageSkeleton() {
  return (
    <div aria-hidden className="motion-safe:animate-pulse">
      <div className="h-[2.75rem] w-2/3 max-w-sm bg-surface" />
      <div className="mt-3 h-6 w-3/4 max-w-md bg-surface" />
      <div className="mt-12 border-t pt-6">
        <div className="h-7 w-40 bg-surface" />
        <div className="mt-4 h-6 w-full max-w-lg bg-surface" />
      </div>
    </div>
  );
}
