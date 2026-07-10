import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, ChefHat, Clock, Minus, Plus, RotateCcw, Tv, Volume2, Wifi, WifiOff } from "lucide-react";
import { categories, menuItems, modifierGroups } from "./data/menu";
import { createOrder, getOrders, saveOrders, updateOrderStatus } from "./lib/orders";
import { createApiOrder, fetchApiOrders, updateApiOrderStatus, type OrderSource } from "./lib/api";
import { safeId } from "./lib/id";
import { announceReadyList, announceReadyOrder, announceVoiceEnabled, canUseSpeech } from "./lib/voice";
import { CustomerKioskMenu } from "./CustomerKioskMenu";
import { StaffPosScreen } from "./StaffPos";
import type { CartItem, MenuItem, Modifier, Order, OrderStatus, OrderType } from "./types";

const formatThb = (value: number) => `฿${value.toLocaleString("en-TH")}`;
const CUSTOMER_ORDER_TYPE: OrderType = "takeaway";
const VOICE_ENABLED_STORAGE_KEY = "sbb-status-voice-enabled";
const VOICE_ANNOUNCED_STORAGE_KEY = "sbb-status-announced-ready-ids";

function loadVoiceEnabled() {
  return localStorage.getItem(VOICE_ENABLED_STORAGE_KEY) === "true";
}

function saveVoiceEnabled(enabled: boolean) {
  localStorage.setItem(VOICE_ENABLED_STORAGE_KEY, enabled ? "true" : "false");
}

function loadAnnouncedReadyIds() {
  try {
    return new Set<string>(JSON.parse(sessionStorage.getItem(VOICE_ANNOUNCED_STORAGE_KEY) ?? "[]"));
  } catch {
    return new Set<string>();
  }
}

function saveAnnouncedReadyIds(ids: Set<string>) {
  sessionStorage.setItem(VOICE_ANNOUNCED_STORAGE_KEY, JSON.stringify([...ids]));
}

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
  const [source, setSource] = useState<OrderSource>("local");

  useEffect(() => {
    let alive = true;

    const refresh = async () => {
      try {
        const apiOrders = await fetchApiOrders();
        if (!alive) return;
        setOrders(apiOrders);
        saveOrders(apiOrders);
        setSource("api");
      } catch {
        if (!alive) return;
        setOrders(getOrders());
        setSource("local");
      }
    };

    void refresh();
    window.addEventListener("storage", refresh);
    const timer = window.setInterval(refresh, 1000);
    return () => {
      alive = false;
      window.removeEventListener("storage", refresh);
      window.clearInterval(timer);
    };
  }, []);

  return { orders, source };
}

async function setOrderStatus(orderId: string, status: OrderStatus) {
  try {
    const updated = await updateApiOrderStatus(orderId, status);
    saveOrders(getOrders().map((order) => order.id === orderId ? updated : order));
  } catch {
    updateOrderStatus(orderId, status);
  }
}

export function App() {
  const { path, navigate } = useRoute();

  if (path === "/pos") return <StaffPosScreen navigate={navigate} />;
  if (path === "/kitchen") return <KitchenScreen navigate={navigate} />;
  if (path === "/status") return <StatusScreen navigate={navigate} />;
  if (path === "/admin") return <AdminScreen navigate={navigate} />;
  return <CustomerKioskMenu />;
}

function SyncBadge({ source }: { source: OrderSource }) {
  return (
    <span className={source === "api" ? "sync-badge online" : "sync-badge"}>
      {source === "api" ? <Wifi size={15} /> : <WifiOff size={15} />}
      {source === "api" ? "Shared live" : "Local test"}
    </span>
  );
}

