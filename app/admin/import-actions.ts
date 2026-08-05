"use server"

import { randomUUID } from "crypto"
import { revalidatePath } from "next/cache"
import { isAuthenticated } from "@/lib/admin-auth"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"
import { slugify } from "@/lib/slug"
import { fetchImportItemById } from "@/lib/supabase/import"
import { processSource } from "@/lib/import/process-source"
import { processOrganizationDirectory } from "@/lib/import/process-directory"

export type ActionState = {
  error?: string
  success?: string
  sourceCheckStatus?: "imported" | "unchanged" | "skipped" | "deferred" | "error"
} | null

export async function discoverOrganizations(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await requireAuth()
    const sourceUrl = String(formData.get("sourceUrl") ?? "").trim()
    const sourceName = String(formData.get("sourceName") ?? "").trim() || null
    const province = String(formData.get("province") ?? "Ontario").trim() || "Ontario"
    const result = await processOrganizationDirectory(sourceUrl, sourceName, province)
    revalidatePath("/admin")
    return result.ok ? { success: result.message } : { error: result.message }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Directory import failed." }
  }
}

export async function approveOrganizationImport(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await requireAuth()
    const id = String(formData.get("id") ?? "").trim()
    if (!id) return { error: "Missing organization import id." }
    const supabase = getSupabaseAdminClient()
    const result = await approveOrganizationImportById(supabase, id)
    revalidatePath("/admin")
    return { success: `${result.organizationName} added and queued as a crawl source.` }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Approval failed." }
  }
}

export async function bulkApproveOrganizationImports(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await requireAuth()
    const ids = [...new Set(
      formData
        .getAll("selectedId")
        .map((value) => String(value).trim())
        .filter(Boolean),
    )].slice(0, 200)
    if (ids.length === 0) return { error: "Select at least one organization." }

    const supabase = getSupabaseAdminClient()
    const failures: string[] = []
    let approved = 0

    // Small batches keep the action fast without overwhelming Supabase.
    for (let index = 0; index < ids.length; index += 5) {
      const results = await Promise.allSettled(
        ids.slice(index, index + 5).map((id) => approveOrganizationImportById(supabase, id)),
      )
      for (const result of results) {
        if (result.status === "fulfilled") {
          approved++
        } else {
          failures.push(
            result.reason instanceof Error ? result.reason.message : "Unknown approval error",
          )
        }
      }
    }

    revalidatePath("/admin")
    if (failures.length > 0) {
      return {
        error: `${approved} approved; ${failures.length} left in review. ${failures[0]}`,
      }
    }
    return {
      success: `${approved} organization${approved === 1 ? "" : "s"} approved and added as crawl sources.`,
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Bulk approval failed." }
  }
}

type SupabaseAdminClient = ReturnType<typeof getSupabaseAdminClient>

