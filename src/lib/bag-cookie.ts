import "server-only";
import { cookies } from "next/headers";
import { parseBag, serializeBag, type BagItem } from "@/lib/bag";

const BAG_COOKIE = "atelier_bag";
const BAG_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/* Reads request cookies, so callers sit behind <Suspense> and never inside
 * "use cache". */
export async function readBag(): Promise<BagItem[]> {
  return parseBag((await cookies()).get(BAG_COOKIE)?.value);
}

/* Server Actions only. Setting the cookie re-renders the current page, so the
 * header count and bag page update without a manual refresh. */
export async function writeBag(items: BagItem[]) {
  const cookieStore = await cookies();
  if (items.length === 0) {
    cookieStore.delete(BAG_COOKIE);
    return;
  }
  cookieStore.set(BAG_COOKIE, serializeBag(items), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: BAG_MAX_AGE,
  });
}
