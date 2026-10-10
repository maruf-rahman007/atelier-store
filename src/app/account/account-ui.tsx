import type { ReactNode } from "react";

/* Shared building blocks for /account pages (server-rendered). */

export const formatMemberSince = (date: Date) =>
  new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(
    date,
  );

export function AccountSection({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="border-t pt-6">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-title">{title}</h2>
        {action}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

/* Label/value rows; two columns from sm. */
export function DetailList({
  items,
}: {
  items: { label: string; value: ReactNode }[];
}) {
  return (
    <dl className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className="min-w-0">
          <dt className="text-small text-ink-muted">{item.label}</dt>
          <dd className="mt-1 text-body-lg break-words">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/* Matches a heading + intro + section so streaming in doesn't shift layout. */
export function AccountPageSkeleton({ rows = 2 }: { rows?: number }) {
  return (
    <div aria-hidden className="motion-safe:animate-pulse">
      <div className="h-[2.75rem] w-2/3 max-w-sm bg-surface" />
      <div className="mt-3 h-6 w-3/4 max-w-md bg-surface" />
      <div className="mt-12 border-t pt-6">
        <div className="h-7 w-40 bg-surface" />
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {Array.from({ length: rows }, (_, i) => (
            <div key={i}>
              <div className="h-5 w-16 bg-surface" />
              <div className="mt-1 h-7 w-48 max-w-full bg-surface" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
