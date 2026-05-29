-- RPC: returns all data needed to render the pay page, callable by anon.
-- SECURITY DEFINER so it can read across tables without exposing them directly.
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

    SELECT full_name, venmo_handle, cashapp_handle, zelle_number, expo_push_token
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
        'zelle',        v_owner.zelle_number,
        'push_token',   v_owner.expo_push_token
    );
END;
$$;

GRANT EXECUTE ON FUNCTION get_pay_page_data(TEXT) TO anon;
