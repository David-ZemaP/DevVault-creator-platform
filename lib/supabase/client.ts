import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseClientConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes("your-project.supabase.co") &&
  !supabaseAnonKey.includes("your_anon_key") &&
  supabaseUrl.startsWith("http")
);

let cachedBrowserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (!isSupabaseClientConfigured || !supabaseUrl || !supabaseAnonKey) {
    return null;
  }
  if (!cachedBrowserClient) {
    cachedBrowserClient = createClient(supabaseUrl, supabaseAnonKey);
  }
  return cachedBrowserClient;
}

/**
 * Standard Supabase client instance for client-side execution.
 * Null when Supabase environment variables are missing or placeholders.
 */
export const supabase = isSupabaseClientConfigured && supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
