"use server"

import { randomUUID } from "crypto"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import {
  ADMIN_COOKIE,
  isAuthenticated,
  isValidPassword,
  sessionToken,
} from "@/lib/admin-auth"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"
import { slugify } from "@/lib/slug"

export type ActionState = { error?: string; success?: string } | null

/** Result of an inline "quick create" so the client can auto-select the new record. */
export type InlineCreateState =
  | { ok: true; id: string; name: string; slug: string; organizationId?: string }
  | { ok: false; error: string }
  | null

/**
 * Generates a slug for `name` that is unique within `table`. Appends a numeric
 * suffix on collision (excluding the row being edited via `excludeId`).
 */
async function generateUniqueSlug(
  table: "Organizations" | "Teams",
  name: string,
  excludeId?: string,
): Promise<string> {
  const supabase = getSupabaseAdminClient()
  const base = slugify(name) || "item"

  const { data, error } = await supabase
    .from(table)
    .select("id, slug")
    .like("slug", `${base}%`)

  if (error) throw new Error(error.message)

  const taken = new Set(
    (data ?? [])
      .filter((r: { id: string | number }) => String(r.id) !== excludeId)
      .map((r: { slug: string | null }) => r.slug)
      .filter(Boolean) as string[],
  )

  if (!taken.has(base)) return base
  let n = 2
  while (taken.has(`${base}-${n}`)) n++
  return `${base}-${n}`
}

const STATUSES = ["Open", "Waitlist", "Full", "Closed"] as const

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

// Builds a human-readable display string from ISO start/end dates
// (e.g. "Apr 12–14, 2026" or "Apr 12, 2026"). Falls back to "Dates TBA".
function composeDates(start: string, end: string): string {
  if (!start) return "Dates TBA"
  const s = new Date(`${start}T00:00:00`)
  if (Number.isNaN(s.getTime())) return "Dates TBA"
  const sMonth = MONTHS[s.getMonth()]
  const sDay = s.getDate()
  const sYear = s.getFullYear()
  if (!end) return `${sMonth} ${sDay}, ${sYear}`
  const e = new Date(`${end}T00:00:00`)
  if (Number.isNaN(e.getTime())) return `${sMonth} ${sDay}, ${sYear}`
  if (s.getMonth() === e.getMonth() && sYear === e.getFullYear()) {
    return `${sMonth} ${sDay}–${e.getDate()}, ${sYear}`
  }
  const eMonth = MONTHS[e.getMonth()]
  return `${sMonth} ${sDay} – ${eMonth} ${e.getDate()}, ${e.getFullYear()}`
}

function parseTryoutForm(formData: FormData) {
  const get = (k: string) => String(formData.get(k) ?? "").trim()
  const getNum = (k: string) => {
    const v = get(k)
    if (v === "") return null
    const n = Number(v)
    return Number.isNaN(n) ? null : Math.trunc(n)
  }
  const getBool = (k: string) => formData.get(k) != null

  // Identity + location (team, city, province, level, age group, birth year)
  // are owned by the linked Team and filled by applyRelationshipSnapshot — they
  // are no longer entered on the tryout form. A Team link is required.
  const teamId = get("teamId")
  const startDate = get("startDate")

  if (!teamId) {
    throw new Error("Please select a team for this tryout.")
  }
  if (!startDate) {
    throw new Error("A start date is required.")
  }

  const endDate = get("endDate")

  const statusRaw = get("status")
  const status = (STATUSES as readonly string[]).includes(statusRaw)
    ? statusRaw
    : "Open"

  // Positions can arrive as multiple checkbox values under the same name.
  const positions = formData
    .getAll("positionsNeeded")
    .map((p) => String(p).trim())
    .filter(Boolean)
    .join(", ")

  return {
    organization_id: get("organizationId") || null,
    team_id: teamId,
    hero_image: get("heroImage") || null,
    arena: get("arena") || null,
    address: get("address") || null,
    google_maps_link: get("googleMapsLink") || null,
    positions_needed: positions || null,
    start_date: startDate,
    end_date: endDate || null,
    dates: composeDates(startDate, endDate),
    times: get("times") || null,
    registration_deadline: get("registrationDeadline") || null,
    cost: get("cost") || null,
    registration_link: get("registrationLink") || null,
    website: get("website") || null,
    contact_name: get("contactName") || null,
    contact_email: get("contactEmail") || null,
    contact_phone: get("contactPhone") || null,
    description: get("description") || null,
    equipment: get("equipment") || null,
    max_players: getNum("maxPlayers"),
    current_registrations: getNum("currentRegistrations"),
    status,
    featured: getBool("featured"),
    image: get("heroImage") || get("image") || null,
  }
}

