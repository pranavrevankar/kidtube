// Load environment variables from .env file if it exists
require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const https = require('https');
const { createClient } = require('@supabase/supabase-js');
const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');

const app = express();
const PORT = process.env.PORT || 3000;

// Validate environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const clerkSecretKey = process.env.CLERK_SECRET_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials!');
  console.error('SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.error('SUPABASE_ANON_KEY:', supabaseKey ? 'Set' : 'Missing');
}

if (!clerkSecretKey) {
  console.error('Missing Clerk credentials!');
  console.error('CLERK_SECRET_KEY:', clerkSecretKey ? 'Set' : 'Missing');
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Serve public folder for kid's view (with user_id parameter)
app.use('/view', express.static('public'));

// Serve CMS at root with Clerk key injection
app.get('/', (req, res) => {
  const fs = require('fs');
  const path = require('path');
  const htmlPath = path.join(__dirname, 'cms', 'index.html');

  fs.readFile(htmlPath, 'utf8', (err, html) => {
    if (err) {
      return res.status(500).send('Error loading CMS');
    }

    // Replace ALL occurrences of placeholder with actual Clerk publishable key
    const clerkKey = process.env.CLERK_PUBLISHABLE_KEY || '';
    const modifiedHtml = html.replace(/CLERK_PUBLISHABLE_KEY_PLACEHOLDER/g, clerkKey);

    res.send(modifiedHtml);
  });
});

// Serve other CMS static files
app.use(express.static('cms'));

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

// Get all videos (filtered by user_id from query parameter)
app.get('/api/videos', async (req, res) => {
  try {
    const userId = req.query.user_id;

    if (!userId) {
      return res.status(400).json({ error: 'user_id query parameter is required' });
    }

    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('user_id', userId)
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

// Add a new video (requires authentication)
app.post('/api/videos', ClerkExpressRequireAuth(), async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { url, title } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    // Check if video already exists for this user
    const { data: existing } = await supabase
      .from('videos')
      .select('youtube_video_id')
      .eq('youtube_video_id', videoId)
      .eq('user_id', userId)
      .single();

    if (existing) {
      return res.status(400).json({ error: 'Video already exists in your collection' });
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
          title: videoTitle,
          user_id: userId
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

// Delete a video (requires authentication)
app.delete('/api/videos/:id', ClerkExpressRequireAuth(), async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { id } = req.params;

    const { error } = await supabase
      .from('videos')
      .delete()
      .eq('youtube_video_id', id)
      .eq('user_id', userId);

    if (error) throw error;

    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({ error: 'Failed to delete video' });
  }
});

// Update video title (requires authentication)
app.put('/api/videos/:id', ClerkExpressRequireAuth(), async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { id } = req.params;
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const { data, error } = await supabase
      .from('videos')
      .update({ title })
      .eq('youtube_video_id', id)
      .eq('user_id', userId)
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

// Get child profile for authenticated user
app.get('/api/child-profile', ClerkExpressRequireAuth(), async (req, res) => {
  try {
    const userId = req.auth.userId;

    const { data, error } = await supabase
      .from('child_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
      throw error;
    }

    res.json(data || null);
  } catch (error) {
    console.error('Error fetching child profile:', error);
    res.status(500).json({ error: 'Failed to fetch child profile' });
  }
});

// Get child profile by user_id (public, for kid's view)
app.get('/api/child-profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from('child_profiles')
      .select('child_name')  // Only return child name for privacy
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    res.json(data || null);
  } catch (error) {
    console.error('Error fetching child profile:', error);
    res.status(500).json({ error: 'Failed to fetch child profile' });
  }
});

// Create or update child profile
app.post('/api/child-profile', ClerkExpressRequireAuth(), async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { child_name, date_of_birth } = req.body;

    if (!child_name) {
      return res.status(400).json({ error: 'Child name is required' });
    }

    // Check if profile exists
    const { data: existing } = await supabase
      .from('child_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    let result;
    if (existing) {
      // Update existing profile
      result = await supabase
        .from('child_profiles')
        .update({
          child_name,
          date_of_birth,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();
    } else {
      // Create new profile
      result = await supabase
        .from('child_profiles')
        .insert([{
          user_id: userId,
          child_name,
          date_of_birth
        }])
        .select()
        .single();
    }

    if (result.error) throw result.error;

    res.json(result.data);
  } catch (error) {
    console.error('Error saving child profile:', error);
    res.status(500).json({ error: 'Failed to save child profile' });
  }
});

// Get popular videos (top 10 most added across all accounts)
app.get('/api/videos/popular', async (req, res) => {
  try {
    // Query to get top 10 most common videos across all users
    const { data, error } = await supabase
      .from('videos')
      .select('youtube_video_id, title')
      .order('youtube_video_id');

    if (error) throw error;

    // Count occurrences of each video
    const videoCounts = {};
    data.forEach(video => {
      if (videoCounts[video.youtube_video_id]) {
        videoCounts[video.youtube_video_id].count++;
      } else {
        videoCounts[video.youtube_video_id] = {
          id: video.youtube_video_id,
          title: video.title,
          count: 1
        };
      }
    });

    // Convert to array and sort by count
    const popularVideos = Object.values(videoCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(video => ({
        id: video.id,
        title: video.title,
        addedByCount: video.count
      }));

    res.json(popularVideos);
  } catch (error) {
    console.error('Error fetching popular videos:', error);
    res.status(500).json({ error: 'Failed to fetch popular videos' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Start server (only when not running as serverless function)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`CMS (Parent's Dashboard): http://localhost:${PORT}`);
    console.log(`Kid's View: http://localhost:${PORT}/view?user_id=YOUR_USER_ID`);
  });
}

// Export for Vercel
module.exports = app;
