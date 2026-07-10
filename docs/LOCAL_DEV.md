# Local Development

## Install

```bash
npm install
```

## Run frontend + API together

```bash
npm run dev:all
```

Open:

```text
http://localhost:5174/kiosk
http://localhost:5174/kitchen
http://localhost:5174/status
http://localhost:5174/admin
```

Health check:

```bash
curl http://localhost:4110/api/healthz
```

## Hostinger background test

```bash
cd ~/SBB-Kiosk-Ordering

git pull --ff-only origin main
npm install
npm run build

pkill -f "vite --host" || true
pkill -f "tsx server/index.ts" || true

nohup npm run dev:all > /tmp/sbb-kiosk.log 2>&1 &

sleep 3
curl -I http://127.0.0.1:5174/kiosk
curl http://127.0.0.1:4110/api/healthz
curl http://127.0.0.1:4110/api/debug/state
```

Open:

```text
http://76.13.189.158:5174/kiosk
http://76.13.189.158:5174/kitchen
http://76.13.189.158:5174/status
http://76.13.189.158:5174/admin
```

## Build check

```bash
npm run build
```

## Current MVP behaviour

The frontend now tries the shared API first:

```text
/kiosk creates order through /api/orders
/kitchen reads shared orders from /api/orders
/status reads shared orders from /api/orders
```

If the API is not running, the app falls back to browser localStorage so the kiosk can still be tested on one device.

The screen badge shows:

```text
Shared live = API is connected
Local test = API is not available and localStorage fallback is being used
```

## Current data layer

The API now uses a persistent order store:

```text
DATABASE_URL present -> Postgres kiosk_orders + kiosk_state tables
DATABASE_URL missing/unavailable -> memory fallback
```

The diagnostics endpoint shows the active data source:

```bash
curl http://localhost:4110/api/debug/state
```

Look for:

```text
dataSource: postgres
```

If it shows `memory`, the app still works, but orders will not survive an API restart.