async function approveOrganizationImportById(
  supabase: SupabaseAdminClient,
  id: string,
): Promise<{ organizationName: string }> {
  const { data: item, error } = await supabase
    .from("organization_import_queue")
    .select("*")
    .eq("id", id)
    .eq("status", "pending_review")
    .single()
  if (error || !item) throw new Error(error?.message ?? "Import not found or already reviewed.")

  const organizationName = String(item.organization_name).trim()
  const website = item.website ? String(item.website) : null
  const { data: existing, error: existingError } = await supabase
    .from("Organizations")
    .select("id")
    .ilike("organization_name", organizationName)
    .maybeSingle()
  if (existingError) throw new Error(existingError.message)

  let organizationId = existing?.id ? String(existing.id) : null
  if (!organizationId) {
    const { data: created, error: createError } = await supabase
      .from("Organizations")
      .insert({
        id: randomUUID(),
        organization_name: organizationName,
        slug: await uniqueOrganizationSlug(organizationName),
        website,
        city: item.city,
        province: item.province,
        verified: false,
      })
      .select("id")
      .single()
    if (createError) throw new Error(`${organizationName}: ${createError.message}`)
    organizationId = String(created.id)
  }

  if (website) {
    const { data: existingSource, error: sourceLookupError } = await supabase
      .from("source_pages")
      .select("id")
      .eq("source_url", website)
      .maybeSingle()
    if (sourceLookupError) throw new Error(`${organizationName}: ${sourceLookupError.message}`)
    if (!existingSource) {
      const { error: sourceError } = await supabase.from("source_pages").insert({
        id: randomUUID(),
        organization_id: organizationId,
        source_url: website,
        source_type: "organization",
        province: item.province,
        active: true,
        scrape_allowed: true,
      })
      if (sourceError) throw new Error(`${organizationName}: ${sourceError.message}`)
    }
  }

  const { error: reviewError } = await supabase
    .from("organization_import_queue")
    .update({
      status: "approved",
      duplicate_of_organization_id: existing?.id ?? null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", "pending_review")
  if (reviewError) throw new Error(`${organizationName}: ${reviewError.message}`)

  return { organizationName }
}

export async function rejectOrganizationImport(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await requireAuth()
    const id = String(formData.get("id") ?? "").trim()
    const supabase = getSupabaseAdminClient()
    const { error } = await supabase
      .from("organization_import_queue")
      .update({ status: "rejected", reviewed_at: new Date().toISOString() })
      .eq("id", id)
    if (error) return { error: error.message }
    revalidatePath("/admin")
    return { success: "Organization import rejected." }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Rejection failed." }
  }
}

async function uniqueOrganizationSlug(name: string): Promise<string> {
  const supabase = getSupabaseAdminClient()
  const base = slugify(name) || "organization"
  let candidate = base
  for (let suffix = 2; suffix < 100; suffix++) {
    const { data } = await supabase
      .from("Organizations")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle()
    if (!data) return candidate
    candidate = `${base}-${suffix}`
  }
  return `${base}-${randomUUID().slice(0, 8)}`
}

async function requireAuth() {
  if (!(await isAuthenticated())) {
    throw new Error("Not authorized.")
  }
}

/* ------------------------------------------------------------------ */
/* Source pages                                                        */
/* ------------------------------------------------------------------ */

function parseSourceForm(formData: FormData) {
  const get = (k: string) => String(formData.get(k) ?? "").trim()
  const sourceUrl = get("sourceUrl")
  if (!sourceUrl) throw new Error("Source URL is required.")

  // Validate the URL and enforce http(s).
  let normalized: string
  try {
    const u = new URL(sourceUrl)
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      throw new Error("bad protocol")
    }
    normalized = u.toString()
  } catch {
    throw new Error("Enter a valid http(s) URL.")
  }

  return {
    source_url: normalized,
    organization_id: get("organizationId") || null,
    source_type: get("sourceType") || "webpage",
    province: get("province") || null,
    scrape_allowed: formData.get("scrapeAllowed") != null,
    active: formData.get("active") != null,
  }
}

export async function createSource(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await requireAuth()
    const row = parseSourceForm(formData)
    const supabase = getSupabaseAdminClient()
    const { error } = await supabase
      .from("source_pages")
      .insert({ id: randomUUID(), ...row })
    if (error) return { error: error.message }

    revalidatePath("/admin")
    return { success: "Source added." }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to add source." }
  }
}

export async function updateSource(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await requireAuth()
    const id = String(formData.get("id") ?? "").trim()
    if (!id) return { error: "Missing source id." }
    const row = parseSourceForm(formData)
    const supabase = getSupabaseAdminClient()
    const { error } = await supabase.from("source_pages").update(row).eq("id", id)
    if (error) return { error: error.message }

    revalidatePath("/admin")
    return { success: "Source updated." }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update source." }
  }
}

export async function deleteSource(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await requireAuth()
    const id = String(formData.get("id") ?? "").trim()
    if (!id) return { error: "Missing source id." }
    const supabase = getSupabaseAdminClient()
    const { error } = await supabase.from("source_pages").delete().eq("id", id)
    if (error) return { error: error.message }

    revalidatePath("/admin")
    return { success: "Source deleted." }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to delete source." }
  }
}

/** Manually triggers a fetch + extraction run for one source. */
export async function triggerSourceCheck(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await requireAuth()
    const id = String(formData.get("id") ?? "").trim()
    if (!id) return { error: "Missing source id." }

    const result = await processSource(id)
    revalidatePath("/admin")
    if (!result.ok && result.status === "error") {
      return { error: result.message, sourceCheckStatus: result.status }
    }
    return { success: result.message, sourceCheckStatus: result.status }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Source check failed." }
  }
}

