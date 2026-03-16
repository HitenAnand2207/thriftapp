const express = require("express");
const cors = require("cors");
const multer = require("multer");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { Pool } = require("pg"); // PostgreSQL for production

require("dotenv").config({ path: path.join(__dirname, ".env") });

const app = express();
const PORT = Number(process.env.PORT) || 8000;
const NODE_ENV = process.env.NODE_ENV || "development";
const IS_PRODUCTION = NODE_ENV === "production";

const DATA_DIR = path.join(__dirname, "data");
const UPLOADS_DIR = path.join(__dirname, "uploads");
const DB_PATH = path.join(DATA_DIR, "thriftapp.db");

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Enhanced database connection with better error handling and connection management
let db;
let dbType = IS_PRODUCTION ? "postgresql" : "sqlite";

const initializeDatabase = () => {
  return new Promise((resolve, reject) => {
    if (IS_PRODUCTION) {
      // Production: Use PostgreSQL/Supabase
      const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;
      
      if (!connectionString) {
        console.error("❌ DATABASE_URL or SUPABASE_DATABASE_URL environment variable is required for production");
        reject(new Error("Database connection string not provided"));
        return;
      }

      db = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false }
      });

      db.on('error', (err) => {
        console.error('❌ PostgreSQL pool error:', err);
      });

      // Test connection
      db.query('SELECT NOW()', (err, result) => {
        if (err) {
          console.error("❌ PostgreSQL connection error:", err.message);
          reject(err);
          return;
        }
        console.log("✅ Connected to PostgreSQL database at", connectionString.split("@")[1]);
        resolve();
      });
    } else {
      // Development: Use SQLite
      db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
        if (err) {
          console.error("❌ Database connection error:", err.message);
          reject(err);
          return;
        }
        console.log("✅ Connected to SQLite database at", DB_PATH);
        
        // Enable foreign keys and WAL mode for better performance and data integrity
        // Note: These are SQLite-specific pragmas; PostgreSQL doesn't need them
        db.run("PRAGMA foreign_keys = ON");
        db.run("PRAGMA journal_mode = WAL");
        db.run("PRAGMA synchronous = NORMAL");
        db.run("PRAGMA cache_size = 1000");
        db.run("PRAGMA temp_store = memory");
        
        resolve();
      });
    }
  });
};

const createTables = () => {
  return new Promise((resolve, reject) => {
    // Skip table creation in production - tables already exist in Supabase
    if (IS_PRODUCTION) {
      console.log("✅ Using existing Supabase tables (skipped table creation in production)");
      resolve();
      return;
    }

    // Development: Create tables using SQLite
    db.serialize(() => {
      // Users table - comprehensive user management
      db.run(`
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
          preferences TEXT, -- JSON string for user preferences
          createdAt TEXT NOT NULL,
          updatedAt TEXT
        )
      `, (err) => {
        if (err) {
          console.error("❌ Error creating users table:", err.message);
          reject(err);
          return;
        }
      });

      // Products table - enhanced with more fields
      db.run(`
        CREATE TABLE IF NOT EXISTS products (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          category TEXT NOT NULL,
          price REAL NOT NULL,
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
          likes INTEGER DEFAULT 0,
          FOREIGN KEY (sellerId) REFERENCES users(id)
        )
      `, (err) => {
        if (err) {
          console.error("❌ Error creating products table:", err.message);
          reject(err);
          return;
        }
      });

      // Cart items table - persistent cart storage
      db.run(`
        CREATE TABLE IF NOT EXISTS cart_items (
          id TEXT PRIMARY KEY,
          userId TEXT NOT NULL,
          productId TEXT NOT NULL,
          quantity INTEGER DEFAULT 1,
          addedAt TEXT NOT NULL,
          FOREIGN KEY (userId) REFERENCES users(id),
          FOREIGN KEY (productId) REFERENCES products(id),
          UNIQUE(userId, productId)
        )
      `, (err) => {
        if (err) {
          console.error("❌ Error creating cart_items table:", err.message);
          reject(err);
          return;
        }
      });

      // Wishlist items table - persistent wishlist storage
      db.run(`
        CREATE TABLE IF NOT EXISTS wishlist_items (
          id TEXT PRIMARY KEY,
          userId TEXT NOT NULL,
          productId TEXT NOT NULL,
          addedAt TEXT NOT NULL,
          FOREIGN KEY (userId) REFERENCES users(id),
          FOREIGN KEY (productId) REFERENCES products(id),
          UNIQUE(userId, productId)
        )
      `, (err) => {
        if (err) {
          console.error("❌ Error creating wishlist_items table:", err.message);
          reject(err);
          return;
        }
      });

      // Orders table - complete order management
      db.run(`
        CREATE TABLE IF NOT EXISTS orders (
          id TEXT PRIMARY KEY,
          userId TEXT NOT NULL,
          totalAmount REAL NOT NULL,
          status TEXT DEFAULT 'pending',
          paymentId TEXT,
          paymentMethod TEXT,
          shippingAddress TEXT,
          orderItems TEXT, -- JSON array of ordered products
          placedAt TEXT NOT NULL,
          updatedAt TEXT,
          FOREIGN KEY (userId) REFERENCES users(id)
        )
      `, (err) => {
        if (err) {
          console.error("❌ Error creating orders table:", err.message);
          reject(err);
          return;
        }
      });

      // User sessions table - session management
      db.run(`
        CREATE TABLE IF NOT EXISTS user_sessions (
          id TEXT PRIMARY KEY,
          userId TEXT NOT NULL,
          sessionToken TEXT UNIQUE NOT NULL,
          expiresAt TEXT NOT NULL,
          createdAt TEXT NOT NULL,
          lastAccessed TEXT,
          deviceInfo TEXT,
          FOREIGN KEY (userId) REFERENCES users(id)
        )
      `, (err) => {
        if (err) {
          console.error("❌ Error creating user_sessions table:", err.message);
          reject(err);
          return;
        }
      });

      // App settings table - application configuration
      db.run(`
        CREATE TABLE IF NOT EXISTS app_settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          description TEXT,
          updatedAt TEXT NOT NULL
        )
      `, (err) => {
        if (err) {
          console.error("❌ Error creating app_settings table:", err.message);
          reject(err);
          return;
        }
      });

      // Seller accounts table - legacy compatibility
      db.run(`
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
        )
      `, (err) => {
        if (err) {
          console.error("❌ Error creating seller_accounts table:", err.message);
          reject(err);
          return;
        }
        console.log("✅ All database tables initialized successfully");
        console.log("📊 Tables: users, products, cart_items, wishlist_items, orders, user_sessions, app_settings, seller_accounts");
        resolve();
      });
    });
  });
};

