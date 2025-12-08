-- Fix unique constraint to allow same video for different users
-- Drop the old unique constraint on youtube_video_id
ALTER TABLE videos DROP CONSTRAINT IF EXISTS videos_youtube_video_id_key;

-- Add a new unique constraint on the combination of user_id and youtube_video_id
ALTER TABLE videos ADD CONSTRAINT videos_user_video_unique UNIQUE (user_id, youtube_video_id);
