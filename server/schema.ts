import { boolean, integer, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const menuCategories = pgTable("menu_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});

export const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  description: text("description").default("").notNull(),
  priceThb: integer("price_thb").notNull(),
  imageUrl: text("image_url").default("").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  isAvailable: boolean("is_available").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});

export const modifierGroups = pgTable("modifier_groups", {
  id: serial("id").primaryKey(),
  menuItemId: integer("menu_item_id"),
  name: varchar("name", { length: 140 }).notNull(),
  required: boolean("required").default(false).notNull(),
  minSelect: integer("min_select").default(0).notNull(),
  maxSelect: integer("max_select").default(1).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});

export const modifiers = pgTable("modifiers", {
  id: serial("id").primaryKey(),
  modifierGroupId: integer("modifier_group_id").notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  priceDeltaThb: integer("price_delta_thb").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  ticketNumber: integer("ticket_number").notNull(),
  orderType: varchar("order_type", { length: 40 }).notNull(),
  status: varchar("status", { length: 40 }).default("new").notNull(),
  subtotalThb: integer("subtotal_thb").notNull(),
  totalThb: integer("total_thb").notNull(),
  customerNote: text("customer_note"),
  source: varchar("source", { length: 40 }).default("kiosk").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  menuItemId: integer("menu_item_id"),
  nameSnapshot: varchar("name_snapshot", { length: 160 }).notNull(),
  unitPriceThb: integer("unit_price_thb").notNull(),
  quantity: integer("quantity").notNull(),
  lineTotalThb: integer("line_total_thb").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const orderItemModifiers = pgTable("order_item_modifiers", {
  id: serial("id").primaryKey(),
  orderItemId: integer("order_item_id").notNull(),
  modifierId: integer("modifier_id"),
  nameSnapshot: varchar("name_snapshot", { length: 120 }).notNull(),
  priceDeltaThb: integer("price_delta_thb").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const orderStatusEvents = pgTable("order_status_events", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  fromStatus: varchar("from_status", { length: 40 }),
  toStatus: varchar("to_status", { length: 40 }).notNull(),
  actor: varchar("actor", { length: 120 }).default("system").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const kioskDevices = pgTable("kiosk_devices", {
  id: serial("id").primaryKey(),
  deviceName: varchar("device_name", { length: 120 }).notNull(),
  deviceType: varchar("device_type", { length: 60 }).notNull(),
  location: varchar("location", { length: 120 }),
  isActive: boolean("is_active").default(true).notNull(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});
