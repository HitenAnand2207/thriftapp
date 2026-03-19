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

# Database
DATABASE_URL=postgresql://user:password@your-pooler-host:6543/dbname?sslmode=require
SUPABASE_DATABASE_URL=postgresql://user:password@your-pooler-host:6543/dbname?sslmode=require

# Shared image storage
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
CLOUDINARY_FOLDER=thriftapp

# Optional integrations
RAZORPAY_KEY_ID=rzp_live_replace_me
RAZORPAY_KEY_SECRET=replace_me
`;

  fs.writeFileSync(path.join(__dirname, "../.env.production.template"), envProduction);

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
    "deploy:migrate-images": "node server/scripts/migrate-images-to-cloudinary.js",
    "deploy:setup": "node server/scripts/deploy-setup.js",
    "start:production": "cross-env NODE_ENV=production node server/server.js"
  };

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

  console.log(" Created deployment files:");
  console.log("    .env.production.template");
  console.log("    Procfile (Heroku)");
  console.log("    railway-deploy.sh");
  console.log("    Updated package.json scripts");
};

// Create cloud database setup instructions
const createSetupInstructions = () => {
  const guidePath = path.join(__dirname, "../../DEPLOYMENT_GUIDE_NEON_CLOUDINARY.md");
  if (fs.existsSync(guidePath)) {
    console.log("📚 Deployment guide already present: DEPLOYMENT_GUIDE_NEON_CLOUDINARY.md");
    return;
  }

  const instructions = `# Deployment Guide

See README.md for setup basics and add your detailed production runbook here.
`;
  fs.writeFileSync(guidePath, instructions);
  console.log("📚 Created DEPLOYMENT_GUIDE_NEON_CLOUDINARY.md");
};

if (require.main === module) {
  createDeploymentFiles();
  createSetupInstructions();
  console.log("\\n🎉 Deployment setup complete!");
  console.log("📚 Read DEPLOYMENT_GUIDE_NEON_CLOUDINARY.md for step-by-step instructions");
}

module.exports = { createDeploymentFiles, createSetupInstructions };
