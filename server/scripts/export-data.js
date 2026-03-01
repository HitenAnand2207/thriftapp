// server/scripts/export-data.js
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

const DB_PATH = path.join(__dirname, "../data/thriftapp.db");
const UPLOADS_DIR = path.join(__dirname, "../uploads");
const EXPORT_DIR = path.join(__dirname, "../export");

// Ensure export directory exists
fs.mkdirSync(EXPORT_DIR, { recursive: true });

const exportData = async () => {
  console.log("🚀 Starting data export for deployment...");
  
  try {
    const db = new sqlite3.Database(DB_PATH);
    
    // Get all table names
    const tables = await new Promise((resolve, reject) => {
      db.all(`SELECT name FROM sqlite_master WHERE type='table'`, (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map(row => row.name));
      });
    });
    
    console.log(`📊 Found ${tables.length} tables:`, tables);
    
    const exportData = {
      timestamp: new Date().toISOString(),
      version: "1.0",
      database: {}
    };
    
    // Export each table
    for (const tableName of tables) {
      console.log(`📤 Exporting table: ${tableName}`);
      
      const tableData = await new Promise((resolve, reject) => {
        db.all(`SELECT * FROM ${tableName}`, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
      
      exportData.database[tableName] = tableData;
      console.log(`✅ Exported ${tableData.length} rows from ${tableName}`);
    }
    
    // Save database export
    const dbExportPath = path.join(EXPORT_DIR, "database-export.json");
    fs.writeFileSync(dbExportPath, JSON.stringify(exportData, null, 2));
    console.log(`💾 Database exported to: ${dbExportPath}`);
    
    // Export file information
    const fileExport = {
      timestamp: new Date().toISOString(),
      files: []
    };
    
    if (fs.existsSync(UPLOADS_DIR)) {
      const files = fs.readdirSync(UPLOADS_DIR);
      console.log(`📁 Found ${files.length} uploaded files`);
      
      files.forEach(filename => {
        const filePath = path.join(UPLOADS_DIR, filename);
        const stats = fs.statSync(filePath);
        
        fileExport.files.push({
          filename,
          size: stats.size,
          modified: stats.mtime.toISOString(),
          path: filePath
        });
      });
    }
    
    // Save file export info
    const filesExportPath = path.join(EXPORT_DIR, "files-export.json");
    fs.writeFileSync(filesExportPath, JSON.stringify(fileExport, null, 2));
    console.log(`📂 File info exported to: ${filesExportPath}`);
    
    // Create SQL export for easier cloud database import
    const sqlExportPath = path.join(EXPORT_DIR, "database-export.sql");
    let sqlContent = "-- ThriftApp Database Export\\n";
    sqlContent += `-- Generated on: ${new Date().toISOString()}\\n\\n`;
    
    for (const [tableName, tableData] of Object.entries(exportData.database)) {
      if (tableData.length > 0) {
        const columns = Object.keys(tableData[0]);
        sqlContent += `-- Table: ${tableName}\\n`;
        
        tableData.forEach(row => {
          const values = columns.map(col => {
            const val = row[col];
            if (val === null) return 'NULL';
            if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
            return val;
          }).join(', ');
          
          sqlContent += `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values});\\n`;
        });
        
        sqlContent += `\\n`;
      }
    }
    
    fs.writeFileSync(sqlExportPath, sqlContent);
    console.log(`🗄️ SQL export created: ${sqlExportPath}`);
    
    // Generate deployment summary
    const summary = {
      exportTime: new Date().toISOString(),
      database: {
        tables: Object.keys(exportData.database).length,
        totalRecords: Object.values(exportData.database).reduce((sum, table) => sum + table.length, 0)
      },
      files: {
        count: fileExport.files.length,
        totalSize: fileExport.files.reduce((sum, file) => sum + file.size, 0)
      },
      exports: {
        databaseJson: dbExportPath,
        databaseSql: sqlExportPath,
        filesInfo: filesExportPath
      }
    };
    
    const summaryPath = path.join(EXPORT_DIR, "export-summary.json");
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    
    console.log("\\n🎉 Export Complete!");
    console.log(`📊 Database: ${summary.database.tables} tables, ${summary.database.totalRecords} records`);
    console.log(`📁 Files: ${summary.files.count} files, ${(summary.files.totalSize / 1024 / 1024).toFixed(2)}MB`);
    console.log(`📂 Export directory: ${EXPORT_DIR}`);
    
    db.close();
    
  } catch (error) {
    console.error("❌ Export failed:", error);
    process.exit(1);
  }
};

// Run export if called directly
if (require.main === module) {
  exportData();
}

module.exports = { exportData };