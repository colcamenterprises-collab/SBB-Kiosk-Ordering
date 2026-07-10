import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, ChefHat, Clock, Home, Minus, Plus, ReceiptText, ShoppingCart, Tv } from "lucide-react";
import { categories, menuItems, modifierGroups } from "./data/menu";
import { createOrder, getOrders, updateOrderStatus } from "./lib/orders";
import type { CartItem, MenuItem, Modifier, Order, OrderStatus, OrderType } from "./types";

const formatThb = (value: number) => `฿${value.toLocaleString("en-TH")}`;

function useRoute() {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const handler = () => setPath(window.location.pathname);
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  const navigate = (nextPath: string) => {
    window.history.pushState(null, "", nextPath);
    setPath(nextPath);
  };

  return { path, navigate };
}

function useOrders() {
  const [orders, setOrders] = useState<Order[]>(() => getOrders());
  useEffect(() => {
    const refresh = () => setOrders(getOrders());
    window.addEventListener("storage", refresh);
    window.addEventListener("sbb-orders-updated", refresh);
    const timer = window.setInterval(refresh, 2500);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("sbb-orders-updated", refresh);
      window.clearInterval(timer);
    };
  }, []);
  return orders;
}

export function App() {
  const { path, navigate } = useRoute();

  if (path === "/kitchen") return <KitchenScreen navigate={navigate} />;
  if (path === "/status") return <StatusScreen navigate={navigate} />;
  if (path === "/admin") return <AdminScreen navigate={navigate} />;
  return <KioskScreen navigate={navigate} />;
}

