import "server-only"

import { getSupabaseAdminClient } from "@/lib/supabase/admin"

export const IMPORT_STATUSES = [
  "pending_review",
  "approved",
  "rejected",
  "duplicate",
  "needs_information",
] as const

export type ImportStatus = (typeof IMPORT_STATUSES)[number]

/* ------------------------------------------------------------------ */
/* Source pages                                                        */
/* ------------------------------------------------------------------ */

export type SourcePage = {
  id: string
  organizationId?: string
  sourceUrl: string
  sourceType: string
  province?: string
  active: boolean
  scrapeAllowed: boolean
  lastCheckedAt?: string
  lastSuccessAt?: string
  nextCheckAt?: string
  contentHash?: string
  errorMessage?: string
  createdAt?: string
}

export type SourcePageRow = {
  id: string
  organization_id: string | null
  source_url: string
  source_type: string | null
  province: string | null
  active: boolean | null
  scrape_allowed: boolean | null
  last_checked_at: string | null
  last_success_at: string | null
  next_check_at: string | null
  content_hash: string | null
  error_message: string | null
  created_at: string | null
}

export function mapSourcePage(row: SourcePageRow): SourcePage {
  return {
    id: String(row.id),
    organizationId: row.organization_id ? String(row.organization_id) : undefined,
    sourceUrl: row.source_url,
    sourceType: row.source_type ?? "webpage",
    province: row.province ?? undefined,
    active: row.active ?? true,
    scrapeAllowed: row.scrape_allowed ?? true,
    lastCheckedAt: row.last_checked_at ?? undefined,
    lastSuccessAt: row.last_success_at ?? undefined,
    nextCheckAt: row.next_check_at ?? undefined,
    contentHash: row.content_hash ?? undefined,
    errorMessage: row.error_message ?? undefined,
    createdAt: row.created_at ?? undefined,
  }
}

/** Fetches all source pages, newest first. Admin-only (service role). */
export async function fetchSourcePages(): Promise<SourcePage[]> {
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from("source_pages")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []).map((r) => mapSourcePage(r as SourcePageRow))
}

/** Fetches a single source page by id. */
export async function fetchSourcePageById(id: string): Promise<SourcePage | null> {
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from("source_pages")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data ? mapSourcePage(data as SourcePageRow) : null
}

/* ------------------------------------------------------------------ */
/* Import queue                                                        */
/* ------------------------------------------------------------------ */

export type ImportItem = {
  id: string
  sourcePageId?: string
  organizationName?: string
  teamName?: string
  ageGroup?: string
  birthYear?: string
  level?: string
  season?: string
  tryoutDates?: string
  registrationDeadline?: string
  cost?: string
  registrationLink?: string
  arena?: string
  address?: string
  googleMapsLink?: string
  positionsNeeded?: string
  equipment?: string
  capacity?: string
  description?: string
  contactInformation?: string
  sourceUrl?: string
  confidenceScore?: number
  status: ImportStatus
  duplicateOfTryoutId?: string
  rawContent?: string
  createdAt?: string
  reviewedAt?: string
}

export type ImportItemRow = Record<string, unknown>

export function mapImportItem(row: ImportItemRow): ImportItem {
  const str = (k: string) =>
    row[k] != null && String(row[k]).trim() !== "" ? String(row[k]) : undefined
  const statusRaw = String(row.status ?? "pending_review")
  const status = (IMPORT_STATUSES as readonly string[]).includes(statusRaw)
    ? (statusRaw as ImportStatus)
    : "pending_review"
  return {
    id: String(row.id),
    sourcePageId: str("source_page_id"),
    organizationName: str("organization_name"),
    teamName: str("team_name"),
    ageGroup: str("age_group"),
    birthYear: str("birth_year"),
    level: str("level"),
    season: str("season"),
    tryoutDates: str("tryout_dates"),
    registrationDeadline: str("registration_deadline"),
    cost: str("cost"),
    registrationLink: str("registration_link"),
    arena: str("arena"),
    address: str("address"),
    googleMapsLink: str("google_maps_link"),
    positionsNeeded: str("positions_needed"),
    equipment: str("equipment"),
    capacity: str("capacity"),
    description: str("description"),
    contactInformation: str("contact_information"),
    sourceUrl: str("source_url"),
    confidenceScore:
      row.confidence_score != null ? Number(row.confidence_score) : undefined,
    status,
    duplicateOfTryoutId: str("duplicate_of_tryout_id"),
    rawContent: str("raw_content"),
    createdAt: str("created_at"),
    reviewedAt: str("reviewed_at"),
  }
}

/** Fetches import queue items, optionally filtered by status. */
export async function fetchImportQueue(status?: ImportStatus): Promise<ImportItem[]> {
  const supabase = getSupabaseAdminClient()
  let query = supabase
    .from("tryout_import_queue")
    .select("*")
    .order("created_at", { ascending: false })

  if (status) query = query.eq("status", status)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []).map((r) => mapImportItem(r as ImportItemRow))
}

/** Fetches a single import queue item by id. */
export async function fetchImportItemById(id: string): Promise<ImportItem | null> {
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from("tryout_import_queue")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data ? mapImportItem(data as ImportItemRow) : null
}
