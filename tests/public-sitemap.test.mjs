import assert from "node:assert/strict"
import test from "node:test"

import { generatePublicSitemap, SITE_URL } from "../lib/public-sitemap.ts"

test("includes canonical public listing routes with reliable modification dates", async () => {
  const sitemap = await generatePublicSitemap({
    organizations: async () => [
      { id: "org-id", slug: "minor hockey", createdAt: "2026-07-01" },
    ],
    teams: async () => [{ id: "team-id", slug: "u18/aaa", createdAt: "invalid" }],
    tryouts: async () => [{ id: "tryout 1" }],
  })

  assert.deepEqual(
    sitemap.map(({ url }) => url),
    [
      SITE_URL,
      `${SITE_URL}/organizations/minor%20hockey`,
      `${SITE_URL}/teams/u18%2Faaa`,
      `${SITE_URL}/tryouts/tryout%201`,
    ],
  )
  assert.equal(sitemap[1].lastModified, "2026-07-01T00:00:00.000Z")
  assert.equal(sitemap[2].lastModified, sitemap[0].lastModified)
})

test("returns at least the homepage when a public data query fails", async () => {
  const sitemap = await generatePublicSitemap({
    organizations: async () => {
      throw new Error("temporary Supabase failure")
    },
    teams: async () => [],
    tryouts: async () => [],
  })

  assert.deepEqual(sitemap, [
    { url: SITE_URL, lastModified: "1970-01-01T00:00:00.000Z" },
  ])
})
