"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { requireUser } from "@/lib/auth/session";
import { removeOrderedFromBag } from "@/lib/bag";
import { readBag, writeBag } from "@/lib/bag-cookie";
import { claimBagClear } from "@/lib/orders";

/*
 * Takes a paid order's pieces out of the bag cookie, once. Called by the
 * order page after the webhook has recorded the payment. It only reads the
 * order's state; it never changes payment status.
 */
export async function clearOrderedFromBag(publicId: string) {
  const user = await requireUser(`/account/orders/${publicId}`);
  const order = await db.query.orders.findFirst({
    where: and(eq(orders.publicId, publicId), eq(orders.userId, user.id)),
    columns: { id: true, paymentStatus: true },
    with: { items: { columns: { productSlug: true, size: true, quantity: true } } },
  });
  if (order?.paymentStatus !== "paid" || !(await claimBagClear(order.id))) {
    return;
  }
  await writeBag(
    removeOrderedFromBag(
      await readBag(),
      order.items.map((item) => ({
        slug: item.productSlug,
        size: item.size,
        quantity: item.quantity,
      })),
    ),
  );
}
