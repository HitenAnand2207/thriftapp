// server/scripts/import-data.js
const fs = require("fs");
const path = require("path");

const importToCloudDatabase = async () => {
  console.log("📥 Starting data import to cloud database...");
  
  const EXPORT_DIR = path.join(__dirname, "../export");
  const dbExportPath = path.join(EXPORT_DIR, "database-export.json");
  
  if (!fs.existsSync(dbExportPath)) {
    console.error("❌ No export file found. Run 'npm run deploy:export' first.");
    process.exit(1);
  }
  
  try {
    const exportData = JSON.parse(fs.readFileSync(dbExportPath, 'utf8'));
    console.log(`📊 Import file from: ${exportData.timestamp}`);
    
    // Check if we have a cloud database URL
    if (!process.env.DATABASE_URL) {
      console.log("📋 SQL Import Instructions:");
      console.log("1. Copy the SQL file content from: server/export/database-export.sql");
      console.log("2. Paste it into your cloud database SQL editor (Supabase, Railway, etc.)");
      console.log("3. Run the SQL to create all your data");
      console.log("");
      console.log("🔗 Or set DATABASE_URL environment variable to auto-import");
      return;
    }
    
    // If DATABASE_URL is set, attempt auto-import
    console.log("🔄 Attempting automatic import...");
    
    // This would connect to PostgreSQL/MySQL cloud database
    // For now, show manual instructions
    console.log("✅ Export data ready for import!");
    console.log("📁 Files to upload to cloud storage:");
    
    const filesExportPath = path.join(EXPORT_DIR, "files-export.json");
    if (fs.existsSync(filesExportPath)) {
      const fileData = JSON.parse(fs.readFileSync(filesExportPath, 'utf8'));
      fileData.files.forEach((file, index) => {
        console.log(`   ${index + 1}. ${file.filename} (${(file.size / 1024).toFixed(1)}KB)`);
      });
      
      console.log("\\n📤 Upload these files to Cloudinary or AWS S3");
      console.log("🔧 Update image URLs in your products table after upload");
    }
    
  } catch (error) {
    console.error("❌ Import failed:", error);
    process.exit(1);
  }
};

if (require.main === module) {
  importToCloudDatabase();
}

module.exports = { importToCloudDatabase };