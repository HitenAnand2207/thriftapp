/**
 * Production Database Handler for PostgreSQL/Supabase
 * This file handles database connections in production environment
 * Automatically switches between SQLite (development) and PostgreSQL (production)
 */

const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const { promisify } = require('util');
const path = require('path');

class DatabaseManager {
  constructor() {
    this.db = null;
    this.dbType = process.env.NODE_ENV === 'production' ? 'postgresql' : 'sqlite';
    this.isConnected = false;
  }

  async connect() {
    try {
      if (this.dbType === 'postgresql') {
        await this.connectPostgreSQL();
      } else {
        await this.connectSQLite();
      }
      this.isConnected = true;
      console.log(`✅ Connected to ${this.dbType} database`);
    } catch (error) {
      console.error(`❌ Database connection failed:`, error);
      throw error;
    }
  }

  async connectPostgreSQL() {
    const connectionString = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;
    
    if (!connectionString) {
      throw new Error('SUPABASE_DATABASE_URL or DATABASE_URL environment variable is required');
    }

    this.db = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false }
    });

    // Test connection
    const client = await this.db.connect();
    await client.query('SELECT NOW()');
    client.release();

    // Initialize tables if they don't exist
    await this.initializePostgreSQLTables();
  }

  async connectSQLite() {
    const dbPath = path.join(__dirname, '..', 'database.sqlite');
    
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) throw err;
    });

    // Enable WAL mode for better concurrency
    await this.query('PRAGMA journal_mode=WAL;');
    
    // Initialize tables if they don't exist
    await this.initializeSQLiteTables();
  }

  async initializePostgreSQLTables() {
    const tables = [
      `CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS seller_accounts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        business_name VARCHAR(255) NOT NULL,
        business_address TEXT NOT NULL,
        phone VARCHAR(20) NOT NULL,
        bank_account VARCHAR(50) NOT NULL,
        ifsc_code VARCHAR(20) NOT NULL,
        gstin VARCHAR(20),
        verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        seller_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        category VARCHAR(100) NOT NULL,
        condition VARCHAR(50) NOT NULL,
        image_url TEXT,
        images TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS cart_items (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        quantity INTEGER DEFAULT 1,
        selected BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS wishlist_items (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, product_id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        total_amount DECIMAL(10,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        shipping_address TEXT NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        items TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS user_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        session_token VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS app_settings (
        id SERIAL PRIMARY KEY,
        setting_key VARCHAR(255) UNIQUE NOT NULL,
        setting_value TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    for (const table of tables) {
      await this.query(table);
    }

    console.log('✅ PostgreSQL tables initialized');
  }

  async initializeSQLiteTables() {
    const tables = [
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS seller_accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        business_name TEXT NOT NULL,
        business_address TEXT NOT NULL,
        phone TEXT NOT NULL,
        bank_account TEXT NOT NULL,
        ifsc_code TEXT NOT NULL,
        gstin TEXT,
        verified BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )`,
      
      `CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        seller_id INTEGER,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        category TEXT NOT NULL,
        condition TEXT NOT NULL,
        image_url TEXT,
        images TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (seller_id) REFERENCES users (id) ON DELETE CASCADE
      )`,
      
      `CREATE TABLE IF NOT EXISTS cart_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        product_id INTEGER,
        quantity INTEGER DEFAULT 1,
        selected BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
      )`,
      
      `CREATE TABLE IF NOT EXISTS wishlist_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        product_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
        UNIQUE(user_id, product_id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        total_amount REAL NOT NULL,
        status TEXT DEFAULT 'pending',
        shipping_address TEXT NOT NULL,
        payment_method TEXT NOT NULL,
        items TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )`,
      
      `CREATE TABLE IF NOT EXISTS user_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        session_token TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )`,
      
      `CREATE TABLE IF NOT EXISTS app_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        setting_key TEXT UNIQUE NOT NULL,
        setting_value TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    for (const table of tables) {
      await this.query(table);
    }

    console.log('✅ SQLite tables initialized');
  }

  async query(sql, params = []) {
    if (!this.isConnected) {
      await this.connect();
    }

    if (this.dbType === 'postgresql') {
      const result = await this.db.query(sql, params);
      return result.rows;
    } else {
      return new Promise((resolve, reject) => {
        if (sql.trim().toLowerCase().startsWith('select')) {
          this.db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          });
        } else {
          this.db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve({ lastID: this.lastID, changes: this.changes });
          });
        }
      });
    }
  }

  async get(sql, params = []) {
    if (this.dbType === 'postgresql') {
      const result = await this.query(sql, params);
      return result[0] || null;
    } else {
      return new Promise((resolve, reject) => {
        this.db.get(sql, params, (err, row) => {
          if (err) reject(err);
          else resolve(row || null);
        });
      });
    }
  }

  async all(sql, params = []) {
    return await this.query(sql, params);
  }

  async transaction(queries) {
    if (this.dbType === 'postgresql') {
      const client = await this.db.connect();
      try {
        await client.query('BEGIN');
        const results = [];
        
        for (const { sql, params } of queries) {
          const result = await client.query(sql, params);
          results.push(result.rows);
        }
        
        await client.query('COMMIT');
        return results;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } else {
      return new Promise((resolve, reject) => {
        this.db.serialize(() => {
          this.db.run('BEGIN TRANSACTION');
          
          const results = [];
          let completed = 0;
          
          queries.forEach((query, index) => {
            const { sql, params } = query;
            
            if (sql.trim().toLowerCase().startsWith('select')) {
              this.db.all(sql, params, (err, rows) => {
                if (err) {
                  this.db.run('ROLLBACK');
                  reject(err);
                } else {
                  results[index] = rows;
                  completed++;
                  
                  if (completed === queries.length) {
                    this.db.run('COMMIT', (err) => {
                      if (err) reject(err);
                      else resolve(results);
                    });
                  }
                }
              });
            } else {
              this.db.run(sql, params, function(err) {
                if (err) {
                  this.db.run('ROLLBACK');
                  reject(err);
                } else {
                  results[index] = { lastID: this.lastID, changes: this.changes };
                  completed++;
                  
                  if (completed === queries.length) {
                    this.db.run('COMMIT', (err) => {
                      if (err) reject(err);
                      else resolve(results);
                    });
                  }
                }
              });
            }
          });
        });
      });
    }
  }

  async close() {
    if (this.db) {
      if (this.dbType === 'postgresql') {
        await this.db.end();
      } else {
        await new Promise((resolve) => {
          this.db.close(resolve);
        });
      }
      this.isConnected = false;
      console.log(`✅ ${this.dbType} connection closed`);
    }
  }

  getStatus() {
    return {
      connected: this.isConnected,
      type: this.dbType,
      environment: process.env.NODE_ENV || 'development'
    };
  }
}

// Export singleton instance
const dbManager = new DatabaseManager();
module.exports = dbManager;