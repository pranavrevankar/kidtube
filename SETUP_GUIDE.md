# KidTube - Setup Guide with Clerk & Supabase

## Step 1: Create Supabase Project

1. Go to https://supabase.com and sign in
2. Click "New Project"
3. Fill in the details:
   - Name: `kidtube`
   - Database Password: (save this securely)
   - Region: Choose closest to you
4. Wait for the project to be created

## Step 2: Set Up Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy and paste the contents of `supabase-schema.sql`
4. Click "Run" to execute the SQL

## Step 3: Get Supabase Credentials

1. Go to **Project Settings** → **API**
2. Copy these values (you'll need them later):
   - Project URL (e.g., `https://xxx.supabase.co`)
   - `anon` public key
   - `service_role` secret key (for backend only)

## Step 4: Create Clerk Account

1. Go to https://clerk.com and sign up
2. Click "Add Application"
3. Application name: `KidTube`
4. Enable **Email** authentication
5. Click "Create Application"

## Step 5: Get Clerk Credentials

From your Clerk dashboard:
1. Go to **API Keys**
2. Copy:
   - Publishable key (starts with `pk_test_`)
   - Secret key (starts with `sk_test_`)

## Step 6: Configure Webhooks (for syncing users to Supabase)

1. In Clerk dashboard, go to **Webhooks**
2. Click "Add Endpoint"
3. Endpoint URL: `https://your-vercel-app.vercel.app/api/webhooks/clerk` (you'll get this after deploying)
4. Subscribe to events:
   - `user.created`
   - `user.updated`
   - `user.deleted`
5. Copy the **Signing Secret**

## Step 7: Environment Variables

Create a `.env.local` file:

```env
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_role_key

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key
CLERK_SECRET_KEY=your_secret_key
CLERK_WEBHOOK_SECRET=your_webhook_signing_secret

# Default videos (comma-separated YouTube video IDs)
DEFAULT_VIDEOS=J3tu_VzmSDQ,Lix-XLkFuvE,H46vC6Qp67U,hTqtGJwsJVE
```

## Step 8: Install Dependencies

```bash
npm install @supabase/supabase-js @clerk/clerk-sdk-node @clerk/nextjs svix
```

## Step 9: Deploy

Follow the deployment steps in README.md

## Default Videos

When a new user signs up, they will automatically get these videos:
- Chinnu Kannada Rhymes for Children Vol. 3
- Punyakoti Kannada Song
- Little Krishna
- Baby Learning With Ms Rachel

You can customize this list in the environment variables.
