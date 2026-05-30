-- payment_requests
-- Tracks per-person payment status for each receipt split.
-- Phase 2: status UI + manual mark paid/unpaid (in-app only)
-- Phase 3: adds token-based shareable links + "I sent it" web flow
-- Phase 4: adds push notifications + anonymous read/update policies

CREATE TABLE IF NOT EXISTS payment_requests (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_id   UUID        NOT NULL REFERENCES receipts(id)    ON DELETE CASCADE,
    contact_id   UUID        NOT NULL REFERENCES contacts(id)    ON DELETE CASCADE,
    owner_id     UUID        NOT NULL REFERENCES auth.users(id)  ON DELETE CASCADE,

    -- 24-char hex token used for the shareable pay link (Phase 3)
    token        TEXT        NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(12), 'hex'),

    amount       NUMERIC(10,2) NOT NULL DEFAULT 0,
    items        JSONB         NOT NULL DEFAULT '[]',

    status       TEXT        NOT NULL DEFAULT 'unpaid'
                               CHECK (status IN ('unpaid', 'requested', 'pending', 'settled')),

    requested_at TIMESTAMPTZ,
    pending_at   TIMESTAMPTZ,
    settled_at   TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- One row per person per receipt
    UNIQUE (receipt_id, contact_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS payment_requests_receipt_idx ON payment_requests (receipt_id);
CREATE INDEX IF NOT EXISTS payment_requests_owner_idx   ON payment_requests (owner_id);
CREATE INDEX IF NOT EXISTS payment_requests_token_idx   ON payment_requests (token);

-- RLS
ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;

-- Authenticated owner has full access to their own rows
CREATE POLICY "owner_full_access" ON payment_requests
    FOR ALL
    USING  (owner_id = auth.uid())
    WITH CHECK (owner_id = auth.uid());

-- Phase 4 policies (uncomment when building the web pay page):
-- Anonymous users can read a single row by token
-- CREATE POLICY "anon_read_by_token" ON payment_requests
--     FOR SELECT TO anon USING (true);
