import { getSupabaseClient } from "@/lib/supabase/client"

const SELECT_COLUMNS =
  "id, organization_id, team_name, slug, age_group, birth_year, level, season, head_coach, assistant_coach, logo, city, province, description, active, created_at"

// Shape of a row in the Supabase `Teams` table (snake_case columns).
export type TeamRow = {
  id: string | number
  organization_id: string | number | null
  team_name: string
  slug: string | null
  age_group: string | null
  birth_year: string | number | null
  level: string | null
  season: string | null
  head_coach: string | null
  assistant_coach: string | null
  logo: string | null
  city: string | null
  province: string | null
  description: string | null
  active: boolean | null
  created_at: string | null
}

// Camel-cased shape used throughout the app.
export type Team = {
  id: string
  organizationId?: string
  name: string
  slug: string
  ageGroup?: string
  birthYear?: string
  level?: string
  season?: string
  headCoach?: string
  assistantCoach?: string
  logo?: string
  city?: string
  province?: string
  description?: string
  active: boolean
  createdAt?: string
}

function str(v: unknown): string | undefined {
  if (typeof v === "string" && v.trim().length > 0) return v.trim()
  if (typeof v === "number") return String(v)
  return undefined
}

export function mapTeam(row: TeamRow): Team {
  return {
    id: String(row.id),
    organizationId: row.organization_id != null ? String(row.organization_id) : undefined,
    name: row.team_name,
    slug: row.slug ?? String(row.id),
    ageGroup: str(row.age_group),
    birthYear: str(row.birth_year),
    level: str(row.level),
    season: str(row.season),
    headCoach: str(row.head_coach),
    assistantCoach: str(row.assistant_coach),
    logo: str(row.logo),
    city: str(row.city),
    province: str(row.province),
    description: str(row.description),
    active: row.active == null ? true : Boolean(row.active),
    createdAt: str(row.created_at),
  }
}

/** Fetches all teams (optionally filtered to a single organization). */
export async function fetchTeams(organizationId?: string): Promise<Team[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  let query = supabase.from("Teams").select(SELECT_COLUMNS)
  if (organizationId) query = query.eq("organization_id", organizationId)

  const { data, error } = await query.order("team_name", { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => mapTeam(row as TeamRow))
}

/** Fetches all active teams for a given organization. */
export async function fetchActiveTeamsByOrganization(
  organizationId: string,
): Promise<Team[]> {
  const teams = await fetchTeams(organizationId)
  return teams.filter((t) => t.active)
}

/** Fetches a single team by slug. Returns null when not found. */
export async function fetchTeamBySlug(slug: string): Promise<Team | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const { data, error } = await supabase
    .from("Teams")
    .select(SELECT_COLUMNS)
    .eq("slug", slug)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data ? mapTeam(data as TeamRow) : null
}