// Graceful shutdown handling
const gracefulShutdown = () => {
  console.log("🔄 Shutting down gracefully...");
  if (db) {
    if (IS_PRODUCTION) {
      // PostgreSQL Pool uses end() instead of close()
      db.end().then(() => {
        console.log("✅ Database connection closed");
        process.exit(0);
      }).catch((err) => {
        console.error("❌ Error closing database:", err.message);
        process.exit(1);
      });
    } else {
      // SQLite uses close()
      db.close((err) => {
        if (err) {
          console.error("❌ Error closing database:", err.message);
          process.exit(1);
        }
        console.log("✅ Database connection closed");
        process.exit(0);
      });
    }
  } else {
    process.exit(0);
  }
};

// Handle shutdown signals
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
process.on('SIGUSR2', gracefulShutdown); // For nodemon restarts
process.on('SIGUSR2', gracefulShutdown); // For nodemon restarts

const defaultCorsOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3001",
];
const envCorsOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
const corsAllowList = Array.from(new Set([...defaultCorsOrigins, ...envCorsOrigins]));

app.use(
  cors({
    origin(origin, callback) {
      if (process.env.NODE_ENV !== "production") {
        return callback(null, true);
      }
      if (!origin || corsAllowList.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
  })
);
app.use(express.json());
app.use("/uploads", express.static(UPLOADS_DIR));

// Make database available to routes
app.set('db', db);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const safeExt = ext || ".jpg";
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image uploads are allowed"));
    }
    cb(null, true);
  },
});

const mapProductRow = (row) => ({
  ...row,
  price: Number(row.price || 0),
});

const hashPassword = (plain) => {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(plain, salt, 10000, 64, "sha512").toString("hex");
  return { salt, hash };
};

const verifyPassword = (plain, salt, hash) => {
  const compareHash = crypto.pbkdf2Sync(plain, salt, 10000, 64, "sha512").toString("hex");
  return crypto.timingSafeEqual(Buffer.from(compareHash), Buffer.from(hash));
};

const normalizeStoreName = (name) => (name || "").trim().toLowerCase();

// Convert SQLite placeholders (?) to PostgreSQL placeholders ($1, $2, etc)
const convertPlaceholders = (sql) => {
  if (!IS_PRODUCTION) return sql;
  
  let paramIndex = 1;
  return sql.replace(/\?/g, () => `$${paramIndex++}`);
};

// Convert SQLite INSERT OR REPLACE to PostgreSQL INSERT ... ON CONFLICT
const convertInsertOrReplace = (sql) => {
  if (!IS_PRODUCTION) return sql;
  
  // Match: INSERT OR REPLACE INTO table (col1, col2) VALUES (?, ?)
  const match = sql.match(/INSERT\s+OR\s+REPLACE\s+INTO\s+(\w+)\s*\((.*?)\)\s+VALUES\s*\((.*?)\)/i);
  if (!match) return sql;
  
  const [, table, columns, ] = match;
  const cols = columns.split(',').map(c => c.trim());
  
  // Build: INSERT INTO table (col1, col2) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET col1=$1, col2=$2
  const placeholderCount = (sql.match(/\?/g) || []).length;
  const placeholders = Array.from({length: placeholderCount}, (_, i) => `$${i+1}`).join(',');
  const updateClauses = cols.filter(c => c !== 'id').map((c, i) => `${c}=$${i+1}`).join(',');
  
  return sql
    .replace(/INSERT\s+OR\s+REPLACE\s+INTO/i, 'INSERT INTO')
    .replace(/VALUES\s*\([^)]+\)/i, `VALUES (${placeholders})`)
    .concat(` ON CONFLICT (id) DO UPDATE SET ${updateClauses}`);
};

