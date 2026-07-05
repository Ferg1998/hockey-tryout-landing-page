import { getSupabaseClient } from "@/lib/supabase/client"
import type { TryoutListing } from "@/lib/data"

const SELECT_COLUMNS =
  "id, team, city, province, birth_year, age_group, level, dates, arena, cost, status, registration_link, image"

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
}

const VALID_STATUSES: TryoutListing["status"][] = [
  "Open",
  "Closing Soon",
  "Waitlist",
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
