# Production Service Runbook

This runbook installs SBB Kiosk Ordering as a systemd service on the Hostinger VPS.

## Assumptions

```text
Repo path: /root/SBB-Kiosk-Ordering
Frontend port: 5174
API port: 4110
Service name: sbb-kiosk-ordering
```

## One-time install

```bash
cd /root/SBB-Kiosk-Ordering

git pull --ff-only origin main
npm install
npm run build

cp deploy/sbb-kiosk-ordering.service /etc/systemd/system/sbb-kiosk-ordering.service

systemctl daemon-reload
systemctl enable sbb-kiosk-ordering
systemctl restart sbb-kiosk-ordering

systemctl status sbb-kiosk-ordering --no-pager
```

## Health checks

```bash
curl -I http://127.0.0.1:5174/kiosk
curl http://127.0.0.1:4110/api/healthz
curl http://127.0.0.1:4110/api/debug/state
```

Expected:

```text
HTTP/1.1 200 OK
status: ok
```

## Logs

```bash
journalctl -u sbb-kiosk-ordering -n 120 --no-pager
```

Live logs:

```bash
journalctl -u sbb-kiosk-ordering -f
```

## Restart after every GitHub patch

```bash
cd /root/SBB-Kiosk-Ordering

git pull --ff-only origin main
npm install
npm run build
systemctl restart sbb-kiosk-ordering

curl -I http://127.0.0.1:5174/kiosk
curl http://127.0.0.1:4110/api/healthz
```

## Data source

Open diagnostics:

```bash
curl http://127.0.0.1:4110/api/debug/state
```

If it shows:

```text
"dataSource":"postgres"
```

orders are stored in Postgres and survive API restart.

If it shows:

```text
"dataSource":"memory"
```

the app still works, but orders disappear when the service restarts.

## DATABASE_URL

Create this file when Postgres is ready:

```bash
nano /root/SBB-Kiosk-Ordering/.env
```

Add:

```text
DATABASE_URL=postgres://USER:PASSWORD@HOST:PORT/DATABASE
```

Then restart:

```bash
systemctl restart sbb-kiosk-ordering
curl http://127.0.0.1:4110/api/debug/state
```
