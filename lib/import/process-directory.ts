import "server-only"

import { createHash } from "node:crypto"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"
import { htmlToText } from "@/lib/import/sanitize"
import { extractOrganizations } from "@/lib/import/extract-organizations"

const USER_AGENT =
  "HockeyTryoutsBot/1.0 (+https://hockeytryouts.ca/about/crawler; respects robots.txt)"
const TIMEOUT_MS = 20_000
const MAX_HTML_LENGTH = 2_000_000

export type DirectoryResult = {
  ok: boolean
  message: string
  discovered?: number
  queued?: number
}

export async function processOrganizationDirectory(
  sourceUrl: string,
  sourceName: string | null,
  province: string,
): Promise<DirectoryResult> {
  let url: URL
  try {
    url = new URL(sourceUrl)
    if (!["http:", "https:"].includes(url.protocol)) throw new Error("Invalid protocol")
  } catch {
    return { ok: false, message: "Enter a valid public http(s) directory URL." }
  }

  const allowed = await robotsAllows(url)
  if (!allowed) return { ok: false, message: "The directory blocks this crawler in robots.txt." }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  let html: string
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": USER_AGENT, Accept: "text/html,application/xhtml+xml" },
    })
    if (!response.ok) return { ok: false, message: `Directory returned HTTP ${response.status}.` }
    if (!(response.headers.get("content-type") ?? "").includes("html")) {
      return { ok: false, message: "The directory is not an HTML page." }
    }
    html = (await response.text()).slice(0, MAX_HTML_LENGTH)
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error && error.name === "AbortError"
        ? "Directory request timed out."
        : "Directory could not be downloaded.",
    }
  } finally {
    clearTimeout(timer)
  }

  const text = `${htmlToText(html)}\n\nLINKS:\n${extractLinks(html, url)}`
  const contentHash = createHash("sha256").update(text).digest("hex")
  const supabase = getSupabaseAdminClient()
  const now = new Date().toISOString()

  const { data: source, error: sourceError } = await supabase
    .from("organization_directory_sources")
    .upsert({
      source_url: url.toString(),
      source_name: sourceName,
      province,
      active: true,
      scrape_allowed: true,
      last_checked_at: now,
      content_hash: contentHash,
      error_message: null,
    }, { onConflict: "source_url" })
    .select("id")
    .single()
  if (sourceError) return { ok: false, message: sourceError.message }

  let organizations
  try {
    organizations = await extractOrganizations(text, url.toString())
  } catch (error) {
    const message = error instanceof Error ? error.message : "Organization extraction failed."
    await supabase
      .from("organization_directory_sources")
      .update({ error_message: message })
      .eq("id", source.id)
    return { ok: false, message }
  }

  const { data: existing } = await supabase
    .from("Organizations")
    .select("id, organization_name, website")

  const normalizedExisting = (existing ?? []).map((item) => ({
    id: String(item.id),
    name: normalize(String(item.organization_name ?? "")),
    host: hostname(item.website ? String(item.website) : null),
  }))

  const rows = organizations.map((item) => {
    const itemName = normalize(item.organizationName)
    const itemHost = hostname(item.website)
    const duplicate = normalizedExisting.find(
      (candidate) =>
        (itemHost && candidate.host === itemHost) ||
        candidate.name === itemName,
    )
    return {
      directory_source_id: source.id,
      organization_name: item.organizationName,
      website: item.website,
      city: item.city,
      province,
      league_or_branch: item.leagueOrBranch || sourceName,
      source_url: url.toString(),
      confidence_score: item.confidenceScore,
      status: duplicate ? "duplicate" : "pending_review",
      duplicate_of_organization_id: duplicate?.id ?? null,
    }
  })

  const { data: queuedRows } = await supabase
    .from("organization_import_queue")
    .select("organization_name, website")
    .eq("directory_source_id", source.id)
  const queuedKeys = new Set(
    (queuedRows ?? []).map((item) =>
      `${normalize(String(item.organization_name))}|${hostname(item.website ? String(item.website) : null) ?? ""}`,
    ),
  )

  let queued = 0
  for (const row of rows) {
    const key = `${normalize(row.organization_name)}|${hostname(row.website) ?? ""}`
    if (queuedKeys.has(key)) continue
    const { error } = await supabase
      .from("organization_import_queue")
      .insert(row)
    if (!error) {
      queuedKeys.add(key)
      if (row.status === "pending_review") queued++
    }
  }

  await supabase
    .from("organization_directory_sources")
    .update({ last_success_at: now, error_message: null })
    .eq("id", source.id)

  return {
    ok: true,
    discovered: organizations.length,
    queued,
    message: `Found ${organizations.length} organizations; ${queued} new records are ready for review.`,
  }
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/\b(hockey|association|club|minor)\b/g, "").replace(/[^a-z0-9]/g, "")
}

function hostname(value: string | null): string | null {
  if (!value) return null
  try {
    return new URL(value).hostname.replace(/^www\./, "").toLowerCase()
  } catch {
    return null
  }
}

function extractLinks(html: string, base: URL): string {
  const links: string[] = []
  const pattern = /<a\b[^>]*href\s*=\s*["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi
  for (const match of html.matchAll(pattern)) {
    try {
      const href = new URL(match[1], base)
      if (!["http:", "https:"].includes(href.protocol)) continue
      const label = htmlToText(match[2]).trim()
      if (label) links.push(`${label} [${href.toString()}]`)
    } catch {
      // Ignore malformed links.
    }
    if (links.length >= 2_000) break
  }
  return links.join("\n")
}

async function robotsAllows(url: URL): Promise<boolean> {
  try {
    const robotsUrl = new URL("/robots.txt", url.origin)
    const response = await fetch(robotsUrl, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(5_000),
    })
    if (!response.ok) return true
    const lines = (await response.text()).split(/\r?\n/)
    let applies = false
    for (const line of lines) {
      const [rawKey, ...rest] = line.split(":")
      const key = rawKey.trim().toLowerCase()
      const value = rest.join(":").trim()
      if (key === "user-agent") applies = value === "*" || /hockeytryoutsbot/i.test(value)
      if (applies && key === "disallow" && value === "/") return false
    }
    return true
  } catch {
    return true
  }
}
