# Agent Instructions — SBB Kiosk Ordering

## Project mission

Build a standalone Smash Brothers Burgers kiosk ordering system.

This repo must remain independent from the main SBB Dashboard until the kiosk/order loop is stable.

## Non-negotiables

- Tablet/kiosk-first UI.
- Touch-friendly controls.
- Minimal text.
- Large product images.
- Black + yellow/orange SBB visual direction.
- No dependency on the existing SBB Dashboard in MVP.
- No payment gateway in MVP.
- No inventory/recipe costing in MVP.
- Do not introduce complex auth until the core order loop works.

## Core MVP loop

```text
/kiosk order placed
  -> /kitchen receives ticket
  -> staff updates status
  -> /status shows order number
```

## Preferred stack

- React + Vite
- TypeScript
- Express API
- PostgreSQL
- Drizzle ORM
- pnpm

## Route ownership

- Customer ordering: `/kiosk`
- Kitchen display: `/kitchen`
- Customer ticket display: `/status`
- Admin/menu management: `/admin`
- API: `/api/*`

## Build sequence

1. Scaffold app and API.
2. Add database schema.
3. Add seed menu.
4. Build kiosk menu/cart/order submission.
5. Build kitchen queue/status updates.
6. Build customer status screen.
7. Add admin menu manager.
8. Add deployment scripts.

## Design rule

Do not build this like a dashboard. Build it like a fast-food kiosk.

Every screen should be usable by a customer with no instructions.

## Definition of done for first build

- `pnpm install` works.
- `pnpm build` works.
- `pnpm dev` runs locally.
- `/kiosk`, `/kitchen`, `/status`, `/admin` all render.
- Seed menu is visible.
- A test order can be created.
- Kitchen can mark order ready.
- Status screen updates.
