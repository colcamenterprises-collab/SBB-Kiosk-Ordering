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

nohup npm run dev:all > /tmp/sbb-kiosk.log 2>&1 &

sleep 3
curl -I http://127.0.0.1:5174/kiosk
curl http://127.0.0.1:4110/api/healthz
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

The API currently stores orders in server memory while the UI is tested across devices.

Next database patch:

```text
Move Express order storage from memory to Postgres/Drizzle tables.
```
