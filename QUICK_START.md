# KidTube - Quick Start Guide

## Getting Started in 3 Steps

### 1. Install and Run

```bash
# Install dependencies
npm install

# Start the server
npm start
```

The server will start at http://localhost:3000

### 2. Add Videos (Parent - CMS)

1. Open http://localhost:3000/cms in your browser
2. Copy a YouTube video URL (example: https://www.youtube.com/watch?v=dQw4w9WgXcQ)
3. Paste it in the "YouTube Video URL or ID" field
4. Optionally add a custom title
5. Click "Add Video"

You can add multiple videos - they'll all appear in the grid.

### 3. Let Your Child Watch (Mobile App)

1. Open http://localhost:3000 on your mobile device or tablet
2. Your child will see a clean grid of video thumbnails
3. Tap any video to play it
4. When the video ends, the next one plays automatically
5. Tap the X button in the top-right to return to the grid

## Tips

- **Mobile Access**: To access from your phone/tablet on the same network:
  - Find your computer's IP address (e.g., 192.168.1.100)
  - Open http://YOUR_IP:3000 on your mobile device

- **Add to Home Screen**: On mobile, add the app to your home screen for a native app-like experience

- **Video Selection**: Choose videos from trusted channels like:
  - Educational content creators
  - Kids' learning channels
  - Story-telling channels
  - Music and songs for kids

- **Channel Safety**: When a video ends, YouTube will only suggest videos from the same channel (thanks to `rel=0` parameter)

## Safety Features

- No ads or recommendations from YouTube's algorithm
- Only videos you've pre-approved will show
- Related videos limited to same channel only
- No comments section visible
- Minimized YouTube branding
- Full control over what your child watches

## Stopping the Server

Press `Ctrl + C` in the terminal where the server is running.

## Need Help?

Check the full README.md for more detailed information and troubleshooting.
