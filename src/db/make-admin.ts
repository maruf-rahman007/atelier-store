/*
 * Grants the admin role: `npm run auth:make-admin -- someone@example.com`.
 * Add `--revoke` to set the user back to customer. The user must have signed
 * up already. Runs outside Next, so it loads env files itself and uses
 * relative imports.
 */

import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { user } from "./schema/auth";

config({ path: [".env.local", ".env"], quiet: true });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const args = process.argv.slice(2);
const email = args.find((arg) => !arg.startsWith("--"))?.trim().toLowerCase();
const role = args.includes("--revoke") ? "customer" : "admin";

const db = drizzle({ client: neon(process.env.DATABASE_URL) });

async function main() {
  if (!email) {
    console.error("Usage: npm run auth:make-admin -- <email> [--revoke]");
    process.exit(1);
  }

  const [updated] = await db
    .update(user)
    .set({ role })
    .where(eq(user.email, email))
    .returning({ email: user.email, role: user.role });

  if (!updated) {
    console.error(`No user with email ${email}. Sign up first.`);
    process.exit(1);
  }

  console.log(`${updated.email} is now ${updated.role}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
