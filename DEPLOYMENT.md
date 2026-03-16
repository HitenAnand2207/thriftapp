# Free Deployment Guide (Updated: March 16, 2026)

This is the safest free deployment path for the current ThriftApp codebase.

## Why this guide is different

The backend currently stores:
- app data in local SQLite: `server/data/thriftapp.db`
- uploaded images in local disk: `server/uploads/`

Most free serverless/free web services use ephemeral filesystems, so local data can be lost on restart/redeploy.

## Recommended Free Stack (Persistent)

- Frontend: Netlify Free (static React hosting)
- Backend: Oracle Cloud Always Free VM (preferred) or Google Cloud e2-micro Always Free
- Data/Image storage: keep current SQLite + uploads on VM disk

This path requires no backend rewrite and keeps your current features working.

## Step 1: Deploy frontend on Netlify (Free)

1. Push your repo to GitHub.
2. In Netlify: Add new site -> Import from Git.
3. Use these build settings:
   - Build command: `npm run build`
   - Publish directory: `build`
4. Add env var in Netlify:
   - `REACT_APP_API_BASE_URL=https://<your-backend-domain-or-ip>`
5. Deploy and note your site URL (for example `https://thriftapp.netlify.app`).

## Step 2: Create a free VM for backend

Pick one:
- Oracle Cloud Always Free VM (best free capacity)
- Google Cloud Always Free e2-micro (US-region Always Free limits apply)

Use Ubuntu 22.04/24.04 and open ports `22`, `80`, `443`.

## Step 3: Install backend runtime on VM

```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git nginx
sudo npm install -g pm2
```

## Step 4: Deploy backend app on VM

```bash
git clone https://github.com/<your-username>/thriftapp.git
cd thriftapp
npm ci
```

Create `server/.env`:

```env
NODE_ENV=production
PORT=8000
CORS_ORIGIN=https://<your-netlify-site>.netlify.app
```

Start backend with PM2:

```bash
pm2 start server/server.js --name thrift-api
pm2 save
pm2 startup
```

## Step 4.5: Import Pre-Stored Seller Data ⚠️ **REQUIRED**

Your app comes with pre-stored data including products, sellers, and reviews from different sellers. **You MUST import this data or your app will appear empty with no products.**

On your VM, run:

```bash
# Navigate to app directory
cd thriftapp

# Import the pre-stored data to your local SQLite database
npm run deploy:import
```

**Expected output:**
```
📥 Starting data import to cloud database...
📊 Import file from: 2026-03-15T18:08:00.743Z
✅ Pre-stored seller products imported successfully!
📦 Imported: 5 products from sellers
✅ Imported: 3 seller accounts
✅ Imported: 2 reviews and ratings
✅ Imported: 4 transactions records
🎉 Total 14 records imported to SQLite database!
```

**What was imported:**
- Products from multiple sellers (T-shirts, bags, shoes, etc.)
- Seller accounts (hiten.01@gamil.com, and others)
- Product reviews and ratings
- Transaction history
- Product images

**Verify the import:**
```bash
# Check if data file was updated
ls -lh server/data/thriftapp.db

# Restart the backend service
pm2 restart thrift-api
```

Your users will now see the pre-stocked products when they load the app!

## Step 5: Add Nginx reverse proxy

Create `/etc/nginx/sites-available/thrift-api`:

```nginx
server {
    listen 80;
    server_name <your-backend-domain-or-ip>;

    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable and reload:

```bash
sudo ln -s /etc/nginx/sites-available/thrift-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Step 6: (Recommended) enable HTTPS

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d <your-backend-domain>
```

After HTTPS is ready:
1. Update Netlify env `REACT_APP_API_BASE_URL` to `https://<your-backend-domain>`
2. Update VM `server/.env` `CORS_ORIGIN` with your exact Netlify URL
3. Restart backend: `pm2 restart thrift-api`
4. Trigger a Netlify redeploy

## Step 7: Verify

Run these checks:

```bash
curl https://<your-backend-domain>/api/health
```

Expected response:

```json
{"ok":true}
```

**Critical checks in browser:**
1. Open your Netlify site (https://thriftapp.netlify.app)
2. **Check if products are visible** - you should see pre-stored products from sellers on the home page
   - If NO products shown → Data import failed, go back and run `npm run deploy:import` again
   - If products shown → Data import succeeded ✅
3. Verify you can:
   - View product details and seller information
   - See reviews and ratings on products
   - Register/login as new user
   - Browse products from different sellers
   - Add products to cart
   - Create new seller account and list new products
   - Upload product images

## Troubleshooting

### No Products Visible After Deployment

This means the data import (Step 4.5) didn't run or failed.

```bash
# SSH into your VM and re-run the import
ssh ubuntu@<your-vm-ip>
cd thriftapp

# Check if export file exists
ls -la server/export/database-export.json

# Re-run the import
npm run deploy:import

# Restart the backend
pm2 restart thrift-api
```

Then reload your Netlify site in the browser.

### Backend Service Won't Start

```bash
# Check PM2 logs
pm2 logs thrift-api

# Verify Node.js is running
node --version

# Restart the service
pm2 restart thrift-api
pm2 status
```

## Demo-only all-PaaS option (faster, but not persistent)

You can do Netlify (frontend) + Render Free Web Service (backend) for a quick demo.

Important limitations on Render Free:
- service spins down after idle
- local filesystem is ephemeral
- local SQLite/uploads can be lost on restart/redeploy/spin-down

Use this only for temporary demos.

## Basic backups (recommended)

Because you are using SQLite and local uploads, back up regularly:

```bash
tar -czf thriftapp-backup-$(date +%F).tar.gz server/data/thriftapp.db server/uploads
```

Store backup archives in cloud storage or another machine.

## Free-tier references (official)

- Netlify pricing: https://www.netlify.com/pricing
- Render free limits: https://render.com/docs/free
- Oracle Cloud Free Tier: https://docs.oracle.com/iaas/Content/FreeTier/freetier.htm
- Oracle Always Free resources: https://docs.oracle.com/iaas/Content/FreeTier/resourceref.htm
- Google Cloud free features: https://docs.cloud.google.com/free/docs/free-cloud-features
- Google Compute free tier details: https://cloud.google.com/free/docs/compute-getting-started

