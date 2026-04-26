# Sentry Error Tracking Setup

Sentry has been integrated into KidTube to help track errors in both frontend and backend, especially useful for debugging mobile-specific issues.

## Setup Instructions

### 1. Create a Sentry Account
- Go to https://sentry.io and sign up for a free account
- Free tier includes:
  - 5,000 errors per month
  - 10,000 transactions per month
  - 50 replays per month
  - Perfect for small-medium projects

### 2. Create a New Project
- Click "Create Project"
- Select "Node.js" as the platform
- Give it a name like "kidtube" or "kidtube-backend"
- Click "Create Project"

### 3. Get Your DSN
- After creating the project, you'll see your DSN (Data Source Name)
- It looks like: `https://abc123@o123456.ingest.sentry.io/7654321`
- Copy this DSN

### 4. Add DSN to Environment Variables

**Local Development:**
Add to your `.env` file:
```
SENTRY_DSN=https://your_actual_dsn_here@sentry.io/your_project_id
```

**Production (Render):**
1. Go to your Render dashboard
2. Select your web service
3. Go to "Environment" tab
4. Add a new environment variable:
   - Key: `SENTRY_DSN`
   - Value: `https://your_actual_dsn_here@sentry.io/your_project_id`
5. Save changes (this will redeploy your service)

### 5. What Gets Tracked

**Backend (Node.js):**
- All unhandled errors and exceptions
- API endpoint errors
- Request context (URL, method, user agent)
- Stack traces

**Frontend (Browser):**
- JavaScript errors
- Unhandled promise rejections
- Network errors
- User actions leading up to errors (breadcrumbs)
- Session replays (10% of sessions, 100% with errors)

### 6. Viewing Errors in Sentry

Once deployed:
1. Log into your Sentry dashboard
2. Select your project
3. View "Issues" to see all errors
4. Click on any error to see:
   - Stack trace
   - User context (browser, OS, device)
   - Request details
   - Breadcrumbs (user actions before error)
   - Session replay (if available)

### 7. Benefits for Mobile Debugging

For the mobile URL paste issue:
- You'll see exactly which device/browser had the problem
- The exact error message
- The URL that was submitted
- User's actions before the error

Example error you might see:
```
Invalid YouTube URL
Browser: Mobile Safari 16.6
OS: iOS 16.6.1
Device: iPhone 13 Pro
URL submitted: "https://youtu.be/VIDEO_ID?feature=shared"
```

### 8. Optional: Remove Verbose Logging

Once Sentry is set up and working, you can remove or reduce the console.log statements we added for debugging in `server.js`:

```javascript
// These can be removed once Sentry is working:
console.log('Received URL:', JSON.stringify(url));
console.log('URL length:', url.length);
console.log('URL char codes:', Array.from(url).map(c => c.charCodeAt(0)).join(','));
```

Sentry will automatically capture these details in a more structured way.

### 9. Testing

To test if Sentry is working:

**Backend test:**
Add a test route in `server.js`:
```javascript
app.get('/api/test-error', (req, res) => {
  throw new Error('Test error for Sentry');
});
```

Then visit: `http://localhost:3000/api/test-error`

**Frontend test:**
Open browser console on dashboard and run:
```javascript
throw new Error('Test frontend error for Sentry');
```

You should see these errors appear in your Sentry dashboard within seconds.

## Cost

- **Free tier is sufficient** for most small projects
- Upgrade only if you exceed:
  - 5,000 errors/month
  - 10,000 transactions/month
  - 50 session replays/month

## Support

If you have questions about Sentry setup, check:
- Sentry Docs: https://docs.sentry.io
- Or ask in the Sentry Discord community
