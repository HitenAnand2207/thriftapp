# 📊 DATA MIGRATION GUIDE - Transfer Local Data to Supabase

> **CRITICAL:** This guide covers the most important step after deployment - transferring your pre-stored seller marketplace data from local SQLite to Supabase PostgreSQL. **Without this, your deployed app will show NO products.**

---

## 🎯 **What This Guide Does**

Migrates your existing local database to production:
- ✅ 13 pre-stocked products from different sellers
- ✅ 6 seller accounts (example: hiten.01@gamil.com)
- ✅ User profiles and cart data
- ✅ Product reviews and ratings
- ✅ All uploaded product images

**Result:** Your live Vercel app shows a fully populated marketplace with products from multiple sellers.

---

## 📋 **PREREQUISITES**

Before starting migration:

- [ ] Your Vercel app is **deployed** (you have a live URL)
- [ ] Supabase project is **created** (go to [supabase.com](https://supabase.com))
- [ ] You have Supabase **connection string** (Settings → Database → URI)
- [ ] Database is **empty** (fresh Supabase project)
- [ ] You have local `server/export/database-export.sql` file
- [ ] All 13 products are in your local SQLite database

---

## 🚀 **STEP 1: VERIFY LOCAL DATA EXISTS**

### 1.1 Check Export Files

```bash
# Run this command in your project root
npm run deploy:export
```

**Expected Output:**
```
🚀 Starting data export for deployment...
📊 Found 11 tables
📤 Exporting table: products
✅ Exported 13 rows from products
📤 Exporting table: seller_accounts
✅ Exported 6 rows from seller_accounts
📤 Exporting table: users
✅ Exported 1 rows from users
...
🎉 Export Complete!
📊 Database: 11 tables, 21 records
📁 Files: 14 files, 2.00MB
📂 Export directory: server/export
```

✅ **Success:** Your data is exported and ready!

### 1.2 Verify Export Files Generated

```bash
# Check these files exist:
ls server/export/

# Should show:
# - database-export.json    (21 records in JSON format)
# - database-export.sql     (SQL statements for import)
# - files-export.json       (metadata about uploaded images)
# - export-summary.json     (export statistics)
```

---

## 🗄️ **STEP 2: CREATE SUPABASE SCHEMA (Tables)**

> **Important:** Supabase starts with an empty database. You need to create the table structure first.

### 2.1 Export Schema from Local Database

```bash
# Generate SQL schema and data export
npm run deploy:export
```

### 2.2 Open Supabase SQL Editor

1. Go to **[supabase.com](https://supabase.com)** → Sign in to your project
2. Click **SQL Editor** (left sidebar)
3. Click **"New query"** button
4. Leave the name as default or give it a meaningful name

### 2.3 Create Tables

Copy and paste this SQL to create the schema:

```sql
-- Create tables schema for ThriftApp

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  price DECIMAL(10, 2),
  size TEXT,
  condition TEXT,
  description TEXT,
  imageUrl TEXT,
  imagePath TEXT,
  sellerEmail TEXT,
  listedAt TIMESTAMP,
  soldAt TIMESTAMP,
  status TEXT DEFAULT 'available'
);

-- Seller accounts table
CREATE TABLE IF NOT EXISTS seller_accounts (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  storeName TEXT,
  description TEXT,
  rating DECIMAL(2, 1),
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT,
  name TEXT,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);

-- Cart items table
CREATE TABLE IF NOT EXISTS cart_items (
  id TEXT PRIMARY KEY,
  userId TEXT,
  productId TEXT,
  quantity INTEGER,
  addedAt TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (productId) REFERENCES products(id)
);

-- Wishlist items table
CREATE TABLE IF NOT EXISTS wishlist_items (
  id TEXT PRIMARY KEY,
  userId TEXT,
  productId TEXT,
  addedAt TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (productId) REFERENCES products(id)
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  userId TEXT,
  productId TEXT,
  quantity INTEGER,
  totalPrice DECIMAL(10, 2),
  status TEXT,
  createdAt TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (productId) REFERENCES products(id)
);

-- User sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id TEXT PRIMARY KEY,
  userId TEXT,
  token TEXT,
  expiresAt TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id)
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY,
  senderId TEXT,
  receiverId TEXT,
  message TEXT,
  createdAt TIMESTAMP,
  FOREIGN KEY (senderId) REFERENCES users(id),
  FOREIGN KEY (receiverId) REFERENCES users(id)
);

-- App settings table
CREATE TABLE IF NOT EXISTS app_settings (
  id TEXT PRIMARY KEY,
  settingKey TEXT UNIQUE,
  settingValue TEXT,
  updatedAt TIMESTAMP
);

-- Support tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
  id TEXT PRIMARY KEY,
  userId TEXT,
  subject TEXT,
  message TEXT,
  status TEXT,
  createdAt TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id)
);
```

4. Click **▶️ Run** button
5. You should see: **"Success. No rows returned"**

✅ **Schema Created:** Tables are now ready for data import!

---

## 📥 **STEP 3: IMPORT DATA TO SUPABASE**

### 3.1 Prepare SQL Import File

1. Open your project directory: `server/export/`
2. Find file: `database-export.sql`
3. Right-click → **Open with Text Editor**
4. **Select All** (Ctrl+A) and **Copy** the entire content

### 3.2 Import Data via SQL Editor

1. Go back to Supabase **SQL Editor**
2. Click **"New query"** again
3. **Paste** all content from `database-export.sql`
4. Click **▶️ Run**

**Expected Output:**
```
Success. No rows returned
(This means all INSERT statements executed successfully)
```

### 3.3 Verify Data Import

Go to **Table Editor** in Supabase and verify:

```
✅ products table → Should show 13 rows
✅ seller_accounts table → Should show 6 rows
✅ users table → Should show 1 row
✅ cart_items table → May be empty or show 1 item
✅ Other tables → May be empty
```

---

## 🖼️ **STEP 4: HANDLE PRODUCT IMAGES**

Your product images are stored locally. You have two options:

### **OPTION A: Use Local Images (Faster, For Testing)**
The app will serve images from the local `server/uploads/` folder.
- ✅ Works immediately
- ❌ Only works if backend is running (not for serverless Vercel)

### **OPTION B: Use Cloudinary (Recommended, For Production)**

#### 4.1 Set Up Cloudinary

1. Go to [cloudinary.com](https://cloudinary.com)
2. Sign up (free account)
3. Go to **Dashboard**
4. Copy:
   - **Cloud Name**
   - **API Key**
   - **API Secret**

#### 4.2 Upload Images to Cloudinary

**Manual Upload:**
1. Go to **Media Library**
2. Click **Upload** button
3. Select all files from `server/uploads/` folder
4. Upload all 14 images
5. Note the URLs generated (format: `https://res.cloudinary.com/your_cloud_name/...`)

**Or use Cloudinary CLI:**
```bash
npm install -g cloudinary-cli
cloudinary config
# Follow prompts to add your credentials
cloudinary upload_dir server/uploads/
```

#### 4.3 Update Image URLs in Database

Go back to Supabase **SQL Editor** and run:

```sql
-- Update imageUrl for each product with Cloudinary URL
UPDATE products SET 
  imageUrl = 'https://res.cloudinary.com/your_cloud_name/image/upload/v1/tshirt.jpg'
WHERE name = 'Tshirt';

UPDATE products SET 
  imageUrl = 'https://res.cloudinary.com/your_cloud_name/image/upload/v1/bag.jpg'
WHERE name = 'Bag';

-- Continue for remaining products...
-- Or you can use a script if you have many products
```

---

## ✅ **STEP 5: VERIFY MIGRATION SUCCESS**

### 5.1 Check Vercel Deployment

1. Go to your Vercel app URL: `https://your-app.vercel.app`
2. **Homepage should show products** ← **CRITICAL CHECK**

**If you see products:**
- ✅ Migration successful!
- ✅ Products visible from multiple sellers
- ✅ Seller names and prices display correctly
- ✅ App is fully functional

**If you see NO products:**
- ❌ Data import failed
- Go back to Step 3 and verify import
- Check Supabase **Table Editor** to confirm data exists
- Restart backend if needed

### 5.2 Test Key Features

```
✅ Browse products on home page
✅ Click product to view details
✅ See seller information
✅ View reviews and ratings
✅ Add product to cart
✅ User registration/login
✅ Create new seller account
✅ List new product as seller
✅ Upload product image
```

### 5.3 Run Diagnostic Queries

In Supabase **SQL Editor**, run these to verify:

```sql
-- Check product count
SELECT COUNT(*) as total_products FROM products;
-- Should return: 13

-- Check seller count
SELECT COUNT(*) as total_sellers FROM seller_accounts;
-- Should return: 6

-- List all products with seller info
SELECT p.name, p.price, p.status, s.storeName 
FROM products p 
LEFT JOIN seller_accounts s ON p.sellerEmail = s.email;
-- Should show all 13 products with seller names

-- Check image URLs
SELECT name, imageUrl FROM products LIMIT 5;
-- Should show valid image URLs
```

---

## 🚨 **TROUBLESHOOTING MIGRATION FAILURES**

### Problem: "No products visible on deployed app"

**Causes & Solutions:**

1. **Data import didn't run**
   - Go back to Step 3
   - Re-copy and re-paste SQL from `database-export.sql`
   - Click Run again
   - Verify in Table Editor

2. **Supabase not connected to Vercel**
   - Check your Vercel environment variables
   - Verify `DATABASE_URL` is set correctly
   - Copy exact connection string from Supabase
   - Redeploy on Vercel

3. **SQL import syntax error**
   - Check individual INSERT statements
   - Verify special characters are escaped
   - Try importing in smaller batches
   - Check Supabase logs for error messages

4. **Wrong Supabase project**
   - Verify you're importing to the correct project
   - Check project URL matches in Vercel env vars

### Problem: "Products show but no images"

**Solutions:**

1. Image URLs point to local `server/uploads/`
   - Update all image URLs to Cloudinary (Step 4)
   - Re-run UPDATE queries in SQL Editor

2. Images not uploaded to Cloudinary yet
   - Upload images manually or via CLI (Step 4.2)
   - Update image URLs in database (Step 4.3)

3. Image URLs are broken
   - Check URL format: `https://res.cloudinary.com/cloud_name/...`
   - Verify images exist in Cloudinary Media Library
   - Test URL in browser - should load image

### Problem: "Database connection error"

**Solutions:**

1. Verify connection string format
   ```
   postgresql://postgres:[PASSWORD]@aws-0-us-west-1.pooler.supabase.co:5432/postgres
   ```

2. Check password in URL is correct
   - Go to Supabase → Settings → Database
   - Verify [PASSWORD] matches exactly

3. Test connection locally
   ```bash
   psql "your-connection-string"
   # If it connects, the string is correct
   ```

---

## 📝 **MIGRATION CHECKLIST**

- [ ] Ran `npm run deploy:export` successfully
- [ ] Verified `database-export.sql` exists and has content
- [ ] Created Supabase project
- [ ] Created database schema (STEP 2)
- [ ] Imported data to Supabase (STEP 3)
- [ ] Verified 13 products in Supabase
- [ ] Verified 6 sellers in Supabase
- [ ] Configured Cloudinary (if using)
- [ ] Updated image URLs to Cloudinary (if using)
- [ ] Deployed Vercel app
- [ ] Added DATABASE_URL to Vercel env vars
- [ ] Products visible on live Vercel app ✅
- [ ] Cart/wishlist features working
- [ ] Seller features working
- [ ] Images loading correctly

---

## 🎯 **NEXT STEPS AFTER MIGRATION**

Once migration is complete:

1. **Monitor your app** for 24-48 hours
2. **Test all user flows** (signup, login, purchase) 
3. **Check Vercel logs** for any runtime errors
4. **Set up backups** for Supabase database
5. **Enable HTTPS** if not already enabled
6. **Configure custom domain** (optional)
7. **Monitor database usage** to stay within free tier

---

## 📞 **SUPPORT**

If migration fails:

1. **Check Supabase logs** → Dashboard → Logs
2. **Check Vercel logs** → Deployments → Function logs
3. **Verify connection string** → Copy fresh from Supabase
4. **Re-run export** → `npm run deploy:export`
5. **Delete and recreate** Supabase project if needed

---

**Your marketplace is now live with pre-stored seller data! 🎉**

🚀 Share your Vercel URL and start testing with real users!
