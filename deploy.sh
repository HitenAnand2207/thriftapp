#!/bin/bash
# Quick Deployment Script for ThriftApp 
# Run this to deploy your app with all current data

echo "🚀 ThriftApp Deployment Helper"
echo "=================================="
echo ""

echo "📊 Current Data Summary:"
echo "• 9 Products (Shirts, Bags, Kurta, etc.)"
echo "• 3 Seller Accounts" 
echo "• 1 User Account"
echo "• 1 Cart Item"
echo "• 10 Product Images (1.5MB)"
echo ""

echo "🎯 Choose your deployment platform:"
echo "1. Vercel + Supabase (Free, Recommended)"
echo "2. Railway (Free tier available)"
echo "3. Heroku (Free tier limited)"
echo "4. Manual setup"
echo ""

read -p "Enter choice (1-4): " choice

case $choice in
  1)
    echo ""
    echo "🚀 Vercel + Supabase Deployment:"
    echo "1. Go to https://supabase.com and create a free project"
    echo "2. Copy your DATABASE_URL from Supabase settings"
    echo "3. Go to https://vercel.com and connect your GitHub repo"
    echo "4. Add these environment variables in Vercel:"
    echo "   DATABASE_URL=your_supabase_url"
    echo "   NODE_ENV=production"
    echo "   CLOUDINARY_CLOUD_NAME=your_cloudinary_name"
    echo "   CLOUDINARY_API_KEY=your_cloudinary_key"
    echo "   CLOUDINARY_API_SECRET=your_cloudinary_secret"
    echo ""
    echo "5. Upload your SQL data to Supabase:"
    echo "   • Copy content from: server/export/database-export.sql"
    echo "   • Paste in Supabase SQL Editor and run"
    echo ""
    echo "6. Upload images to Cloudinary and update image URLs"
    echo ""
    echo "🎉 Your deployed app will have all 9 products!"
    ;;
  2)
    echo ""
    echo "🚀 Railway Deployment:"
    echo "1. Go to https://railway.app and connect your GitHub repo"
    echo "2. Add PostgreSQL service in Railway"
    echo "3. Set environment variables in Railway dashboard"
    echo "4. Use the provided SQL export to import your data"
    echo ""
    ;;
  3)
    echo ""
    echo "🚀 Heroku Deployment:"
    echo "1. Install Heroku CLI"
    echo "2. Run: heroku create your-app-name"
    echo "3. Run: heroku addons:create heroku-postgresql:hobby-dev"
    echo "4. Import your data using the SQL export"
    echo ""
    ;;
  4)
    echo ""
    echo "📚 Manual Setup:"
    echo "1. Read DEPLOYMENT.md for detailed instructions"
    echo "2. Use the exported files in server/export/"
    echo "3. Set up your chosen cloud database"
    echo "4. Import the SQL file to recreate all your data"
    echo ""
    ;;
esac

echo ""
echo "📁 Your export files are ready in: server/export/"
echo "📄 database-export.sql - Import this to your cloud database"
echo "📄 files-export.json - List of images to upload to cloud storage"
echo ""
echo "❓ Need help? Check DEPLOYMENT.md for step-by-step instructions"