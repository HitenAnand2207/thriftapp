# 🚀 Deployment Setup Guide

## Step 1: Export Your Local Data
```bash
npm run deploy:export
```
This creates an `export/` folder with all your data.

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
```bash
# Set your DATABASE_URL environment variable
export DATABASE_URL="your_cloud_database_url"

# Import your local data
npm run deploy:import
```

## Step 4: Access Your Deployed App
Your app will have the same products, users, and data as your local version!

## Environment Variables Needed:
- `DATABASE_URL` - Cloud database connection
- `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET` - File storage  
- `NODE_ENV=production`
- `CORS_ORIGIN` - Your deployed frontend URL

## 🎯 Result
✅ All your local products will appear on the deployed site
✅ Users can create accounts that persist 
✅ Shopping carts work across devices
✅ All data is safely stored in the cloud
