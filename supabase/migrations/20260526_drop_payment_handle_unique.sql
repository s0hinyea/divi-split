-- Remove unique constraints on payment handle columns.
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_cashapp_handle_key;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_venmo_handle_key;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_zelle_number_key;
