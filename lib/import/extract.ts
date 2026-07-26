import "server-only"

import { generateObject } from "ai"
import { z } from "zod"
import { sanitizeField } from "@/lib/import/sanitize"

// Model used for extraction. gpt-4.1-mini is a cost-effective, current model
// well-suited to structured extraction and is zero-config on the AI Gateway.
const EXTRACTION_MODEL = "openai/gpt-4.1-mini"

const nullableString = z
  .string()
  .nullable()
  .describe("The value, or null if not present on the page")

// A single team/tryout listing. Every field is nullable so the model can
// honestly report missing information rather than hallucinating.
const listingSchema = z.object({
  organizationName: nullableString,
  teamName: nullableString.describe(
    "The specific team name, e.g. 'Milton Winterhawks U7 MD'. Always populate this from the listing heading even when it repeats the org name.",
  ),
  ageGroup: nullableString.describe("e.g. U7, U13, U21, Midget"),
  birthYear: nullableString.describe("Eligible birth year(s), e.g. 2011 or 2010-2011"),
  level: nullableString.describe("e.g. AAA, AA, A, MD, House League"),
  season: nullableString.describe("e.g. 2025-2026"),
  tryoutDates: nullableString.describe("Human-readable tryout date(s) for THIS team only"),
  tryoutTimes: nullableString.describe("Time(s) of the tryout sessions for THIS team only"),
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

export type ExtractedTryout = {
  organizationName: string | null
  teamName: string | null
  ageGroup: string | null
  birthYear: string | null
  level: string | null
  season: string | null
  tryoutDates: string | null
  tryoutTimes: string | null
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
  const { object } = await generateObject({
    model: EXTRACTION_MODEL,
    schema: extractionSchema,
    system:
      "You extract youth/amateur hockey tryout information from a web page's text. " +
      "A single page often lists MULTIPLE teams (different age groups or divisions). " +
      "Return one entry in `listings` for EACH distinct team/tryout, and keep each team's " +
      "dates, times, arena, and coach/contact details separate — never merge two teams together. " +
      "Always populate teamName from the listing's heading. " +
      "Only report values that are explicitly present; if a field is not present, return null. " +
      "Do not repeat a token (return 'MD', not 'MD MD'). " +
      "Never invent dates, prices, or contact details. Set isTryoutPage to false only if the page " +
      "is not about hockey tryouts at all.",
    prompt: `Source URL: ${sourceUrl}\n\nPage content:\n"""\n${pageText}\n"""`,
  })

  const listings = (object.listings ?? []).map((l) => ({
    organizationName: normalizeTokens(sanitizeField(l.organizationName)),
    teamName: normalizeTokens(sanitizeField(l.teamName)),
    ageGroup: normalizeTokens(sanitizeField(l.ageGroup, 100)),
    birthYear: sanitizeField(l.birthYear, 100),
    level: normalizeTokens(sanitizeField(l.level, 100)),
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
    confidenceScore: clampScore(l.confidenceScore),
  }))

  return { isTryoutPage: Boolean(object.isTryoutPage), listings }
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
