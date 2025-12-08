-- Migration to add multi-user support to KidTube
-- This adds user_id to the videos table to support multiple parents

-- Add user_id column to videos table
ALTER TABLE videos ADD COLUMN user_id TEXT NOT NULL DEFAULT 'default_user';

-- Create index on user_id for faster queries
CREATE INDEX idx_videos_user_id ON videos(user_id);

-- Update the added_at index to include user_id for compound queries
CREATE INDEX idx_videos_user_added ON videos(user_id, added_at DESC);

-- Optional: If you want to migrate existing videos to a specific user,
-- you can run this (replace 'your_clerk_user_id' with actual user ID):
-- UPDATE videos SET user_id = 'your_clerk_user_id' WHERE user_id = 'default_user';