export async function login(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const password = String(formData.get("password") ?? "")
  if (!isValidPassword(password)) {
    return { error: "Incorrect password." }
  }
  const store = await cookies()
  store.set(ADMIN_COOKIE, sessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours
  })
  return { success: "Signed in." }
}

export async function logout(): Promise<void> {
  const store = await cookies()
  store.delete(ADMIN_COOKIE)
  revalidatePath("/admin")
}

async function requireAuth() {
  if (!(await isAuthenticated())) {
    throw new Error("Not authorized.")
  }
}

/**
 * When a tryout is linked to a team, copy the team's (and its organization's)
 * details into the tryout's denormalized snapshot columns. This keeps the
 * public search — which reads team/city/province/level/age_group/birth_year
 * straight off the Tryouts row — working while sourcing values from the
 * relationship. Admin-entered values are used as fallbacks.
 */
async function applyRelationshipSnapshot(
  row: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const teamId = row.team_id ? String(row.team_id) : ""
  if (!teamId) return row

  const supabase = getSupabaseAdminClient()
  const { data: team, error } = await supabase
    .from("Teams")
    .select(
      "id, organization_id, team_name, age_group, birth_year, level, city, province",
    )
    .eq("id", teamId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!team) return row

  const t = team as Record<string, unknown>
  const synced: Record<string, unknown> = {
    ...row,
    team: t.team_name ?? row.team,
    age_group: t.age_group ?? row.age_group,
    birth_year: t.birth_year ?? row.birth_year,
    level: t.level ?? row.level,
    // Prefer explicit tryout location; fall back to the team's location.
    city: row.city || t.city || "",
    province: row.province || t.province || "",
    organization_id: row.organization_id || t.organization_id || null,
  }

  // Pull the organization name into the snapshot when available.
  const orgId = synced.organization_id ? String(synced.organization_id) : ""
  if (orgId) {
    const { data: org } = await supabase
      .from("Organizations")
      .select("organization_name")
      .eq("id", orgId)
      .maybeSingle()
    if (org && (org as Record<string, unknown>).organization_name) {
      synced.organization =
        (org as Record<string, unknown>).organization_name ?? row.organization
    }
  }

  return synced
}

export async function createTryout(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await requireAuth()
    const row = await applyRelationshipSnapshot(parseTryoutForm(formData))
    const id = String(formData.get("id") ?? "").trim() || randomUUID()

    const supabase = getSupabaseAdminClient()
    const { error } = await supabase.from("Tryouts").insert({ id, ...row })
    if (error) return { error: error.message }

    revalidatePath("/admin")
    revalidatePath("/")
    revalidatePath(`/tryouts/${id}`)
    return { success: `Added "${row.team}".` }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to add tryout." }
  }
}

export async function updateTryout(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await requireAuth()
    const id = String(formData.get("id") ?? "").trim()
    if (!id) return { error: "Missing tryout id." }
    const row = await applyRelationshipSnapshot(parseTryoutForm(formData))

    const supabase = getSupabaseAdminClient()
    const { error } = await supabase.from("Tryouts").update(row).eq("id", id)
    if (error) return { error: error.message }

    revalidatePath("/admin")
    revalidatePath("/")
    revalidatePath(`/tryouts/${id}`)
    return { success: `Updated "${row.team}".` }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update tryout." }
  }
}

