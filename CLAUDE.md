# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Atelier Store: an eCommerce foundation on Next.js 16.4 (App Router, Turbopack), React 19.3, TypeScript (strict), Tailwind CSS v4, Better Auth, Drizzle ORM and Neon Postgres. The storefront reads a product catalogue from Postgres and has a cookie-based shopping bag and hosted Stripe Checkout for signed-in customers (no tax; free US delivery).

## Commands

```bash
npm run dev            # dev server (Turbopack)
npm run build          # production build
npm run lint           # ESLint (next core-web-vitals + typescript)
npm run typecheck      # tsc --noEmit
npm run auth:generate  # Better Auth CLI → writes src/db/schema/auth.ts (needs BETTER_AUTH_SECRET/URL set; any placeholder works)
npm run auth:make-admin -- <email>  # grant the admin role (--revoke to undo)
npm run db:generate    # SQL migrations from schema → drizzle/
npm run db:migrate     # apply migrations
npm run db:push        # push schema directly (prototyping only)
npm run db:seed        # upsert the sample catalogue (src/db/seed-data.ts); safe to re-run
npm run db:studio      # Drizzle Studio
```

There is no test runner configured.

Setup: `cp .env.example .env.local` and fill in `DATABASE_URL` (Neon pooled connection string) and `BETTER_AUTH_SECRET` (`openssl rand -base64 32`). Checkout also needs `STRIPE_SECRET_KEY` (prefer a restricted `rk_` key) and `STRIPE_WEBHOOK_SECRET`; see the README for the Stripe CLI command.

## Architecture

