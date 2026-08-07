export const SITE_URL = "https://hockeytryouts.ca"

const FALLBACK_LAST_MODIFIED = "1970-01-01T00:00:00.000Z"

type SitemapRecord = {
  url: string
  lastModified: string
}

type PublicRecord = {
  id: string
  slug?: string
  createdAt?: string
}

export type SitemapLoaders = {
  organizations: () => Promise<PublicRecord[]>
  teams: () => Promise<PublicRecord[]>
  tryouts: () => Promise<PublicRecord[]>
}

function safeDate(value?: string): string {
  if (!value) return FALLBACK_LAST_MODIFIED
  const date = new Date(value)
  return Number.isNaN(date.valueOf()) ? FALLBACK_LAST_MODIFIED : date.toISOString()
}

function entry(path: string, lastModified?: string): SitemapRecord {
  return {
    url: `${SITE_URL}${path}`,
    lastModified: safeDate(lastModified),
  }
}

/** Builds the public sitemap, retaining the homepage if any data query fails. */
export async function generatePublicSitemap(loaders: SitemapLoaders): Promise<SitemapRecord[]> {
  const homepage = entry("")

  try {
    const [organizations, teams, tryouts] = await Promise.all([
      loaders.organizations(),
      loaders.teams(),
      loaders.tryouts(),
    ])

    return [
      homepage,
      ...organizations.map((organization) =>
        entry(
          `/organizations/${encodeURIComponent(organization.slug ?? organization.id)}`,
          organization.createdAt,
        ),
      ),
      ...teams.map((team) =>
        entry(`/teams/${encodeURIComponent(team.slug ?? team.id)}`, team.createdAt),
      ),
      ...tryouts.map((tryout) =>
        entry(`/tryouts/${encodeURIComponent(tryout.id)}`, tryout.createdAt),
      ),
    ]
  } catch {
    return [homepage]
  }
}
