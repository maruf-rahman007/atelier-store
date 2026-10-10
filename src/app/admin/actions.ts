"use server";

import { updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";

/* Drops cached catalogue reads so a re-seed or DB edit shows straight away.
 * Every admin action checks the role itself; hiding the button isn't enough. */
export async function refreshCatalogue() {
  await requireAdmin();
  updateTag("products");
}
