-- Add email column to profiles so username-based login can look up the
-- corresponding email address without exposing auth.users to the client.
ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS email TEXT;
