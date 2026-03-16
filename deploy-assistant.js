#!/usr/bin/env node

/**
 * ThriftApp Deployment Assistant
 * This script helps guide you through the deployment process
 * Run with: node deploy-assistant.js
 */

const fs = require('fs').promises;
const path = require('path');

class DeploymentAssistant {
  constructor() {
    this.checksPassed = 0;
    this.totalChecks = 0;
  }

  async run() {
    console.log('🚀 ThriftApp Deployment Assistant');
    console.log('=====================================\n');

    await this.checkPrerequisites();
    await this.checkExportedData();
    await this.checkConfiguration();
    await this.provideSummary();
  }

  async check(description, checkFunction) {
    this.totalChecks++;
    process.stdout.write(`${description}... `);
    
    try {
      const result = await checkFunction();
      if (result) {
        console.log('✅');
        this.checksPassed++;
        return true;
      } else {
        console.log('❌');
        return false;
      }
    } catch (error) {
      console.log(`❌ (${error.message})`);
      return false;
    }
  }

  async checkPrerequisites() {
    console.log('📋 Checking Prerequisites...\n');

    await this.check('Node.js installed', async () => {
      return process.version && process.version.startsWith('v');
    });

    await this.check('package.json exists', async () => {
      return await fs.access('package.json').then(() => true).catch(() => false);
    });

    await this.check('Dependencies installed', async () => {
      return await fs.access('node_modules').then(() => true).catch(() => false);
    });

    await this.check('Server directory exists', async () => {
      return await fs.access('server').then(() => true).catch(() => false);
    });

    await this.check('Build script exists', async () => {
      const pkg = JSON.parse(await fs.readFile('package.json', 'utf8'));
      return pkg.scripts && pkg.scripts['vercel-build'];
    });

    console.log();
  }

  async checkExportedData() {
    console.log('📊 Checking Exported Data...\n');

    const exportPath = path.join('server', 'export', 'database-export.json');
    
    const hasExport = await this.check('Export file exists', async () => {
      return await fs.access(exportPath).then(() => true).catch(() => false);
    });

    if (hasExport) {
      await this.check('Export contains data', async () => {
        const raw = JSON.parse(await fs.readFile(exportPath, 'utf8'));
        const data = raw.database || {};
        const recordCount = Object.values(data).reduce((sum, table) => sum + table.length, 0);
        console.log(`\n   📈 Found ${recordCount} records across ${Object.keys(data).length} tables`);
        return recordCount > 0;
      });
    } else {
      console.log('\n   ⚠️  Run: npm run deploy:export');
    }

    console.log();
  }

  async checkConfiguration() {
    console.log('⚙️  Checking Configuration...\n');

    await this.check('Vercel config exists', async () => {
      return await fs.access('vercel.json').then(() => true).catch(() => false);
    });

    await this.check('Environment template exists', async () => {
      return await fs.access('.env.template').then(() => true).catch(() => false);
    });

    await this.check('Production database handler exists', async () => {
      return await fs.access(path.join('server', 'db', 'prod-database.js')).then(() => true).catch(() => false);
    });

    await this.check('Import script exists', async () => {
      return await fs.access(path.join('server', 'scripts', 'import-to-supabase.js')).then(() => true).catch(() => false);
    });

    await this.check('PostgreSQL dependency installed', async () => {
      const pkg = JSON.parse(await fs.readFile('package.json', 'utf8'));
      return pkg.dependencies && pkg.dependencies.pg;
    });

    console.log();
  }

  async provideSummary() {
    console.log('📋 Deployment Readiness Summary');
    console.log('================================\n');

    console.log(`✅ Passed: ${this.checksPassed}/${this.totalChecks} checks`);
    
    if (this.checksPassed === this.totalChecks) {
      console.log('🎉 Your project is ready for deployment!\n');
      
      console.log('📝 Next Steps:');
      console.log('1. Set up Supabase database (see DEPLOYMENT_CHECKLIST.md)');
      console.log('2. Set up Cloudinary account (see .env.template)');
      console.log('3. Deploy to Vercel with environment variables');
      console.log('4. Import data: npm run deploy:supabase');
      console.log('5. Test your deployed application\n');
      
      console.log('📚 Resources:');
      console.log('- DEPLOYMENT_CHECKLIST.md (step-by-step guide)');
      console.log('- VERCEL_DEPLOYMENT_GUIDE.md (detailed Vercel guide)');
      console.log('- .env.template (environment variables template)\n');
      
    } else {
      console.log('⚠️  Please fix the failing checks before deployment.\n');
      
      console.log('💡 Common fixes:');
      console.log('- Run: npm install (to install dependencies)');
      console.log('- Run: npm run deploy:export (to export data)');
      console.log('- Check that all required files exist\n');
    }

    // Show quick stats if export exists
    try {
      const exportPath = path.join('server', 'export', 'database-export.json');
      const raw = JSON.parse(await fs.readFile(exportPath, 'utf8'));
      const data = raw.database || {};
      const stats = {};
      
      for (const [table, records] of Object.entries(data)) {
        if (records.length > 0) {
          stats[table] = records.length;
        }
      }
      
      if (Object.keys(stats).length > 0) {
        console.log('📊 Data Summary:');
        console.table(stats);
      }
      
    } catch (error) {
      // Export file doesn't exist or is invalid
    }
  }
}

// Run the assistant
if (require.main === module) {
  const assistant = new DeploymentAssistant();
  assistant.run().catch(error => {
    console.error('❌ Assistant error:', error.message);
    process.exit(1);
  });
}

module.exports = DeploymentAssistant;
