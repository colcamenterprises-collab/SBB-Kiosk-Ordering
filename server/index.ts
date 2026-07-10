import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { categories, menuItems, modifierGroups } from "../src/data/menu";
import type { OrderStatus, OrderType } from "../src/types";
import {
  createStoredOrder,
  getOrder,
  getStoreState,
  initializeOrderStore,
  listOrders,
  updateStoredOrderStatus
} from "./order-store";

const app = express();
const port = Number(process.env.PORT ?? 4110);
const allowedStatuses: OrderStatus[] = ["new", "preparing", "ready", "collected", "cancelled"];
const allowedOrderTypes: OrderType[] = ["dine_in", "takeaway", "pickup"];
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, "../dist");
const indexPath = path.join(distPath, "index.html");

app.use(express.json({ limit: "1mb" }));

app.get("/api/healthz", async (_req, res) => {
  const state = await getStoreState();
  res.json({ status: "ok", service: "sbb-kiosk-ordering", dataSource: state.dataSource });
});

app.get("/api/debug/state", async (_req, res) => {
  const state = await getStoreState();
  res.json({
    service: "sbb-kiosk-ordering",
    port,
    staticDist: distPath,
    ...state,
    categoryCount: categories.length,
    itemCount: menuItems.length
  });
});

app.get("/api/menu", (_req, res) => {
  res.json({ categories, items: menuItems, modifierGroups });
});

app.post("/api/orders", async (req, res) => {
  const orderType = allowedOrderTypes.includes(req.body.orderType) ? req.body.orderType as OrderType : "takeaway";
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  const subtotalThb = Number(req.body.subtotalThb ?? 0);
  const totalThb = Number(req.body.totalThb ?? subtotalThb);

  const order = await createStoredOrder({
    orderType,
    items,
    subtotalThb,
    totalThb
  });

  res.status(201).json(order);
});

app.get("/api/orders", async (_req, res) => {
  res.json(await listOrders());
});

app.get("/api/orders/:id", async (req, res) => {
  const order = await getOrder(req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found" });
  return res.json(order);
});

app.patch("/api/orders/:id/status", async (req, res) => {
  if (!allowedStatuses.includes(req.body.status)) {
    return res.status(400).json({ error: "Invalid order status" });
  }

  const order = await updateStoredOrderStatus(req.params.id, req.body.status as OrderStatus);
  if (!order) return res.status(404).json({ error: "Order not found" });
  return res.json(order);
});

app.get("/api/status-board", async (_req, res) => {
  const orders = await listOrders();
  res.json({
    preparing: orders.filter((order) => order.status === "new" || order.status === "preparing"),
    ready: orders.filter((order) => order.status === "ready")
  });
});

app.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

app.use(express.static(distPath, {
  index: false,
  etag: false,
  lastModified: false,
  maxAge: 0
}));

app.get(["/", "/kiosk", "/kitchen", "/status", "/admin"], (_req, res) => {
  res.sendFile(indexPath);
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("SBB kiosk API error", error);
  res.status(500).json({ error: "Unexpected kiosk API error" });
});

await initializeOrderStore();

app.listen(port, "0.0.0.0", () => {
  console.log(`SBB Kiosk server listening on ${port}`);
  console.log(`Serving built kiosk app from ${distPath}`);
});
