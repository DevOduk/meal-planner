import { createClient } from '@supabase/supabase-js';

// Replace these with your actual values from the Supabase dashboard
// It is best practice to use Environment Variables (.env) for these
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);