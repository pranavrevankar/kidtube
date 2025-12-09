-- Fix Row Level Security for child_profiles table
-- Run this in Supabase SQL Editor

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can manage their own child profile" ON child_profiles;

-- Disable RLS temporarily to allow our API to work
ALTER TABLE child_profiles DISABLE ROW LEVEL SECURITY;

-- Alternatively, if you want to keep RLS enabled, use service role key in your backend
-- For now, we'll disable it since we're using Clerk authentication at the API level

-- You can also create more permissive policies:
-- ALTER TABLE child_profiles ENABLE ROW LEVEL SECURITY;
--
-- CREATE POLICY "Enable all access for authenticated users"
-- ON child_profiles
-- FOR ALL
-- USING (true)
-- WITH CHECK (true);
