import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "./environment";

let client: SupabaseClient | null = null;

export function isSupabaseConfigured() {
  return Boolean(env.supabaseUrl && env.supabaseServiceRoleKey);
}

/**
 * Service-role client for a future Supabase adapter.
 * The running directory currently reads and writes the local JSON store so the
 * app works before a Supabase project exists. Apply database/migrations first,
 * then keep the service-role key on the server only.
 */
export function getSupabase() {
  if (!isSupabaseConfigured()) return null;
  if (!client) {
    client = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}
