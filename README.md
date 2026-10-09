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
