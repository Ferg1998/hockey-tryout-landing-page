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
  const { object } = await generateObject({
    model: "openai/gpt-4.1-mini",
    schema: organizationSchema,
    system:
      "Extract Canadian minor, junior, girls/women's, and competitive hockey organizations " +
      "from an official league, governing-body, or association directory. Return one record per " +
      "actual organization. Do not return navigation labels, sponsors, arenas, staff, or governing " +
      "bodies unless they are themselves a member organization. Prefer the official organization " +
      "website from the provided link list. Never invent a URL or city.",
    prompt:
      `Directory URL: ${sourceUrl}\n\n` +
      "The page text includes anchor destinations formatted as `label [URL]`.\n\n" +
      pageText.slice(0, 80_000),
  })

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

function normalizeUrl(value: string | null): string | null {
  if (!value) return null
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null
  } catch {
    return null
  }
}

