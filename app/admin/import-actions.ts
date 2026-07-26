"use server"

import { randomUUID } from "crypto"
import { revalidatePath } from "next/cache"
import { isAuthenticated } from "@/lib/admin-auth"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"
import { slugify } from "@/lib/slug"
import { fetchImportItemById } from "@/lib/supabase/import"
import { processSource } from "@/lib/import/process-source"

export type ActionState = { error?: string; success?: string } | null

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
      return { error: result.message }
    }
    return { success: result.message }
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

    // 1. Match or create the organization.
    const organizationId = item.organizationName
      ? await findOrCreateOrganization(item.organizationName, province)
      : null

    // 2. Match or create the team.
    const teamName = item.teamName || item.organizationName || "Tryout Team"
    const teamId = await findOrCreateTeam(teamName, organizationId, {
      ageGroup: item.ageGroup,
      birthYear: item.birthYear,
      level: item.level,
      season: item.season,
      province,
    })

    const { name: contactName, email, phone } = splitContact(item.contactInformation)
    const now = new Date().toISOString()

    // Fields shared by create and update. On update we strip null/empty values
    // so we never clobber good existing data with blanks from extraction.
    const core = {
      organization_id: organizationId,
      team_id: teamId,
      team: teamName,
      organization: item.organizationName ?? null,
      arena: item.arena ?? null,
      address: item.address ?? null,
      google_maps_link: item.googleMapsLink ?? null,
      birth_year: item.birthYear ?? null,
      age_group: item.ageGroup ?? null,
      level: item.level ?? null,
      positions_needed: item.positionsNeeded ?? null,
      dates: item.tryoutDates ?? null,
      registration_deadline: item.registrationDeadline ?? null,
      cost: item.cost ?? null,
      registration_link: item.registrationLink ?? item.sourceUrl ?? null,
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
      const merged = stripNullish(core)
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
        ...core,
        // Ensure not-null-friendly defaults for a brand new row.
        birth_year: item.birthYear ?? "",
        age_group: item.ageGroup ?? "",
        level: item.level ?? "",
        dates: item.tryoutDates ?? "Dates TBA",
      })
      if (insertError) return { error: insertError.message }
    }

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
        ? `Updated existing tryout "${teamName}".`
        : `Published "${teamName}".`,
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
