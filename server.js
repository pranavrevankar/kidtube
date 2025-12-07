const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));
app.use('/cms', express.static('cms'));

// Data file path
const dataFile = path.join(__dirname, 'data', 'videos.json');

// Helper function to read videos
function readVideos() {
  try {
    const data = fs.readFileSync(dataFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// Helper function to write videos
function writeVideos(videos) {
  fs.writeFileSync(dataFile, JSON.stringify(videos, null, 2));
}

// Helper function to extract YouTube video ID from URL
function extractVideoId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Helper function to fetch video title from YouTube oEmbed API
function fetchVideoTitle(videoId) {
  return new Promise((resolve, reject) => {
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;

    https.get(url, (resp) => {
      let data = '';

      resp.on('data', (chunk) => {
        data += chunk;
      });

      resp.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.title || 'Untitled Video');
        } catch (e) {
          resolve('Untitled Video');
        }
      });

    }).on('error', (err) => {
      console.error('Error fetching video title:', err);
      resolve('Untitled Video');
    });
  });
}

// API Routes

// Get all videos
app.get('/api/videos', (req, res) => {
  const videos = readVideos();
  res.json(videos);
});

// Add a new video
app.post('/api/videos', async (req, res) => {
  const { url, title } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  const videoId = extractVideoId(url);
  if (!videoId) {
    return res.status(400).json({ error: 'Invalid YouTube URL' });
  }

  const videos = readVideos();

  // Check if video already exists
  if (videos.find(v => v.id === videoId)) {
    return res.status(400).json({ error: 'Video already exists' });
  }

  // Fetch video title from YouTube if not provided
  let videoTitle = title;
  if (!videoTitle || videoTitle.trim() === '') {
    videoTitle = await fetchVideoTitle(videoId);
  }

  const newVideo = {
    id: videoId,
    title: videoTitle,
    addedAt: new Date().toISOString()
  };

  videos.push(newVideo);
  writeVideos(videos);

  res.status(201).json(newVideo);
});

// Delete a video
app.delete('/api/videos/:id', (req, res) => {
  const { id } = req.params;
  let videos = readVideos();

  const initialLength = videos.length;
  videos = videos.filter(v => v.id !== id);

  if (videos.length === initialLength) {
    return res.status(404).json({ error: 'Video not found' });
  }

  writeVideos(videos);
  res.json({ message: 'Video deleted successfully' });
});

// Update video title
app.put('/api/videos/:id', (req, res) => {
  const { id } = req.params;
  const { title } = req.body;

  const videos = readVideos();
  const video = videos.find(v => v.id === id);

  if (!video) {
    return res.status(404).json({ error: 'Video not found' });
  }

  video.title = title || video.title;
  writeVideos(videos);

  res.json(video);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Mobile app: http://localhost:${PORT}`);
  console.log(`CMS: http://localhost:${PORT}/cms`);
});
