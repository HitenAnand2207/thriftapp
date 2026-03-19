# ThriftApp Deployment Guide (Neon + Cloudinary + Vercel + Render)

This is the recommended production setup for this codebase so data is shared across all systems.

## Target Architecture

- Frontend: Vercel (React static build)
- Backend API: Render Web Service (Node/Express, always-on process)
- Database: Neon Postgres (pooled connection string)
- Image storage: Cloudinary (shared CDN URLs)

## Why this setup

- `server/server.js` runs as a long-lived Express server and listens on `PORT`.
- Production DB uses `DATABASE_URL`/`SUPABASE_DATABASE_URL`.
- Production table creation is skipped, so schema must exist before first production run.
- Image uploads must be cloud-backed (Cloudinary) to be visible across systems.

## 1) One-time local preparation

1. Verify local production backend works:
```bash
npm run preserver
npm run start:production
```

2. Export latest local data:
```bash
npm run deploy:export
```

This updates:
- `server/export/database-export.json`
- `server/export/database-export.sql`

## 2) Create Neon schema

1. Open Neon SQL Editor.
2. Run:
- `server/migrations/001_init_postgres.sql`

This creates all tables expected by `server/server.js`.

## 3) Import existing data into Neon

1. Open `server/export/database-export.sql`.
2. Copy the SQL and run it in Neon SQL Editor.

## 4) Migrate existing image paths to Cloudinary

Existing rows in `products` may contain old localhost image URLs and local disk paths.
Run this once from your local machine (where `server/uploads` exists):

```bash
npm run deploy:migrate-images
```

Required env vars in `server/.env` before running:
- `DATABASE_URL` (Neon pooled URL)
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- optional: `CLOUDINARY_FOLDER`

## 5) Deploy backend on Render

Create a new **Web Service** from this repo.

Recommended settings:
- Build Command: `npm install`
- Start Command: `node server/server.js`
- Health Check Path: `/api/health`

Set these environment variables in Render:

```env
NODE_ENV=production
PORT=10000
CORS_ORIGIN=https://<your-frontend-domain>
DATABASE_URL=postgresql://...-pooler...neon.tech/...?...sslmode=require
SUPABASE_DATABASE_URL=postgresql://...-pooler...neon.tech/...?...sslmode=require
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CLOUDINARY_FOLDER=thriftapp
```

Notes:
- `DATABASE_URL` must be Neon pooled host (`-pooler` in hostname).
- If you have multiple frontend domains, comma-separate in `CORS_ORIGIN`.

## 6) Deploy frontend on Vercel

Deploy same repo to Vercel as static frontend.

Set frontend environment variable:

```env
REACT_APP_API_BASE_URL=https://<your-render-backend-domain>
```

Redeploy after setting env vars.

## 7) Post-deploy verification checklist

Run these checks:

1. Backend health:
- `GET https://<backend>/api/health` returns `{"ok":true}`

2. Product listing:
- `GET https://<backend>/api/products` returns rows with image URLs from `res.cloudinary.com`

3. Frontend connectivity:
- Open app on two devices.
- Add a product on device A.
- Confirm it appears on device B (auto-refresh runs every 30s, and also refreshes on tab focus).

4. Delete flow:
- Delete a product and confirm product disappears from list.

## 8) Real-time behavior in current app

- Product list auto-refresh is enabled every 30 seconds and on tab focus.
- Cart/wishlist sync also runs periodically for logged-in users.
- For instant push updates (sub-second), add WebSocket/SSE in a later iteration.

## 9) Security and ops

1. Rotate any leaked DB/API secrets immediately.
2. Keep `.env` files out of git.
3. Back up Neon periodically.
4. Monitor Render logs and Neon query/runtime metrics.

