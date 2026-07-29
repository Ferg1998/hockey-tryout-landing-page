"use client"

import { useState } from "react"
import useSWR from "swr"
import { HeroSearch, type SearchFilters } from "@/components/hero-search"
import { TryoutResults } from "@/components/tryout-results"
import {
  tryouts as sampleTryouts,
  parseTryoutStartDate,
  type TryoutListing,
} from "@/lib/data"
import { fetchTryouts } from "@/lib/supabase/tryouts"

export function TryoutFinder() {
  const [results, setResults] = useState<TryoutListing[] | null>(null)

  // Fetch from the Supabase `tryouts` table. Falls back to local sample data
  // when Supabase is not configured (source === "local").
  const { data, isLoading } = useSWR("tryouts", fetchTryouts, {
    revalidateOnFocus: false,
  })

  const usingSupabase = data?.source === "supabase"
  const dataset = usingSupabase ? data!.data : sampleTryouts
  const datasetEmpty = usingSupabase && dataset.length === 0

  function handleSearch(filters: SearchFilters) {
    const team = filters.team.trim().toLowerCase()
    const city = filters.city.trim().toLowerCase()
    const { province, birthYear, ageGroup, level, upcomingOnly } = filters

    // Start of today, so a tryout happening today still counts as upcoming.
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const matches = dataset.filter((t) => {
      const matchesTeam = team ? t.team.toLowerCase().includes(team) : true
      const matchesCity = city ? t.city.toLowerCase().includes(city) : true
      const matchesProvince = province ? t.province === province : true
      const matchesYear = birthYear ? t.birthYear === birthYear : true
      const matchesAge = ageGroup ? t.ageGroup === ageGroup : true
      const matchesLevel = level ? t.level === level : true

      let matchesUpcoming = true
      if (upcomingOnly) {
        const start = parseTryoutStartDate(t.dates)
        // Keep unparseable dates so valid listings are never hidden.
        matchesUpcoming = start ? start >= today : true
      }

      return (
        matchesTeam &&
        matchesCity &&
        matchesProvince &&
        matchesYear &&
        matchesAge &&
        matchesLevel &&
        matchesUpcoming
      )
    })

    setResults(matches)

    // Scroll to results after render.
    requestAnimationFrame(() => {
      document
        .getElementById("search-results")
        ?.scrollIntoView({ behavior: "smooth", block: "start" })
    })
  }

  return (
    <>
      <HeroSearch onSearch={handleSearch} />
      {results !== null && (
        <TryoutResults
          results={results}
          total={dataset.length}
          loading={isLoading}
          datasetEmpty={datasetEmpty}
          onClear={() => setResults(null)}
        />
      )}
    </>
  )
}
