import type { Metadata } from "next";
import { AuthPage } from "../auth-page";

export const metadata: Metadata = {
  title: "Create an account | Atelier Store",
  robots: { index: false },
};

export default function SignUpPage({ searchParams }: PageProps<"/sign-up">) {
  return (
    <AuthPage
      mode="sign-up"
      title="Create an account"
      intro="One account for everything you buy at Atelier."
      searchParams={searchParams}
    />
  );
}
