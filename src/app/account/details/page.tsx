import type { Metadata } from "next";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth/session";
import {
  AccountPageSkeleton,
  AccountSection,
  DetailList,
  formatMemberSince,
} from "../account-ui";

export const metadata: Metadata = {
  title: "Account details | Atelier Store",
  robots: { index: false },
};

export default function AccountDetailsPage() {
  return (
    <Suspense fallback={<AccountPageSkeleton />}>
      <Details />
    </Suspense>
  );
}

async function Details() {
  const user = await requireUser("/account/details");

  return (
    <>
      <h1 className="text-headline">Account details</h1>
      <p className="mt-3 text-body-lg text-ink-muted">
        The information we hold for your account.
      </p>

      <div className="mt-12 flex flex-col gap-12">
        <AccountSection title="Personal information">
          <DetailList
            items={[
              { label: "Name", value: user.name },
              { label: "Member since", value: formatMemberSince(user.createdAt) },
            ]}
          />
        </AccountSection>

        <AccountSection title="Sign-in and security">
          <DetailList
            items={[
              { label: "Email", value: user.email },
              { label: "Sign-in method", value: "Email and password" },
            ]}
          />
        </AccountSection>
      </div>
    </>
  );
}
