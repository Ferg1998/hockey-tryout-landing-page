import "server-only"

import { createHash } from "node:crypto"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"
import { fetchSourcePageById } from "@/lib/supabase/import"
import { htmlToText } from "@/lib/import/sanitize"
import { extractTryoutFromText } from "@/lib/import/extract"

// Descriptive user agent so site owners can identify and contact us.
const USER_AGENT =
  "HockeyTryoutsBot/1.0 (+https://hockeytryouts.ca/about/crawler; respects robots.txt)"

// Rate limiting: minimum interval between fetches to the same host, and a
// minimum spacing before the same source is checked again.
const MIN_HOST_INTERVAL_MS = 5_000
const MIN_RECHECK_INTERVAL_MS = 60 * 60 * 1000 // 1 hour
const FETCH_TIMEOUT_MS = 15_000
const MAX_BYTES = 2_000_000 // 2MB cap on downloaded HTML

// In-memory guards. Not durable across serverless instances, but combined with
// the persisted next_check_at they prevent hammering and concurrent runs.
const lastHostFetch = new Map<string, number>()
const processing = new Set<string>()

export type ProcessResult = {
  ok: boolean
  status: "imported" | "unchanged" | "skipped" | "error"
  message: string
  importItemId?: string
}

export async function processSource(sourceId: string): Promise<ProcessResult> {
  // Prevent duplicate/concurrent processing of the same source.
  if (processing.has(sourceId)) {
    return { ok: false, status: "skipped", message: "This source is already being processed." }
  }
  processing.add(sourceId)
  try {
    return await run(sourceId)
  } finally {
    processing.delete(sourceId)
  }
}

