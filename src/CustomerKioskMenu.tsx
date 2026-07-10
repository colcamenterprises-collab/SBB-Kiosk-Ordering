import { useMemo, useState } from "react";
import { Check, X } from "lucide-react";
import { categories, menuItems, modifierGroups } from "./data/menu";
import { createOrder } from "./lib/orders";
import { createApiOrder } from "./lib/api";
import { safeId } from "./lib/id";
import type { CartItem, MenuItem, Modifier, Order } from "./types";

const formatThb = (value: number) => `฿${value.toLocaleString("en-TH")}`;

const preferredHotSelling = ["double-smash", "single-smash", "super-double-bacon"];
const categoryLabels: Record<string, string> = {
  burgers: "Burgers",
  sets: "Sets",
  sides: "Sides",
  drinks: "Drinks"
};

export function CustomerKioskMenu() {
  const tabs = useMemo(() => [
    { id: "hot-selling", name: "Hot Selling" },
    ...categories.map((category) => ({ id: category.id, name: categoryLabels[category.id] ?? category.name }))
  ], []);
  const [activeTab, setActiveTab] = useState("burgers");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedModifiers, setSelectedModifiers] = useState<Modifier[]>([]);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const visibleItems = useMemo(() => {
    const available = menuItems.filter((item) => item.isAvailable);
    const selected = activeTab === "hot-selling"
      ? preferredHotSelling.map((id) => available.find((item) => item.id === id)).filter(Boolean) as MenuItem[]
      : available.filter((item) => item.categoryId === activeTab);

    return selected.slice(0, 3);
  }, [activeTab]);

  const cartTotal = cart.reduce((sum, item) => {
    const extras = item.modifiers.reduce((extraSum, modifier) => extraSum + modifier.priceDeltaThb, 0);
    return sum + (item.priceThb + extras) * item.quantity;
  }, 0);
  const cartLineCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const itemGroups = selectedItem?.modifierGroupIds?.map((groupId) => modifierGroups.find((group) => group.id === groupId)).filter(Boolean) ?? [];

  const addItemToCart = (item: MenuItem, modifiers: Modifier[] = []) => {
    setCart((current) => [
      ...current,
      {
        cartId: safeId("customer-cart"),
        itemId: item.id,
        name: item.name,
        priceThb: item.priceThb,
        image: item.image,
        quantity: 1,
        modifiers
      }
    ]);
  };

  const submitOrder = async () => {
    if (cart.length === 0 || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const order = await createApiOrder("takeaway", cart);
      setConfirmedOrder(order);
    } catch {
      const order = createOrder("takeaway", cart);
      setConfirmedOrder(order);
    } finally {
      setCart([]);
      setIsSubmitting(false);
    }
  };

  const addSelectedToCart = () => {
    if (!selectedItem) return;
    addItemToCart(selectedItem, selectedModifiers);
    setSelectedItem(null);
    setSelectedModifiers([]);
  };

  if (confirmedOrder) {
    return (
      <main className="customer-screen customer-confirmed-screen">
        <section className="customer-confirmed-card">
          <div className="customer-confirmed-icon"><Check size={62} /></div>
          <p>Order confirmed</p>
          <h1>#{confirmedOrder.ticketNumber}</h1>
          <span>Watch the pickup screen for your number.</span>
          <button onClick={() => setConfirmedOrder(null)}>Start New Order</button>
        </section>
      </main>
    );
  }

  return (
    <main className="customer-screen">
      <section className="customer-stage" aria-label="Smash Brothers Burgers customer menu">
        <header className="customer-title-block">
          <h1>Pick Your Craving</h1>
          <p>Every bite hits different. Choose your category and feast.</p>
        </header>

        <nav className="customer-tabs" aria-label="Menu categories">
          {tabs.map((tab) => (
            <button key={tab.id} className={activeTab === tab.id ? "active" : ""} onClick={() => setActiveTab(tab.id)}>
              {tab.name}
            </button>
          ))}
        </nav>

        <section className="customer-card-grid" aria-label="Menu items">
          {visibleItems.map((item) => (
            <article className="craving-card no-cutout-yet" key={item.id}>
              <button className="craving-image-button" onClick={() => { setSelectedItem(item); setSelectedModifiers([]); }} aria-label={`View ${item.name}`} />
              <h2>{item.name}</h2>
              <p>{descriptionPreview(item.description)}</p>
              <footer>
                <strong>{formatThb(item.priceThb)}</strong>
                <button className="craving-add-button" onClick={() => addItemToCart(item)} aria-label={`Add ${item.name}`}>+</button>
              </footer>
            </article>
          ))}
        </section>

        {cart.length > 0 && (
          <aside className="customer-checkout-strip" aria-live="polite">
            <span>{cartLineCount} item{cartLineCount === 1 ? "" : "s"}</span>
            <strong>{formatThb(cartTotal)}</strong>
            <button disabled={isSubmitting} onClick={submitOrder}>{isSubmitting ? "Sending..." : "Place Order"}</button>
          </aside>
        )}
      </section>

      {selectedItem && (
        <div className="customer-modal-backdrop" onClick={() => setSelectedItem(null)}>
          <section className="customer-item-sheet" onClick={(event) => event.stopPropagation()}>
            <button className="customer-close" onClick={() => setSelectedItem(null)} aria-label="Close"><X size={24} /></button>
            <div className="customer-modal-image-space" />
            <h2>{selectedItem.name}</h2>
            <p>{selectedItem.description}</p>
            <strong>{formatThb(selectedItem.priceThb)}</strong>
            <div className="customer-modifiers">
              {itemGroups.map((group) => group && (
                <section key={group.id}>
                  <h3>{group.name}</h3>
                  <div>
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
            <button className="customer-add-to-order" onClick={addSelectedToCart}>Add to Order</button>
          </section>
        </div>
      )}
    </main>
  );
}

function descriptionPreview(description: string) {
  if (description.length <= 58) return description;
  return `${description.slice(0, 58).trim()}...`;
}
