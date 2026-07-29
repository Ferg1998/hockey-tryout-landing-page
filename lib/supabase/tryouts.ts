import { getSupabaseClient } from "@/lib/supabase/client"
import type { TryoutListing } from "@/lib/data"

// Plain snapshot columns — used as a resilient fallback when the normalized
// relationships aren't available yet (e.g. migration not applied). Keeping this
// path guarantees the public search never regresses.
const PLAIN_SELECT =
  "id, team, city, province, birth_year, age_group, level, dates, arena, cost, status, registration_link, image, organization_id, team_id"

// Normalized select: embeds the linked Team and, through it, the owning
// Organization. Also embeds the Organization directly off the tryout so legacy
// rows that set organization_id (but no team_id) still resolve an org.
const JOIN_SELECT = `
  id, team, city, province, birth_year, age_group, level, dates, arena, cost, status, registration_link, image, organization_id, team_id,
  team_rel:Teams!team_id (
    id, slug, team_name, logo, level, age_group, birth_year, city, province,
    organization:Organizations!organization_id ( id, slug, organization_name, logo, banner_image, verified )
  ),
  org_rel:Organizations!organization_id ( id, slug, organization_name, logo, banner_image, verified )
`

// Full select: every Tryouts column (so extended detail/edit fields resolve)
// plus the same Team/Organization embeds. Used by the detail page and the admin
// edit form, where all optional columns must round-trip.
const FULL_JOIN_SELECT = `
  *,
  team_rel:Teams!team_id (
    id, slug, team_name, logo, level, age_group, birth_year, city, province,
    organization:Organizations!organization_id ( id, slug, organization_name, logo, banner_image, verified )
  ),
  org_rel:Organizations!organization_id ( id, slug, organization_name, logo, banner_image, verified )
`

// Embedded organization shape.
type OrgEmbed = {
  id: string | number
  slug: string | null
  organization_name: string | null
  logo: string | null
  banner_image: string | null
  verified: boolean | null
}

// Embedded team shape (with its nested organization).
type TeamEmbed = {
  id: string | number
  slug: string | null
  team_name: string | null
  logo: string | null
  level: string | null
  age_group: string | null
  birth_year: string | number | null
  city: string | null
  province: string | null
  organization: OrgEmbed | OrgEmbed[] | null
}

// Shape of a row in the Supabase `Tryouts` table (snake_case columns), plus the
// optional embedded relationships returned by the normalized query.
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
  team_rel?: TeamEmbed | TeamEmbed[] | null
  org_rel?: OrgEmbed | OrgEmbed[] | null
}

const VALID_STATUSES: TryoutListing["status"][] = [
  "Open",
  "Closing Soon",
  "Waitlist",
  "Full",
  "Closed",
]

// Supabase may return a to-one embed as a single object or a one-element array
// depending on how the relationship is inferred. Normalize to a single value.
function one<T>(value: T | T[] | null | undefined): T | undefined {
  if (Array.isArray(value)) return value[0]
  return value ?? undefined
}

// A non-empty trimmed string, or undefined.
function str(value: string | number | null | undefined): string | undefined {
  if (typeof value === "number") return String(value)
  if (typeof value === "string" && value.trim().length > 0) return value.trim()
  return undefined
}

function mapRow(row: TryoutRow): TryoutListing {
  const status = VALID_STATUSES.includes(row.status as TryoutListing["status"])
    ? (row.status as TryoutListing["status"])
    : "Open"

  const team = one(row.team_rel)
  // Prefer the organization reached through the team; fall back to the tryout's
  // direct organization link (legacy rows).
  const org = one(team?.organization) ?? one(row.org_rel)

  // Identity + location are owned by the Team when linked, otherwise fall back
  // to the tryout's own snapshot columns.
  const teamName = str(team?.team_name) ?? row.team
  const city = str(team?.city) ?? row.city
  const province = str(team?.province) ?? row.province
  const birthYear = str(team?.birth_year) ?? String(row.birth_year ?? "")
  const ageGroup = str(team?.age_group) ?? row.age_group
  const level = str(team?.level) ?? row.level

  return {
    id: String(row.id),
    team: teamName,
    city,
    province,
    birthYear,
    ageGroup,
    level,
    dates: row.dates,
    arena: row.arena ?? "Arena TBA",
    cost: row.cost ?? "—",
    status,
    registrationLink: row.registration_link ?? "#",
    image: str(row.image) ?? "",
    organizationId:
      str(org?.id) ?? (row.organization_id != null ? String(row.organization_id) : undefined),
    teamId: str(team?.id) ?? (row.team_id != null ? String(row.team_id) : undefined),
    teamSlug: str(team?.slug),
    teamLogo: str(team?.logo),
    organizationName: str(org?.organization_name),
    organizationSlug: str(org?.slug),
    organizationLogo: str(org?.logo),
    organizationBanner: str(org?.banner_image),
    verified: Boolean(org?.verified),
  }
}

