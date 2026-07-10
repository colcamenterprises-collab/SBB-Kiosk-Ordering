import { randomUUID } from "node:crypto";
import pg from "pg";
import type { Order, OrderStatus, OrderType } from "../src/types";

const { Pool } = pg;

export type OrderDataSource = "postgres" | "memory";

type CreateOrderInput = {
  orderType: OrderType;
  items: Order["items"];
  subtotalThb: number;
  totalThb: number;
};

type StoreState = {
  dataSource: OrderDataSource;
  startedAt: string;
  ticketSeed: number;
  orderCount: number;
  latestOrders: Array<{
    id: string;
    ticketNumber: number;
    status: OrderStatus;
    orderType: OrderType;
    itemCount: number;
    totalThb: number;
    createdAt: string;
    updatedAt: string;
  }>;
};

const memoryOrders: Order[] = [];
let memoryTicketSeed = 100;
const startedAt = new Date().toISOString();
const databaseUrl = process.env.DATABASE_URL;
const pool = databaseUrl ? new Pool({ connectionString: databaseUrl }) : null;
let databaseReady = false;
let databaseFailed = false;
let databaseFailureMessage = "";

export async function initializeOrderStore() {
  if (!pool || databaseFailed || databaseReady) return;

  try {
    await pool.query(`
      create table if not exists kiosk_orders (
        id text primary key,
        ticket_number integer not null,
        order_type text not null,
        status text not null default 'new',
        items_json jsonb not null default '[]'::jsonb,
        subtotal_thb integer not null default 0,
        total_thb integer not null default 0,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );
    `);

    await pool.query(`
      create table if not exists kiosk_state (
        key text primary key,
        value text not null,
        updated_at timestamptz not null default now()
      );
    `);

    await pool.query(`
      insert into kiosk_state (key, value)
      values ('ticket_seed', '100')
      on conflict (key) do nothing;
    `);

    databaseReady = true;
  } catch (error) {
    databaseFailed = true;
    databaseFailureMessage = error instanceof Error ? error.message : "Unknown database error";
    console.warn("SBB kiosk database unavailable, using memory store", databaseFailureMessage);
  }
}

export async function listOrders(): Promise<Order[]> {
  if (await canUseDatabase()) {
    const result = await pool!.query(`
      select id, ticket_number, order_type, status, items_json, subtotal_thb, total_thb, created_at, updated_at
      from kiosk_orders
      order by created_at desc
      limit 100;
    `);
    return result.rows.map(rowToOrder);
  }

  return memoryOrders;
}

export async function getOrder(id: string): Promise<Order | null> {
  if (await canUseDatabase()) {
    const result = await pool!.query(`
      select id, ticket_number, order_type, status, items_json, subtotal_thb, total_thb, created_at, updated_at
      from kiosk_orders
      where id = $1
      limit 1;
    `, [id]);
    return result.rows[0] ? rowToOrder(result.rows[0]) : null;
  }

  return memoryOrders.find((order) => order.id === id) ?? null;
}

export async function createStoredOrder(input: CreateOrderInput): Promise<Order> {
  const now = new Date().toISOString();
  const order: Order = {
    id: randomUUID(),
    ticketNumber: await nextTicketNumber(),
    orderType: input.orderType,
    status: "new",
    items: input.items,
    subtotalThb: input.subtotalThb,
    totalThb: input.totalThb,
    createdAt: now,
    updatedAt: now
  };

  if (await canUseDatabase()) {
    await pool!.query(`
      insert into kiosk_orders (id, ticket_number, order_type, status, items_json, subtotal_thb, total_thb, created_at, updated_at)
      values ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9);
    `, [
      order.id,
      order.ticketNumber,
      order.orderType,
      order.status,
      JSON.stringify(order.items),
      order.subtotalThb,
      order.totalThb,
      order.createdAt,
      order.updatedAt
    ]);
    return order;
  }

  memoryOrders.unshift(order);
  return order;
}

export async function updateStoredOrderStatus(id: string, status: OrderStatus): Promise<Order | null> {
  const now = new Date().toISOString();

  if (await canUseDatabase()) {
    const result = await pool!.query(`
      update kiosk_orders
      set status = $2, updated_at = $3
      where id = $1
      returning id, ticket_number, order_type, status, items_json, subtotal_thb, total_thb, created_at, updated_at;
    `, [id, status, now]);
    return result.rows[0] ? rowToOrder(result.rows[0]) : null;
  }

  const index = memoryOrders.findIndex((order) => order.id === id);
  if (index === -1) return null;
  memoryOrders[index] = { ...memoryOrders[index], status, updatedAt: now };
  return memoryOrders[index];
}

export async function getStoreState(): Promise<StoreState & { databaseFailureMessage?: string }> {
  const orders = await listOrders();
  return {
    dataSource: await canUseDatabase() ? "postgres" : "memory",
    startedAt,
    ticketSeed: await getTicketSeed(),
    orderCount: orders.length,
    latestOrders: orders.slice(0, 8).map((order) => ({
      id: order.id,
      ticketNumber: order.ticketNumber,
      status: order.status,
      orderType: order.orderType,
      itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
      totalThb: order.totalThb,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    })),
    databaseFailureMessage: databaseFailureMessage || undefined
  };
}

async function canUseDatabase() {
  await initializeOrderStore();
  return Boolean(pool && databaseReady && !databaseFailed);
}

async function nextTicketNumber() {
  if (await canUseDatabase()) {
    const result = await pool!.query(`
      update kiosk_state
      set value = (value::integer + 1)::text, updated_at = now()
      where key = 'ticket_seed'
      returning value;
    `);
    return Number(result.rows[0]?.value ?? 101);
  }

  memoryTicketSeed += 1;
  return memoryTicketSeed;
}

async function getTicketSeed() {
  if (await canUseDatabase()) {
    const result = await pool!.query("select value from kiosk_state where key = 'ticket_seed' limit 1;");
    return Number(result.rows[0]?.value ?? 100);
  }

  return memoryTicketSeed;
}

function rowToOrder(row: Record<string, unknown>): Order {
  return {
    id: String(row.id),
    ticketNumber: Number(row.ticket_number),
    orderType: row.order_type as OrderType,
    status: row.status as OrderStatus,
    items: Array.isArray(row.items_json) ? row.items_json as Order["items"] : [],
    subtotalThb: Number(row.subtotal_thb),
    totalThb: Number(row.total_thb),
    createdAt: new Date(row.created_at as string).toISOString(),
    updatedAt: new Date(row.updated_at as string).toISOString()
  };
}
