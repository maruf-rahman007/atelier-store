import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth/session";
import { getOrdersForUser } from "@/lib/queries/orders";
import {
  AccountPageSkeleton,
  AccountSection,
  DetailList,
} from "./account-ui";
import { OrderList } from "./orders/order-list";

export const metadata: Metadata = {
  title: "Your account | Atelier Store",
  robots: { index: false },
};

export default function AccountOverviewPage() {
  return (
    <Suspense fallback={<AccountPageSkeleton />}>
      <Overview />
    </Suspense>
  );
}

async function Overview() {
  const user = await requireUser("/account");
  const firstName = user.name.split(/\s+/)[0] || user.name;
  const recentOrders = await getOrdersForUser(user.id, 3);

  return (
    <>
      <h1 className="text-headline">Hello, {firstName}</h1>
      <p className="mt-3 text-body-lg text-ink-muted">
        Track your orders and manage your details.
      </p>

      <div className="mt-12 flex flex-col gap-12">
        <AccountSection
          title="Recent orders"
          action={
            recentOrders.length > 0 && (
              <Link href="/account/orders" className="link-cta shrink-0">
                View all
              </Link>
            )
          }
        >
          {recentOrders.length > 0 ? (
            <OrderList orders={recentOrders} />
          ) : (
            <p className="text-body text-ink-muted">
              You haven’t placed an order yet.
            </p>
          )}
        </AccountSection>

        <AccountSection
          title="Account details"
          action={
            <Link href="/account/details" className="link-cta shrink-0">
              View all
            </Link>
          }
        >
          <DetailList
            items={[
              { label: "Name", value: user.name },
              { label: "Email", value: user.email },
            ]}
          />
        </AccountSection>

        <AccountSection title="Keep exploring">
          <p className="max-w-[48ch] text-body text-ink-muted">
            New pieces arrive in small runs each season.
          </p>
          <Link href="/collections/new" className="btn btn-secondary mt-6">
            Shop new arrivals
          </Link>
        </AccountSection>
      </div>
    </>
  );
}
