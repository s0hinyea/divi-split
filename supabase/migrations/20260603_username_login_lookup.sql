-- Allows unauthenticated callers to resolve a username to an email for login.
-- Returns only the email address; no other profile data is exposed.
CREATE OR REPLACE FUNCTION get_email_by_username(p_username TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_email TEXT;
BEGIN
    SELECT email INTO v_email
    FROM profiles
    WHERE username = lower(trim(p_username))
    LIMIT 1;

    RETURN v_email;
END;
$$;

GRANT EXECUTE ON FUNCTION get_email_by_username(TEXT) TO anon;
