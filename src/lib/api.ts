import type { CartItem, Order, OrderStatus, OrderType } from "../types";

export type OrderSource = "api" | "local";

export async function fetchApiOrders(): Promise<Order[]> {
  return request<Order[]>("/api/orders");
}

export async function createApiOrder(orderType: OrderType, cartItems: CartItem[]): Promise<Order> {
  const items = cartItems.map((item) => {
    const modifierTotal = item.modifiers.reduce((sum, modifier) => sum + modifier.priceDeltaThb, 0);
    const lineTotalThb = (item.priceThb + modifierTotal) * item.quantity;
    return { ...item, lineTotalThb };
  });
  const subtotalThb = items.reduce((sum, item) => sum + item.lineTotalThb, 0);

  return request<Order>("/api/orders", {
    method: "POST",
    body: JSON.stringify({
      orderType,
      items,
      subtotalThb,
      totalThb: subtotalThb
    })
  });
}

export async function updateApiOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
  return request<Order>(`/api/orders/${orderId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status })
  });
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(message || `Request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}