async function run(sourceId: string): Promise<ProcessResult> {
  const source = await fetchSourcePageById(sourceId)
  if (!source) {
    return { ok: false, status: "error", message: "Source not found." }
  }

  // Guard: respect the admin's activation and scraping permission flags.
  if (!source.active) {
    return { ok: false, status: "skipped", message: "Source is inactive." }
  }
  if (!source.scrapeAllowed) {
    return {
      ok: false,
      status: "skipped",
      message: "Scraping is not allowed for this source.",
    }
  }

  // Validate URL and scheme (never fetch non-http(s)).
  let url: URL
  try {
    url = new URL(source.sourceUrl)
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("Only http(s) URLs are supported.")
    }
  } catch {
    await recordError(sourceId, "Invalid source URL.")
    return { ok: false, status: "error", message: "Invalid source URL." }
  }

  // Rate limit: space out checks and per-host requests.
  if (source.lastCheckedAt) {
    const since = Date.now() - new Date(source.lastCheckedAt).getTime()
    if (since < MIN_RECHECK_INTERVAL_MS) {
      const mins = Math.ceil((MIN_RECHECK_INTERVAL_MS - since) / 60000)
      return {
        ok: false,
        status: "skipped",
        message: `Checked recently. Try again in about ${mins} minute(s).`,
      }
    }
  }
  const host = url.host
  const lastHost = lastHostFetch.get(host) ?? 0
  const hostWait = MIN_HOST_INTERVAL_MS - (Date.now() - lastHost)
  if (hostWait > 0) {
    await new Promise((r) => setTimeout(r, hostWait))
  }

  // Respect robots.txt for our user agent.
  const robotsAllowed = await isAllowedByRobots(url)
  if (!robotsAllowed) {
    await recordError(sourceId, "Blocked by robots.txt.")
    return { ok: false, status: "error", message: "Blocked by robots.txt." }
  }

  // Fetch the page with a timeout and descriptive user agent.
  let html: string
  try {
    lastHostFetch.set(host, Date.now())
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
    const res = await fetch(url.toString(), {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
      },
    }).finally(() => clearTimeout(timer))

    // Never bypass access restrictions: treat auth/anti-bot walls as blocked.
    if (res.status === 401 || res.status === 403) {
      await recordError(sourceId, `Access restricted (HTTP ${res.status}). Not bypassing.`)
      return { ok: false, status: "error", message: `Access restricted (HTTP ${res.status}).` }
    }
    if (res.status === 429) {
      await recordError(sourceId, "Rate limited by source (HTTP 429).")
      return { ok: false, status: "error", message: "Rate limited by source (HTTP 429)." }
    }
    if (!res.ok) {
      await recordError(sourceId, `Fetch failed (HTTP ${res.status}).`)
      return { ok: false, status: "error", message: `Fetch failed (HTTP ${res.status}).` }
    }

    const contentType = res.headers.get("content-type") ?? ""
    if (!contentType.includes("html")) {
      await recordError(sourceId, `Unsupported content type: ${contentType || "unknown"}.`)
      return { ok: false, status: "error", message: "Page is not HTML." }
    }

    html = await readCapped(res, MAX_BYTES)
  } catch (e) {
    const message =
      e instanceof Error && e.name === "AbortError"
        ? "Fetch timed out."
        : e instanceof Error
          ? e.message
          : "Fetch failed."
    await recordError(sourceId, message)
    return { ok: false, status: "error", message }
  }

  // Detect obvious login/CAPTCHA walls and refuse to proceed.
  if (looksLikeAccessWall(html)) {
    await recordError(sourceId, "Login or CAPTCHA wall detected. Not bypassing.")
    return { ok: false, status: "error", message: "Login/CAPTCHA wall detected." }
  }

  const text = htmlToText(html)
  const contentHash = createHash("sha256").update(text).digest("hex")

  const supabase = getSupabaseAdminClient()
  const now = new Date().toISOString()
  const nextCheck = new Date(Date.now() + MIN_RECHECK_INTERVAL_MS).toISOString()

  // Prevent duplicate processing: if content is unchanged, skip extraction.
  if (source.contentHash && source.contentHash === contentHash) {
    await supabase
      .from("source_pages")
      .update({ last_checked_at: now, next_check_at: nextCheck, error_message: null })
      .eq("id", sourceId)
    return { ok: true, status: "unchanged", message: "No changes since last check." }
  }

  if (!text || text.length < 40) {
    await recordError(sourceId, "Page had no readable content.")
    return { ok: false, status: "error", message: "No readable content found." }
  }

  // AI extraction. A page may describe multiple teams -> multiple listings.
  let extraction
  try {
    extraction = await extractTryoutFromText(text, source.sourceUrl)
  } catch (e) {
    const message = e instanceof Error ? e.message : "Extraction failed."
    await recordError(sourceId, `Extraction failed: ${message}`)
    return { ok: false, status: "error", message: `Extraction failed: ${message}` }
  }

  // Load existing queue rows for this source so we never create duplicates when
  // the same page is checked again. We key on a normalized team+age+level+org
  // fingerprint and skip any listing that already has a live (non-rejected) row.
  const { data: existingRows } = await supabase
    .from("tryout_import_queue")
    .select("organization_name, team_name, age_group, level, status")
    .eq("source_page_id", sourceId)

  const seen = new Set<string>()
  for (const r of existingRows ?? []) {
    const row = r as Record<string, unknown>
    if (String(row.status) === "rejected") continue
    seen.add(
      fingerprint(
        row.organization_name as string | null,
        row.team_name as string | null,
        row.age_group as string | null,
        row.level as string | null,
      ),
    )
  }

  // Build insert rows for genuinely new listings.
  const toInsert: Record<string, unknown>[] = []
  for (const l of extraction.listings) {
    // Ignore empty shells the model may emit.
    if (!l.teamName && !l.organizationName && !l.tryoutDates) continue

    const fp = fingerprint(l.organizationName, l.teamName, l.ageGroup, l.level)
    if (seen.has(fp)) continue // duplicate (already queued/approved) -> skip
    seen.add(fp) // also dedupes repeats within this same extraction batch

    // Keep dates and times per team; fold times into the dates string since the
    // queue has no separate times column (avoids a schema change).
    const datesWithTimes = [l.tryoutDates, l.tryoutTimes]
      .filter((v) => v && v.trim())
      .join(" · ")

    const status =
      !extraction.isTryoutPage || l.confidenceScore < 0.4
        ? "needs_information"
        : "pending_review"

    toInsert.push({
      source_page_id: sourceId,
      organization_name: l.organizationName,
      team_name: l.teamName,
      age_group: l.ageGroup,
      birth_year: l.birthYear,
      level: l.level,
      season: l.season,
      tryout_dates: datesWithTimes || null,
      registration_deadline: l.registrationDeadline,
      cost: l.cost,
      registration_link: l.registrationLink,
      arena: l.arena,
      address: l.address,
      positions_needed: l.positionsNeeded,
      equipment: l.equipment,
      capacity: l.capacity,
      description: l.description,
      contact_information: l.contactInformation,
      source_url: source.sourceUrl,
      confidence_score: l.confidenceScore,
      status,
      raw_content: text.slice(0, 8000),
    })
  }

  let insertedCount = 0
  if (toInsert.length > 0) {
    const { data: inserted, error: insertError } = await supabase
      .from("tryout_import_queue")
      .insert(toInsert)
      .select("id")

    if (insertError) {
      await recordError(sourceId, `Failed to save import: ${insertError.message}`)
      return { ok: false, status: "error", message: insertError.message }
    }
    insertedCount = inserted?.length ?? toInsert.length
  }

  // Record a successful check and store the content hash.
  await supabase
    .from("source_pages")
    .update({
      last_checked_at: now,
      last_success_at: now,
      next_check_at: nextCheck,
      content_hash: contentHash,
      error_message: null,
    })
    .eq("id", sourceId)

  const found = extraction.listings.length
  const skipped = found - insertedCount
  if (insertedCount === 0) {
    return {
      ok: true,
      status: "unchanged",
      message:
        found === 0
          ? "No tryout listings found on the page."
          : "No new listings — all were already in the review queue.",
    }
  }

  return {
    ok: true,
    status: "imported",
    message:
      `Imported ${insertedCount} listing${insertedCount === 1 ? "" : "s"} for review` +
      (skipped > 0 ? ` (${skipped} already queued).` : "."),
  }
}

