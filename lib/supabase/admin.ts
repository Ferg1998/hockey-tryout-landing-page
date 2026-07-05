import "server-only"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"

function normalizeSupabaseUrl(url: string | undefined): string | undefined {
  if (!url) return url
  return url
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/rest\/v\d+$/i, "")
}

const supabaseUrl = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

/**
 * True when the server has everything needed to perform privileged writes.
 */
export const isAdminConfigured =
  typeof supabaseUrl === "string" &&
  supabaseUrl.length > 0 &&
  typeof serviceRoleKey === "string" &&
  serviceRoleKey.length > 0

let adminClient: SupabaseClient | null = null

/**
 * Returns a singleton Supabase client authenticated with the service role key.
 * This client bypasses RLS and MUST only ever be used in server-side code
 * (Server Actions / Route Handlers). It is never sent to the browser.
 */
export function getSupabaseAdminClient(): SupabaseClient {
  if (!isAdminConfigured) {
    throw new Error(
      "Supabase admin is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    )
  }
  if (!adminClient) {
    adminClient = createClient(supabaseUrl as string, serviceRoleKey as string, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }
  return adminClient
}
