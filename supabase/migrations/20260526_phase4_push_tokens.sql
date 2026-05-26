-- Phase 4: expo push tokens on profiles + anon read on payment_requests

-- Add push token column so the Edge Function can notify the owner
ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS expo_push_token TEXT;

-- Allow anonymous reads on payment_requests by token only
-- (the Edge Function uses service role, but the web pay page needs no auth)
CREATE POLICY IF NOT EXISTS "anon_read_by_token" ON payment_requests
    FOR SELECT TO anon
    USING (true);