function KioskScreen({ navigate }: { navigate: (path: string) => void }) {
  const customerCategories = [{ id: "hot-selling", name: "Hot Selling" }, ...categories.map((category) => ({ id: category.id, name: category.name }))];
  const [activeCategory, setActiveCategory] = useState(customerCategories[1]?.id ?? "hot-selling");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedModifiers, setSelectedModifiers] = useState<Modifier[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeItems = menuItems.filter((item) => item.categoryId === activeCategory && item.isAvailable);
  const cartTotal = cart.reduce((sum, item) => {
    const extras = item.modifiers.reduce((extraSum, modifier) => extraSum + modifier.priceDeltaThb, 0);
    return sum + (item.priceThb + extras) * item.quantity;
  }, 0);

  const itemGroups = selectedItem?.modifierGroupIds?.map((groupId) => modifierGroups.find((group) => group.id === groupId)).filter(Boolean) ?? [];

  const addItemToCart = (item: MenuItem, modifiers: Modifier[] = []) => {
    setCart((current) => [
      ...current,
      {
        cartId: safeId("cart"),
        itemId: item.id,
        name: item.name,
        priceThb: item.priceThb,
        image: item.image,
        quantity: 1,
        modifiers
      }
    ]);
  };

  const addSelectedToCart = () => {
    if (!selectedItem) return;
    addItemToCart(selectedItem, selectedModifiers);
    setSelectedItem(null);
    setSelectedModifiers([]);
  };

  const submitOrder = async () => {
    if (cart.length === 0 || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const order = await createApiOrder(CUSTOMER_ORDER_TYPE, cart);
      setConfirmedOrder(order);
    } catch {
      const order = createOrder(CUSTOMER_ORDER_TYPE, cart);
      setConfirmedOrder(order);
    } finally {
      setCart([]);
      setIsSubmitting(false);
    }
  };

  if (confirmedOrder) {
    return (
      <main className="kiosk-shell confirmation-screen">
        <div className="success-card">
          <div className="success-ring"><Check size={62} /></div>
          <p>Order confirmed</p>
          <h1>#{confirmedOrder.ticketNumber}</h1>
          <span>Watch the status screen for your number.</span>
          <button className="primary-action" onClick={() => setConfirmedOrder(null)}>Start New Order</button>
        </div>
      </main>
    );
  }

  return (
    <main className="kiosk-shell customer-kiosk">
      <section className="customer-menu-panel">
        <header className="customer-kiosk-top">
          <h1>Pick Your Craving</h1>
          <p>Every bite hits different. Choose your category and feast.</p>
        </header>

        <nav className="customer-category-tabs" aria-label="Menu categories">
          {customerCategories.map((category) => (
            <button key={category.id} className={activeCategory === category.id ? "active" : ""} onClick={() => setActiveCategory(category.id)}>
              {category.name}
            </button>
          ))}
        </nav>

        <section className="customer-product-grid">
          {activeItems.slice(0, 3).map((item) => (
            <article className="customer-product-card" key={item.id}>
              <button className="customer-product-open" onClick={() => { setSelectedItem(item); setSelectedModifiers([]); }} aria-label={`Customize ${item.name}`}>
                <img src={item.image} alt={item.name} />
              </button>
              <h2>{item.name}</h2>
              <p>{shortDescription(item.description)}</p>
              <footer className="customer-card-footer">
                <strong className="customer-price">{formatThb(item.priceThb)}</strong>
                <button className="customer-add-button" onClick={() => addItemToCart(item)} aria-label={`Add ${item.name}`}>+</button>
              </footer>
            </article>
          ))}
        </section>

        {cart.length > 0 && (
          <section className="customer-cart-strip" aria-live="polite">
            <div className="customer-cart-summary">
              <strong>{cart.length} item{cart.length === 1 ? "" : "s"}</strong>
              <span>Total {formatThb(cartTotal)}</span>
            </div>
            <button className="customer-checkout-button" disabled={isSubmitting} onClick={submitOrder}>
              {isSubmitting ? "Sending..." : "Place Order"}
            </button>
          </section>
        )}
      </section>

      {selectedItem && (
        <div className="modal-backdrop" onClick={() => setSelectedItem(null)}>
          <div className="item-modal customer-item-modal" onClick={(event) => event.stopPropagation()}>
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

function shortDescription(description: string) {
  if (description.length <= 58) return description;
  return `${description.slice(0, 58).trim()}...`;
}

function KitchenScreen({ navigate }: { navigate: (path: string) => void }) {
  const { orders, source } = useOrders();
  const lanes: Array<{ status: OrderStatus; label: string }> = [
    { status: "new", label: "New" },
    { status: "preparing", label: "Preparing" },
    { status: "ready", label: "Ready" }
  ];

  return (
    <main className="operations-shell">
      <header className="ops-header"><button onClick={() => navigate("/kiosk")}><ArrowLeft /> Kiosk</button><h1>Kitchen Queue</h1><SyncBadge source={source} /><button onClick={() => navigate("/status")}><Tv /> Status</button></header>
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
      {next && <button onClick={() => void setOrderStatus(order.id, next)}>{next === "collected" ? "Collected" : `Mark ${next}`}</button>}
    </article>
  );
}

function StatusScreen({ navigate }: { navigate: (path: string) => void }) {
  const { orders, source } = useOrders();
  const [voiceEnabled, setVoiceEnabled] = useState(() => loadVoiceEnabled());
  const [voiceSupported, setVoiceSupported] = useState(() => canUseSpeech());
  const announcedReadyIdsRef = useRef<Set<string>>(loadAnnouncedReadyIds());
  const preparing = orders.filter((order) => order.status === "new" || order.status === "preparing");
  const ready = orders.filter((order) => order.status === "ready");

  useEffect(() => {
    setVoiceSupported(canUseSpeech());
  }, []);

  useEffect(() => {
    saveVoiceEnabled(voiceEnabled);
  }, [voiceEnabled]);

  useEffect(() => {
    if (!voiceEnabled) return;

    const unseenReady = ready.filter((order) => !announcedReadyIdsRef.current.has(order.id));
    unseenReady.forEach((order, index) => {
      announcedReadyIdsRef.current.add(order.id);
      saveAnnouncedReadyIds(announcedReadyIdsRef.current);
      window.setTimeout(() => announceReadyOrder(order.ticketNumber), index * 1800);
    });
  }, [ready, voiceEnabled]);

  const enableVoice = () => {
    setVoiceEnabled(true);
    saveVoiceEnabled(true);
    if (ready.length > 0) {
      ready.forEach((order) => announcedReadyIdsRef.current.add(order.id));
      saveAnnouncedReadyIds(announcedReadyIdsRef.current);
      announceReadyList(ready.map((order) => order.ticketNumber));
      return;
    }

    announceVoiceEnabled();
  };

  const replayReadyOrders = () => {
    ready.forEach((order) => announcedReadyIdsRef.current.add(order.id));
    saveAnnouncedReadyIds(announcedReadyIdsRef.current);
    announceReadyList(ready.map((order) => order.ticketNumber));
  };

  return (
    <main className="status-shell">
      <button className="status-back" onClick={() => navigate("/kiosk")}><ArrowLeft /> Kiosk</button>
      <div className="status-sync"><SyncBadge source={source} /></div>
      <div className="voice-controls">
        <button className={voiceEnabled ? "voice-button active" : "voice-button"} disabled={!voiceSupported || voiceEnabled} onClick={enableVoice}>
          <Volume2 size={17} /> {voiceEnabled ? "Voice On" : "Enable Voice"}
        </button>
        <button className="voice-button" disabled={!voiceSupported || !voiceEnabled} onClick={replayReadyOrders}>
          <RotateCcw size={17} /> Replay Ready
        </button>
      </div>
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
