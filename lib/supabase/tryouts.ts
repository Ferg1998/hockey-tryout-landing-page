import { getSupabaseClient } from "@/lib/supabase/client"
import type { TryoutListing } from "@/lib/data"

const SELECT_COLUMNS =
  "id, team, city, province, birth_year, age_group, level, dates, arena, cost, status, registration_link, image, organization_id, team_id"

// Shape of a row in the Supabase `tryouts` table (snake_case columns).
type TryoutRow = {
  id: string | number
  team: string
  city: string
  province: string
  birth_year: string | number
  age_group: string
  level: string
  dates: string
  arena: string | null
  cost: string | null
  status: string | null
  registration_link: string | null
  image: string | null
  organization_id?: string | number | null
  team_id?: string | number | null
}

const VALID_STATUSES: TryoutListing["status"][] = [
  "Open",
  "Closing Soon",
  "Waitlist",
  "Full",
  "Closed",
]

function mapRow(row: TryoutRow): TryoutListing {
  const status = VALID_STATUSES.includes(row.status as TryoutListing["status"])
    ? (row.status as TryoutListing["status"])
    : "Open"

  return {
    id: String(row.id),
    team: row.team,
    city: row.city,
    province: row.province,
    birthYear: String(row.birth_year),
    ageGroup: row.age_group,
    level: row.level,
    dates: row.dates,
    arena: row.arena ?? "Arena TBA",
    cost: row.cost ?? "—",
    status,
    registrationLink: row.registration_link ?? "#",
    image: row.image ?? "/placeholder.svg",
    organizationId: row.organization_id != null ? String(row.organization_id) : undefined,
    teamId: row.team_id != null ? String(row.team_id) : undefined,
  }
}

export type TryoutsResult = {
  /** Listings mapped from the `tryouts` table (empty array when configured but no rows). */
  data: TryoutListing[]
  /** Whether the data came from Supabase or the local sample fallback. */
  source: "supabase" | "local"
}

/**
 * Fetches all tryouts from the Supabase `tryouts` table.
 * Returns source: "local" (and no data) when Supabase is not configured, so the
 * caller can fall back to the bundled sample data.
 */
export async function fetchTryouts(): Promise<TryoutsResult> {
  const supabase = getSupabaseClient()
  if (!supabase) {
    return { data: [], source: "local" }
  }

  const { data, error } = await supabase
    .from("Tryouts")
    .select(SELECT_COLUMNS)
    .order("dates", { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return { data: (data ?? []).map((row) => mapRow(row as TryoutRow)), source: "supabase" }
}

/**
 * Fetches a single tryout from the Supabase `Tryouts` table by id.
 * Returns null when Supabase is not configured or no matching row exists.
 */
export async function fetchTryoutById(
  id: string,
): Promise<TryoutListing | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const { data, error } = await supabase
    .from("Tryouts")
    .select(SELECT_COLUMNS)
    .eq("id", id)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data ? mapRow(data as TryoutRow) : null
}

/**
 * Richer tryout shape for the detail page. All extended fields are optional so
 * the page renders whatever columns exist in the table and gracefully hides
 * sections when a column is absent (or empty). Nothing is hardcoded.
 */
export type TryoutFull = TryoutListing & {
  organization?: string
  logo?: string
  heroImage?: string
  arenaAddress?: string
  googleMapsLink?: string
  positionsNeeded?: string
  startDate?: string
  endDate?: string
  times?: string
  registrationDeadline?: string
  website?: string
  contactName?: string
  contactEmail?: string
  contactPhone?: string
  description?: string
  equipment?: string
  maxPlayers?: number
  currentRegistrations?: number
  featured?: boolean
  verified?: boolean
}

// Reads the first present, non-empty value among several possible column names.
function pick(row: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = row[key]
    if (typeof value === "string" && value.trim().length > 0) return value.trim()
    if (typeof value === "number") return String(value)
  }
  return undefined
}

// Reads an integer value, returning undefined when absent or not numeric.
function pickNumber(row: Record<string, unknown>, ...keys: string[]): number | undefined {
  for (const key of keys) {
    const value = row[key]
    if (typeof value === "number" && Number.isFinite(value)) return value
    if (typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value))) {
      return Number(value)
    }
  }
  return undefined
}

