# KidTube - Curated YouTube Videos for Kids

A simple, safe mobile web application that allows parents to curate YouTube videos for their children, avoiding algorithm-driven recommendations.

## Features

### Mobile Web App
- Clean, kid-friendly interface similar to YouTube Kids
- Video thumbnails with play buttons
- Responsive design optimized for mobile devices
- YouTube IFrame API integration with safe playback settings
- Auto-play next video feature
- No external recommendations or ads
- Full-screen video playback support

### CMS (Content Management System)
- Simple interface for parents to manage videos
- Add videos by pasting YouTube URLs or video IDs
- **Auto-fetches video titles from YouTube** (optional manual override)
- View all added videos with thumbnails
- Delete unwanted videos
- Real-time updates to the mobile app

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

3. Access the application:
- Mobile App: http://localhost:3000
- CMS: http://localhost:3000/cms

## How to Use

### Adding Videos (Parent)

1. Open the CMS at http://localhost:3000/cms
2. Paste a YouTube video URL (e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ)
3. Optionally add a custom title (leave blank to auto-fetch from YouTube)
4. Click "Add Video"
5. The video title will be automatically fetched if not provided
6. The video will immediately appear in both CMS and mobile app

### Watching Videos (Child)

1. Open the mobile app at http://localhost:3000
2. Tap any video thumbnail to play
3. The video will play in full screen
4. When it ends, the next video will automatically play
5. Tap the X button to return to the video gallery

## YouTube IFrame API Features

The app uses YouTube's IFrame API with the following safety features:

- `rel=0`: Only shows related videos from the same channel
- `modestbranding=1`: Minimizes YouTube branding
- `iv_load_policy=3`: Hides video annotations
- `autoplay=1`: Automatically starts playback when selected
- `playsinline=1`: Plays inline on iOS devices

## Technical Details

### Project Structure
```
chotu_app/
├── server.js           # Express backend server
├── package.json        # Dependencies
├── data/
│   └── videos.json     # Video data storage
├── public/             # Mobile web app
│   ├── index.html
│   ├── style.css
│   └── script.js
└── cms/                # Content management system
    ├── index.html
    ├── style.css
    └── script.js
```

### API Endpoints

- `GET /api/videos` - Get all videos
- `POST /api/videos` - Add a new video
- `PUT /api/videos/:id` - Update video title
- `DELETE /api/videos/:id` - Delete a video

### Technology Stack

- Backend: Node.js + Express
- Frontend: Vanilla JavaScript, HTML5, CSS3
- API: YouTube IFrame API
- Storage: JSON file-based (easily upgradeable to database)

## Mobile Optimization

- Touch-friendly interface with large tap targets
- Responsive grid layout
- Optimized for both portrait and landscape orientations
- No pull-to-refresh interference
- Smooth scrolling and animations
- Works on iOS and Android devices

## Future Enhancements

- User authentication for CMS
- Multiple playlists/categories
- Video watch history
- Time limits and parental controls
- Offline video caching
- Database integration (MongoDB, PostgreSQL)

## License

ISC
