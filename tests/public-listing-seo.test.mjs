import assert from "node:assert/strict"
import test from "node:test"

import {
  organizationSeo,
  serializeJsonLd,
  teamSeo,
  tryoutSeo,
} from "../lib/public-listing-seo.ts"

test("builds unique organization metadata and omits missing structured-data fields", () => {
  const { metadata, jsonLd } = organizationSeo({
    id: "org-1",
    name: "North Stars",
    slug: "north stars",
    city: "Sudbury",
    province: "ON",
    verified: false,
  })

  assert.equal(metadata.title, "North Stars — Hockey Tryouts & Teams")
  assert.equal(
    metadata.alternates.canonical,
    "https://hockeytryouts.ca/organizations/north%20stars",
  )
  assert.equal(jsonLd["@type"], "SportsOrganization")
  assert.equal(jsonLd.address.addressCountry, "CA")
  assert.equal("streetAddress" in jsonLd.address, false)
})

test("builds team metadata and SportsTeam membership with optional fallbacks", () => {
  const { metadata, jsonLd } = teamSeo(
    {
      id: "team-1",
      name: "Wolves",
      slug: "wolves",
      level: "AAA",
      ageGroup: "U15",
      active: true,
    },
    { name: "Northern Hockey" },
  )

  assert.equal(metadata.title, "Wolves — AAA U15 Hockey Tryouts")
  assert.match(metadata.description, /Wolves/)
  assert.equal(jsonLd["@type"], "SportsTeam")
  assert.equal(jsonLd.memberOf.name, "Northern Hockey")
  assert.equal("location" in jsonLd, false)
})

test("builds SportsEvent data without publishing placeholder registration offers", () => {
  const tryout = {
    id: "tryout/1",
    team: "Wolves",
    city: "Sudbury",
    province: "ON",
    birthYear: "2011",
    ageGroup: "U15",
    level: "AAA",
    dates: "September 1–3",
    arena: "Community Arena",
    cost: "$100",
    status: "Open",
    registrationLink: "#",
    image: "",
  }
  const { metadata, jsonLd } = tryoutSeo(tryout)

  assert.equal(metadata.alternates.canonical, "https://hockeytryouts.ca/tryouts/tryout%2F1")
  assert.equal(jsonLd["@type"], "SportsEvent")
  assert.equal(jsonLd.location.address.addressCountry, "CA")
  assert.equal("offers" in jsonLd, false)
})

test("escapes script-closing characters in JSON-LD", () => {
  const serialized = serializeJsonLd({ name: "</script><script>alert(1)</script>" })

  assert.equal(serialized.includes("</script>"), false)
  assert.match(serialized, /\\u003c\/script>/)
})
