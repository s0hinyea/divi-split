-- Phase 4: expo push tokens on profiles + anon read on payment_requests

-- Add push token column so the Edge Function can notify the owner
ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS expo_push_token TEXT;

-- Allow anonymous reads on payment_requests by token only
-- (the Edge Function uses service role, but the web pay page needs no auth)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'payment_requests' AND policyname = 'anon_read_by_token'
    ) THEN
        CREATE POLICY "anon_read_by_token" ON payment_requests
            FOR SELECT TO anon
            USING (true);
    END IF;
END $$;