// Detects errors that mean "the normalized JOIN isn't usable here", so read
// paths can gracefully fall back to the plain snapshot select. This covers both
// the relationship/table not existing (migration not applied) AND the embedded
// Teams/Organizations tables being blocked by RLS for the anon role (code
// 42501 "permission denied"). In every one of these cases the base Tryouts
// table is still readable, so the fallback lets valid rows render.
function shouldFallbackToPlain(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false
  const msg = error.message ?? ""
  return (
    error.code === "PGRST200" || // could not find a relationship in schema cache
    error.code === "42P01" || // undefined_table
    error.code === "42501" || // insufficient_privilege (RLS on embedded table)
    /permission denied/i.test(msg) ||
    /relationship/i.test(msg) ||
    /schema cache/i.test(msg) ||
    /does not exist/i.test(msg)
  )
}

/**
 * Runs a list query with the normalized JOIN_SELECT, transparently falling back
 * to the PLAIN_SELECT (snapshot columns) if the relationships aren't available.
 * `apply` layers the filters/order onto the base query.
 */
async function fetchList(
  apply: (q: any) => any,
): Promise<TryoutListing[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  const joined = await apply(supabase.from("Tryouts").select(JOIN_SELECT))
  if (!joined.error) {
    return (joined.data ?? []).map((r: unknown) => mapRow(r as TryoutRow))
  }
  if (!shouldFallbackToPlain(joined.error)) {
    throw new Error(joined.error.message)
  }

  const plain = await apply(supabase.from("Tryouts").select(PLAIN_SELECT))
  if (plain.error) throw new Error(plain.error.message)
  return (plain.data ?? []).map((r: unknown) => mapRow(r as TryoutRow))
}

/** Runs a single-row query with join + fallback semantics. */
async function fetchOne(
  apply: (q: any) => any,
  selectCols: string = JOIN_SELECT,
): Promise<TryoutRow | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const joined = await apply(supabase.from("Tryouts").select(selectCols)).maybeSingle()
  if (!joined.error) return (joined.data as TryoutRow) ?? null
  if (!shouldFallbackToPlain(joined.error)) throw new Error(joined.error.message)

  const plain = await apply(supabase.from("Tryouts").select("*")).maybeSingle()
  if (plain.error) throw new Error(plain.error.message)
  return (plain.data as TryoutRow) ?? null
}

export type TryoutsResult = {
  /** Listings mapped from the `Tryouts` table (empty array when configured but no rows). */
  data: TryoutListing[]
  /** Whether the data came from Supabase or the local sample fallback. */
  source: "supabase" | "local"
}

/**
 * Fetches all tryouts, joined to their Team and Organization.
 * Returns source: "local" (and no data) when Supabase is not configured, so the
 * caller can fall back to the bundled sample data.
 */
export async function fetchTryouts(): Promise<TryoutsResult> {
  const supabase = getSupabaseClient()
  if (!supabase) {
    return { data: [], source: "local" }
  }

  const data = await fetchList((q) => q.order("dates", { ascending: true }))
  return { data, source: "supabase" }
}

/**
 * Fetches a single tryout (list shape) by id, joined to Team/Organization.
 * Returns null when Supabase is not configured or no matching row exists.
 */
export async function fetchTryoutById(id: string): Promise<TryoutListing | null> {
  const row = await fetchOne((q) => q.eq("id", id))
  return row ? mapRow(row) : null
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
  address?: string
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
  registrations?: number
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
    // Prefer normalized values from the join; fall back to snapshot columns.
    organization: base.organizationName ?? pick(row, "organization", "org", "association", "club"),
    logo:
      base.teamLogo ??
      base.organizationLogo ??
      pick(row, "logo", "logo_url", "team_logo", "logoUrl"),
    heroImage: pick(row, "hero_image", "heroImage", "banner", "cover_image"),
    address: pick(row, "address"),
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
    registrations: pickNumber(row, "registrations"),
    featured: pickBool(row, "featured", "featured_tryout", "is_featured"),
    verified: base.verified || pickBool(row, "verified", "verified_organization", "is_verified"),
  }
}

/**
 * Fetches a single tryout with all available columns plus the Team/Organization
 * join, so optional detail fields and normalized identity both resolve.
 */
export async function fetchTryoutFullById(id: string): Promise<TryoutFull | null> {
  const row = await fetchOne((q) => q.eq("id", id), FULL_JOIN_SELECT)
  return row ? mapFullRow(row as unknown as Record<string, unknown>) : null
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
  return fetchList((q) =>
    q
      .neq("id", current.id)
      .or(`province.eq.${current.province},level.eq.${current.level}`)
      .limit(limit),
  )
}

/** Fetches all tryouts linked to a given team id. */
export async function fetchTryoutsByTeam(teamId: string): Promise<TryoutListing[]> {
  return fetchList((q) => q.eq("team_id", teamId).order("dates", { ascending: true }))
}

/** Fetches all tryouts linked to a given organization id. */
export async function fetchTryoutsByOrganization(
  organizationId: string,
): Promise<TryoutListing[]> {
  return fetchList((q) =>
    q.eq("organization_id", organizationId).order("dates", { ascending: true }),
  )
}
