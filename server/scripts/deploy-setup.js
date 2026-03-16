// server/scripts/deploy-setup.js
const fs = require("fs");
const path = require("path");

const createDeploymentFiles = () => {
  console.log(" Creating deployment configuration files...");
  
  // Create .env.production template
  const envProduction = `# Production Environment Variables
# Copy this to .env.production and fill in your values

# Backend runtime (required by server/server.js)
NODE_ENV=production
PORT=8000
CORS_ORIGIN=https://yourdomain.com

# Frontend public env (optional)
# REACT_APP_API_BASE_URL=https://api.yourdomain.com
# REACT_APP_RAZORPAY_KEY=rzp_live_replace_me
# REACT_APP_RAZORPAY_KEY_ID=rzp_live_replace_me

# Deployment / migration helpers (optional today)
DATABASE_URL=postgresql://user:password@host:5432/database
SUPABASE_DATABASE_URL=postgresql://user:password@host:5432/postgres
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_BUCKET_NAME=your_bucket_name
AWS_REGION=us-east-1
RAZORPAY_KEY_ID=rzp_live_replace_me
RAZORPAY_KEY_SECRET=replace_me
`;

  fs.writeFileSync(path.join(__dirname, "../.env.production.template"), envProduction);

  // Create Vercel config
  const vercelConfig = {
    "version": 2,
    "builds": [
      {
        "src": "server/server.js",
        "use": "@vercel/node"
      },
      {
        "src": "package.json",
        "use": "@vercel/static-build",
        "config": {
          "distDir": "build"
        }
      }
    ],
    "routes": [
      {
        "src": "/api/(.*)",
        "dest": "/server/server.js"
      },
      {
        "src": "/(.*)",
        "dest": "/build/$1"
      }
    ],
    "env": {
      "NODE_ENV": "production"
    }
  };

  fs.writeFileSync(
    path.join(__dirname, "../../vercel.json"), 
    JSON.stringify(vercelConfig, null, 2)
  );

  // Create Railway deployment script
  const railwayDeploy = `#!/bin/bash
# Railway Deployment Script

echo "🚀 Deploying to Railway..."

# Install dependencies
npm install

# Build frontend
npm run build

# Start server
npm run server
`;

  fs.writeFileSync(path.join(__dirname, "../railway-deploy.sh"), railwayDeploy);

  // Create Heroku Procfile
  const procfile = `web: node server/server.js
`;

  fs.writeFileSync(path.join(__dirname, "../../Procfile"), procfile);

  // Create deployment package.json scripts
  const packageJsonPath = path.join(__dirname, "../../package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  packageJson.scripts = {
    ...packageJson.scripts,
    "build": "react-scripts build",
    "deploy:export": "node server/scripts/export-data.js",
    "deploy:import": "node server/scripts/import-data.js", 
    "deploy:setup": "node server/scripts/deploy-setup.js",
    "start:production": "NODE_ENV=production node server/server.js"
  };

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

  console.log(" Created deployment files:");
  console.log("    .env.production.template");
  console.log("    vercel.json");  
  console.log("    Procfile (Heroku)");
  console.log("    railway-deploy.sh");
  console.log("    Updated package.json scripts");
};

// Create cloud database setup instructions
const createSetupInstructions = () => {
  const instructions = `#  Deployment Setup Guide

## Step 1: Export Your Local Data
\`\`\`bash
npm run deploy:export
\`\`\`
This creates an \`export/\` folder with all your data.

## Step 2: Choose Your Cloud Platform

### Option A: Vercel + Supabase (Recommended)
1. **Database**: Create free Supabase project at https://supabase.com
   - Get your DATABASE_URL from project settings
   - Run the SQL file from export/ in Supabase SQL editor

2. **Files**: Upload to Cloudinary at https://cloudinary.com  
   - Get API keys from dashboard
   
3. **Deploy**: Connect GitHub repo to Vercel
   - Add environment variables in Vercel dashboard

### Option B: Railway (Full-Stack)
1. Connect GitHub repo to Railway at https://railway.app
2. Add PostgreSQL service 
3. Upload your export files using import script
4. Add environment variables

### Option C: Heroku 
1. Install Heroku CLI
2. Add Heroku Postgres addon
3. Upload export data
4. Deploy with git push

## Step 3: Import Your Data
After setting up cloud database:
\`\`\`bash
# Set your DATABASE_URL environment variable
export DATABASE_URL="your_cloud_database_url"

# Import your local data
npm run deploy:import
\`\`\`

## Step 4: Access Your Deployed App
Your app will have the same products, users, and data as your local version!

## Environment Variables Needed:
- \`DATABASE_URL\` - Cloud database connection
- \`CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET\` - File storage  
- \`NODE_ENV=production\`
- \`CORS_ORIGIN\` - Your deployed frontend URL

##  Result
All your local products will appear on the deployed site
 Users can create accounts that persist 
 Shopping carts work across devices
 All data is safely stored in the cloud
`;

  fs.writeFileSync(path.join(__dirname, "../../DEPLOYMENT.md"), instructions);
  console.log("📚 Created DEPLOYMENT.md with setup instructions");
};

if (require.main === module) {
  createDeploymentFiles();
  createSetupInstructions();
  console.log("\\n🎉 Deployment setup complete!");
  console.log("📚 Read DEPLOYMENT.md for step-by-step instructions");
}

module.exports = { createDeploymentFiles, createSetupInstructions };
