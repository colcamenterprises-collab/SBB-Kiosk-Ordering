# Local Development

## Install

```bash
pnpm install
```

## Run kiosk frontend

```bash
pnpm dev
```

Open:

```text
http://localhost:5174/kiosk
http://localhost:5174/kitchen
http://localhost:5174/status
http://localhost:5174/admin
```

## Run API skeleton

In a second terminal:

```bash
pnpm dev:api
```

Health check:

```bash
curl http://localhost:4110/api/healthz
```

## Build check

```bash
pnpm build
```

## Current MVP behaviour

The frontend currently uses browser localStorage for the fastest first working loop:

```text
/kiosk creates order
/kitchen reads order and updates status
/status displays preparing / ready tickets
```

The API and Drizzle schema are scaffolded as the next layer. The next patch should move the frontend from localStorage to API-backed orders.
