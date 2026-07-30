import "server-only"

import { generateObject } from "ai"
import { z } from "zod"
import { sanitizeField } from "@/lib/import/sanitize"

// Model used for extraction. gpt-4.1-mini is a cost-effective, current model
// well-suited to structured extraction and is zero-config on the AI Gateway.
const EXTRACTION_MODEL = "openai/gpt-4.1-mini"
const EXTRACTION_TIMEOUT_MS = 45_000
const MAX_EXTRACTION_ATTEMPTS = 2
const RETRY_DELAY_MS = 4_000

const nullableString = z
  .string()
  .nullable()
  .describe("The value, or null if not present on the page")

// A single tryout session. Each entry is one date with its own time + rink so
// a multi-session schedule is preserved line-by-line instead of being merged.
const sessionSchema = z.object({
  date: nullableString.describe("Session date, e.g. 'Fri, Sep 11' or 'September 11'"),
  startTime: nullableString.describe("Start time, e.g. '4:30 PM'"),
  endTime: nullableString.describe("End time, e.g. '5:30 PM'"),
  rink: nullableString.describe("Rink/pad name for this session, e.g. 'Rink D'"),
})

// A single team/tryout listing. Every field is nullable so the model can
// honestly report missing information rather than hallucinating.
const listingSchema = z.object({
  organizationName: nullableString,
  clubName: nullableString.describe(
    "The club/association brand name as fans know it, e.g. 'Milton Winterhawks', 'Burlington Eagles'. This is the team-name prefix, distinct from the legal org name.",
  ),
  teamName: nullableString.describe(
    "The full team name as '<Club brand> <AgeGroup> <Level>', e.g. 'Milton Winterhawks U7 MD' or 'Milton Winterhawks U21 AA'. " +
      "Build it from the club brand name plus the concise age group and level. Do NOT use raw division-range labels like 'U5-7 - U7 MD' or trailing words like 'Rep'/'Teams'.",
  ),
  ageGroup: nullableString.describe("e.g. U7, U13, U21, Midget"),
  birthYear: nullableString.describe("Eligible birth year(s), e.g. 2011 or 2010-2011"),
  level: nullableString.describe("e.g. AAA, AA, A, MD, House League"),
  season: nullableString.describe("e.g. 2025-2026"),
  tryoutDates: nullableString.describe("Human-readable tryout date(s) for THIS team only"),
  tryoutTimes: nullableString.describe("Time(s) of the tryout sessions for THIS team only"),
  sessions: z
    .array(sessionSchema)
    .describe(
      "EVERY individual tryout session for THIS team — one entry per date. Extract ALL of them " +
        "(do not summarize or drop any), each with its exact date, start time, end time, and rink.",
    ),
  registrationDeadline: nullableString,
  cost: nullableString.describe("Registration cost, include currency if shown"),
  registrationLink: nullableString.describe("Absolute URL to register, if present"),
  arena: nullableString.describe("Arena or rink name for THIS team's tryout"),
  address: nullableString.describe("Street address of the arena"),
  positionsNeeded: nullableString.describe("Positions being recruited, e.g. Goalie, Defence"),
  equipment: nullableString.describe("Equipment requirements"),
  capacity: nullableString.describe("Max players/spots, if stated"),
  description: nullableString.describe("A concise summary of this team's tryout"),
  contactInformation: nullableString.describe(
    "Coach or contact name, email, and/or phone for THIS team",
  ),
  confidenceScore: z
    .number()
    .min(0)
    .max(1)
    .describe(
      "Your confidence from 0 to 1 that these fields are accurate for this specific team's tryout",
    ),
})

// Schema the model must return. A page can describe MANY teams, so we ask for
// an array of listings — one per distinct team/tryout — plus a page-level flag.
const extractionSchema = z.object({
  isTryoutPage: z
    .boolean()
    .describe("True only if this page actually describes one or more hockey tryouts"),
  listings: z
    .array(listingSchema)
    .describe(
      "One entry for EACH distinct team/tryout on the page. If the page lists multiple " +
        "age groups or divisions (e.g. U7 MD and U21 AA), return a separate entry for each.",
    ),
})

export type ExtractionResult = z.infer<typeof extractionSchema>

export type TryoutSession = {
  date: string | null
  startTime: string | null
  endTime: string | null
  rink: string | null
}

export type ExtractedTryout = {
  organizationName: string | null
  teamName: string | null
  ageGroup: string | null
  birthYear: string | null
  level: string | null
  season: string | null
  tryoutDates: string | null
  tryoutTimes: string | null
  sessions: TryoutSession[]
  schedule: string | null
  registrationDeadline: string | null
  cost: string | null
  registrationLink: string | null
  arena: string | null
  address: string | null
  positionsNeeded: string | null
  equipment: string | null
  capacity: string | null
  description: string | null
  contactInformation: string | null
  confidenceScore: number
}