/* ------------------------------------------------------------------ */
/* Import review                                                       */
/* ------------------------------------------------------------------ */

// Fields the admin can edit before approving.
function parseImportForm(formData: FormData) {
  const get = (k: string) => {
    const v = String(formData.get(k) ?? "").trim()
    return v === "" ? null : v
  }
  return {
    organization_name: get("organizationName"),
    team_name: get("teamName"),
    age_group: get("ageGroup"),
    birth_year: get("birthYear"),
    level: get("level"),
    season: get("season"),
    tryout_dates: get("tryoutDates"),
    registration_deadline: get("registrationDeadline"),
    cost: get("cost"),
    registration_link: get("registrationLink"),
    arena: get("arena"),
    address: get("address"),
    google_maps_link: get("googleMapsLink"),
    positions_needed: get("positionsNeeded"),
    equipment: get("equipment"),
    capacity: get("capacity"),
    description: get("description"),
    contact_information: get("contactInformation"),
  }
}

/** Saves admin edits to a pending import without changing its status. */
export async function updateImportItem(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await requireAuth()
    const id = String(formData.get("id") ?? "").trim()
    if (!id) return { error: "Missing import id." }
    const row = parseImportForm(formData)
    const supabase = getSupabaseAdminClient()
    const { error } = await supabase
      .from("tryout_import_queue")
      .update(row)
      .eq("id", id)
    if (error) return { error: error.message }

    revalidatePath("/admin")
    return { success: "Changes saved." }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to save changes." }
  }
}

export async function rejectImportItem(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await requireAuth()
    const id = String(formData.get("id") ?? "").trim()
    if (!id) return { error: "Missing import id." }
    const supabase = getSupabaseAdminClient()
    const { error } = await supabase
      .from("tryout_import_queue")
      .update({ status: "rejected", reviewed_at: new Date().toISOString() })
      .eq("id", id)
    if (error) return { error: error.message }

    revalidatePath("/admin")
    return { success: "Import rejected." }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to reject import." }
  }
}

export async function markImportDuplicate(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await requireAuth()
    const id = String(formData.get("id") ?? "").trim()
    if (!id) return { error: "Missing import id." }
    const duplicateOf = String(formData.get("duplicateOfTryoutId") ?? "").trim() || null
    const supabase = getSupabaseAdminClient()
    const { error } = await supabase
      .from("tryout_import_queue")
      .update({
        status: "duplicate",
        duplicate_of_tryout_id: duplicateOf,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id)
    if (error) return { error: error.message }

    revalidatePath("/admin")
    return { success: "Marked as duplicate." }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to mark duplicate." }
  }
}

/**
 * Approves an import and publishes it: matches or creates the organization and
 * team, then creates a tryout linked to both, preserving the source URL. Saves
 * any admin edits from the form first.
 */
