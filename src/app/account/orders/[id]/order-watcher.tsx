"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { clearOrderedFromBag } from "../actions";

const POLL_MS = 3000;
const MAX_POLLS = 40; // about two minutes; delayed bank payments take days

/*
 * Keeps the order page current without trusting the browser: while payment is
 * unconfirmed it re-renders from the server until the webhook has recorded
 * it, and once paid it asks the server to take the pieces out of the bag.
 */
export function OrderWatcher({
  publicId,
  awaitingPayment,
  clearBag,
}: {
  publicId: string;
  awaitingPayment: boolean;
  clearBag: boolean;
}) {
  const router = useRouter();

  useEffect(() => {
    if (clearBag) void clearOrderedFromBag(publicId);
  }, [clearBag, publicId]);

  useEffect(() => {
    if (!awaitingPayment) return;
    let polls = 0;
    const timer = setInterval(() => {
      polls += 1;
      if (polls > MAX_POLLS) clearInterval(timer);
      else router.refresh();
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [awaitingPayment, router]);

  return null;
}
