# Cloudflare Deployment Guide (Pages + Workers Runtime + D1 + R2)

This repository now includes a Cloudflare-native deployment track using:
- Cloudflare Pages for frontend hosting.
- Pages Functions (Workers runtime) for server-side API routes.
- D1 for SQL metadata.
- R2 for object storage.

## Added in this repo

- `wrangler.jsonc` for Cloudflare project config.
- `functions/api/health.js` for runtime health checks.
- `functions/api/storage/status.js` for D1 and R2 binding validation.
- `functions/api/uploads/[[key]].js` for R2 object upload/read/delete.
- `functions/api/[[catchall]].js` as a fallback API proxy for non-migrated endpoints.
- `cloudflare/d1/migrations/0001_create_uploads_table.sql` for D1 schema.
- `.dev.vars.example` for local Cloudflare runtime variables.

## 1. Prerequisites

1. Install dependencies:

```bash
npm install
```

2. Login to Cloudflare:

```bash
npx wrangler login
```

## 2. Provision Cloudflare resources

1. Create Pages project (run once):

```bash
npm run cf:pages:create
```

2. Create D1 database:

```bash
npm run cf:d1:create
```

Copy the returned `database_id` and set it in `wrangler.jsonc` under `d1_databases[0].database_id`.

3. Create R2 bucket:

```bash
npm run cf:r2:create
```

If you choose a different bucket name, update `wrangler.jsonc` under `r2_buckets[0].bucket_name`.

## 3. Apply D1 migrations

For local testing:

```bash
npm run cf:d1:migrate:local
```

For remote/production D1:

```bash
npm run cf:d1:migrate:remote
```

## 4. Local development with Pages Functions

1. Copy runtime env file:

```bash
cp .dev.vars.example .dev.vars
```

2. (Optional) keep using existing Express API for routes not yet migrated:
- Set `API_PROXY_ORIGIN` in `.dev.vars` (default is `http://localhost:5000/api`).
- Start backend separately when proxying:

```bash
npm run backend
```

3. Start Cloudflare local runtime:

```bash
npm run cf:dev
```

## 5. Deploy to Cloudflare

1. Export your legacy backend origin (the deploy script auto-normalizes to `/api` if needed):

```bash
export API_PROXY_ORIGIN="https://api.yourdomain.com/api"
```

2. (Optional) override the Pages project name if not `alumni-portal`:

```bash
export CF_PAGES_PROJECT_NAME="your-pages-project"
```

3. Deploy:

```bash
npm run cf:deploy
```

This now runs three steps in order:
- Build frontend (`dist`).
- Update Pages secret `API_PROXY_ORIGIN` via `wrangler pages secret put`.
- Deploy with `wrangler pages deploy --branch main` using `wrangler.jsonc` project settings.

If `API_PROXY_ORIGIN` is missing, deploy exits early to prevent shipping a production build where non-migrated `/api/*` routes fail with `501`.

## 6. Available Cloudflare API routes

- `GET /api/health`
- `GET /api/storage/status`
- `POST /api/uploads` (multipart form field name: `file`)
- `GET /api/uploads/<object-key>`
- `DELETE /api/uploads/<object-key>`

For endpoints not yet moved to Cloudflare Functions, `functions/api/[[catchall]].js` will:
- Proxy to `API_PROXY_ORIGIN` when provided.
- Return `501` when no proxy origin is configured.
- Return `500` for invalid proxy configuration (for example self-referential `/api` loop).

## 7. Notes

- `wrangler.jsonc` is treated as the source of truth for bindings and Pages configuration.
- Use `npx wrangler pages download config <PROJECT_NAME>` if you want to import existing dashboard config before further edits.
- If deploy fails with `Can't set compatibility date in the future`, update `compatibility_date` in `wrangler.jsonc` to a currently supported date and avoid hardcoding a newer date in CLI flags.
- Current D1 schema in this track is scoped to upload metadata; existing Prisma/PostgreSQL backend can run in parallel until full endpoint migration is complete.
