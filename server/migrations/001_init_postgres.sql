-- ThriftApp PostgreSQL schema for production (Neon/Supabase/Render Postgres)
-- Run this once in your cloud PostgreSQL SQL editor before importing data.

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  firstName TEXT,
  lastName TEXT,
  phone TEXT,
  address TEXT,
  isSeller BOOLEAN DEFAULT FALSE,
  profileImage TEXT,
  preferences TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT,
  isAdmin BOOLEAN DEFAULT FALSE,
  name TEXT
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price DOUBLE PRECISION NOT NULL,
  size TEXT,
  condition TEXT DEFAULT 'Good',
  description TEXT,
  imageUrl TEXT NOT NULL,
  imagePath TEXT NOT NULL,
  sellerEmail TEXT,
  sellerId TEXT,
  listedAt TEXT NOT NULL,
  soldAt TEXT,
  status TEXT NOT NULL DEFAULT 'available',
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS cart_items (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  productId TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  addedAt TEXT NOT NULL,
  UNIQUE(userId, productId)
);

CREATE TABLE IF NOT EXISTS wishlist_items (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  productId TEXT NOT NULL,
  addedAt TEXT NOT NULL,
  UNIQUE(userId, productId)
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  totalAmount DOUBLE PRECISION NOT NULL,
  status TEXT DEFAULT 'pending',
  paymentId TEXT,
  paymentMethod TEXT,
  shippingAddress TEXT,
  orderItems TEXT,
  placedAt TEXT NOT NULL,
  updatedAt TEXT
);

CREATE TABLE IF NOT EXISTS user_sessions (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  sessionToken TEXT UNIQUE NOT NULL,
  expiresAt TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  lastAccessed TEXT,
  deviceInfo TEXT
);

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS seller_accounts (
  id TEXT PRIMARY KEY,
  normalizedStoreName TEXT UNIQUE NOT NULL,
  storeName TEXT NOT NULL,
  sellerEmail TEXT NOT NULL,
  phone TEXT NOT NULL,
  passwordHash TEXT NOT NULL,
  passwordSalt TEXT NOT NULL,
  profileJson TEXT,
  createdAt TEXT NOT NULL
);
