# SBB Kiosk Ordering

Standalone kiosk, online ordering, kitchen ticket, and order number display system for Smash Brothers Burgers.

## Mission

Replace cashier dependency and reduce staff turnover risk by allowing customers to order through a tablet/kiosk flow, while the kitchen receives clear tickets and customers can see order numbers move from preparing to ready.

This repo is intentionally separate from the main SBB Dashboard. It should be built, tested, and proven as a clean standalone system first. Once stable, it can be plugged into SBB Dashboard, POS, analytics, and marketing systems.

## Core flow

```text
Customer kiosk / online order
  -> cart
  -> checkout
  -> ticket number generated
  -> kitchen display receives order
  -> staff mark preparing / ready / collected
  -> customer status screen updates
```

## Primary surfaces

- `/kiosk` — tablet-first customer ordering flow
- `/kitchen` — kitchen ticket display
- `/status` — customer-facing order number display
- `/admin` — simple menu and availability management
- `/api` — order/menu/status API

## Design direction

Think McDonald's self-ordering kiosk built for tablet.

- Touch-first
- Very large buttons
- Product-photo led
- Black, yellow, orange brand energy
- Minimal text
- Fast ordering
- Clear ticket numbers
- Clean kitchen queue

## MVP scope

### Customer ordering

- Start screen
- Order type: dine in / takeaway / pickup
- Category navigation
- Product grid
- Product detail
- Modifier selection
- Cart
- Order confirmation
- Ticket number

### Kitchen

- New orders
- Preparing orders
- Ready orders
- Collected orders
- Time since ordered
- Status actions

### Status screen

- Preparing ticket numbers
- Ready ticket numbers
- Large TV/tablet-friendly display

### Admin

- Categories
- Items
- Pricing
- Images
- Availability on/off
- Modifier groups

## Out of scope for MVP

- Payment gateway
- Loyalty
- Customer accounts
- Full POS replacement
- Inventory deduction
- Recipe costing
- Delivery partner integration

These come after the first working order loop is proven.

## Target stack

- React + Vite
- TypeScript
- Node + Express
- PostgreSQL
- Drizzle ORM
- Hostinger VPS deployment

## Success criteria

The MVP is successful when:

1. a customer can place an order on a tablet,
2. the order lands on the kitchen display,
3. staff can update the order status,
4. the customer status screen shows the ticket number,
5. the system can run standalone without touching the main SBB Dashboard.