export async function approveImportItem(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await requireAuth()
    const id = String(formData.get("id") ?? "").trim()
    if (!id) return { error: "Missing import id." }

    // Persist any edits, then reload the canonical record.
    const edits = parseImportForm(formData)
    const supabase = getSupabaseAdminClient()
    await supabase.from("tryout_import_queue").update(edits).eq("id", id)

    const item = await fetchImportItemById(id)
    if (!item) return { error: "Import not found." }
    if (!item.teamName && !item.organizationName) {
      return { error: "An organization or team name is required to publish." }
    }

    // If the admin chose an existing tryout to update, we update in place
    // instead of inserting a new row (requirement: update, don't duplicate).
    const updateTargetId =
      String(formData.get("duplicateOfTryoutId") ?? "").trim() || null

    // Source page province is the most reliable location signal we have.
    let province: string | null = null
    if (item.sourcePageId) {
      const { data: sp } = await supabase
        .from("source_pages")
        .select("province")
        .eq("id", item.sourcePageId)
        .maybeSingle()
      province = (sp as { province?: string } | null)?.province ?? null
    }

    const hasExtractedTeamName = Boolean(item.teamName && item.teamName.trim())
    const { name: contactName, email, phone } = splitContact(item.contactInformation)
    const now = new Date().toISOString()

    // Resolve the org/team relationship only when we can do so from real
    // extracted data. On an update with a blank team name we intentionally
    // skip this so the existing team name + team_id are preserved and no
    // stray team is created (never overwrite good data with blanks).
    const resolveRelationship = !updateTargetId || hasExtractedTeamName

    let organizationId: string | null = null
    let teamId: string | null = null
    let teamName: string | null = null
    if (resolveRelationship) {
      // 1. Match or create the organization.
      organizationId = item.organizationName
        ? await findOrCreateOrganization(item.organizationName, province)
        : null

      // 2. Match or create the team (fallback names only apply here, where we
      //    have a real team name or are creating a brand-new tryout).
      teamName = item.teamName || item.organizationName || "Tryout Team"
      teamId = await findOrCreateTeam(teamName, organizationId, {
        ageGroup: item.ageGroup,
        birthYear: item.birthYear,
        level: item.level,
        season: item.season,
        province,
      })
    }

    // Relationship fields are only ever set when we resolved them above; on a
    // blank-team update they are omitted entirely so existing values remain.
    const relationship = resolveRelationship
      ? {
          organization_id: organizationId,
          team_id: teamId,
          team: teamName,
          organization: item.organizationName ?? null,
        }
      : {}

    // Non-relationship fields shared by create and update. On update we strip
    // null/empty values so we never clobber good existing data with blanks.
    const core = {
      arena: item.arena ?? null,
      address: item.address ?? null,
      google_maps_link: item.googleMapsLink ?? null,
      birth_year: item.birthYear ?? null,
      age_group: item.ageGroup ?? null,
      level: item.level ?? null,
      positions_needed: item.positionsNeeded ?? null,
      // The schedule is stored one session per line in tryoutDates. Publish the
      // full per-line schedule to `times` (rendered line-by-line publicly) and a
      // concise summary to `dates`.
      dates: summarizeSchedule(item.tryoutDates) ?? item.tryoutDates ?? null,
      times: item.tryoutDates ?? null,
      registration_deadline: item.registrationDeadline ?? null,
      cost: item.cost ?? null,
      // Requirement: use the official source URL as the website and registration
      // link when no dedicated registration link was extracted.
      registration_link: item.registrationLink ?? item.sourceUrl ?? null,
      website: item.registrationLink ?? item.sourceUrl ?? null,
      description: item.description ?? null,
      equipment: item.equipment ?? null,
      contact_name: contactName,
      contact_email: email,
      contact_phone: phone,
      max_players: parseCapacity(item.capacity),
      // Traceability: source URL + when it was last checked/published.
      source_url: item.sourceUrl ?? null,
      source_last_checked_at: now,
    }

    let tryoutId: string
    if (updateTargetId) {
      // 3a. Update the existing tryout in place, merging only known values.
      //     `relationship` is empty on a blank-team update, so the existing
      //     team/team_id are left untouched.
      const merged = { ...relationship, ...stripNullish(core) }
      const { error: updateError } = await supabase
        .from("Tryouts")
        .update(merged)
        .eq("id", updateTargetId)
      if (updateError) return { error: updateError.message }
      tryoutId = updateTargetId
    } else {
      // 3b. Create a new tryout connected to both records.
      tryoutId = randomUUID()
      const { error: insertError } = await supabase.from("Tryouts").insert({
        id: tryoutId,
        province: province ?? "",
        city: "",
        status: "Open",
        ...relationship,
        ...core,
        // Ensure not-null-friendly defaults for a brand new row.
        birth_year: item.birthYear ?? "",
        age_group: item.ageGroup ?? "",
        level: item.level ?? "",
        dates: summarizeSchedule(item.tryoutDates) ?? item.tryoutDates ?? "Dates TBA",
      })
      if (insertError) return { error: insertError.message }
    }

    // Label for the success message: resolved team name, or the item's own
    // team/org name when we deliberately left the existing relationship alone.
    const label =
      teamName || item.teamName || item.organizationName || "tryout"

    // 5. Mark the import as approved, recording the tryout it resolved to.
    await supabase
      .from("tryout_import_queue")
      .update({
        status: "approved",
        duplicate_of_tryout_id: updateTargetId,
        reviewed_at: now,
      })
      .eq("id", id)

    revalidatePath("/admin")
    revalidatePath("/")
    revalidatePath(`/tryouts/${tryoutId}`)
    return {
      success: updateTargetId
        ? `Updated existing tryout "${label}".`
        : `Published "${label}".`,
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to approve import." }
  }
}