// Enhanced database operation wrappers with retry logic and transaction support
const runSql = (sql, params = []) =>
  new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error("Database not initialized"));
      return;
    }
    
    if (IS_PRODUCTION) {
      // PostgreSQL - convert placeholders
      const convertedSql = convertPlaceholders(sql);
      const convertedInsert = convertInsertOrReplace(convertedSql);
      
      db.query(convertedInsert, params, (err, result) => {
        if (err) {
          console.error("❌ Database run error:", {
            sql: convertedInsert.substring(0, 100),
            error: err.message,
            params: params
          });
          reject(err);
          return;
        }
        resolve({ changes: result.rowCount });
      });
    } else {
      // SQLite
      db.run(sql, params, function onRun(err) {
        if (err) {
          console.error("❌ Database run error:", {
            sql: sql.substring(0, 100),
            error: err.message,
            params: params
          });
          reject(err);
          return;
        }
        resolve(this);
      });
    }
  });

const getSql = (sql, params = []) =>
  new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error("Database not initialized"));
      return;
    }
    
    if (IS_PRODUCTION) {
      // PostgreSQL - convert placeholders
      const convertedSql = convertPlaceholders(sql);
      db.query(convertedSql, params, (err, result) => {
        if (err) {
          console.error("❌ Database get error:", {
            sql: convertedSql.substring(0, 100),
            error: err.message,
            params: params
          });
          reject(err);
          return;
        }
        resolve(result.rows ? result.rows[0] : null);
      });
    } else {
      // SQLite
      db.get(sql, params, (err, row) => {
        if (err) {
          console.error("❌ Database get error:", {
            sql: sql.substring(0, 100),
            error: err.message,
            params: params
          });
          reject(err);
          return;
        }
        resolve(row);
      });
    }
  });

const allSql = (sql, params = []) =>
  new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error("Database not initialized"));
      return;
    }
    
    if (IS_PRODUCTION) {
      // PostgreSQL - convert placeholders
      const convertedSql = convertPlaceholders(sql);
      db.query(convertedSql, params, (err, result) => {
        if (err) {
          console.error("❌ Database query error:", {
            sql: convertedSql.substring(0, 100),
            error: err.message,
            params: params
          });
          reject(err);
          return;
        }
        resolve(result.rows || []);
      });
    } else {
      // SQLite
      db.all(sql, params, (err, rows) => {
        if (err) {
          console.error("❌ Database all error:", {
            sql: sql.substring(0, 100),
            error: err.message,
            params: params
          });
          reject(err);
          return;
        }
        resolve(rows);
      });
    }
  });

// Transaction helper for atomic operations
const runTransaction = async (operations) => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error("Database not initialized"));
      return;
    }

    if (IS_PRODUCTION) {
      // PostgreSQL: Use client transactions
      db.connect().then(client => {
        client.query('BEGIN', (err) => {
          if (err) {
            console.error("❌ Transaction begin error:", err.message);
            client.release();
            reject(err);
            return;
          }

          Promise.all(operations.map(op => op()))
            .then(results => {
              client.query('COMMIT', (commitErr) => {
                if (commitErr) {
                  console.error("❌ Transaction commit error:", commitErr.message);
                  client.query('ROLLBACK');
                  client.release();
                  reject(commitErr);
                  return;
                }
                client.release();
                resolve(results);
              });
            })
            .catch(opErr => {
              console.error("❌ Transaction operation error:", opErr.message);
              client.query('ROLLBACK', () => {
                client.release();
                reject(opErr);
              });
            });
        });
      }).catch(err => {
        console.error("❌ Failed to get database client:", err.message);
        reject(err);
      });
    } else {
      // SQLite: Use db.serialize()
      db.serialize(() => {
        db.run("BEGIN TRANSACTION", (err) => {
          if (err) {
            console.error("❌ Transaction begin error:", err.message);
            reject(err);
            return;
          }

          Promise.all(operations.map(op => op()))
            .then(results => {
              db.run("COMMIT", (commitErr) => {
                if (commitErr) {
                  console.error("❌ Transaction commit error:", commitErr.message);
                  reject(commitErr);
                  return;
                }
                resolve(results);
              });
            })
            .catch(opErr => {
              console.error("❌ Transaction operation error:", opErr.message);
              db.run("ROLLBACK", (rollbackErr) => {
                if (rollbackErr) {
                  console.error("❌ Transaction rollback error:", rollbackErr.message);
                }
                reject(opErr);
              });
            });
        });
      });
  });
};

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

// ============= COMPREHENSIVE USER MANAGEMENT =============

