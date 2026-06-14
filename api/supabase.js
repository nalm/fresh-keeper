import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Check if real keys are supplied or if it's using the placeholders
export const useSupabase = 
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-project') && 
  supabaseAnonKey !== 'your-supabase-anon-key';

if (!useSupabase) {
  console.log('NOTICE: Supabase credentials not found or placeholder detected. FreshKeeper will run in LOCAL JSON DB fallback mode.');
}

export const supabase = useSupabase ? createClient(supabaseUrl, supabaseAnonKey) : null;
