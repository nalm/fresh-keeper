import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('WARNING: SUPABASE_URL or SUPABASE_ANON_KEY is not defined in the environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
