import express from "express";
import { categories, menuItems, modifierGroups } from "../src/data/menu";
import type { Order, OrderStatus } from "../src/types";

const app = express();
const port = Number(process.env.PORT ?? 4110);
const orders: Order[] = [];
const startedAt = new Date().toISOString();
let ticketSeed = 100;

app.use(express.json());

app.get("/api/healthz", (_req, res) => {
  res.json({ status: "ok", service: "sbb-kiosk-ordering" });
});

app.get("/api/debug/state", (_req, res) => {
  res.json({
    service: "sbb-kiosk-ordering",
    startedAt,
    port,
    ticketSeed,
    orderCount: orders.length,
    categoryCount: categories.length,
    itemCount: menuItems.length,
    latestOrders: orders.slice(0, 8).map((order) => ({
      id: order.id,
      ticketNumber: order.ticketNumber,
      status: order.status,
      orderType: order.orderType,
      itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
      totalThb: order.totalThb,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    }))
  });
});

app.get("/api/menu", (_req, res) => {
  res.json({ categories, items: menuItems, modifierGroups });
});

app.post("/api/orders", (req, res) => {
  const now = new Date().toISOString();
  const order: Order = {
    id: crypto.randomUUID(),
    ticketNumber: ++ticketSeed,
    orderType: req.body.orderType ?? "takeaway",
    status: "new",
    items: req.body.items ?? [],
    subtotalThb: Number(req.body.subtotalThb ?? 0),
    totalThb: Number(req.body.totalThb ?? req.body.subtotalThb ?? 0),
    createdAt: now,
    updatedAt: now
  };
  orders.unshift(order);
  res.status(201).json(order);
});

app.get("/api/orders", (_req, res) => {
  res.json(orders);
});

app.get("/api/orders/:id", (req, res) => {
  const order = orders.find((item) => item.id === req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found" });
  return res.json(order);
});

app.patch("/api/orders/:id/status", (req, res) => {
  const allowedStatuses: OrderStatus[] = ["new", "preparing", "ready", "collected", "cancelled"];
  if (!allowedStatuses.includes(req.body.status)) {
    return res.status(400).json({ error: "Invalid order status" });
  }

  const order = orders.find((item) => item.id === req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found" });
  order.status = req.body.status as OrderStatus;
  order.updatedAt = new Date().toISOString();
  return res.json(order);
});

app.get("/api/status-board", (_req, res) => {
  res.json({
    preparing: orders.filter((order) => order.status === "new" || order.status === "preparing"),
    ready: orders.filter((order) => order.status === "ready")
  });
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("SBB kiosk API error", error);
  res.status(500).json({ error: "Unexpected kiosk API error" });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`SBB Kiosk API listening on ${port}`);
});
