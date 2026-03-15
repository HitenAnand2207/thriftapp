const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Database migration for chat and support system
const migrateChatTables = (db) => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Support tickets table
      db.run(`
        CREATE TABLE IF NOT EXISTS support_tickets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'active',
          needs_human_support BOOLEAN DEFAULT FALSE,
          assigned_to TEXT NULL,
          resolved_by TEXT NULL,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now')),
          resolved_at TEXT NULL,
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (assigned_to) REFERENCES users(id),
          FOREIGN KEY (resolved_by) REFERENCES users(id)
        )
      `, (err) => {
        if (err) {
          console.error("❌ Error creating support_tickets table:", err.message);
          reject(err);
          return;
        }
        console.log("✅ Support tickets table created/verified");
      });

      // Chat messages table
      db.run(`
        CREATE TABLE IF NOT EXISTS chat_messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NULL,
          support_ticket_id INTEGER NOT NULL,
          message TEXT NOT NULL,
          sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'bot', 'support', 'system')),
          admin_id TEXT NULL,
          admin_name TEXT NULL,
          timestamp TEXT NOT NULL DEFAULT (datetime('now')),
          is_read BOOLEAN DEFAULT FALSE,
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (support_ticket_id) REFERENCES support_tickets(id),
          FOREIGN KEY (admin_id) REFERENCES users(id)
        )
      `, (err) => {
        if (err) {
          console.error("❌ Error creating chat_messages table:", err.message);
          reject(err);
          return;
        }
        console.log("✅ Chat messages table created/verified");
      });

      // Create indexes for better performance
      db.run(`
        CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id)
      `);

      db.run(`
        CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status)
      `);

      db.run(`
        CREATE INDEX IF NOT EXISTS idx_support_tickets_needs_human_support ON support_tickets(needs_human_support)
      `);

      db.run(`
        CREATE INDEX IF NOT EXISTS idx_chat_messages_ticket_id ON chat_messages(support_ticket_id)
      `);

      db.run(`
        CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON chat_messages(timestamp)
      `);

      // Add admin role to users table if it doesn't exist
      db.run(`
        ALTER TABLE users ADD COLUMN isAdmin BOOLEAN DEFAULT FALSE
      `, (err) => {
        // Ignore error if column already exists
        if (err && !err.message.includes('duplicate column')) {
          console.error("❌ Error adding isAdmin column:", err.message);
        } else {
          console.log("✅ Admin role column added/verified");
        }
      });

      // Add name column to users table if it doesn't exist (combining firstName and lastName)
      db.run(`
        ALTER TABLE users ADD COLUMN name TEXT
      `, (err) => {
        // Ignore error if column already exists
        if (err && !err.message.includes('duplicate column')) {
          console.error("❌ Error adding name column:", err.message);
        } else {
          console.log("✅ Name column added/verified");

          // Update name column with combined firstName and lastName for existing users
          db.run(`
            UPDATE users
            SET name = TRIM(COALESCE(firstName, '') || ' ' || COALESCE(lastName, ''))
            WHERE name IS NULL AND (firstName IS NOT NULL OR lastName IS NOT NULL)
          `);
        }
      });

      // Final no-op query — runs last in the serialized queue, so all prior
      // operations (including nested db.run calls in callbacks) have completed
      // before we resolve the promise.
      db.run('SELECT 1', (err) => {
        if (err) {
          reject(err);
          return;
        }
        console.log("✅ Chat and support system migration completed successfully");
        resolve();
      });
    });
  });
};

module.exports = { migrateChatTables };