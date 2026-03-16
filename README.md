# ThriftApp

Thrift marketplace app with:
- React frontend
- Express backend
- SQLite persistent storage for products
- Disk-based image uploads served as public URLs

## Persistent Image Storage

Images are uploaded to `server/uploads/` and product metadata is stored in `server/data/thriftapp.db`.
Because products are fetched from the backend API, all users now see the same products and pictures.

## Run Locally

1. Install dependencies:
```bash
npm install
```

2. Start backend API:
```bash
npm run server
```

3. In another terminal, start frontend:
```bash
npm start
```

Frontend: `http://localhost:3000`  
Backend: `http://localhost:<PORT from server/.env (or 8000 default)>`

## Environment Variables

`server/.env` supports:
- `PORT` (default: `8000`)
- `NODE_ENV` (`development` or `production`)
- `CORS_ORIGIN` (default: `http://localhost:3000`)

Optional frontend API override:
- `REACT_APP_API_BASE_URL` (optional; if not set, frontend uses relative `/api` with local proxy)
- `REACT_APP_RAZORPAY_KEY` (optional; used by Razorpay checkout)
- `REACT_APP_RAZORPAY_KEY_ID` (legacy alias, still supported)

## Docker MongoDB (Optional)

`docker-compose.mongodb.yml` starts MongoDB + Mongo Express for experiments:

```bash
docker compose -f docker-compose.mongodb.yml up -d
```

Current backend (`server/server.js`) is SQLite-based and does not use MongoDB yet.

## API Endpoints

- `GET /api/health`
- `GET /api/products`
- `POST /api/products` (multipart form-data, image field name: `image`)
- `PATCH /api/products/:id` (JSON: `{ "status": "sold" }`)
- `DELETE /api/products/:id`