// Normalized fingerprint for duplicate detection across re-checks.
function fingerprint(
  org: string | null,
  team: string | null,
  age: string | null,
  level: string | null,
): string {
  const norm = (v: string | null) => (v ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "")
  return [norm(org), norm(team), norm(age), norm(level)].join("|")
}

async function recordError(sourceId: string, message: string) {
  const supabase = getSupabaseAdminClient()
  await supabase
    .from("source_pages")
    .update({
      last_checked_at: new Date().toISOString(),
      error_message: message.slice(0, 500),
    })
    .eq("id", sourceId)
}

// Reads the response body but stops after maxBytes to avoid unbounded memory.
async function readCapped(res: Response, maxBytes: number): Promise<string> {
  const reader = res.body?.getReader()
  if (!reader) return await res.text()
  const decoder = new TextDecoder()
  let received = 0
  let out = ""
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    received += value.byteLength
    out += decoder.decode(value, { stream: true })
    if (received >= maxBytes) {
      await reader.cancel()
      break
    }
  }
  out += decoder.decode()
  return out
}

// Minimal robots.txt check for our user agent and the wildcard group.
async function isAllowedByRobots(url: URL): Promise<boolean> {
  try {
    const robotsUrl = `${url.origin}/robots.txt`
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 5000)
    const res = await fetch(robotsUrl, {
      headers: { "User-Agent": USER_AGENT },
      signal: controller.signal,
    }).finally(() => clearTimeout(timer))

    if (!res.ok) return true // No robots.txt => allowed.
    const body = await res.text()
    return isPathAllowed(body, url.pathname)
  } catch {
    return true // If robots.txt can't be read, don't block.
  }
}

// Parses robots.txt and returns whether the path is allowed for our agent.
function isPathAllowed(robots: string, path: string): boolean {
  const lines = robots.split(/\r?\n/).map((l) => l.replace(/#.*$/, "").trim())
  const groups: { agents: string[]; disallow: string[]; allow: string[] }[] = []
  let current: { agents: string[]; disallow: string[]; allow: string[] } | null = null
  let lastWasAgent = false

  for (const line of lines) {
    if (!line) continue
    const [rawKey, ...rest] = line.split(":")
    const key = rawKey.toLowerCase().trim()
    const value = rest.join(":").trim()
    if (key === "user-agent") {
      if (!current || !lastWasAgent) {
        current = { agents: [], disallow: [], allow: [] }
        groups.push(current)
      }
      current.agents.push(value.toLowerCase())
      lastWasAgent = true
    } else if (key === "disallow" && current) {
      current.disallow.push(value)
      lastWasAgent = false
    } else if (key === "allow" && current) {
      current.allow.push(value)
      lastWasAgent = false
    } else {
      lastWasAgent = false
    }
  }

  // Prefer a group matching our token, else the wildcard group.
  const ua = "hockeytryoutsbot"
  const match =
    groups.find((g) => g.agents.some((a) => ua.includes(a) && a !== "*")) ??
    groups.find((g) => g.agents.includes("*"))
  if (!match) return true

  // Longest-match rule between allow and disallow.
  const matchLen = (rules: string[]) =>
    rules
      .filter((r) => r !== "" && path.startsWith(r))
      .reduce((max, r) => Math.max(max, r.length), -1)

  const disallowLen = matchLen(match.disallow)
  const allowLen = matchLen(match.allow)
  if (disallowLen === -1) return true
  return allowLen >= disallowLen
}

// Heuristic detection of login/CAPTCHA walls so we never attempt to bypass them.
function looksLikeAccessWall(html: string): boolean {
  const lower = html.toLowerCase()
  const signals = [
    "recaptcha",
    "g-recaptcha",
    "hcaptcha",
    "cf-challenge",
    "please enable javascript and cookies",
    "checking your browser before accessing",
    "sign in to continue",
    "log in to continue",
    "you must be logged in",
  ]
  return signals.some((s) => lower.includes(s))
}
