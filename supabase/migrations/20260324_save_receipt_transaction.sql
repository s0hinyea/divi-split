-- save_receipt_transaction
-- Accepts one JSON payload and atomically saves:
--   receipt → receipt_items → contacts (upsert) → assignments
-- If anything fails the entire transaction is rolled back.

CREATE OR REPLACE FUNCTION save_receipt_transaction(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER          -- runs with table-owner privileges
SET search_path = public  -- avoid schema hijacking
AS $$
DECLARE
  v_user_id       uuid;
  v_receipt       record;
  v_item          record;
  v_contact       record;
  v_assignment     record;
  v_receipt_id    uuid;
  v_item_map      jsonb := '{}'::jsonb;   -- frontend_id → db_id
  v_contact_db_id uuid;
  v_db_item_id    uuid;
BEGIN
  -- ── 0. Auth check ─────────────────────────────────────
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- ── 1. Insert receipt ─────────────────────────────────
  INSERT INTO receipts (user_id, receipt_name, total_amount, tax_amount, tip_amount, created_at)
  VALUES (
    v_user_id,
    COALESCE(payload->>'receipt_name', 'Untitled Receipt'),
    COALESCE((payload->>'total_amount')::numeric, 0),
    COALESCE((payload->>'tax_amount')::numeric, 0),
    COALESCE((payload->>'tip_amount')::numeric, 0),
    COALESCE((payload->>'created_at')::timestamptz, now())
  )
  RETURNING id INTO v_receipt_id;

  -- ── 2. Insert receipt items ───────────────────────────
  IF payload->'items' IS NOT NULL THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(payload->'items')
    LOOP
      INSERT INTO receipt_items (receipt_id, item_name, item_price)
      VALUES (
        v_receipt_id,
        v_item.value->>'name',
        (v_item.value->>'price')::numeric
      )
      RETURNING id INTO v_db_item_id;

      -- Map frontend id → database id
      v_item_map := v_item_map || jsonb_build_object(v_item.value->>'id', v_db_item_id);
    END LOOP;
  END IF;

  -- ── 3. Upsert contacts & insert assignments ──────────
  IF payload->'contacts' IS NOT NULL THEN
    FOR v_contact IN SELECT * FROM jsonb_array_elements(payload->'contacts')
    LOOP
      -- Try to find existing contact by phone for this user
      SELECT id INTO v_contact_db_id
      FROM contacts
      WHERE user_id = v_user_id
        AND phone_number = COALESCE(v_contact.value->>'phone_number', 'no-phone')
      LIMIT 1;

      -- If not found, insert
      IF v_contact_db_id IS NULL THEN
        INSERT INTO contacts (user_id, contact_name, phone_number, contact_id)
        VALUES (
          v_user_id,
          v_contact.value->>'name',
          COALESCE(v_contact.value->>'phone_number', 'no-phone'),
          v_contact.value->>'frontend_id'
        )
        RETURNING id INTO v_contact_db_id;
      END IF;

      -- Insert assignments for this contact
      IF v_contact.value->'item_ids' IS NOT NULL THEN
        FOR v_assignment IN SELECT * FROM jsonb_array_elements_text(v_contact.value->'item_ids')
        LOOP
          -- Look up the real DB item id from our map
          v_db_item_id := (v_item_map->>v_assignment.value)::uuid;
          IF v_db_item_id IS NOT NULL THEN
            INSERT INTO assignments (item_id, contact_id)
            VALUES (v_db_item_id, v_contact_db_id);
          END IF;
        END LOOP;
      END IF;
    END LOOP;
  END IF;

  -- ── 4. Return the receipt id so frontend can reference it ─
  RETURN jsonb_build_object('receipt_id', v_receipt_id);
END;
$$;
