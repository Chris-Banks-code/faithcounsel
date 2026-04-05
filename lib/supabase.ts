import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (_client) return _client;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      `Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL=${!!supabaseUrl}, NEXT_PUBLIC_SUPABASE_ANON_KEY=${!!supabaseAnonKey}`
    );
  }

  _client = createClient(supabaseUrl, supabaseAnonKey);
  return _client;
}

// Legacy named export for backwards compatibility
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return () => getSupabase()[prop as keyof SupabaseClient];
  },
});
