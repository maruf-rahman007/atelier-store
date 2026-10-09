# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Atelier Store: an eCommerce foundation on Next.js 16.4 (App Router, Turbopack), React 19.3, TypeScript (strict), Tailwind CSS v4, Better Auth, Drizzle ORM and Neon Postgres. The storefront reads a product catalogue from Postgres; there are no carts, orders or checkout yet.

## Commands

```bash
npm run dev            # dev server (Turbopack)
npm run build          # production build
npm run lint           # ESLint (next core-web-vitals + typescript)
npm run typecheck      # tsc --noEmit
npm run auth:generate  # Better Auth CLI → writes src/db/schema/auth.ts
npm run db:generate    # SQL migrations from schema → drizzle/
npm run db:migrate     # apply migrations
npm run db:push        # push schema directly (prototyping only)
npm run db:seed        # upsert the sample catalogue (src/db/seed-data.ts); safe to re-run
npm run db:studio      # Drizzle Studio
```

There is no test runner configured.

Setup: `cp .env.example .env.local` and fill in `DATABASE_URL` (Neon pooled connection string) and `BETTER_AUTH_SECRET` (`openssl rand -base64 32`).

## Architecture

- **Single schema barrel.** `src/db/schema/index.ts` is the one place tables are exported from. The Drizzle client (`src/db/index.ts`), the Better Auth Drizzle adapter (`src/lib/auth/server.ts`) and drizzle-kit (`drizzle.config.ts`, which points at the `src/db/schema` folder) all consume it. New table files must be re-exported there (e.g. `export * from "./auth";` after running `auth:generate`).
- **Auth flow.** `src/lib/auth/client.ts` (React client, base URL from `NEXT_PUBLIC_APP_URL`) → `src/app/api/auth/[...all]/route.ts` (`toNextJsHandler(auth)`) → `auth` in `src/lib/auth/server.ts` → `db` → Neon. `nextCookies()` must remain the **last** plugin so Server Actions can set auth cookies. No auth methods (e.g. `emailAndPassword`) are enabled yet.
- **Env handling.** Server code reads config only via `env` from `src/lib/env.ts`, which throws at import time if `DATABASE_URL` is missing. The auth variables are getters checked on first read, so the storefront runs without auth configured; only `/api/auth` fails. `BETTER_AUTH_URL` (server) and `NEXT_PUBLIC_APP_URL` (client) must hold the same origin. `drizzle.config.ts` and `src/db/seed.ts` load `.env.local` then `.env` via `dotenv` because drizzle-kit runs outside Next.
- **DB driver.** Drizzle uses `drizzle-orm/neon-http` (stateless HTTP queries; no interactive transactions).
- **Next config.** `cacheComponents: true` and `partialPrefetching: true` are on, so the Cache Components caching model applies (not the older `fetch`/`revalidate` model). See `node_modules/next/dist/docs/01-app/01-getting-started/08-caching.md` and `.../02-guides/optimizing-prefetching.md`.
- **Styling.** Tailwind v4 is processed by the `@tailwindcss/turbopack` loader configured in `next.config.ts`; there is no PostCSS config. Theme tokens live in `src/app/globals.css` (`@theme inline`).
- **Path alias.** `@/*` → `src/*`.

## Database conventions

- **Scope.** The catalogue is only products, categories and per-size stock. Don't add carts, orders, payments, wishlists, reviews, warehouses or product variants until asked.
- **Money.** Store prices as integer minor units (`price_cents`). Currency is USD, fixed in code; there is no currency column.
- **Stock.** Store one `product_stock` row per product + size. One-size products have a single `"One size"` row. Sizes have no SKU, price or image of their own; they are not variants.
- **Schema changes.** Use `db:generate`, review the SQL, commit it, then run `db:migrate`. Don't use `db:push` on shared databases.
- **Seeding.** Keep `db:seed` idempotent: upsert by slug and replace stock rows.
- **Reads.** Only Server Components query the DB, through `server-only` functions marked `"use cache"`, with `cacheLife` and `cacheTag("products")`. Client Components import only types and pure helpers from `src/lib/products.ts`. Anything that must see live stock, such as a future checkout, reads it without the cache.
- **Build needs data.** With Cache Components, `generateStaticParams` must return at least one param, so `npm run build` needs a migrated, seeded database (an empty DB falls back to a placeholder slug).
- **Identifiers.** Integer identity ids are internal. URLs and editorial lists in `src/lib/catalog.ts` reference products by slug.
