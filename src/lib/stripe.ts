import "server-only";
import Stripe from "stripe";
import { env } from "@/lib/env";

let client: Stripe | undefined;

/* Created on first use, so builds and the storefront work without the Stripe
 * keys set. The API version is pinned to the one this SDK was built for. */
export function getStripe() {
  client ??= new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-09-30.endive",
    maxNetworkRetries: 2,
  });
  return client;
}
