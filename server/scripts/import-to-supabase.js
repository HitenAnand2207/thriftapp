/**
 * Supabase Data Import Script
 * Use this script to import your exported data into Supabase PostgreSQL
 * Run this after setting up your Supabase project and configuring environment variables
 */

const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config();

// Import the production database manager
const dbManager = require('../db/prod-database');

async function importToSupabase() {
  console.log('🚀 Starting Supabase data import...');
  
  try {
    const dbConnectionString = (process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL || '').trim();
    if (!dbConnectionString) {
      console.error('❌ DATABASE_URL or SUPABASE_DATABASE_URL is required for Supabase import');
      process.exit(1);
    }

    // Check if export file exists
    const exportPath = path.join(__dirname, '..', 'export', 'database-export.json');
    const exportExists = await fs.access(exportPath).then(() => true).catch(() => false);
    
    if (!exportExists) {
      console.log('❌ No exported data found. Please run: npm run deploy:export');
      process.exit(1);
    }

    // Load exported data
    const exportDataStr = await fs.readFile(exportPath, 'utf8');
    const rawExport = JSON.parse(exportDataStr);
    const exportData = rawExport.database || {};
    
    console.log('📚 Loaded export data:', {
      totalTables: Object.keys(exportData).length,
      totalRecords: Object.values(exportData).reduce((sum, table) => sum + table.length, 0)
    });

    // Connect to Supabase
    await dbManager.connect();
    console.log('✅ Connected to Supabase PostgreSQL');

    // Import data table by table
    for (const [tableName, records] of Object.entries(exportData)) {
      if (records.length === 0) {
        console.log(`⏩ Skipping empty table: ${tableName}`);
        continue;
      }

      console.log(`📥 Importing ${records.length} records to ${tableName}...`);
      
      try {
        await importTable(tableName, records);
        console.log(`✅ Successfully imported ${tableName}`);
      } catch (error) {
        console.error(`❌ Failed to import ${tableName}:`, error.message);
        
        // Show detailed error for debugging
        if (records.length > 0) {
          console.log('Sample record structure:', JSON.stringify(records[0], null, 2));
        }
      }
    }

    // Verify import
    await verifyImport(exportData);

    console.log('🎉 Data import completed successfully!');
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  } finally {
    await dbManager.close();
  }
}

async function importTable(tableName, records) {
  if (!Array.isArray(records) || records.length === 0) return;

  // Get column names from first record
  const columns = Object.keys(records[0]);
  const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
  const columnNames = columns.join(', ');
  
  const insertSQL = `INSERT INTO ${tableName} (${columnNames}) VALUES (${placeholders})`;
  
  // Import in batches of 100 for better performance
  const batchSize = 100;
  let imported = 0;
  
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    
    try {
      const queries = batch.map(record => ({
        sql: insertSQL,
        params: columns.map(col => record[col])
      }));
      
      await dbManager.transaction(queries);
      imported += batch.length;
      
      if (records.length > batchSize) {
        console.log(`  📊 Progress: ${imported}/${records.length} records imported`);
      }
      
    } catch (error) {
      // Try individual inserts if batch fails
      console.log(`⚠️  Batch failed, trying individual inserts...`);
      
      for (const record of batch) {
        try {
          const params = columns.map(col => record[col]);
          await dbManager.query(insertSQL, params);
          imported++;
        } catch (singleError) {
          console.error(`❌ Failed to insert record:`, {
            table: tableName,
            record,
            error: singleError.message
          });
        }
      }
    }
  }
  
  console.log(`✅ Imported ${imported}/${records.length} records to ${tableName}`);
}

async function verifyImport(originalData) {
  console.log('🔍 Verifying import...');
  
  const verification = {};
  
  for (const [tableName, originalRecords] of Object.entries(originalData)) {
    try {
      const currentRecords = await dbManager.all(`SELECT * FROM ${tableName}`);
      verification[tableName] = {
        expected: originalRecords.length,
        actual: currentRecords.length,
        status: originalRecords.length === currentRecords.length ? '✅' : '⚠️'
      };
    } catch (error) {
      verification[tableName] = {
        expected: originalRecords.length,
        actual: 0,
        status: '❌',
        error: error.message
      };
    }
  }
  
  console.log('\n📊 Import Verification Results:');
  console.table(verification);
  
  const allGood = Object.values(verification).every(v => v.status === '✅');
  
  if (allGood) {
    console.log('🎉 All data imported successfully!');
  } else {
    console.log('⚠️  Some tables have mismatched counts. Check the errors above.');
  }
  
  return verification;
}

// Run import if called directly
if (require.main === module) {
  importToSupabase().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { importToSupabase, verifyImport };
