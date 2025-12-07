# Supabase Setup Guide

## Step 1: Create Supabase Project

1. Go to https://supabase.com and sign in
2. Click "New Project"
3. Fill in:
   - Name: `kidtube`
   - Database Password: (create and save securely)
   - Region: Choose closest to you
4. Wait for project creation (takes ~2 minutes)

## Step 2: Run Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy and paste contents of `supabase-schema-simple.sql`
4. Click "Run" to create the table and insert your existing videos

## Step 3: Get API Credentials

1. Go to **Project Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: Long string starting with `eyJ...`

## Step 4: Create .env File

Create a `.env` file in the project root:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
```

Replace with your actual values from Step 3.

## Step 5: Install Dependencies

```bash
npm install
```

## Step 6: Test Locally

```bash
npm start
```

Visit:
- Mobile App: http://localhost:3000
- CMS: http://localhost:3000/cms

Your videos should now be loading from Supabase!

## Done!

The app is now using Supabase instead of local JSON files. When you deploy to Vercel, you'll add these same environment variables in the Vercel dashboard.
