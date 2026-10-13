import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth/session";
import { formatPrice, ONE_SIZE } from "@/lib/products";
import { getOrderForUser, type OrderDetail } from "@/lib/queries/orders";
import { AccountPageSkeleton, AccountSection, DetailList } from "../../account-ui";
import { formatOrderDate, orderReference, orderStatusLabel } from "../order-ui";
import { OrderWatcher } from "./order-watcher";

export const metadata: Metadata = {
  title: "Order | Atelier Store",
  robots: { index: false },
};

export default function OrderPage({ params }: PageProps<"/account/orders/[id]">) {
  return (
    <Suspense fallback={<AccountPageSkeleton rows={4} />}>
      <Order params={params} />
    </Suspense>
  );
}

async function Order({ params }: Pick<PageProps<"/account/orders/[id]">, "params">) {
  const { id } = await params;
  const user = await requireUser(`/account/orders/${id}`);
  const order = await getOrderForUser(id, user.id);
  if (!order) notFound();

  return (
    <>
      <OrderWatcher
        publicId={order.publicId}
        awaitingPayment={order.status === "pending"}
        clearBag={order.paymentStatus === "paid" && !order.bagClearedAt}
      />
      <p className="text-small">
        <Link href="/account/orders" className="link-quiet text-ink-muted">
          ← All orders
        </Link>
      </p>
      <h1 className="mt-4 text-headline">
        Order {orderReference(order.publicId)}
      </h1>
      <p className="mt-3 text-body-lg text-ink-muted">
        <StatusMessage order={order} />
      </p>

      <div className="mt-12 flex flex-col gap-12">
        <AccountSection title="Items">
          <ul className="flex flex-col gap-4">
            {order.items.map((item) => (
              <li
                key={`${item.productSlug}/${item.size}`}
                className="flex items-start justify-between gap-4 text-small"
              >
                <div className="min-w-0">
                  <p className="font-medium">
                    <Link href={`/products/${item.productSlug}`} className="link-quiet">
                      {item.productName}
                    </Link>
                  </p>
                  <p className="text-ink-subtle">
                    {item.colour}
                    {item.size !== ONE_SIZE && ` · Size ${item.size}`} · Qty{" "}
                    {item.quantity}
                  </p>
                </div>
                <p className="shrink-0 tabular-nums">
                  {formatPrice(item.unitPriceCents * item.quantity)}
                </p>
              </li>
            ))}
          </ul>
          <dl className="mt-6 flex flex-col gap-3 border-t pt-6 text-small">
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">Subtotal</dt>
              <dd className="tabular-nums">{formatPrice(order.subtotalCents)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">Delivery</dt>
              <dd>{order.shippingCents === 0 ? "Free" : formatPrice(order.shippingCents)}</dd>
            </div>
            <div className="flex justify-between gap-4 font-medium">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatPrice(order.totalCents)}</dd>
            </div>
          </dl>
        </AccountSection>

        <AccountSection title="Details">
          <DetailList
            items={[
              { label: "Placed", value: formatOrderDate(order.createdAt) },
              { label: "Status", value: orderStatusLabel(order) },
              { label: "Confirmation email", value: order.email },
              {
                label: "Delivery address",
                value: order.shippingAddress ? (
                  <Address address={order.shippingAddress} />
                ) : (
                  "—"
                ),
              },
            ]}
          />
        </AccountSection>
      </div>
    </>
  );
}

function StatusMessage({ order }: { order: OrderDetail }) {
  if (order.paymentStatus === "refunded") return <>This order was refunded.</>;
  if (order.paymentStatus === "paid") {
    return order.status === "requires_review" ? (
      <>Your payment was received. We’re checking a detail and will be in touch.</>
    ) : (
      <>Thank you. Your payment was received and your order is confirmed.</>
    );
  }
  switch (order.status) {
    case "pending":
      return (
        <>
          We’re waiting for Stripe to confirm your payment. Card payments take
          a few seconds and this page updates by itself; bank payments can
          take a few days.
        </>
      );
    case "requires_review":
      return <>We’re reviewing this payment and will be in touch.</>;
    default:
      return (
        <>
          This checkout wasn’t completed and nothing was charged. Your pieces
          are back in stock;{" "}
          <Link href="/bag" className="link">
            return to your bag
          </Link>
          .
        </>
      );
  }
}

function Address({
  address,
}: {
  address: NonNullable<OrderDetail["shippingAddress"]>;
}) {
  const lines = [
    address.name,
    address.line1,
    address.line2,
    [address.city, address.state, address.postalCode].filter(Boolean).join(", "),
    address.country,
  ].filter(Boolean);
  return (
    <>
      {lines.map((line, index) => (
        <span key={index} className="block">
          {line}
        </span>
      ))}
    </>
  );
}
