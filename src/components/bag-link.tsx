import Link from "next/link";
import { BagIcon } from "@/components/icons";
import { bagCount, buildBagLines } from "@/lib/bag";
import { readBag } from "@/lib/bag-cookie";
import { getBagProducts } from "@/lib/queries/bag";

function BagLinkView({ count }: { count?: number }) {
  return (
    <Link
      href="/bag"
      className="btn btn-ghost btn-icon relative"
      aria-label={
        count === undefined
          ? "Shopping bag"
          : `Shopping bag, ${count} ${count === 1 ? "item" : "items"}`
      }
    >
      <BagIcon />
      {!!count && (
        <span
          aria-hidden="true"
          className="absolute right-1 top-1 flex min-w-4 items-center justify-center rounded-full bg-ink px-1 text-[0.625rem] leading-4 text-canvas tabular-nums"
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}

/* Counts what the bag page would charge for (live stock, vanished and sold
 * out lines excluded), so the two always agree. An empty bag skips the
 * database. Reads cookies, so it sits behind <Suspense> with BagLinkFallback. */
export async function BagLink() {
  const items = await readBag();
  if (items.length === 0) return <BagLinkView count={0} />;
  const lines = buildBagLines(
    items,
    await getBagProducts(items.map((item) => item.slug)),
  );
  return (
    <BagLinkView
      count={bagCount(lines.filter((line) => line.status !== "out-of-stock"))}
    />
  );
}

export function BagLinkFallback() {
  return <BagLinkView />;
}
