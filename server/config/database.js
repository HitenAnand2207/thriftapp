// server/config/database.js
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

// Database configuration based on environment
const getDbConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    // Production: Use cloud database URL if available
    if (process.env.DATABASE_URL) {
      // For PostgreSQL/MySQL cloud databases
      return {
        type: 'cloud',
        url: process.env.DATABASE_URL
      };
    }
  }
  
  // Development/Fallback: Use SQLite
  const DATA_DIR = path.join(__dirname, "../data");
  const DB_PATH = path.join(DATA_DIR, "thriftapp.db");
  
  // Ensure directory exists
  fs.mkdirSync(DATA_DIR, { recursive: true });
  
  return {
    type: 'sqlite',
    path: DB_PATH
  };
};

// Export database connection based on environment
const createDatabase = () => {
  const config = getDbConfig();
  
  if (config.type === 'sqlite') {
    return new sqlite3.Database(config.path);
  }
  
  // For cloud databases, you'd use different drivers
  // This is where you'd add PostgreSQL, MySQL, etc.
  throw new Error('Cloud database not yet configured');
};

module.exports = { getDbConfig, createDatabase };