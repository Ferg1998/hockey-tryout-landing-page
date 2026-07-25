import { getSupabaseClient } from "@/lib/supabase/client"

const SELECT_COLUMNS =
  "id, organization_name, slug, logo, banner_image, website, email, phone, city, province, address, google_maps_link, description, verified, created_at"

// Shape of a row in the Supabase `Organizations` table (snake_case columns).
export type OrganizationRow = {
  id: string | number
  organization_name: string
  slug: string | null
  logo: string | null
  banner_image: string | null
  website: string | null
  email: string | null
  phone: string | null
  city: string | null
  province: string | null
  address: string | null
  google_maps_link: string | null
  description: string | null
  verified: boolean | null
  created_at: string | null
}

// Camel-cased shape used throughout the app.
export type Organization = {
  id: string
  name: string
  slug: string
  logo?: string
  bannerImage?: string
  website?: string
  email?: string
  phone?: string
  city?: string
  province?: string
  address?: string
  googleMapsLink?: string
  description?: string
  verified: boolean
  createdAt?: string
}

function str(v: unknown): string | undefined {
  if (typeof v === "string" && v.trim().length > 0) return v.trim()
  if (typeof v === "number") return String(v)
  return undefined
}

/**
 * True for errors that mean the table simply isn't readable by the current role
 * (RLS/grant not applied yet: code 42501) or doesn't exist yet (42P01). Public
 * pages should degrade to an empty state in these cases rather than crash, so a
 * missing migration never takes the whole site down.
 */
export function isPublicReadBlocked(
  error: { code?: string; message?: string } | null,
): boolean {
  if (!error) return false
  const msg = error.message ?? ""
  return (
    error.code === "42501" ||
    error.code === "42P01" ||
    /permission denied/i.test(msg) ||
    /does not exist/i.test(msg)
  )
}

export function mapOrganization(row: OrganizationRow): Organization {
  return {
    id: String(row.id),
    name: row.organization_name,
    slug: row.slug ?? String(row.id),
    logo: str(row.logo),
    bannerImage: str(row.banner_image),
    website: str(row.website),
    email: str(row.email),
    phone: str(row.phone),
    city: str(row.city),
    province: str(row.province),
    address: str(row.address),
    googleMapsLink: str(row.google_maps_link),
    description: str(row.description),
    verified: Boolean(row.verified),
    createdAt: str(row.created_at),
  }
}

/**
 * Fetches all organizations. Returns an empty array when Supabase is not
 * configured so callers can render an empty state.
 */
export async function fetchOrganizations(): Promise<Organization[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from("Organizations")
    .select(SELECT_COLUMNS)
    .order("organization_name", { ascending: true })

  if (error) {
    if (isPublicReadBlocked(error)) return []
    throw new Error(error.message)
  }
  return (data ?? []).map((row) => mapOrganization(row as OrganizationRow))
}

/**
 * Fetches a single organization by its slug. Returns null when not found or
 * Supabase is not configured.
 */
export async function fetchOrganizationBySlug(
  slug: string,
): Promise<Organization | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const { data, error } = await supabase
    .from("Organizations")
    .select(SELECT_COLUMNS)
    .eq("slug", slug)
    .maybeSingle()

  if (error) {
    if (isPublicReadBlocked(error)) return null
    throw new Error(error.message)
  }
  return data ? mapOrganization(data as OrganizationRow) : null
}

/** Fetches a single organization by id. Returns null when not found. */
export async function fetchOrganizationById(
  id: string,
): Promise<Organization | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const { data, error } = await supabase
    .from("Organizations")
    .select(SELECT_COLUMNS)
    .eq("id", id)
    .maybeSingle()

  if (error) {
    if (isPublicReadBlocked(error)) return null
    throw new Error(error.message)
  }
  return data ? mapOrganization(data as OrganizationRow) : null
}
