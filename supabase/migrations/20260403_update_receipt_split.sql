-- update_receipt_split
-- Atomically updates an existing receipt: overwrites items and assignments.
-- ACID compliant: all changes succeed or none do (plpgsql implicit transaction).

CREATE OR REPLACE FUNCTION update_receipt_split(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id       uuid;
  v_receipt_id    uuid;
  v_item          record;
  v_contact       record;
  v_assignment    record;
  v_item_map      jsonb := '{}'::jsonb;
  v_contact_db_id uuid;
  v_db_item_id    uuid;
BEGIN
  -- 1. Verify ownership of the receipt
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_receipt_id := (payload->>'receipt_id')::uuid;

  IF NOT EXISTS (
    SELECT 1 FROM receipts WHERE id = v_receipt_id AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Receipt not found or access denied';
  END IF;

  -- 2. Update the parent receipts row (total, tax, tip, merchant)
  UPDATE receipts SET
    receipt_name = COALESCE(payload->>'receipt_name', receipt_name),
    total_amount = COALESCE((payload->>'total_amount')::numeric, total_amount),
    tax_amount   = COALESCE((payload->>'tax_amount')::numeric, tax_amount),
    tip_amount   = COALESCE((payload->>'tip_amount')::numeric, tip_amount),
    created_at   = COALESCE((payload->>'created_at')::timestamptz, created_at)
  WHERE id = v_receipt_id;

  -- 3. DELETE all existing assignments first, then receipt_items
  --    (Deleting assignments before items avoids FK violations if no cascade)
  DELETE FROM assignments
  WHERE item_id IN (
    SELECT id FROM receipt_items WHERE receipt_id = v_receipt_id
  );

  DELETE FROM receipt_items WHERE receipt_id = v_receipt_id;

  -- 4. INSERT the new receipt_items
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

      -- Map frontend id → new DB id
      v_item_map := v_item_map || jsonb_build_object(v_item.value->>'id', v_db_item_id);
    END LOOP;
  END IF;

  -- 5. INSERT the new item_assignments (upsert contacts first)
  IF payload->'contacts' IS NOT NULL THEN
    FOR v_contact IN SELECT * FROM jsonb_array_elements(payload->'contacts')
    LOOP
      SELECT id INTO v_contact_db_id
      FROM contacts
      WHERE user_id = v_user_id
        AND phone_number = COALESCE(v_contact.value->>'phone_number', 'no-phone')
      LIMIT 1;

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

      IF v_contact.value->'item_ids' IS NOT NULL THEN
        FOR v_assignment IN SELECT * FROM jsonb_array_elements_text(v_contact.value->'item_ids')
        LOOP
          v_db_item_id := (v_item_map->>v_assignment.value)::uuid;
          IF v_db_item_id IS NOT NULL THEN
            INSERT INTO assignments (item_id, contact_id)
            VALUES (v_db_item_id, v_contact_db_id);
          END IF;
        END LOOP;
      END IF;
    END LOOP;
  END IF;

  RETURN jsonb_build_object('receipt_id', v_receipt_id);
END;
$$;
