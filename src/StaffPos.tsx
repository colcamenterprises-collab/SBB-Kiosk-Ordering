import { useState } from "react";
import { ArrowLeft, ChefHat, Minus, Plus, ReceiptText, Send, ShoppingCart, Tv } from "lucide-react";
import { categories, menuItems } from "./data/menu";
import { createApiOrder } from "./lib/api";
import { safeId } from "./lib/id";
import type { CartItem, MenuItem, OrderType } from "./types";

const formatThb = (value: number) => `฿${value.toLocaleString("en-TH")}`;

export function StaffPosScreen({ navigate }: { navigate: (path: string) => void }) {
  const [activeCategory, setActiveCategory] = useState(categories[0].id);
  const [orderType, setOrderType] = useState<OrderType>("takeaway");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const activeItems = menuItems.filter((item) => item.categoryId === activeCategory && item.isAvailable);
  const total = cart.reduce((sum, item) => sum + item.priceThb * item.quantity, 0);

  const addItem = (item: MenuItem) => {
    setMessage(null);
    setCart((current) => {
      const existing = current.find((cartItem) => cartItem.itemId === item.id && cartItem.modifiers.length === 0);
      if (existing) {
        return current.map((cartItem) => cartItem.cartId === existing.cartId ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem);
      }

      return [
        ...current,
        {
          cartId: safeId("pos-cart"),
          itemId: item.id,
          name: item.name,
          priceThb: item.priceThb,
          image: item.image,
          quantity: 1,
          modifiers: []
        }
      ];
    });
  };

  const updateQuantity = (cartId: string, direction: number) => {
    setCart((current) => current.flatMap((item) => {
      if (item.cartId !== cartId) return [item];
      const quantity = item.quantity + direction;
      return quantity <= 0 ? [] : [{ ...item, quantity }];
    }));
  };

  const sendOrder = async () => {
    if (cart.length === 0 || isSubmitting) return;
    setIsSubmitting(true);
    setMessage(null);

    try {
      const order = await createApiOrder(orderType, cart);
      setCart([]);
      setMessage(`Ticket #${order.ticketNumber} sent to kitchen`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not send order");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="pos-shell">
      <header className="pos-header">
        <button onClick={() => navigate("/kiosk")}><ArrowLeft /> Kiosk</button>
        <div>
          <span>Staff POS</span>
          <h1>New Sale</h1>
        </div>
        <nav>
          <button onClick={() => navigate("/kitchen")}><ChefHat /> Kitchen</button>
          <button onClick={() => navigate("/status")}><Tv /> Status</button>
        </nav>
      </header>

      <section className="pos-layout">
        <aside className="pos-menu-panel">
          <div className="pos-order-types">
            <button className={orderType === "dine_in" ? "active" : ""} onClick={() => setOrderType("dine_in")}>Dine In</button>
            <button className={orderType === "takeaway" ? "active" : ""} onClick={() => setOrderType("takeaway")}>Takeaway</button>
            <button className={orderType === "pickup" ? "active" : ""} onClick={() => setOrderType("pickup")}>Pickup</button>
          </div>

          <div className="pos-categories">
            {categories.map((category) => (
              <button key={category.id} className={activeCategory === category.id ? "active" : ""} onClick={() => setActiveCategory(category.id)}>
                {category.name}
              </button>
            ))}
          </div>

          <div className="pos-product-grid">
            {activeItems.map((item) => (
              <button key={item.id} onClick={() => addItem(item)}>
                <img src={item.image} alt="" />
                <span>{item.name}</span>
                <strong>{formatThb(item.priceThb)}</strong>
              </button>
            ))}
          </div>
        </aside>

        <aside className="pos-cart-panel">
          <div className="pos-cart-title">
            <span>Current Order</span>
            <strong>{cart.length} lines</strong>
          </div>

          <div className="pos-cart-list">
            {cart.length === 0 ? (
              <div className="pos-empty-cart">
                <ShoppingCart size={42} />
                <p>Tap items to build an order.</p>
              </div>
            ) : cart.map((item) => (
              <article key={item.cartId} className="pos-cart-row">
                <div>
                  <strong>{item.name}</strong>
                  <span>{formatThb(item.priceThb)} each</span>
                </div>
                <button onClick={() => updateQuantity(item.cartId, -1)}><Minus size={17} /></button>
                <b>{item.quantity}</b>
                <button onClick={() => updateQuantity(item.cartId, 1)}><Plus size={17} /></button>
              </article>
            ))}
          </div>

          {message && <div className="pos-message">{message}</div>}

          <div className="pos-total-card">
            <span>Total</span>
            <strong>{formatThb(total)}</strong>
            <button disabled={cart.length === 0 || isSubmitting} onClick={sendOrder}>
              {isSubmitting ? <><ReceiptText /> Sending...</> : <><Send /> Send to Kitchen</>}
            </button>
          </div>
        </aside>
      </section>
    </main>
  );
}
