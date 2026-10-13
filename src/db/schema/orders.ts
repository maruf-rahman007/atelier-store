import { relations, sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { products } from "./catalog";

export type ShippingAddress = {
  name: string | null;
  line1: string | null;
  line2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
};

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

/*
 * Order lifecycle. "pending" while a checkout session is open, "placed" once
 * paid, "expired" when abandoned or cancelled, "cancelled" when it never
 * reached payment (stock gone, Stripe error), "requires_review" when a payment
 * doesn't match the order.
 */
export const orderStatus = pgEnum("order_status", [
  "pending",
  "placed",
  "expired",
  "cancelled",
  "requires_review",
]);

/* Payment state, kept separate so nothing infers payment from order status.
 * Only ever set from a verified Stripe webhook or a server-side lookup. */
export const paymentStatus = pgEnum("payment_status", [
  "unpaid",
  "paid",
  "refunded",
]);

export const orders = pgTable(
  "orders",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    /* Random id for URLs and Stripe metadata; `id` stays internal. */
    publicId: text("public_id").notNull().unique(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    status: orderStatus("status").notNull().default("pending"),
    paymentStatus: paymentStatus("payment_status").notNull().default("unpaid"),
    /* Minor units (cents); currency is USD. Computed server-side from
     * order_items, never taken from the client. */
    subtotalCents: integer("subtotal_cents").notNull(),
    shippingCents: integer("shipping_cents").notNull().default(0),
    totalCents: integer("total_cents").notNull(),
    email: text("email").notNull(),
    shippingAddress: jsonb("shipping_address").$type<ShippingAddress>(),
    stripeCheckoutSessionId: text("stripe_checkout_session_id").unique(),
    stripePaymentIntentId: text("stripe_payment_intent_id").unique(),
    /* When the checkout session (and so the stock hold) ends. */
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    /* Set once each by reserve_order_stock() / release_order_stock(), so
     * stock is taken and given back at most once per order. */
    stockReservedAt: timestamp("stock_reserved_at", { withTimezone: true }),
    stockReleasedAt: timestamp("stock_released_at", { withTimezone: true }),
    reviewReason: text("review_reason"),
    ...timestamps,
  },
  (table) => [
    index("orders_user_id_created_at_idx").on(
      table.userId,
      table.createdAt.desc(),
    ),
    index("orders_pending_created_at_idx")
      .on(table.createdAt)
      .where(sql`${table.status} = 'pending'`),
    check(
      "orders_amounts_check",
      sql`${table.subtotalCents} >= 0 AND ${table.shippingCents} >= 0 AND ${table.totalCents} >= 0`,
    ),
    check(
      "orders_total_check",
      sql`${table.totalCents} = ${table.subtotalCents} + ${table.shippingCents}`,
    ),
    check(
      "orders_paid_check",
      sql`${table.paymentStatus} = 'unpaid' OR (${table.paidAt} IS NOT NULL AND ${table.stripeCheckoutSessionId} IS NOT NULL AND ${table.stripePaymentIntentId} IS NOT NULL)`,
    ),
    check(
      "orders_stock_release_check",
      sql`${table.stockReleasedAt} IS NULL OR ${table.stockReservedAt} IS NOT NULL`,
    ),
    check(
      "orders_placed_check",
      sql`${table.status} <> 'placed' OR ${table.paymentStatus} IN ('paid', 'refunded')`,
    ),
  ],
);

/* One row per product + size, with name and price snapshotted at checkout so
 * the order doesn't change when the catalogue does. */
export const orderItems = pgTable(
  "order_items",
  {
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: integer("product_id").references(() => products.id, {
      onDelete: "set null",
    }),
    productSlug: text("product_slug").notNull(),
    productName: text("product_name").notNull(),
    colour: text("colour").notNull(),
    size: text("size").notNull(),
    unitPriceCents: integer("unit_price_cents").notNull(),
    quantity: integer("quantity").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.orderId, table.productSlug, table.size] }),
    index("order_items_product_id_idx").on(table.productId),
    check("order_items_unit_price_cents_check", sql`${table.unitPriceCents} >= 0`),
    /* Matches MAX_LINE_QUANTITY in src/lib/bag.ts. */
    check(
      "order_items_quantity_check",
      sql`${table.quantity} BETWEEN 1 AND 10`,
    ),
  ],
);

/* Stripe webhook events already seen, for deduplication and audit. */
export const stripeEvents = pgTable("stripe_events", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  receivedAt: timestamp("received_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  processedAt: timestamp("processed_at", { withTimezone: true }),
});

/* user → orders lives here so the generated auth.ts is never hand-edited;
 * Drizzle merges relations declared for the same table. */
export const userOrdersRelations = relations(user, ({ many }) => ({
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(user, { fields: [orders.userId], references: [user.id] }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));