export async function deleteTryout(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await requireAuth()
    const id = String(formData.get("id") ?? "").trim()
    if (!id) return { error: "Missing tryout id." }

    const supabase = getSupabaseAdminClient()
    const { error } = await supabase.from("Tryouts").delete().eq("id", id)
    if (error) return { error: error.message }

    revalidatePath("/admin")
    revalidatePath("/")
    return { success: "Tryout deleted." }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to delete tryout." }
  }
}

/* ------------------------------------------------------------------ */
/* Organizations                                                       */
/* ------------------------------------------------------------------ */

function parseOrganizationForm(formData: FormData) {
  const get = (k: string) => String(formData.get(k) ?? "").trim()
  const name = get("organizationName")
  if (!name) throw new Error("Organization name is required.")

  return {
    organization_name: name,
    logo: get("logo") || null,
    banner_image: get("bannerImage") || null,
    website: get("website") || null,
    email: get("email") || null,
    phone: get("phone") || null,
    city: get("city") || null,
    province: get("province") || null,
    address: get("address") || null,
    google_maps_link: get("googleMapsLink") || null,
    description: get("description") || null,
    verified: formData.get("verified") != null,
  }
}

export async function createOrganization(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await requireAuth()
    const row = parseOrganizationForm(formData)
    const id = randomUUID()
    const slug = await generateUniqueSlug("Organizations", row.organization_name)

    const supabase = getSupabaseAdminClient()
    const { error } = await supabase
      .from("Organizations")
      .insert({ id, slug, ...row })
    if (error) return { error: error.message }

    revalidatePath("/admin")
    revalidatePath("/organizations")
    revalidatePath(`/organizations/${slug}`)
    return { success: `Added "${row.organization_name}".` }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to add organization." }
  }
}

export async function updateOrganization(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await requireAuth()
    const id = String(formData.get("id") ?? "").trim()
    if (!id) return { error: "Missing organization id." }
    const row = parseOrganizationForm(formData)
    const slug = await generateUniqueSlug("Organizations", row.organization_name, id)

    const supabase = getSupabaseAdminClient()
    const { error } = await supabase
      .from("Organizations")
      .update({ slug, ...row })
      .eq("id", id)
    if (error) return { error: error.message }

    revalidatePath("/admin")
    revalidatePath("/organizations")
    revalidatePath(`/organizations/${slug}`)
    return { success: `Updated "${row.organization_name}".` }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update organization." }
  }
}

export async function deleteOrganization(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await requireAuth()
    const id = String(formData.get("id") ?? "").trim()
    if (!id) return { error: "Missing organization id." }

    const supabase = getSupabaseAdminClient()
    // Detach linked teams/tryouts so nothing is orphaned or blocked by FKs.
    await supabase.from("Teams").update({ organization_id: null }).eq("organization_id", id)
    await supabase.from("Tryouts").update({ organization_id: null }).eq("organization_id", id)

    const { error } = await supabase.from("Organizations").delete().eq("id", id)
    if (error) return { error: error.message }

    revalidatePath("/admin")
    revalidatePath("/organizations")
    return { success: "Organization deleted." }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to delete organization." }
  }
}

/* ------------------------------------------------------------------ */
/* Teams                                                               */
/* ------------------------------------------------------------------ */

function parseTeamForm(formData: FormData) {
  const get = (k: string) => String(formData.get(k) ?? "").trim()
  const name = get("teamName")
  if (!name) throw new Error("Team name is required.")

  return {
    organization_id: get("organizationId") || null,
    team_name: name,
    age_group: get("ageGroup") || null,
    birth_year: get("birthYear") || null,
    level: get("level") || null,
    season: get("season") || null,
    head_coach: get("headCoach") || null,
    assistant_coach: get("assistantCoach") || null,
    logo: get("logo") || null,
    city: get("city") || null,
    province: get("province") || null,
    description: get("description") || null,
    active: formData.get("active") != null,
  }
}