export type ExtractionOutput = {
  isTryoutPage: boolean
  listings: ExtractedTryout[]
}

/**
 * Extracts structured tryout fields from cleaned page text using the AI SDK's
 * generateObject. A single page may describe multiple teams, so this returns an
 * array of listings (one per distinct team/tryout). All returned string fields
 * are sanitized and normalized defensively. Throws if the model call fails so
 * the caller can record the error.
 */
export async function extractTryoutFromText(
  pageText: string,
  sourceUrl: string,
): Promise<ExtractionOutput> {
  let object: z.infer<typeof extractionSchema> | undefined
  let lastError: unknown

  for (let attempt = 1; attempt <= MAX_EXTRACTION_ATTEMPTS; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), EXTRACTION_TIMEOUT_MS)
    try {
      const result = await generateObject({
        model: EXTRACTION_MODEL,
        schema: extractionSchema,
        abortSignal: controller.signal,
        system:
          "You extract youth/amateur hockey tryout information from a web page's text. " +
          "A single page often lists MULTIPLE teams (different age groups or divisions). " +
          "Return one entry in `listings` for EACH distinct team/tryout, and keep each team's " +
          "dates, times, arena, and coach/contact details separate — never merge two teams together. " +
          "Set clubName to the club's brand name (e.g. 'Milton Winterhawks'). " +
          "Compose teamName as '<clubName> <ageGroup> <level>' (e.g. 'Milton Winterhawks U7 MD', " +
          "'Milton Winterhawks U21 AA'); never use raw division-range labels like 'U5-7 - U7 MD'. " +
          "Capture EVERY tryout session in the `sessions` array — one entry per date, each with its " +
          "exact date, start time, end time, and rink. If the page lists 14 sessions, return 14 entries; " +
          "never collapse them into a single date range. " +
          "Only report values that are explicitly present; if a field is not present, return null. " +
          "Do not repeat a token (return 'MD', not 'MD MD'). " +
          "Never invent dates, prices, or contact details. Set isTryoutPage to false only if the page " +
          "is not about hockey tryouts at all.",
        prompt: `Source URL: ${sourceUrl}\n\nPage content:\n"""\n${pageText.slice(0, 60_000)}\n"""`,
      })
      object = result.object
      break
    } catch (error) {
      lastError = error
      if (!isTemporaryModelLimit(error) || attempt === MAX_EXTRACTION_ATTEMPTS) throw error
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * attempt))
    } finally {
      clearTimeout(timer)
    }
  }

  if (!object) throw lastError instanceof Error ? lastError : new Error("Extraction failed.")

  const listings = (object.listings ?? []).map((l) => {
    const clubName = normalizeTokens(sanitizeField(l.clubName))
    const ageGroup = normalizeTokens(sanitizeField(l.ageGroup, 100))
    const level = normalizeTokens(sanitizeField(l.level, 100))

    // Clean each session and keep only those with at least a date.
    const sessions: TryoutSession[] = (l.sessions ?? [])
      .map((s) => ({
        date: sanitizeField(s.date, 120),
        startTime: sanitizeField(s.startTime, 60),
        endTime: sanitizeField(s.endTime, 60),
        rink: sanitizeField(s.rink, 120),
      }))
      .filter((s) => s.date || s.startTime || s.rink)

    const schedule = formatSchedule(sessions)

    const fields = {
      teamName: composeTeamName(normalizeTokens(sanitizeField(l.teamName)), clubName, ageGroup, level),
      organizationName: normalizeTokens(sanitizeField(l.organizationName)),
      ageGroup,
      birthYear: sanitizeField(l.birthYear, 100),
      level,
      season: sanitizeField(l.season, 100),
      tryoutDates: sanitizeField(l.tryoutDates, 300),
      tryoutTimes: sanitizeField(l.tryoutTimes, 300),
      registrationDeadline: sanitizeField(l.registrationDeadline, 300),
      cost: sanitizeField(l.cost, 200),
      registrationLink: sanitizeUrl(l.registrationLink),
      arena: sanitizeField(l.arena, 300),
      address: sanitizeField(l.address, 400),
      positionsNeeded: sanitizeField(l.positionsNeeded, 300),
      equipment: sanitizeField(l.equipment, 1000),
      capacity: sanitizeField(l.capacity, 100),
      description: sanitizeField(l.description, 4000),
      contactInformation: sanitizeField(l.contactInformation, 500),
    }

    return {
      ...fields,
      sessions,
      schedule,
      // Confidence blends the model's own score with how complete the listing
      // is, so a listing missing important fields no longer reports ~95%.
      confidenceScore: computeConfidence(clampScore(l.confidenceScore), fields, sessions),
    }
  })

  return { isTryoutPage: Boolean(object.isTryoutPage), listings }
}