// Register a new user
app.post("/api/users/register", async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Check if user already exists
    const existingUser = await getSql("SELECT id FROM users WHERE email = ?", [email]);
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    const userId = `USER${Date.now()}${Math.floor(Math.random() * 10000)}`;
    const now = new Date().toISOString();
    const { salt, hash } = hashPassword(String(password));
    const storedPassword = `${salt}:${hash}`;

    await runSql(`
      INSERT INTO users (id, email, password, firstName, lastName, phone, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [userId, email, storedPassword, firstName || '', lastName || '', phone || '', now, now]);

    const newUser = await getSql("SELECT * FROM users WHERE id = ?", [userId]);
    res.status(201).json({ user: { ...newUser, password: undefined } });
  } catch (error) {
    console.error("❌ User registration error:", error);
    res.status(500).json({ message: "Failed to register user" });
  }
});

// User login
app.post("/api/users/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await getSql("SELECT * FROM users WHERE email = ?", [email]);
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Support both hashed (salt:hash) and legacy plain-text passwords
    let passwordValid = false;
    if (user.password && user.password.includes(':')) {
      const [salt, hash] = user.password.split(':');
      passwordValid = verifyPassword(String(password), salt, hash);
    } else {
      // Legacy plain-text comparison (for any existing dev data)
      passwordValid = user.password === password;
    }

    if (!passwordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.json({ user: { ...user, password: undefined } });
  } catch (error) {
    console.error("❌ User login error:", error);
    res.status(500).json({ message: "Failed to login user" });
  }
});

// ============= CART MANAGEMENT =============

// Get user's cart
app.get("/api/cart/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const cartItems = await allSql(`
      SELECT ci.*, p.* FROM cart_items ci 
      JOIN products p ON ci.productId = p.id 
      WHERE ci.userId = ? AND p.status = 'available'
      ORDER BY ci.addedAt DESC
    `, [userId]);
    
    res.json(cartItems);
  } catch (error) {
    console.error("❌ Cart fetch error:", error);
    res.status(500).json({ message: "Failed to fetch cart" });
  }
});

// Add item to cart
app.post("/api/cart", async (req, res) => {
  try {
    const { userId, productId, quantity = 1 } = req.body;
    
    if (!userId || !productId) {
      return res.status(400).json({ message: "userId and productId are required" });
    }

    const cartItemId = `CART${Date.now()}${Math.floor(Math.random() * 10000)}`;
    const now = new Date().toISOString();

    // Check if item already exists in cart
    const existing = await getSql("SELECT id, quantity FROM cart_items WHERE userId = ? AND productId = ?", [userId, productId]);
    
    if (existing) {
      // Update quantity
      await runSql("UPDATE cart_items SET quantity = quantity + ? WHERE id = ?", [quantity, existing.id]);
    } else {
      // Add new item
      await runSql(`
        INSERT INTO cart_items (id, userId, productId, quantity, addedAt)
        VALUES (?, ?, ?, ?, ?)
      `, [cartItemId, userId, productId, quantity, now]);
    }

    res.json({ message: "Item added to cart" });
  } catch (error) {
    console.error("❌ Cart add error:", error);
    res.status(500).json({ message: "Failed to add item to cart" });
  }
});

// Remove item from cart
app.delete("/api/cart/:userId/:productId", async (req, res) => {
  try {
    const { userId, productId } = req.params;
    await runSql("DELETE FROM cart_items WHERE userId = ? AND productId = ?", [userId, productId]);
    res.json({ message: "Item removed from cart" });
  } catch (error) {
    console.error("❌ Cart remove error:", error);
    res.status(500).json({ message: "Failed to remove item from cart" });
  }
});

// ============= WISHLIST MANAGEMENT =============

// Get user's wishlist
app.get("/api/wishlist/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const wishlistItems = await allSql(`
      SELECT wi.*, p.* FROM wishlist_items wi 
      JOIN products p ON wi.productId = p.id 
      WHERE wi.userId = ?
      ORDER BY wi.addedAt DESC
    `, [userId]);
    
    res.json(wishlistItems);
  } catch (error) {
    console.error("❌ Wishlist fetch error:", error);
    res.status(500).json({ message: "Failed to fetch wishlist" });
  }
});

// Toggle wishlist item
app.post("/api/wishlist/toggle", async (req, res) => {
  try {
    const { userId, productId } = req.body;
    
    if (!userId || !productId) {
      return res.status(400).json({ message: "userId and productId are required" });
    }

    const existing = await getSql("SELECT id FROM wishlist_items WHERE userId = ? AND productId = ?", [userId, productId]);
    
    if (existing) {
      // Remove from wishlist
      await runSql("DELETE FROM wishlist_items WHERE userId = ? AND productId = ?", [userId, productId]);
      res.json({ message: "Item removed from wishlist", action: "removed" });
    } else {
      // Add to wishlist
      const wishlistItemId = `WISH${Date.now()}${Math.floor(Math.random() * 10000)}`;
      const now = new Date().toISOString();
      
      await runSql(`
        INSERT INTO wishlist_items (id, userId, productId, addedAt)
        VALUES (?, ?, ?, ?)
      `, [wishlistItemId, userId, productId, now]);
      
      res.json({ message: "Item added to wishlist", action: "added" });
    }
  } catch (error) {
    console.error("❌ Wishlist toggle error:", error);
    res.status(500).json({ message: "Failed to toggle wishlist item" });
  }
});

// ============= ORDER MANAGEMENT =============

// Create order
app.post("/api/orders", async (req, res) => {
  try {
    const { userId, totalAmount, orderItems, paymentId, paymentMethod, shippingAddress } = req.body;
    
    if (!userId || !totalAmount || !orderItems) {
      return res.status(400).json({ message: "userId, totalAmount, and orderItems are required" });
    }

    const orderId = `ORDER${Date.now()}${Math.floor(Math.random() * 10000)}`;
    const now = new Date().toISOString();

    await runTransaction([
      () => runSql(`
        INSERT INTO orders (id, userId, totalAmount, status, paymentId, paymentMethod, shippingAddress, orderItems, placedAt, updatedAt)
        VALUES (?, ?, ?, 'confirmed', ?, ?, ?, ?, ?, ?)
      `, [orderId, userId, totalAmount, paymentId, paymentMethod, JSON.stringify(orderItems), shippingAddress, now, now]),
      
      // Clear user's cart after order
      () => runSql("DELETE FROM cart_items WHERE userId = ?", [userId]),
      
      // Mark products as sold
      ...orderItems.map(item => 
        () => runSql("UPDATE products SET status = 'sold', soldAt = ? WHERE id = ?", [now, item.productId])
      )
    ]);

    res.status(201).json({ orderId, message: "Order placed successfully" });
  } catch (error) {
    console.error("❌ Order creation error:", error);
    res.status(500).json({ message: "Failed to create order" });
  }
});

// Get user orders
app.get("/api/orders/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const orders = await allSql("SELECT * FROM orders WHERE userId = ? ORDER BY placedAt DESC", [userId]);
    res.json(orders);
  } catch (error) {
    console.error("❌ Orders fetch error:", error);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});

// ============= DATA SYNCHRONIZATION SYSTEM =============

// Sync user data from localStorage to database
app.post("/api/sync/user-data", async (req, res) => {
  try {
    const { userId, localStorageData } = req.body;
    
    if (!userId || !localStorageData) {
      return res.status(400).json({ message: "userId and localStorageData are required" });
    }

    const operations = [];

    // Sync cart items if provided
    if (localStorageData.cartItems && Array.isArray(localStorageData.cartItems)) {
      // Clear existing cart items for this user
      operations.push(() => runSql("DELETE FROM cart_items WHERE userId = ?", [userId]));
      
      // Add current cart items
      localStorageData.cartItems.forEach(item => {
        if (item.product && item.product.id) {
          const cartItemId = `CART${Date.now()}${Math.floor(Math.random() * 10000)}`;
          const now = new Date().toISOString();
          operations.push(() => runSql(`
            INSERT OR REPLACE INTO cart_items (id, userId, productId, quantity, addedAt)
            VALUES (?, ?, ?, ?, ?)
          `, [cartItemId, userId, item.product.id, item.quantity || 1, now]));
        }
      });
    }

    // Sync wishlist items if provided
    if (localStorageData.wishlistItems && Array.isArray(localStorageData.wishlistItems)) {
      // Clear existing wishlist items for this user
      operations.push(() => runSql("DELETE FROM wishlist_items WHERE userId = ?", [userId]));
      
      // Add current wishlist items
      localStorageData.wishlistItems.forEach(item => {
        if (item.product && item.product.id) {
          const wishlistItemId = `WISH${Date.now()}${Math.floor(Math.random() * 10000)}`;
          const now = new Date().toISOString();
          operations.push(() => runSql(`
            INSERT OR REPLACE INTO wishlist_items (id, userId, productId, addedAt)
            VALUES (?, ?, ?, ?)
          `, [wishlistItemId, userId, item.product.id, now]));
        }
      });
    }

    // Execute all operations in a transaction
    if (operations.length > 0) {
      await runTransaction(operations);
    }

    res.json({ message: "Data synchronized successfully" });
  } catch (error) {
    console.error("❌ Data sync error:", error);
    res.status(500).json({ message: "Failed to synchronize data" });
  }
});

// Get all user data from database
app.get("/api/sync/user-data/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get user data
    const user = await getSql("SELECT * FROM users WHERE id = ?", [userId]);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get cart items
    const cartItems = await allSql(`
      SELECT ci.*, p.* FROM cart_items ci 
      JOIN products p ON ci.productId = p.id 
      WHERE ci.userId = ? AND p.status = 'available'
      ORDER BY ci.addedAt DESC
    `, [userId]);

    // Get wishlist items
    const wishlistItems = await allSql(`
      SELECT wi.*, p.* FROM wishlist_items wi 
      JOIN products p ON wi.productId = p.id 
      WHERE wi.userId = ?
      ORDER BY wi.addedAt DESC
    `, [userId]);

    // Get recent orders
    const orders = await allSql(`
      SELECT * FROM orders WHERE userId = ? 
      ORDER BY placedAt DESC LIMIT 10
    `, [userId]);

    const syncData = {
      user: { ...user, password: undefined },
      cartItems: cartItems.map(item => ({
        id: item.id,
        product: {
          id: item.productId,
          name: item.name,
          category: item.category,
          price: item.price,
          size: item.size,
          condition: item.condition,
          description: item.description,
          imageUrl: item.imageUrl,
          sellerEmail: item.sellerEmail,
          status: item.status
        },
        quantity: item.quantity
      })),
      wishlistItems: wishlistItems.map(item => ({
        product: {
          id: item.productId,
          name: item.name,
          category: item.category,
          price: item.price,
          size: item.size,
          condition: item.condition,
          description: item.description,
          imageUrl: item.imageUrl,
          sellerEmail: item.sellerEmail,
          status: item.status
        }
      })),
      orders
    };

    res.json(syncData);
  } catch (error) {
    console.error("❌ Data fetch error:", error);
    res.status(500).json({ message: "Failed to fetch user data" });
  }
});

// Bulk data backup endpoint
app.post("/api/backup/create", async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const backupData = {
      timestamp: new Date().toISOString(),
      userId,
      data: {}
    };

    // Get all user-related data
    const [user, cartItems, wishlistItems, orders] = await Promise.all([
      getSql("SELECT * FROM users WHERE id = ?", [userId]),
      allSql("SELECT * FROM cart_items WHERE userId = ?", [userId]),
      allSql("SELECT * FROM wishlist_items WHERE userId = ?", [userId]),
      allSql("SELECT * FROM orders WHERE userId = ?", [userId])
    ]);

    backupData.data = {
      user: user ? { ...user, password: undefined } : null,
      cartItems,
      wishlistItems,
      orders
    };

    // Store backup in app_settings table
    const backupId = `BACKUP${Date.now()}`;
    await runSql(`
      INSERT OR REPLACE INTO app_settings (key, value, description, updatedAt)
      VALUES (?, ?, ?, ?)
    `, [`user_backup_${userId}`, JSON.stringify(backupData), `User backup for ${userId}`, backupData.timestamp]);

    res.json({ backupId, message: "Backup created successfully" });
  } catch (error) {
    console.error("❌ Backup creation error:", error);
    res.status(500).json({ message: "Failed to create backup" });
  }
});

// Restore from backup
app.post("/api/backup/restore", async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    // Get latest backup
    const backupRow = await getSql(`
      SELECT value FROM app_settings 
      WHERE key = ? ORDER BY updatedAt DESC LIMIT 1
    `, [`user_backup_${userId}`]);

    if (!backupRow) {
      return res.status(404).json({ message: "No backup found for user" });
    }

    const backupData = JSON.parse(backupRow.value);
    const operations = [];

    // Restore cart items
    if (backupData.data.cartItems) {
      operations.push(() => runSql("DELETE FROM cart_items WHERE userId = ?", [userId]));
      backupData.data.cartItems.forEach(item => {
        operations.push(() => runSql(`
          INSERT INTO cart_items (id, userId, productId, quantity, addedAt)
          VALUES (?, ?, ?, ?, ?)
        `, [item.id, item.userId, item.productId, item.quantity, item.addedAt]));
      });
    }

    // Restore wishlist items
    if (backupData.data.wishlistItems) {
      operations.push(() => runSql("DELETE FROM wishlist_items WHERE userId = ?", [userId]));
      backupData.data.wishlistItems.forEach(item => {
        operations.push(() => runSql(`
          INSERT INTO wishlist_items (id, userId, productId, addedAt)
          VALUES (?, ?, ?, ?)
        `, [item.id, item.userId, item.productId, item.addedAt]));
      });
    }

    // Execute restoration
    if (operations.length > 0) {
      await runTransaction(operations);
    }

    res.json({ message: "Data restored successfully from backup" });
  } catch (error) {
    console.error("❌ Backup restore error:", error);
    res.status(500).json({ message: "Failed to restore from backup" });
  }
});

// ============= PRODUCT MANAGEMENT =============

app.get("/api/products", async (_req, res) => {
  try {
    const rows = await allSql("SELECT * FROM products WHERE status = 'available' ORDER BY listedAt DESC");
    res.json(rows.map(mapProductRow));
  } catch (error) {
    console.error("❌ Products fetch error:", error);
    res.status(500).json({ message: "Failed to fetch products" });
  }
});

// ============= STORAGE MONITORING & ANALYTICS =============

// Get storage statistics
app.get("/api/admin/storage-stats", async (_req, res) => {
  try {
    const stats = {
      timestamp: new Date().toISOString(),
      database: {},
      files: {}
    };

    // Database statistics
    const [userCount, productCount, cartItemCount, wishlistItemCount, orderCount] = await Promise.all([
      getSql("SELECT COUNT(*) as count FROM users"),
      getSql("SELECT COUNT(*) as count FROM products"),
      getSql("SELECT COUNT(*) as count FROM cart_items"),
      getSql("SELECT COUNT(*) as count FROM wishlist_items"),
      getSql("SELECT COUNT(*) as count FROM orders")
    ]);

    stats.database = {
      users: userCount.count,
      products: productCount.count,
      cartItems: cartItemCount.count,
      wishlistItems: wishlistItemCount.count,
      orders: orderCount.count
    };

    // File system statistics
    try {
      const dbStats = fs.statSync(DB_PATH);
      stats.files.databaseSize = dbStats.size;
      
      const uploadFiles = fs.readdirSync(UPLOADS_DIR);
      stats.files.uploadCount = uploadFiles.length;
      
      let totalUploadSize = 0;
      uploadFiles.forEach(file => {
        try {
          const filePath = path.join(UPLOADS_DIR, file);
          const fileStats = fs.statSync(filePath);
          totalUploadSize += fileStats.size;
        } catch (err) {
          console.warn("⚠️ Could not stat file:", file);
        }
      });
      
      stats.files.totalUploadSize = totalUploadSize;
    } catch (fsErr) {
      console.error("❌ File system stats error:", fsErr);
      stats.files.error = fsErr.message;
    }

    res.json(stats);
  } catch (error) {
    console.error("❌ Storage stats error:", error);
    res.status(500).json({ message: "Failed to get storage statistics" });
  }
});

// Health check with database connectivity
app.get("/api/admin/health-check", async (_req, res) => {
  try {
    const healthCheck = {
      timestamp: new Date().toISOString(),
      status: "healthy",
      checks: {}
    };

    // Database connectivity check
    try {
      await getSql("SELECT 1 as test");
      healthCheck.checks.database = { status: "connected", message: "Database connection successful" };
    } catch (dbErr) {
      healthCheck.checks.database = { status: "error", message: dbErr.message };
      healthCheck.status = "unhealthy";
    }

    // File system check
    try {
      fs.accessSync(UPLOADS_DIR, fs.constants.R_OK | fs.constants.W_OK);
      healthCheck.checks.fileSystem = { status: "accessible", message: "Upload directory accessible" };
    } catch (fsErr) {
      healthCheck.checks.fileSystem = { status: "error", message: fsErr.message };
      healthCheck.status = "unhealthy";
    }

    // Memory usage
    const memUsage = process.memoryUsage();
    healthCheck.checks.memory = {
      status: "ok",
      rss: `${Math.round(memUsage.rss / 1024 / 1024 * 100) / 100} MB`,
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100} MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024 * 100) / 100} MB`
    };

    const statusCode = healthCheck.status === "healthy" ? 200 : 500;
    res.status(statusCode).json(healthCheck);
  } catch (error) {
    console.error("❌ Health check error:", error);
    res.status(500).json({
      timestamp: new Date().toISOString(),
      status: "unhealthy",
      error: error.message
    });
  }
});