export async function createTeam(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await requireAuth()
    const row = parseTeamForm(formData)
    const id = randomUUID()
    const slug = await generateUniqueSlug("Teams", row.team_name)

    const supabase = getSupabaseAdminClient()
    const { error } = await supabase.from("Teams").insert({ id, slug, ...row })
    if (error) return { error: error.message }

    revalidatePath("/admin")
    revalidatePath(`/teams/${slug}`)
    return { success: `Added "${row.team_name}".` }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to add team." }
  }
}

export async function updateTeam(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await requireAuth()
    const id = String(formData.get("id") ?? "").trim()
    if (!id) return { error: "Missing team id." }
    const row = parseTeamForm(formData)
    const slug = await generateUniqueSlug("Teams", row.team_name, id)

    const supabase = getSupabaseAdminClient()
    const { error } = await supabase
      .from("Teams")
      .update({ slug, ...row })
      .eq("id", id)
    if (error) return { error: error.message }

    revalidatePath("/admin")
    revalidatePath(`/teams/${slug}`)
    return { success: `Updated "${row.team_name}".` }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update team." }
  }
}

export async function deleteTeam(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await requireAuth()
    const id = String(formData.get("id") ?? "").trim()
    if (!id) return { error: "Missing team id." }

    const supabase = getSupabaseAdminClient()
    // Detach linked tryouts so none are orphaned or blocked by FKs.
    await supabase.from("Tryouts").update({ team_id: null }).eq("team_id", id)

    const { error } = await supabase.from("Teams").delete().eq("id", id)
    if (error) return { error: error.message }

    revalidatePath("/admin")
    return { success: "Team deleted." }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to delete team." }
  }
}

/* ------------------------------------------------------------------ */
/* Inline quick-create (used from the tryout form)                     */
/* ------------------------------------------------------------------ */

/**
 * Creates an Organization on the fly from the tryout form and returns its id so
 * the client can immediately select it. Only the name is required.
 */
export async function createOrganizationInline(
  _prev: InlineCreateState,
  formData: FormData,
): Promise<InlineCreateState> {
  try {
    await requireAuth()
    const get = (k: string) => String(formData.get(k) ?? "").trim()
    const name = get("organizationName")
    if (!name) return { ok: false, error: "Organization name is required." }

    const id = randomUUID()
    const slug = await generateUniqueSlug("Organizations", name)
    const supabase = getSupabaseAdminClient()
    const { error } = await supabase.from("Organizations").insert({
      id,
      slug,
      organization_name: name,
      city: get("city") || null,
      province: get("province") || null,
    })
    if (error) return { ok: false, error: error.message }

    revalidatePath("/admin")
    revalidatePath("/organizations")
    return { ok: true, id, name, slug }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to add organization." }
  }
}

/**
 * Creates a Team on the fly from the tryout form and returns its id so the
 * client can immediately select it. Requires a name and owning organization.
 */
export async function createTeamInline(
  _prev: InlineCreateState,
  formData: FormData,
): Promise<InlineCreateState> {
  try {
    await requireAuth()
    const get = (k: string) => String(formData.get(k) ?? "").trim()
    const name = get("teamName")
    const organizationId = get("organizationId")
    if (!name) return { ok: false, error: "Team name is required." }
    if (!organizationId) return { ok: false, error: "Select an organization first." }

    const id = randomUUID()
    const slug = await generateUniqueSlug("Teams", name)
    const supabase = getSupabaseAdminClient()
    const { error } = await supabase.from("Teams").insert({
      id,
      slug,
      organization_id: organizationId,
      team_name: name,
      age_group: get("ageGroup") || null,
      birth_year: get("birthYear") || null,
      level: get("level") || null,
      city: get("city") || null,
      province: get("province") || null,
    })
    if (error) return { ok: false, error: error.message }

    revalidatePath("/admin")
    return { ok: true, id, name, slug, organizationId }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to add team." }
  }
}
