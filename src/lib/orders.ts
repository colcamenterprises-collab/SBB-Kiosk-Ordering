import type { CartItem, Order, OrderStatus, OrderType } from "../types";

const ORDER_STORAGE_KEY = "sbb-kiosk-orders";
const TICKET_STORAGE_KEY = "sbb-kiosk-ticket-seed";

export function getOrders(): Order[] {
  const raw = localStorage.getItem(ORDER_STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Order[];
  } catch {
    return [];
  }
}

export function saveOrders(orders: Order[]) {
  localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(orders));
  window.dispatchEvent(new CustomEvent("sbb-orders-updated"));
}

export function createOrder(orderType: OrderType, cartItems: CartItem[]): Order {
  const now = new Date().toISOString();
  const ticketNumber = nextTicketNumber();
  const items = cartItems.map((item) => {
    const modifierTotal = item.modifiers.reduce((sum, modifier) => sum + modifier.priceDeltaThb, 0);
    const unitTotal = item.priceThb + modifierTotal;
    return {
      ...item,
      lineTotalThb: unitTotal * item.quantity
    };
  });
  const subtotalThb = items.reduce((sum, item) => sum + item.lineTotalThb, 0);

  const order: Order = {
    id: crypto.randomUUID(),
    ticketNumber,
    orderType,
    status: "new",
    items,
    subtotalThb,
    totalThb: subtotalThb,
    createdAt: now,
    updatedAt: now
  };

  saveOrders([order, ...getOrders()]);
  return order;
}

export function updateOrderStatus(orderId: string, status: OrderStatus) {
  const orders = getOrders().map((order) =>
    order.id === orderId ? { ...order, status, updatedAt: new Date().toISOString() } : order
  );
  saveOrders(orders);
}

export function clearCollectedOrders() {
  saveOrders(getOrders().filter((order) => order.status !== "collected" && order.status !== "cancelled"));
}

function nextTicketNumber() {
  const currentDate = new Date().toISOString().slice(0, 10);
  const raw = localStorage.getItem(TICKET_STORAGE_KEY);
  const seed = raw ? JSON.parse(raw) as { date: string; value: number } : { date: currentDate, value: 100 };
  const next = seed.date === currentDate ? seed.value + 1 : 101;
  localStorage.setItem(TICKET_STORAGE_KEY, JSON.stringify({ date: currentDate, value: next }));
  return next;
}