export function isTemporaryModelLimit(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return /429|rate.?limit|quota|too many requests|temporarily unavailable|capacity/i.test(message)
}

/**
 * Formats sessions into a one-per-line schedule, e.g.
 * "Fri, Sep 11 · 4:30–5:30 PM · Rink D". Returns null when there are none.
 */
export function formatSchedule(sessions: TryoutSession[]): string | null {
  const lines = sessions
    .map((s) => {
      const time =
        s.startTime && s.endTime
          ? `${s.startTime}–${s.endTime}`
          : s.startTime || s.endTime || null
      return [s.date, time, s.rink].filter((p) => p && p.trim()).join(" · ")
    })
    .filter((line) => line.trim())
  return lines.length > 0 ? lines.join("\n") : null
}

// Important fields whose absence should lower confidence. Sessions-with-times
// is handled separately since it is the core of a tryout listing.
const IMPORTANT_FIELDS = [
  "birthYear",
  "cost",
  "registrationDeadline",
  "arena",
  "contactInformation",
] as const

/**
 * Blends the model's confidence with a completeness score. Each missing
 * important field applies a penalty, and a schedule with no times is penalized,
 * so incomplete listings surface a realistically lower score for review.
 */
export function computeConfidence(
  modelScore: number,
  fields: Record<string, string | null>,
  sessions: TryoutSession[],
): number {
  let score = modelScore
  const PENALTY = 0.08
  for (const key of IMPORTANT_FIELDS) {
    if (!fields[key]) score -= PENALTY
  }
  // A listing with no sessions at all is a big red flag.
  if (sessions.length === 0) score -= 0.2
  // Sessions present but none have a time is a smaller gap.
  else if (!sessions.some((s) => s.startTime || s.endTime)) score -= PENALTY

  return clampScore(Math.max(score, 0.2))
}

/**
 * Ensures the team name reads as "<Club> <Age> <Level>". If the model already
 * produced a clean club-prefixed name we keep it; otherwise we compose one from
 * the club brand, age group, and level. Falls back to whatever we have.
 */
export function composeTeamName(
  teamName: string | null,
  clubName: string | null,
  ageGroup: string | null,
  level: string | null,
): string | null {
  const looksComposed =
    teamName &&
    clubName &&
    teamName.toLowerCase().includes(clubName.toLowerCase()) &&
    !/\d\s*-\s*u?\d/i.test(teamName) // not a division-range label like "U5-7 - U7"
  if (looksComposed) return normalizeTokens(teamName)

  const parts = [clubName, ageGroup, level].filter((p) => p && p.trim())
  if (parts.length > 0) return normalizeTokens(parts.join(" "))
  return teamName
}

/**
 * Collapses immediately-repeated tokens the model sometimes emits when a page
 * renders a value twice (e.g. "MD MD" -> "MD", "U7 MD MD" -> "U7 MD"). Also
 * collapses an exact repeated whole phrase (e.g. "Winterhawks Winterhawks").
 * Case-insensitive comparison; keeps the first occurrence's casing.
 */
export function normalizeTokens(value: string | null): string | null {
  if (!value) return value
  const tokens = value.split(/\s+/).filter(Boolean)
  const out: string[] = []
  for (const t of tokens) {
    const prev = out[out.length - 1]
    if (prev && prev.toLowerCase() === t.toLowerCase()) continue
    out.push(t)
  }
  const collapsed = out.join(" ")
  // Collapse a phrase repeated back-to-back, e.g. "AA AA" already handled, but
  // also "MD Tier 1 MD Tier 1".
  const half = Math.floor(out.length / 2)
  if (out.length % 2 === 0 && half > 0) {
    const a = out.slice(0, half).join(" ").toLowerCase()
    const b = out.slice(half).join(" ").toLowerCase()
    if (a === b) return out.slice(0, half).join(" ")
  }
  return collapsed
}

// Only keep http(s) URLs; drop anything else to avoid javascript:/data: URIs.
function sanitizeUrl(value: string | null): string | null {
  const cleaned = sanitizeField(value, 500)
  if (!cleaned) return null
  try {
    const u = new URL(cleaned)
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null
  } catch {
    return null
  }
}

function clampScore(n: unknown): number {
  const num = Number(n)
  if (!Number.isFinite(num)) return 0
  return Math.min(1, Math.max(0, num))
}
