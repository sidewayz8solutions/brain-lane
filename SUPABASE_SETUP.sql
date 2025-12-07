-- FORCE RESET SUPABASE POLICIES
-- Run this in the Supabase SQL Editor to fix the RLS errors.

BEGIN;

-- 1. Ensure the bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-files', 'project-files', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Drop ALL existing policies for this bucket to start fresh
-- We drop by name, so if you have others, you might need to delete them manually in the dashboard
DROP POLICY IF EXISTS "Public Access Select" ON storage.objects;
DROP POLICY IF EXISTS "Public Access Insert" ON storage.objects;
DROP POLICY IF EXISTS "Public Access Update" ON storage.objects;
DROP POLICY IF EXISTS "Public Access Delete" ON storage.objects;
DROP POLICY IF EXISTS "Allow All Access to Project Files" ON storage.objects;

-- 3. Create a single, simple permissive policy for the bucket
-- This allows SELECT, INSERT, UPDATE, DELETE for anyone (anon) on this specific bucket
CREATE POLICY "Allow All Access to Project Files"
ON storage.objects FOR ALL
USING ( bucket_id = 'project-files' )
WITH CHECK ( bucket_id = 'project-files' );

COMMIT;
