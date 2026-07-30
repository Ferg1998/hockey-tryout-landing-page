import "server-only"

import { generateObject } from "ai"
import { z } from "zod"
import { sanitizeField } from "@/lib/import/sanitize"

const organizationSchema = z.object({
  organizations: z.array(
    z.object({
      organizationName: z.string(),
      website: z.string().nullable(),
      city: z.string().nullable(),
      leagueOrBranch: z.string().nullable(),
      confidenceScore: z.number().min(0).max(1),
    }),
  ),
})

const EXTRACTION_TIMEOUT_MS = 45_000
const MAX_DIRECTORY_TEXT_LENGTH = 40_000

export type DiscoveredOrganization = {
  organizationName: string
  website: string | null
  city: string | null
  leagueOrBranch: string | null
  confidenceScore: number
}

export async function extractOrganizations(
  pageText: string,
  sourceUrl: string,
): Promise<DiscoveredOrganization[]> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), EXTRACTION_TIMEOUT_MS)
  let object: z.infer<typeof organizationSchema>
  try {
    const result = await generateObject({
      model: "openai/gpt-4.1-mini",
      schema: organizationSchema,
      abortSignal: controller.signal,
      maxRetries: 0,
      system:
        "Extract Canadian minor, junior, girls/women's, and competitive hockey organizations " +
        "from an official league, governing-body, or association directory. Return one record per " +
        "actual organization. Do not return navigation labels, sponsors, arenas, staff, or governing " +
        "bodies unless they are themselves a member organization. Prefer the official organization " +
        "website from the provided link list. Never invent a URL or city.",
      prompt:
        `Directory URL: ${sourceUrl}\n\n` +
        "The page text includes anchor destinations formatted as `label [URL]`.\n\n" +
        pageText.slice(0, MAX_DIRECTORY_TEXT_LENGTH),
    })
    object = result.object
  } catch (error) {
    const fallback = extractOrganizationsFromLinks(pageText, sourceUrl)
    if (fallback.length > 0) return fallback
    if (controller.signal.aborted) throw new Error("Organization extraction timed out. Try the scan again.")
    throw error
  } finally {
    clearTimeout(timer)
  }

  const seen = new Set<string>()
  return object.organizations
    .map((item) => ({
      organizationName: sanitizeField(item.organizationName) ?? "",
      website: normalizeUrl(sanitizeField(item.website)),
      city: sanitizeField(item.city),
      leagueOrBranch: sanitizeField(item.leagueOrBranch),
      confidenceScore: Math.max(0, Math.min(1, item.confidenceScore)),
    }))
    .filter((item) => {
      const key = item.organizationName.toLowerCase().replace(/[^a-z0-9]/g, "")
      if (key.length < 3 || seen.has(key)) return false
      seen.add(key)
      return true
    })
}

function extractOrganizationsFromLinks(
  pageText: string,
  sourceUrl: string,
): DiscoveredOrganization[] {
  const sourceHost = normalizeUrl(sourceUrl) ? new URL(sourceUrl).hostname.replace(/^www\./, "") : null
  const seen = new Set<string>()
  const organizations: DiscoveredOrganization[] = []
  const linkPattern = /^(.+?)\s+\[(https?:\/\/[^\]]+)\]\s*$/gm

  for (const match of pageText.matchAll(linkPattern)) {
    const organizationName = sanitizeField(match[1]) ?? ""
    const website = normalizeUrl(match[2])
    if (!website || !looksLikeHockeyOrganization(organizationName)) continue

    const host = new URL(website).hostname.replace(/^www\./, "")
    if (host === sourceHost || /(?:facebook|instagram|twitter|x|youtube)\.com$/i.test(host)) continue

    const key = organizationName.toLowerCase().replace(/[^a-z0-9]/g, "")
    if (key.length < 3 || seen.has(key)) continue
    seen.add(key)
    organizations.push({
      organizationName,
      website,
      city: null,
      leagueOrBranch: null,
      confidenceScore: 0.75,
    })
  }

  return organizations
}

function looksLikeHockeyOrganization(value: string): boolean {
  return /\b(?:hockey|mha|omha|gmha|girls|minor)\b/i.test(value) &&
    !/\b(?:news|schedule|standings|contact|registration|tryout|arena|shop|policy)\b/i.test(value)
}

function normalizeUrl(value: string | null): string | null {
  if (!value) return null
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null
  } catch {
    return null
  }
}
