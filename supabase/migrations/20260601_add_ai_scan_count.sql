-- Add server-side AI scan count to profiles to prevent reinstall abuse
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS ai_scan_count integer NOT NULL DEFAULT 0;
