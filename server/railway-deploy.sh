#!/bin/bash
# Railway Deployment Script

echo "🚀 Deploying to Railway..."

# Install dependencies
npm install

# Build frontend
npm run build

# Start server
npm run server
