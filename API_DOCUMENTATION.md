# ThriftApp API Documentation

## Base URL

`http://localhost:<PORT from server/.env (default 8000)>`

## Endpoints

### Health

- `GET /api/health`
- Response:
```json
{ "ok": true }
```

### Get Products

- `GET /api/products`
- Response: array of products.

Example item:
```json
{
  "id": "PROD17340256001234",
  "name": "Vintage Denim Jacket",
  "category": "Jackets",
  "price": 799,
  "size": "M",
  "condition": "Good",
  "description": "Classic wash denim jacket",
  "imageUrl": "http://localhost:8000/uploads/1734025600123-123456789.jpg",
  "sellerEmail": "seller@example.com",
  "listedAt": "2025-12-12T16:00:00.000Z",
  "soldAt": null,
  "status": "available"
}
```

### Create Product

- `POST /api/products`
- Content type: `multipart/form-data`
- Required form fields:
  - `name` (string)
  - `category` (string)
  - `price` (number)
  - `image` (file, image only)
- Optional fields:
  - `size`
  - `condition`
  - `description`
  - `sellerEmail`
- Response: created product object.

### Update Product Status

- `PATCH /api/products/:id`
- Content type: `application/json`
- Body:
```json
{ "status": "sold" }
```
- Response: updated product object.

### Delete Product

- `DELETE /api/products/:id`
- Response: `204 No Content`

## Static Images

Uploaded files are served from:

- `GET /uploads/:filename`

So any client can load images directly through the `imageUrl` returned by product APIs.
