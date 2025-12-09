-- Create child_profiles table
-- This should be run in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS child_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  child_name TEXT NOT NULL,
  date_of_birth DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_child_profiles_user_id ON child_profiles(user_id);

-- Enable Row Level Security
ALTER TABLE child_profiles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to manage their own child profile
CREATE POLICY "Users can manage their own child profile"
ON child_profiles
FOR ALL
USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Add comment
COMMENT ON TABLE child_profiles IS 'Stores child profile information for personalized KidTube experience';
