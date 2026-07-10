# SBB Kiosk Ordering — MVP Build Brief

## Product goal

Build a standalone ordering system for Smash Brothers Burgers that can run on tablets/kiosks, send tickets to the kitchen, and show customers their order number status.

This is the foundation for:

- self-ordering kiosk
- online ordering
- order ticket numbers
- customer status screen
- future POS layer
- future SBB Dashboard integration

## Why this exists

Current business issue:

- cashier dependency
- staff turnover
- order channel fragmentation
- need for faster direct sales channels
- need to reduce manual order taking

This system should let Smash Brothers run with fewer front-of-house bottlenecks.

## Build principle

Build clean and standalone first.

Do not couple this to the main SBB Dashboard until the ordering loop is tested and working.

## Routes

### Public / kiosk routes

```text
/                     redirect to /kiosk
/kiosk                customer ordering start
/kiosk/menu           category + item grid
/kiosk/item/:id       item details + modifiers
/kiosk/cart           cart review
/kiosk/confirm        order confirmation / ticket number
/status               customer-facing ticket display
```

### Staff routes

```text
/kitchen              kitchen order queue
/admin                menu admin
/admin/items          item manager
/admin/categories     category manager
/admin/modifiers      modifier manager
```

### API routes

```text
GET    /api/menu
POST   /api/orders
GET    /api/orders
GET    /api/orders/:id
PATCH  /api/orders/:id/status
GET    /api/status-board
GET    /api/admin/menu
POST   /api/admin/items
PATCH  /api/admin/items/:id
POST   /api/admin/categories
PATCH  /api/admin/categories/:id
POST   /api/admin/modifier-groups
PATCH  /api/admin/modifier-groups/:id
```

## Order statuses

```text
new
preparing
ready
collected
cancelled
```

## Order number rules

- Generate a short customer-facing ticket number.
- Reset daily is acceptable for MVP.
- Example: `101`, `102`, `103`.
- Store full database order id separately.

## MVP data model

### menu_categories

- id
- name
- sort_order
- is_active
- created_at
- updated_at

### menu_items

- id
- category_id
- name
- description
- price_thb
- image_url
- is_active
- is_available
- sort_order
- created_at
- updated_at

### modifier_groups

- id
- menu_item_id nullable
- name
- required
- min_select
- max_select
- sort_order
- created_at
- updated_at

### modifiers

- id
- modifier_group_id
- name
- price_delta_thb
- is_active
- sort_order
- created_at
- updated_at

### orders

- id
- ticket_number
- order_type
- status
- subtotal_thb
- total_thb
- customer_note
- source
- created_at
- updated_at

### order_items

- id
- order_id
- menu_item_id
- name_snapshot
- unit_price_thb
- quantity
- line_total_thb
- note
- created_at

### order_item_modifiers

- id
- order_item_id
- modifier_id nullable
- name_snapshot
- price_delta_thb
- created_at

### order_status_events

- id
- order_id
- from_status
- to_status
- actor
- created_at

### kiosk_devices

- id
- device_name
- device_type
- location
- is_active
- last_seen_at
- created_at

## Seed menu for MVP

Categories:

- Burgers
- Sets
- Sides
- Drinks

Items:

- Single Smash Burger
- Double Smash Burger
- Triple Smash Burger
- Super Double Bacon & Cheese
- Classic Set
- Upgrade Set
- Fries
- Onion Rings
- Coke
- Coke Zero
- Water

## UI direction

Use the uploaded references as directional inspiration only.

Core design language:

- kiosk/tablet-first
- black base
- yellow/orange action areas
- large product photography
- minimal copy
- rounded cards
- bottom cart bar
- clear category rail
- large price labels
- large ticket numbers

## First MVP acceptance test

1. Open `/kiosk`.
2. Select order type.
3. Add a Double Smash Burger.
4. Add fries or drink as modifier/upsell.
5. Submit order.
6. See ticket number.
7. Open `/kitchen`.
8. See the order in New.
9. Move it to Preparing.
10. Move it to Ready.
11. Open `/status`.
12. See ticket number under Ready.
13. Mark Collected.
14. Ticket disappears from customer status board.
