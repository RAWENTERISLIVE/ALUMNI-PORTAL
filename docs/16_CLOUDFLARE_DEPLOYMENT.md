# Cloudflare Worker Deployment Guide (Frontend + Backend Proxy)

This repository now uses a Worker-first deployment model:
- Frontend SPA is served from Worker static assets (`dist`).
- `/api/*` routes are proxied by the Worker to your existing backend.
- D1 and R2 bindings in `wrangler.jsonc` remain available for phased migration.

This setup avoids the Pages/Functions dependency and keeps login working as long as `API_PROXY_ORIGIN` points to your backend.

## Architecture

Request flow on your Worker domain:
- `/` and SPA routes -> static assets (`dist`)
- `/api/health` -> Worker runtime health endpoint
- `/api/*` -> proxied to `API_PROXY_ORIGIN`

## 1. Prerequisites

1. Install dependencies:

```bash
npm install
```

2. Login to Cloudflare:

```bash
npx wrangler login
```

3. Ensure backend is publicly reachable over HTTPS (for example `https://api.yourdomain.com/api`).

## 2. Backend readiness (required before Worker deploy)

1. Deploy backend (Docker/VPS) using your existing backend flow.
2. Confirm backend API is reachable:

```bash
curl -i https://api.yourdomain.com/api/status/health
```

3. Set backend environment correctly:
- `FRONTEND_URL` must match your Worker frontend domain.
- CORS must allow that frontend origin.

## 3. Optional Cloudflare resources (D1/R2)

Use only if your Worker code needs them now:

```bash
npm run cf:d1:create
npm run cf:r2:create
npm run cf:d1:migrate:remote
```

If IDs or names differ, update `wrangler.jsonc` bindings.

## 4. Local Worker development

1. Copy local runtime vars:

```bash
cp .dev.vars.example .dev.vars
```

2. Start backend locally in one terminal:

```bash
npm run backend
```

3. Start Worker runtime in another terminal:

```bash
npm run cf:dev
```

By default `.dev.vars.example` uses:

```env
API_PROXY_ORIGIN=http://localhost:5000/api
```

## 5. Deploy Worker to production

1. Export backend proxy target:

```bash
export API_PROXY_ORIGIN="https://api.yourdomain.com/api"
```

2. Optional if Worker name differs from `mpsajmer-connect`:

```bash
export CF_WORKER_NAME="your-worker-name"
```

3. Deploy:

```bash
npm run cf:deploy
```

`cf:deploy` performs:
- Frontend build (`dist`)
- `wrangler secret put API_PROXY_ORIGIN`
- `wrangler deploy`

If `API_PROXY_ORIGIN` is missing or invalid, deploy fails early.

## 6. Post-deploy verification

1. Health check:

```bash
curl -i https://your-frontend-domain/api/health
```

2. Login API path test:

```bash
curl -i -X POST https://your-frontend-domain/api/auth/login \
	-H 'content-type: application/json' \
	-d '{"email":"test@example.com","password":"test"}'
```

Expected behavior:
- No Worker `501` fallback for non-migrated routes.
- Backend response code is returned through the Worker.

## 7. Troubleshooting

- `501 This endpoint has not been migrated...` means `API_PROXY_ORIGIN` secret is missing on Worker.
- `500 API_PROXY_ORIGIN is invalid` means the URL is malformed; use a full URL like `https://api.example.com/api`.
- `530 Origin DNS error` with a `*.trycloudflare.com` hostname means `API_PROXY_ORIGIN` points to an expired temporary tunnel. Update it to a stable backend origin and redeploy.
- Login still fails with network/CORS errors when backend `FRONTEND_URL` or CORS allow-list does not include your Worker frontend domain.
- Proxy loop protection error means `API_PROXY_ORIGIN` points back to the same frontend Worker domain `/api`.

## 8. Notes

- `wrangler.jsonc` is the source of truth for Worker bindings/config.
- If compatibility-date errors appear, set `compatibility_date` to a supported date.
- The backend remains your source of truth for auth and business APIs until full Worker migration is complete.
