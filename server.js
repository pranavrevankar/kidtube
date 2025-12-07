require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const https = require('https');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));
app.use('/cms', express.static('cms'));

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
app.get('/api/videos', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .order('added_at', { ascending: false });

    if (error) throw error;

    // Format response to match frontend expectations
    const videos = data.map(video => ({
      id: video.youtube_video_id,
      title: video.title,
      addedAt: video.added_at
    }));

    res.json(videos);
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

// Add a new video
app.post('/api/videos', async (req, res) => {
  try {
    const { url, title } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    // Check if video already exists
    const { data: existing } = await supabase
      .from('videos')
      .select('youtube_video_id')
      .eq('youtube_video_id', videoId)
      .single();

    if (existing) {
      return res.status(400).json({ error: 'Video already exists' });
    }

    // Fetch video title from YouTube if not provided
    let videoTitle = title;
    if (!videoTitle || videoTitle.trim() === '') {
      videoTitle = await fetchVideoTitle(videoId);
    }

    // Insert video into Supabase
    const { data, error } = await supabase
      .from('videos')
      .insert([
        {
          youtube_video_id: videoId,
          title: videoTitle
        }
      ])
      .select()
      .single();

    if (error) throw error;

    // Format response
    const newVideo = {
      id: data.youtube_video_id,
      title: data.title,
      addedAt: data.added_at
    };

    res.status(201).json(newVideo);
  } catch (error) {
    console.error('Error adding video:', error);
    res.status(500).json({ error: 'Failed to add video' });
  }
});

// Delete a video
app.delete('/api/videos/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('videos')
      .delete()
      .eq('youtube_video_id', id);

    if (error) throw error;

    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({ error: 'Failed to delete video' });
  }
});

// Update video title
app.put('/api/videos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const { data, error } = await supabase
      .from('videos')
      .update({ title })
      .eq('youtube_video_id', id)
      .select()
      .single();

    if (error) throw error;

    // Format response
    const updatedVideo = {
      id: data.youtube_video_id,
      title: data.title,
      addedAt: data.added_at
    };

    res.json(updatedVideo);
  } catch (error) {
    console.error('Error updating video:', error);
    res.status(500).json({ error: 'Failed to update video' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Start server (only in local development)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Mobile app: http://localhost:${PORT}`);
    console.log(`CMS: http://localhost:${PORT}/cms`);
  });
}

// Export for Vercel
module.exports = app;
