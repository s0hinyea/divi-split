-- Only the OCR Edge Function (service role) may read or change scan usage.
-- A reservation prevents two simultaneous free scans from both claiming the last slot.
CREATE TABLE IF NOT EXISTS public.ocr_scan_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  state text NOT NULL DEFAULT 'pending' CHECK (state IN ('pending', 'succeeded', 'released')),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '90 seconds')
);

CREATE INDEX IF NOT EXISTS ocr_scan_attempts_user_state_idx
  ON public.ocr_scan_attempts (user_id, state, expires_at);

-- Pro is unlimited over the subscription lifetime, not unbounded requests per minute.
CREATE TABLE IF NOT EXISTS public.ocr_scan_requests (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ocr_scan_requests_user_time_idx
  ON public.ocr_scan_requests (user_id, created_at DESC);

ALTER TABLE public.ocr_scan_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ocr_scan_attempts FROM PUBLIC, anon, authenticated;
ALTER TABLE public.ocr_scan_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ocr_scan_requests FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.allow_scan_request(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));
  IF (SELECT count(*) FROM public.ocr_scan_requests
      WHERE user_id = p_user_id AND created_at > now() - interval '1 minute') >= 12 THEN
    RETURN false;
  END IF;
  DELETE FROM public.ocr_scan_requests
    WHERE user_id = p_user_id AND created_at < now() - interval '1 day';
  INSERT INTO public.ocr_scan_requests (user_id) VALUES (p_user_id);
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.scan_quota_status(p_user_id uuid)
RETURNS integer
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT count(*)::integer FROM public.ocr_scan_attempts
  WHERE user_id = p_user_id AND state = 'succeeded';
$$;

CREATE OR REPLACE FUNCTION public.reserve_free_scan(p_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_id uuid;
BEGIN
  -- Same-user requests serialize; different users do not block one another.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));
  IF (SELECT count(*) FROM public.ocr_scan_attempts
      WHERE user_id = p_user_id AND
        (state = 'succeeded' OR (state = 'pending' AND expires_at > now()))) >= 5 THEN
    RETURN NULL;
  END IF;
  INSERT INTO public.ocr_scan_attempts (user_id) VALUES (p_user_id) RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.finish_free_scan(p_user_id uuid, p_attempt_id uuid, p_success boolean)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_state text;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));
  SELECT state INTO v_state FROM public.ocr_scan_attempts
    WHERE id = p_attempt_id AND user_id = p_user_id FOR UPDATE;
  IF v_state IS DISTINCT FROM 'pending' THEN RETURN false; END IF;
  IF p_success AND (SELECT count(*) FROM public.ocr_scan_attempts
                    WHERE user_id = p_user_id AND state = 'succeeded') >= 5 THEN
    UPDATE public.ocr_scan_attempts SET state = 'released' WHERE id = p_attempt_id;
    RETURN false;
  END IF;
  UPDATE public.ocr_scan_attempts SET state = CASE WHEN p_success THEN 'succeeded' ELSE 'released' END
    WHERE id = p_attempt_id;
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.scan_quota_status(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.allow_scan_request(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reserve_free_scan(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.finish_free_scan(uuid, uuid, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.scan_quota_status(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.allow_scan_request(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.reserve_free_scan(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.finish_free_scan(uuid, uuid, boolean) TO service_role;