// Auto-cleanup old data
app.post("/api/admin/cleanup", async (req, res) => {
  try {
    const { olderThanDays = 30 } = req.body;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    const cutoffISO = cutoffDate.toISOString();

    const operations = [];

    // Clean up old expired sessions
    operations.push(() => runSql("DELETE FROM user_sessions WHERE expiresAt < ?", [new Date().toISOString()]));

    // Clean up old cart items (older than specified days)
    operations.push(() => runSql("DELETE FROM cart_items WHERE addedAt < ?", [cutoffISO]));

    // Clean up old backups
    operations.push(() => runSql(`
      DELETE FROM app_settings 
      WHERE key LIKE 'user_backup_%' AND updatedAt < ?
    `, [cutoffISO]));

    await runTransaction(operations);

    res.json({ 
      message: `Cleanup completed for data older than ${olderThanDays} days`,
      cutoffDate: cutoffISO
    });
  } catch (error) {
    console.error("❌ Cleanup error:", error);
    res.status(500).json({ message: "Failed to perform cleanup" });
  }
});

// ============= PRODUCT MANAGEMENT =============

app.get("/api/products", async (_req, res) => {
  try {
    const rows = await allSql("SELECT * FROM products WHERE status = 'available' ORDER BY listedAt DESC");
    res.json(rows.map(mapProductRow));
  } catch (error) {
    console.error("❌ Products fetch error:", error);
    res.status(500).json({ message: "Failed to fetch products" });
  }
});

