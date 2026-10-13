# Atelier Store

Next.js (App Router) eCommerce foundation.

**Stack:** TypeScript · Tailwind CSS v4 · Better Auth · Drizzle ORM · Neon Postgres

## Getting started

```bash
cp .env.example .env.local   # fill in DATABASE_URL and BETTER_AUTH_SECRET
npm install
npm run dev
```

Generate a secret with `openssl rand -base64 32`.

### Stripe checkout

Checkout uses hosted Stripe Checkout. Add to `.env.local`:

- `STRIPE_SECRET_KEY`: preferably a restricted key (`rk_test_…`) with write access to Checkout Sessions, from a Stripe sandbox.
- `STRIPE_WEBHOOK_SECRET`: the `whsec_…` printed by the Stripe CLI (locally) or shown for the Dashboard webhook endpoint.

Locally, forward events with the [Stripe CLI](https://docs.stripe.com/stripe-cli):

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook \
  --events checkout.session.completed,checkout.session.async_payment_succeeded,checkout.session.async_payment_failed,checkout.session.expired
```

Pay with test card `4242 4242 4242 4242` (any future date and CVC); `4000 0000 0000 0002` is declined.

## Project structure

```
src/
  app/
    api/auth/[...all]/route.ts   Better Auth route handler
    layout.tsx, page.tsx
  db/
    index.ts                     Drizzle client (Neon HTTP driver)
    schema/index.ts              Schema barrel — export all tables from here
  lib/
    env.ts                       Required server env vars (fails fast)
    auth/server.ts               Better Auth instance (server only)
    auth/client.ts               Better Auth React client
drizzle/                         Generated SQL migrations
drizzle.config.ts                drizzle-kit config (reads .env.local)
```

## Scripts

| Script                  | Purpose                                                |
| ----------------------- | ------------------------------------------------------ |
| `npm run dev`           | Start the dev server                                   |
| `npm run build`         | Production build                                       |
| `npm run lint`          | ESLint                                                 |
| `npm run typecheck`     | TypeScript check                                       |
| `npm run auth:generate` | Generate Better Auth tables into `src/db/schema/auth.ts` |
| `npm run db:generate`   | Create SQL migrations from the schema                  |
| `npm run db:migrate`    | Apply migrations to the database                       |
| `npm run db:push`       | Push the schema directly (prototyping)                 |
| `npm run db:studio`     | Open Drizzle Studio                                    |

## Next steps

1. `npm run auth:generate`, then add `export * from "./auth";` to `src/db/schema/index.ts`.
2. `npm run db:generate && npm run db:migrate`.
3. Enable auth methods (e.g. `emailAndPassword`) in `src/lib/auth/server.ts`.
