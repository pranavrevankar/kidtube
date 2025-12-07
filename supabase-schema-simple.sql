-- Simple videos table (no authentication)
CREATE TABLE IF NOT EXISTS videos (
  id SERIAL PRIMARY KEY,
  youtube_video_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_videos_added_at ON videos(added_at DESC);

-- Insert your existing videos
INSERT INTO videos (youtube_video_id, title) VALUES
  ('J3tu_VzmSDQ', 'Chinnu Kannada Rhymes for Children Vol. 3'),
  ('Lix-XLkFuvE', 'Punyakoti Kannada Song | Govina Haadu Full Version | Infobells'),
  ('H46vC6Qp67U', 'Little Krishna 🪈| Maakhan Ka Hungama 🤩 | Full Episode | Krishna Cartoon Stories | @PogoChannel'),
  ('hTqtGJwsJVE', 'Baby Learning With Ms Rachel - First Words, Songs and Nursery Rhymes for Babies - Toddler Videos')
ON CONFLICT (youtube_video_id) DO NOTHING;