app.post("/api/seller-auth/register", async (req, res) => {
  try {
    const {
      storeName,
      sellerEmail,
      phone,
      password,
      address,
      shippingMethod,
      deliveryOption,
      accountHolder,
      accountNumber,
      ifsc,
      aadhaar,
      pan,
    } = req.body || {};

    if (!storeName || !sellerEmail || !phone || !password) {
      return res.status(400).json({ message: "storeName, sellerEmail, phone, and password are required" });
    }

    if (String(password).length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const normalizedStoreName = normalizeStoreName(storeName);
    const existing = await getSql(
      "SELECT id FROM seller_accounts WHERE normalizedStoreName = ?",
      [normalizedStoreName]
    );
    if (existing) {
      return res.status(409).json({ message: "Store name already registered. Please log in." });
    }

    const id = `SELL${Date.now()}${Math.floor(Math.random() * 10000)}`;
    const createdAt = new Date().toISOString();
    const { salt, hash } = hashPassword(String(password));

    const profileJson = JSON.stringify({
      address: address || "",
      shippingMethod: shippingMethod || "",
      deliveryOption: deliveryOption || "",
      accountHolder: accountHolder || "",
      accountNumber: accountNumber || "",
      ifsc: ifsc || "",
      aadhaar: aadhaar || "",
      pan: pan || "",
    });

    await runSql(
      `
        INSERT INTO seller_accounts (
          id, normalizedStoreName, storeName, sellerEmail, phone, passwordHash, passwordSalt, profileJson, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [id, normalizedStoreName, storeName.trim(), sellerEmail.trim(), String(phone).trim(), hash, salt, profileJson, createdAt]
    );

    return res.status(201).json({
      seller: {
        id,
        sellerId: id,
        name: storeName.trim(),
        storeName: storeName.trim(),
        email: sellerEmail.trim(),
        phone: String(phone).trim(),
        isSeller: true,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to register seller account" });
  }
});

app.post("/api/seller-auth/login", async (req, res) => {
  try {
    const { storeName, password } = req.body || {};
    if (!storeName || !password) {
      return res.status(400).json({ message: "storeName and password are required" });
    }

    const normalizedStoreName = normalizeStoreName(storeName);
    const row = await getSql(
      "SELECT * FROM seller_accounts WHERE normalizedStoreName = ?",
      [normalizedStoreName]
    );

    if (!row || !verifyPassword(String(password), row.passwordSalt, row.passwordHash)) {
      return res.status(401).json({ message: "Invalid store name or password" });
    }

    return res.json({
      seller: {
        id: row.id,
        sellerId: row.id,
        name: row.storeName,
        storeName: row.storeName,
        email: row.sellerEmail,
        phone: row.phone,
        isSeller: true,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to login seller" });
  }
});

app.post("/api/products", upload.single("image"), async (req, res) => {
  try {
    const { name, category, price, size, condition, description, sellerEmail } = req.body;

    if (!name || !category || !price) {
      return res.status(400).json({ message: "name, category, and price are required" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Image upload is required" });
    }

    const parsedPrice = Number(price);
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      return res.status(400).json({ message: "price must be a positive number" });
    }

    const id = `PROD${Date.now()}${Math.floor(Math.random() * 10000)}`;
    const listedAt = new Date().toISOString();
    const imagePath = req.file.path;
    const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

    await runSql(
      `
        INSERT INTO products (
          id, name, category, price, size, condition, description, imageUrl, imagePath, sellerEmail, listedAt, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        id,
        name,
        category,
        parsedPrice,
        size || "",
        condition || "Good",
        description || "",
        imageUrl,
        imagePath,
        sellerEmail || "",
        listedAt,
        "available",
      ]
    );

    const created = await getSql("SELECT * FROM products WHERE id = ?", [id]);
    res.status(201).json(mapProductRow(created));
  } catch (error) {
    res.status(500).json({ message: "Failed to create product" });
  }
});

app.patch("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const nextStatus = status === "sold" ? "sold" : "available";
    const soldAt = nextStatus === "sold" ? new Date().toISOString() : null;

    const result = await runSql(
      "UPDATE products SET status = ?, soldAt = ? WHERE id = ?",
      [nextStatus, soldAt, id]
    );

    if (!result.changes) {
      return res.status(404).json({ message: "Product not found" });
    }

    const updated = await getSql("SELECT * FROM products WHERE id = ?", [id]);
    res.json(mapProductRow(updated));
  } catch (error) {
    res.status(500).json({ message: "Failed to update product" });
  }
});

