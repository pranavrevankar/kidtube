# Deploy to Render

## Prerequisites
- GitHub account with the KidTube repository
- Supabase project with credentials

## Deployment Steps

1. **Create Render Account**
   - Go to https://render.com
   - Sign up with your GitHub account

2. **Create New Web Service**
   - Click "New +" button
   - Select "Web Service"
   - Connect your GitHub account if not already connected
   - Select the `kidtube` repository

3. **Configure the Service**
   - **Name**: kidtube (or any name you prefer)
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

4. **Add Environment Variables**
   Click "Advanced" and add these environment variables:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_ANON_KEY`: Your Supabase anonymous key

5. **Deploy**
   - Click "Create Web Service"
   - Render will automatically build and deploy your app
   - Once deployed, you'll get a URL like: https://kidtube.onrender.com

## Notes
- Free tier apps may spin down after inactivity (takes ~30 seconds to wake up)
- Auto-deploys on every push to main branch
- Logs are available in the Render dashboard
