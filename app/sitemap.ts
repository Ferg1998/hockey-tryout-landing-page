import type { MetadataRoute } from "next"

import { generatePublicSitemap } from "@/lib/public-sitemap"
import { fetchOrganizations } from "@/lib/supabase/organizations"
import { fetchTeams } from "@/lib/supabase/teams"
import { fetchTryouts } from "@/lib/supabase/tryouts"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return generatePublicSitemap({
    organizations: fetchOrganizations,
    teams: fetchTeams,
    tryouts: async () => (await fetchTryouts()).data,
  })
}
