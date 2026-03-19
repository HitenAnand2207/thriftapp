# ThriftApp

Thrift marketplace application with:
- React frontend
- Express backend
- PostgreSQL (Neon) in production
- Cloudinary for shared product image storage

## Quick Start (Local)

1. Install dependencies:
```bash
npm install
```

2. Start backend:
```bash
npm run server
```

3. Start frontend:
```bash
npm start
```

Frontend: `http://localhost:3000`  
Backend: `http://localhost:8050` (or `PORT` from `server/.env`)

## Environment Variables

Backend (`server/.env`):
- `PORT`
- `NODE_ENV` (`development` or `production`)
- `CORS_ORIGIN`
- `DATABASE_URL` (required in production)
- `SUPABASE_DATABASE_URL` (optional alias)
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CLOUDINARY_FOLDER` (optional, default: `thriftapp`)

Frontend (`.env.local`):
- `REACT_APP_API_BASE_URL` (set to backend URL in deployed frontend)
- `REACT_APP_RAZORPAY_KEY` (optional)
- `REACT_APP_RAZORPAY_KEY_ID` (legacy alias)

Do not commit real secrets. Use templates:
- `.env.template`
- `.env.production.template`
- `server/.env.production.template`

## Scripts

- `npm run dev` -> run backend + frontend in parallel
- `npm run start:production` -> run backend in production mode
- `npm run deploy:export` -> export local SQLite data
- `npm run deploy:supabase` -> import exported data to Postgres URL
- `npm run deploy:migrate-images` -> migrate product image paths to Cloudinary

## API

- `GET /api/health`
- `GET /api/products`
- `POST /api/products` (`multipart/form-data`, field: `image`)
- `PATCH /api/products/:id`
- `DELETE /api/products/:id`

## Deployment

Use the full deployment runbook:
- `DEPLOYMENT_GUIDE_NEON_CLOUDINARY.md`