/* ------------------------------------------------------------------ */
/* Matching helpers                                                    */
/* ------------------------------------------------------------------ */

async function generateUniqueSlug(
  table: "Organizations" | "Teams",
  name: string,
): Promise<string> {
  const supabase = getSupabaseAdminClient()
  const base = slugify(name) || "item"
  const { data } = await supabase.from(table).select("slug").like("slug", `${base}%`)
  const taken = new Set((data ?? []).map((r: { slug: string | null }) => r.slug).filter(Boolean))
  if (!taken.has(base)) return base
  let n = 2
  while (taken.has(`${base}-${n}`)) n++
  return `${base}-${n}`
}

// Case-insensitive match on name, else create. Returns the organization id.
async function findOrCreateOrganization(
  name: string,
  province: string | null,
): Promise<string> {
  const supabase = getSupabaseAdminClient()
  const { data: existing } = await supabase
    .from("Organizations")
    .select("id")
    .ilike("organization_name", name)
    .maybeSingle()
  if (existing?.id) return String(existing.id)

  const id = randomUUID()
  const slug = await generateUniqueSlug("Organizations", name)
  const { error } = await supabase.from("Organizations").insert({
    id,
    organization_name: name,
    slug,
    province,
  })
  if (error) throw new Error(error.message)
  return id
}

// Match team by name (scoped to org when present), else create.
async function findOrCreateTeam(
  name: string,
  organizationId: string | null,
  details: {
    ageGroup?: string
    birthYear?: string
    level?: string
    season?: string
    province: string | null
  },
): Promise<string> {
  const supabase = getSupabaseAdminClient()
  let query = supabase.from("Teams").select("id").ilike("team_name", name)
  query = organizationId
    ? query.eq("organization_id", organizationId)
    : query.is("organization_id", null)
  const { data: existing } = await query.maybeSingle()
  if (existing?.id) return String(existing.id)

  const id = randomUUID()
  const slug = await generateUniqueSlug("Teams", name)
  const { error } = await supabase.from("Teams").insert({
    id,
    organization_id: organizationId,
    team_name: name,
    slug,
    age_group: details.ageGroup ?? null,
    birth_year: details.birthYear ?? null,
    level: details.level ?? null,
    season: details.season ?? null,
    province: details.province,
    active: true,
  })
  if (error) throw new Error(error.message)
  return id
}

// Splits a freeform contact string into name/email/phone best-effort.
function splitContact(contact?: string): {
  name: string | null
  email: string | null
  phone: string | null
} {
  if (!contact) return { name: null, email: null, phone: null }
  const email = contact.match(/[\w.+-]+@[\w-]+\.[\w.-]+/)?.[0] ?? null
  const phone =
    contact.match(/(\+?\d[\d\s().-]{7,}\d)/)?.[0]?.trim() ?? null
  let name = contact
  if (email) name = name.replace(email, " ")
  if (phone) name = name.replace(phone, " ")
  name = name.replace(/[|,;•]+/g, " ").replace(/\s+/g, " ").trim()
  return { name: name || null, email, phone }
}

// Builds a concise "N sessions (first – last)" summary from a multi-line
// schedule. Each line starts with its date, e.g. "Fri, Sep 11 · 4:30–5:30 PM".
function summarizeSchedule(schedule?: string): string | null {
  if (!schedule) return null
  const lines = schedule
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  if (lines.length <= 1) return schedule.trim() || null
  const dateOf = (line: string) => line.split("·")[0].trim()
  const first = dateOf(lines[0])
  const last = dateOf(lines[lines.length - 1])
  const range = first && last && first !== last ? `${first} – ${last}` : first
  return `${lines.length} sessions${range ? ` (${range})` : ""}`
}

function parseCapacity(capacity?: string): number | null {
  if (!capacity) return null
  const n = capacity.match(/\d+/)?.[0]
  return n ? Number(n) : null
}

// Removes null/undefined/empty-string values so an update never overwrites
// existing good data with blanks. Keeps 0 and false.
function stripNullish<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined) continue
    if (typeof v === "string" && v.trim() === "") continue
    out[k] = v
  }
  return out as Partial<T>
}
