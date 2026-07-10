export type OrderType = "dine_in" | "takeaway" | "pickup";
export type OrderStatus = "new" | "preparing" | "ready" | "collected" | "cancelled";

export type Category = {
  id: string;
  name: string;
  image?: string;
};

export type MenuItem = {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  priceThb: number;
  image: string;
  isAvailable: boolean;
  tags?: string[];
  modifierGroupIds?: string[];
};

export type Modifier = {
  id: string;
  name: string;
  priceDeltaThb: number;
};

export type ModifierGroup = {
  id: string;
  name: string;
  required: boolean;
  minSelect: number;
  maxSelect: number;
  modifiers: Modifier[];
};

export type CartItem = {
  cartId: string;
  itemId: string;
  name: string;
  priceThb: number;
  image: string;
  quantity: number;
  modifiers: Modifier[];
  note?: string;
};

export type OrderItem = CartItem & {
  lineTotalThb: number;
};

export type Order = {
  id: string;
  ticketNumber: number;
  orderType: OrderType;
  status: OrderStatus;
  items: OrderItem[];
  subtotalThb: number;
  totalThb: number;
  createdAt: string;
  updatedAt: string;
};
