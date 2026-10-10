import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { signOut } from "@/app/(auth)/actions";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Your account | Atelier Store",
  robots: { index: false },
};

export default function AccountPage() {
  return (
    <main className="flex-1">
      <div className="container-content section-sm">
        <p className="eyebrow text-ink-muted">Account</p>
        <Suspense fallback={<AccountSkeleton />}>
          <AccountDetails />
        </Suspense>
      </div>
    </main>
  );
}

const memberSince = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
});

async function AccountDetails() {
  const user = await requireUser("/account");

  return (
    <>
      <h1 className="mt-3 text-headline">Hello, {user.name}</h1>

      <dl className="mt-10 grid gap-6 border-t pt-8 sm:grid-cols-2">
        <div>
          <dt className="text-small text-ink-muted">Email</dt>
          <dd className="mt-1 text-body-lg break-all">{user.email}</dd>
        </div>
        <div>
          <dt className="text-small text-ink-muted">Member since</dt>
          <dd className="mt-1 text-body-lg">
            {memberSince.format(user.createdAt)}
          </dd>
        </div>
      </dl>

      <div className="mt-10 flex flex-wrap gap-3 border-t pt-8">
        {user.role === "admin" && (
          <Link href="/admin" className="btn btn-secondary">
            Admin
          </Link>
        )}
        <form action={signOut}>
          <button type="submit" className="btn btn-secondary">
            Sign out
          </button>
        </form>
      </div>
    </>
  );
}

function AccountSkeleton() {
  return (
    <div aria-hidden className="animate-pulse">
      <div className="mt-3 h-12 w-2/3 max-w-sm bg-surface" />
      <div className="mt-10 h-24 border-t pt-8" />
    </div>
  );
}
