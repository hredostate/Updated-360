import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase: SupabaseClient | null = null;
let supabaseError: string | null = null;

if (!supabaseUrl || !supabaseAnonKey) {
  supabaseError = "Supabase URL and Anon Key must be provided. Please create a '.env' file in the project root and add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY. Refer to README.md for details.";
} else if (supabaseUrl.includes('mcmdtifvvbtolrscktdk')) {
  supabaseError = "A placeholder Supabase URL was detected. Please update your environment variables with your actual Supabase Project URL. Refer to the project's README.md for setup instructions.";
} else {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      }
    });
  } catch (e: any) {
    supabaseError = `Failed to initialize Supabase client: ${e.message}`;
  }
}

export { supabase, supabaseError };