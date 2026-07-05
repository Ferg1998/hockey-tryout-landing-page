import { createClient, type SupabaseClient } from "@supabase/supabase-js"

/**
 * Normalizes the Supabase project URL. The supabase-js client appends its own
 * `/rest/v1` (and other) paths, so the base URL must be the bare project origin
 * (e.g. https://xxxx.supabase.co). This strips any trailing slash or accidental
 * `/rest/v1` suffix so the client works regardless of exactly what was pasted.
 */
function normalizeSupabaseUrl(url: string | undefined): string | undefined {
  if (!url) return url
  return url
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/rest\/v\d+$/i, "")
}

const supabaseUrl = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/**
 * Returns true when both public Supabase env vars are present.
 * Used to decide whether to query Supabase or fall back to local data.
 */
export const isSupabaseConfigured =
  typeof supabaseUrl === "string" &&
  supabaseUrl.length > 0 &&
  typeof supabaseAnonKey === "string" &&
  supabaseAnonKey.length > 0

let browserClient: SupabaseClient | null = null

/**
 * Returns a singleton Supabase browser client, or null when the app has not
 * been configured with NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null
  if (!browserClient) {
    browserClient = createClient(supabaseUrl as string, supabaseAnonKey as string)
  }
  return browserClient
}