- **Single schema barrel.** `src/db/schema/index.ts` is the one place tables are exported from. The Drizzle client (`src/db/index.ts`), the Better Auth Drizzle adapter (`src/lib/auth/server.ts`) and drizzle-kit (`drizzle.config.ts`, which points at the `src/db/schema` folder) all consume it. New table files must be re-exported there (e.g. `export * from "./auth";` after running `auth:generate`).
- **Auth flow.** Email/password only (no social login, reset, verification or 2FA yet). Sign-up, sign-in and sign-out are Server Actions in `src/app/(auth)/actions.ts` calling `auth.api.*`; `nextCookies()` must remain the **last** plugin so they can set cookies. `/api/auth/[...all]` (`toNextJsHandler(auth)`) serves the HTTP API and `src/lib/auth/client.ts` is the React client. Sessions live in Postgres for 30 days, extended daily; there is no cookie cache, so sign-out and role changes apply immediately. Rate limits are stored in the `rate_limit` table.
- **Reading the session.** Only `src/lib/auth/session.ts` reads it: `getCurrentUser()`, `requireUser(returnTo)` (redirects to `/sign-in?next=`) and `requireAdmin()` (404 for non-admins). It calls `connection()` + `headers()`, so callers sit behind `<Suspense>` and never inside `"use cache"`. It imports `auth` lazily (`getAuth()`), so builds and the storefront work without the auth env vars. Pass redirect targets through `safeNext()`.
- **Route protection.** `src/proxy.ts` does an optimistic cookie-only redirect for `/account/*` and `/admin/*`; it is not a security boundary. Every protected page, Server Action and Route Handler calls `requireUser()` / `requireAdmin()` itself. `user.role` is `"customer"` (default, not settable at sign-up) or `"admin"`; grant it with `npm run auth:make-admin -- <email>` (`--revoke` to undo).
- **Env handling.** Server code reads config only via `env` from `src/lib/env.ts`, which throws at import time if `DATABASE_URL` is missing. The auth variables are getters checked on first read, so the storefront runs without auth configured; only `/api/auth` fails. `BETTER_AUTH_URL` (server) and `NEXT_PUBLIC_APP_URL` (client) must hold the same origin. `drizzle.config.ts` and `src/db/seed.ts` load `.env.local` then `.env` via `dotenv` because drizzle-kit runs outside Next.
- **DB driver.** Drizzle uses `drizzle-orm/neon-http` (stateless HTTP queries; no interactive transactions).
- **Next config.** `cacheComponents: true` and `partialPrefetching: true` are on, so the Cache Components caching model applies (not the older `fetch`/`revalidate` model). See `node_modules/next/dist/docs/01-app/01-getting-started/08-caching.md` and `.../02-guides/optimizing-prefetching.md`.
- **Styling.** Tailwind v4 is processed by the `@tailwindcss/turbopack` loader configured in `next.config.ts`; there is no PostCSS config. Theme tokens live in `src/app/globals.css` (`@theme inline`).
- **Shopping bag.** The bag is an httpOnly `atelier_bag` cookie holding only `[slug, size, quantity]` tuples (no table, works signed out). `src/lib/bag-cookie.ts` is the only code that reads/writes it; `src/lib/bag.ts` has the client-safe types and pure helpers (parse, reconcile, subtotal). Names, prices and stock always come from `getBagProducts()` in `src/lib/queries/bag.ts`, which is deliberately **not** cached. Server Actions in `src/app/bag/actions.ts` (`addToBag`, `updateBagLine`, `removeBagLine`) accept only slug/size/quantity, validate against live stock (max 10 per line) and write back a reconciled cookie; setting the cookie re-renders the page. Bags don't reserve stock.
- **Checkout.** `startCheckout` (`src/app/checkout/actions.ts`) requires a user, re-reads the bag with live prices and stock, refuses if anything changed (the form's `expectedSubtotalCents` is only compared, never charged), creates the order and holds stock (`createPendingOrder`), then redirects to a hosted Checkout Session built from the order rows (`startStripeCheckout`). All order logic is in `src/lib/orders.ts`; `src/lib/stripe.ts` creates the client lazily (`getStripe()`), pinned to the SDK's API version.
- **Payment confirmation.** An order becomes paid only in `syncCheckoutSession()`, called only by the signature-verified webhook (`src/app/api/stripe/webhook/route.ts`). `/checkout/return` just redirects to the order page, which polls while pending and, once paid, removes the pieces from the bag via `clearOrderedFromBag` (once, guarded by `bag_cleared_at`); browser redirects never change payment or order state. It checks `payment_status === "paid"`, currency and `amount_total` against the order (a mismatch sets `requires_review`). `/checkout/cancel` expires the session and releases stock only if Stripe confirms the expiry (if it refuses, the webhook settles the order); abandoned sessions release on `checkout.session.expired`; delayed payments keep stock held until `async_payment_succeeded`/`_failed`. Webhook events are recorded in `stripe_events`; every handler is idempotent.
- **Path alias.** `@/*` → `src/*`.

## Database conventions

- **Scope.** The catalogue is only products, categories and per-size stock; auth adds the Better Auth tables (`user` with `role`, `session`, `account`, `verification`, `rate_limit`). Checkout adds `orders` (owned by a `user`), `order_items` (name, slug, size and unit price snapshotted; `product_id` set null if the product is deleted) and `stripe_events` (webhook dedupe). The bag is a cookie, not a table. Don't add wishlists, reviews, warehouses or product variants until asked.
- **Orders.** `status` (`order_status`: pending, placed, expired, cancelled, requires_review) is the lifecycle and `payment_status` (`unpaid`, `paid`, `refunded`) is payment; never infer one from the other. Payment fields are set only from a verified Stripe webhook or a server-side Stripe lookup, never from the client. Check constraints enforce `total = subtotal + shipping`, that paid orders carry `paid_at` and both Stripe ids, and that `placed` orders are paid.
- **Money.** Store prices as integer minor units (`price_cents`). Currency is USD, fixed in code; there is no currency column.
- **Stock.** Store one `product_stock` row per product + size. One-size products have a single `"One size"` row. Sizes have no SKU, price or image of their own; they are not variants. Checkout holds stock only through the Postgres functions `reserve_order_stock(order_id)` (all or nothing; false if any line is short or the order isn't pending and unreserved) and `release_order_stock(order_id)` (gives stock back once; never for paid orders), defined in `drizzle/0003_order_stock_functions.sql`. neon-http has no interactive transactions, so don't reimplement these as multiple queries.
- **Schema changes.** Use `db:generate`, review the SQL, commit it, then run `db:migrate`. Don't use `db:push` on shared databases.
- **Seeding.** Keep `db:seed` idempotent: upsert by slug and replace stock rows.
- **Reads.** Only Server Components query the DB, through `server-only` functions marked `"use cache"`, with `cacheLife` and `cacheTag("products")`. Client Components import only types and pure helpers from `src/lib/products.ts`. Anything that must see live stock or current prices (the bag, checkout, orders) reads without the cache.
- **Build needs data.** With Cache Components, `generateStaticParams` must return at least one param, so `npm run build` needs a migrated, seeded database (an empty DB falls back to a placeholder slug).
- **Identifiers.** Integer identity ids are internal. URLs and editorial lists in `src/lib/catalog.ts` reference products by slug.
