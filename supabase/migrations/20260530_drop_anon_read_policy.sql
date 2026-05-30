-- Drop the overly permissive anon read policy on payment_requests.
-- The get_pay_page_data RPC is SECURITY DEFINER and handles all anon access
-- by token, so this policy is unnecessary and exposes all rows to anyone
-- with the public anon key.
DROP POLICY IF EXISTS "anon_read_by_token" ON payment_requests;
