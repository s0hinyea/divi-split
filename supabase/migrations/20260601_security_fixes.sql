-- Remove push_token from get_pay_page_data RPC response.
-- The Netlify pay page does not use it; push notifications are sent
-- by the pay edge function (service role). Returning it to anon callers
-- would let anyone with a payment link spam push notifications to the owner.
CREATE OR REPLACE FUNCTION get_pay_page_data(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_pr  RECORD;
    v_contact_name TEXT;
    v_owner RECORD;
BEGIN
    SELECT id, status, amount, items, token, contact_id, owner_id
    INTO v_pr
    FROM payment_requests
    WHERE token = p_token
    LIMIT 1;

    IF NOT FOUND THEN RETURN NULL; END IF;

    SELECT contact_name INTO v_contact_name
    FROM contacts WHERE id = v_pr.contact_id;

    SELECT full_name, venmo_handle, cashapp_handle, zelle_number
    INTO v_owner
    FROM profiles WHERE id = v_pr.owner_id;

    RETURN jsonb_build_object(
        'id',           v_pr.id,
        'status',       v_pr.status,
        'amount',       v_pr.amount,
        'items',        v_pr.items,
        'token',        v_pr.token,
        'contact_name', COALESCE(v_contact_name, 'You'),
        'owner_name',   COALESCE(v_owner.full_name, 'Someone'),
        'venmo',        v_owner.venmo_handle,
        'cashapp',      v_owner.cashapp_handle,
        'zelle',        v_owner.zelle_number
    );
END;
$$;

GRANT EXECUTE ON FUNCTION get_pay_page_data(TEXT) TO anon;
