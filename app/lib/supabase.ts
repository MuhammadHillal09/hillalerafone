import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

// Initialize the Supabase SSR browser client so it syncs sessions to Cookies automatically
export const supabase = createBrowserClient(supabaseUrl || '', supabaseAnonKey || '');
