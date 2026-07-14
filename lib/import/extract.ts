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

// Schema the model must return. Every field is nullable so the model can
// honestly report missing information rather than hallucinating.
const extractionSchema = z.object({
  organizationName: nullableString,
  teamName: nullableString,
  ageGroup: nullableString.describe("e.g. U13, U15, Midget"),
  birthYear: nullableString.describe("Eligible birth year(s), e.g. 2011 or 2010-2011"),
  level: nullableString.describe("e.g. AAA, AA, A, House League"),
  season: nullableString.describe("e.g. 2025-2026"),
  tryoutDates: nullableString.describe("Human-readable tryout date(s)"),
  registrationDeadline: nullableString,
  cost: nullableString.describe("Registration cost, include currency if shown"),
  registrationLink: nullableString.describe("Absolute URL to register, if present"),
  arena: nullableString.describe("Arena or rink name"),
  address: nullableString.describe("Street address of the arena"),
  positionsNeeded: nullableString.describe("Positions being recruited, e.g. Goalie, Defence"),
  equipment: nullableString.describe("Equipment requirements"),
  capacity: nullableString.describe("Max players/spots, if stated"),
  description: nullableString.describe("A concise summary of the tryout"),
  contactInformation: nullableString.describe("Contact name, email, and/or phone"),
  isTryoutPage: z
    .boolean()
    .describe("True only if this page actually describes a hockey tryout"),
  confidenceScore: z
    .number()
    .min(0)
    .max(1)
    .describe(
      "Your confidence from 0 to 1 that the extracted fields are accurate and this is a real tryout listing",
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
  isTryoutPage: boolean
  confidenceScore: number
}

/**
 * Extracts structured tryout fields from cleaned page text using the AI SDK's
 * generateObject. All returned string fields are sanitized defensively. Throws
 * if the model call fails so the caller can record the error.
 */
export async function extractTryoutFromText(
  pageText: string,
  sourceUrl: string,
): Promise<ExtractedTryout> {
  const { object } = await generateObject({
    model: EXTRACTION_MODEL,
    schema: extractionSchema,
    system:
      "You extract youth/amateur hockey tryout information from a web page's text. " +
      "Only report values that are explicitly present. If a field is not present, return null. " +
      "Never invent dates, prices, or contact details. Set isTryoutPage to false if the page " +
      "is not clearly about a hockey tryout.",
    prompt: `Source URL: ${sourceUrl}\n\nPage content:\n"""\n${pageText}\n"""`,
  })

  return {
    organizationName: sanitizeField(object.organizationName),
    teamName: sanitizeField(object.teamName),
    ageGroup: sanitizeField(object.ageGroup, 100),
    birthYear: sanitizeField(object.birthYear, 100),
    level: sanitizeField(object.level, 100),
    season: sanitizeField(object.season, 100),
    tryoutDates: sanitizeField(object.tryoutDates, 300),
    registrationDeadline: sanitizeField(object.registrationDeadline, 300),
    cost: sanitizeField(object.cost, 200),
    registrationLink: sanitizeUrl(object.registrationLink),
    arena: sanitizeField(object.arena, 300),
    address: sanitizeField(object.address, 400),
    positionsNeeded: sanitizeField(object.positionsNeeded, 300),
    equipment: sanitizeField(object.equipment, 1000),
    capacity: sanitizeField(object.capacity, 100),
    description: sanitizeField(object.description, 4000),
    contactInformation: sanitizeField(object.contactInformation, 500),
    isTryoutPage: Boolean(object.isTryoutPage),
    confidenceScore: clampScore(object.confidenceScore),
  }
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
