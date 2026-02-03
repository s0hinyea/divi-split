import { createClient } from '@supabase/supabase-js';

// Create Supabase client with SERVICE ROLE key
// This bypasses Row Level Security - use only on backend!
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseServiceKey);