// Reads a boolean value, tolerating true/false, "true"/"false", and 1/0.
function pickBool(row: Record<string, unknown>, ...keys: string[]): boolean {
  for (const key of keys) {
    const value = row[key]
    if (typeof value === "boolean") return value
    if (typeof value === "number") return value === 1
    if (typeof value === "string") {
      const v = value.trim().toLowerCase()
      if (v === "true" || v === "yes" || v === "1") return true
      if (v === "false" || v === "no" || v === "0") return false
    }
  }
  return false
}

export function mapFullRow(row: Record<string, unknown>): TryoutFull {
  const base = mapRow(row as TryoutRow)
  return {
    ...base,
    organization: pick(row, "organization", "org", "association", "club"),
    logo: pick(row, "logo", "logo_url", "team_logo", "logoUrl"),
    heroImage: pick(row, "hero_image", "heroImage", "banner", "cover_image"),
    arenaAddress: pick(row, "arena_address", "arenaAddress", "address"),
    googleMapsLink: pick(row, "google_maps_link", "googleMapsLink", "maps_link", "map_link"),
    positionsNeeded: pick(row, "positions_needed", "positionsNeeded", "positions"),
    startDate: pick(row, "start_date", "startDate", "tryout_start_date"),
    endDate: pick(row, "end_date", "endDate", "tryout_end_date"),
    times: pick(row, "times", "tryout_times", "schedule", "time"),
    registrationDeadline: pick(
      row,
      "registration_deadline",
      "deadline",
      "registration_close",
      "close_date",
    ),
    website: pick(row, "website", "url", "site", "web"),
    contactName: pick(row, "contact_name", "contactName", "contact"),
    contactEmail: pick(row, "contact_email", "email", "contactEmail"),
    contactPhone: pick(row, "contact_phone", "phone", "contactPhone", "telephone"),
    description: pick(row, "description", "details", "about", "summary"),
    equipment: pick(row, "equipment", "equipment_required", "gear", "requirements"),
    maxPlayers: pickNumber(row, "max_players", "maxPlayers", "maximum_players"),
    currentRegistrations: pickNumber(
      row,
      "current_registrations",
      "currentRegistrations",
      "registrations",
    ),
    featured: pickBool(row, "featured", "featured_tryout", "is_featured"),
    verified: pickBool(row, "verified", "verified_organization", "is_verified"),
  }
}

/**
 * Fetches a single tryout with all available columns (`select("*")`), so
 * optional detail fields are included without failing when a column is missing.
 */
export async function fetchTryoutFullById(
  id: string,
): Promise<TryoutFull | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const { data, error } = await supabase
    .from("Tryouts")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data ? mapFullRow(data as Record<string, unknown>) : null
}

/**
 * Fetches related tryouts (same province, then topped up by same level),
 * excluding the current tryout. Returns an empty array when Supabase is not
 * configured so the caller can fall back to local sample data.
 */
export async function fetchRelatedTryouts(
  current: Pick<TryoutListing, "id" | "province" | "level">,
  limit = 3,
): Promise<TryoutListing[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from("Tryouts")
    .select(SELECT_COLUMNS)
    .neq("id", current.id)
    .or(`province.eq.${current.province},level.eq.${current.level}`)
    .limit(limit)

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map((row) => mapRow(row as TryoutRow))
}

/** Fetches all tryouts linked to a given team id. */
export async function fetchTryoutsByTeam(teamId: string): Promise<TryoutListing[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from("Tryouts")
    .select(SELECT_COLUMNS)
    .eq("team_id", teamId)
    .order("dates", { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => mapRow(row as TryoutRow))
}

/** Fetches all tryouts linked to a given organization id. */
export async function fetchTryoutsByOrganization(
  organizationId: string,
): Promise<TryoutListing[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from("Tryouts")
    .select(SELECT_COLUMNS)
    .eq("organization_id", organizationId)
    .order("dates", { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => mapRow(row as TryoutRow))
}
