import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { env } from "@/lib/env";

export const auth = betterAuth({
  appName: "Atelier Store",
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    autoSignIn: true,
  },
  user: {
    additionalFields: {
      /* "customer" | "admin". input: false keeps it out of sign-up; admins
       * are promoted with `npm run auth:make-admin`. */
      role: {
        type: "string",
        required: true,
        defaultValue: "customer",
        input: false,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // extend at most once a day
  },
  /* Memory storage isn't shared between serverless instances. */
  rateLimit: { enabled: true, storage: "database" },
  // nextCookies must stay last so Server Actions can set auth cookies.
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