app.delete("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await getSql("SELECT * FROM products WHERE id = ?", [id]);
    if (!existing) {
      return res.status(404).json({ message: "Product not found" });
    }

    await runSql("DELETE FROM products WHERE id = ?", [id]);

    if (existing.imagePath && fs.existsSync(existing.imagePath)) {
      fs.unlinkSync(existing.imagePath);
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Failed to delete product" });
  }
});

// Enhanced error handling middleware
app.use((err, _req, res, _next) => {
  console.error("❌ Server error:", {
    message: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString()
  });
  
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: err.message });
  }
  if (err) {
    return res.status(400).json({ message: err.message });
  }
  return res.status(500).json({ message: "Unexpected server error" });
});

// Initialize database and start server
const startServer = async () => {
  try {
    console.log("🚀 Starting ThriftApp server...");
    
    // Initialize database connection
    await initializeDatabase();
    await createTables();
    
    // Start the server
    const server = app.listen(PORT, () => {
      console.log(`✅ API running on http://localhost:${PORT}`);
      console.log(`📁 Database: ${DB_PATH}`);
      console.log(`📂 Uploads: ${UPLOADS_DIR}`);
    });

    // Handle server errors
    server.on('error', (err) => {
      console.error("❌ Server error:", err.message);
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
        process.exit(1);
      }
    });

  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

// Start the server
startServer();