function KioskScreen({ navigate }: { navigate: (path: string) => void }) {
  const [orderType, setOrderType] = useState<OrderType | null>(null);
  const [activeCategory, setActiveCategory] = useState(categories[0].id);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedModifiers, setSelectedModifiers] = useState<Modifier[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  const activeItems = menuItems.filter((item) => item.categoryId === activeCategory && item.isAvailable);
  const cartTotal = cart.reduce((sum, item) => {
    const extras = item.modifiers.reduce((extraSum, modifier) => extraSum + modifier.priceDeltaThb, 0);
    return sum + (item.priceThb + extras) * item.quantity;
  }, 0);

  const itemGroups = selectedItem?.modifierGroupIds?.map((groupId) => modifierGroups.find((group) => group.id === groupId)).filter(Boolean) ?? [];

  const addSelectedToCart = () => {
    if (!selectedItem) return;
    setCart((current) => [
      ...current,
      {
        cartId: crypto.randomUUID(),
        itemId: selectedItem.id,
        name: selectedItem.name,
        priceThb: selectedItem.priceThb,
        image: selectedItem.image,
        quantity: 1,
        modifiers: selectedModifiers
      }
    ]);
    setSelectedItem(null);
    setSelectedModifiers([]);
  };

  const submitOrder = () => {
    if (!orderType || cart.length === 0) return;
    const order = createOrder(orderType, cart);
    setConfirmedOrder(order);
    setCart([]);
  };

  if (confirmedOrder) {
    return (
      <main className="kiosk-shell confirmation-screen">
        <div className="success-card">
          <div className="success-ring"><Check size={62} /></div>
          <p>Order confirmed</p>
          <h1>#{confirmedOrder.ticketNumber}</h1>
          <span>Watch the status screen for your number.</span>
          <button className="primary-action" onClick={() => { setConfirmedOrder(null); setOrderType(null); }}>Start New Order</button>
        </div>
      </main>
    );
  }

  if (!orderType) {
    return (
      <main className="kiosk-shell start-screen">
        <section className="brand-hero">
          <span>Smash Brothers Burgers</span>
          <h1>Order Here</h1>
          <p>Choose your order type to start.</p>
        </section>
        <section className="order-type-grid">
          <button onClick={() => setOrderType("dine_in")}><Home />Dine In</button>
          <button onClick={() => setOrderType("takeaway")}><ShoppingCart />Takeaway</button>
          <button onClick={() => setOrderType("pickup")}><ReceiptText />Pickup</button>
        </section>
        <section className="staff-links">
          <button onClick={() => navigate("/kitchen")}><ChefHat /> Kitchen</button>
          <button onClick={() => navigate("/status")}><Tv /> Status</button>
        </section>
      </main>
    );
  }

  return (
    <main className="kiosk-shell menu-screen">
      <header className="kiosk-header">
        <button onClick={() => setOrderType(null)}><ArrowLeft /> Back</button>
        <div><span>SBB</span><strong>{orderType.replace("_", " ")}</strong></div>
        <button onClick={() => navigate("/status")}><Tv /> Status</button>
      </header>

      <nav className="category-rail">
        {categories.map((category) => (
          <button key={category.id} className={activeCategory === category.id ? "active" : ""} onClick={() => setActiveCategory(category.id)}>
            <img src={category.image} alt="" />
            <span>{category.name}</span>
          </button>
        ))}
      </nav>

      <section className="product-grid">
        {activeItems.map((item) => (
          <button className="product-card" key={item.id} onClick={() => { setSelectedItem(item); setSelectedModifiers([]); }}>
            <img src={item.image} alt={item.name} />
            <div>
              <h2>{item.name}</h2>
              <p>{item.description}</p>
              <strong>{formatThb(item.priceThb)}</strong>
            </div>
            {item.tags?.[0] && <span className="tag">{item.tags[0]}</span>}
          </button>
        ))}
      </section>

      <CartBar cart={cart} total={cartTotal} onQuantity={(cartId, direction) => {
        setCart((current) => current.flatMap((item) => {
          if (item.cartId !== cartId) return [item];
          const quantity = item.quantity + direction;
          return quantity <= 0 ? [] : [{ ...item, quantity }];
        }));
      }} onSubmit={submitOrder} />

      {selectedItem && (
        <div className="modal-backdrop" onClick={() => setSelectedItem(null)}>
          <div className="item-modal" onClick={(event) => event.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelectedItem(null)}>×</button>
            <img src={selectedItem.image} alt={selectedItem.name} />
            <h2>{selectedItem.name}</h2>
            <p>{selectedItem.description}</p>
            <strong>{formatThb(selectedItem.priceThb)}</strong>
            <div className="modifier-area">
              {itemGroups.map((group) => group && (
                <section key={group.id}>
                  <h3>{group.name}</h3>
                  <div className="modifier-grid">
                    {group.modifiers.map((modifier) => {
                      const active = selectedModifiers.some((selected) => selected.id === modifier.id);
                      return (
                        <button key={modifier.id} className={active ? "active" : ""} onClick={() => {
                          setSelectedModifiers((current) => active ? current.filter((selected) => selected.id !== modifier.id) : [...current, modifier]);
                        }}>
                          {modifier.name}{modifier.priceDeltaThb > 0 ? ` +${formatThb(modifier.priceDeltaThb)}` : ""}
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
            <button className="primary-action" onClick={addSelectedToCart}>Add to Order</button>
          </div>
        </div>
      )}
    </main>
  );
}

function CartBar({ cart, total, onQuantity, onSubmit }: { cart: CartItem[]; total: number; onQuantity: (cartId: string, direction: number) => void; onSubmit: () => void }) {
  return (
    <aside className="cart-bar">
      <div className="cart-list">
        {cart.length === 0 ? <span>Your order is empty</span> : cart.map((item) => (
          <div className="cart-row" key={item.cartId}>
            <img src={item.image} alt="" />
            <div><strong>{item.name}</strong><span>{item.modifiers.map((modifier) => modifier.name).join(", ")}</span></div>
            <button onClick={() => onQuantity(item.cartId, -1)}><Minus size={16} /></button>
            <b>{item.quantity}</b>
            <button onClick={() => onQuantity(item.cartId, 1)}><Plus size={16} /></button>
          </div>
        ))}
      </div>
      <div className="cart-total"><span>Total</span><strong>{formatThb(total)}</strong><button disabled={cart.length === 0} onClick={onSubmit}>Place Order</button></div>
    </aside>
  );
}

function KitchenScreen({ navigate }: { navigate: (path: string) => void }) {
  const orders = useOrders();
  const lanes: Array<{ status: OrderStatus; label: string }> = [
    { status: "new", label: "New" },
    { status: "preparing", label: "Preparing" },
    { status: "ready", label: "Ready" }
  ];

  return (
    <main className="operations-shell">
      <header className="ops-header"><button onClick={() => navigate("/kiosk")}><ArrowLeft /> Kiosk</button><h1>Kitchen Queue</h1><button onClick={() => navigate("/status")}><Tv /> Status</button></header>
      <section className="kitchen-board">
        {lanes.map((lane) => (
          <div className="kitchen-lane" key={lane.status}>
            <h2>{lane.label}</h2>
            {orders.filter((order) => order.status === lane.status).map((order) => <KitchenTicket key={order.id} order={order} />)}
          </div>
        ))}
      </section>
    </main>
  );
}

function KitchenTicket({ order }: { order: Order }) {
  const nextStatus: Record<OrderStatus, OrderStatus | null> = { new: "preparing", preparing: "ready", ready: "collected", collected: null, cancelled: null };
  const next = nextStatus[order.status];

  return (
    <article className="ticket-card">
      <header><strong>#{order.ticketNumber}</strong><span><Clock size={14} /> {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span></header>
      {order.items.map((item) => (
        <div className="ticket-item" key={item.cartId}>
          <b>{item.quantity}× {item.name}</b>
          {item.modifiers.length > 0 && <span>{item.modifiers.map((modifier) => modifier.name).join(", ")}</span>}
        </div>
      ))}
      {next && <button onClick={() => updateOrderStatus(order.id, next)}>{next === "collected" ? "Collected" : `Mark ${next}`}</button>}
    </article>
  );
}

function StatusScreen({ navigate }: { navigate: (path: string) => void }) {
  const orders = useOrders();
  const preparing = orders.filter((order) => order.status === "new" || order.status === "preparing");
  const ready = orders.filter((order) => order.status === "ready");

  return (
    <main className="status-shell">
      <button className="status-back" onClick={() => navigate("/kiosk")}><ArrowLeft /> Kiosk</button>
      <section><span>Now Preparing</span><div>{preparing.map((order) => <b key={order.id}>#{order.ticketNumber}</b>)}</div></section>
      <section className="ready"><span>Ready for Collection</span><div>{ready.map((order) => <b key={order.id}>#{order.ticketNumber}</b>)}</div></section>
    </main>
  );
}

function AdminScreen({ navigate }: { navigate: (path: string) => void }) {
  const grouped = categories.map((category) => ({ ...category, items: menuItems.filter((item) => item.categoryId === category.id) }));
  return (
    <main className="operations-shell">
      <header className="ops-header"><button onClick={() => navigate("/kiosk")}><ArrowLeft /> Kiosk</button><h1>Menu Admin</h1><button onClick={() => navigate("/kitchen")}><ChefHat /> Kitchen</button></header>
      <section className="admin-grid">
        {grouped.map((category) => (
          <article className="admin-card" key={category.id}>
            <h2>{category.name}</h2>
            {category.items.map((item) => <div key={item.id}><span>{item.name}</span><strong>{formatThb(item.priceThb)}</strong><em>{item.isAvailable ? "Available" : "Off"}</em></div>)}
          </article>
        ))}
      </section>
    </main>
  );
}
