"use client"

import { useState } from "react"
import {
  Search,
  MapPin,
  Users,
  TrendingUp,
  CalendarDays,
  Map,
  Layers,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ageGroups, provinces } from "@/lib/data"

const stats = [
  { value: "6,400+", label: "Tryouts listed" },
  { value: "1,200+", label: "Vetted coaches" },
  { value: "10 provinces", label: "Coast to coast" },
]

export type SearchFilters = {
  team: string
  city: string
  province: string
  birthYear: string
  ageGroup: string
  level: string
  upcomingOnly: boolean
}

export function HeroSearch({
  onSearch,
}: {
  onSearch?: (filters: SearchFilters) => void
}) {
  const [team, setTeam] = useState("")
  const [city, setCity] = useState("")
  const [province, setProvince] = useState("")
  const [birthYear, setBirthYear] = useState("")
  const [ageGroup, setAgeGroup] = useState("")
  const [level, setLevel] = useState("")
  const [upcomingOnly, setUpcomingOnly] = useState(false)

  const years = Array.from({ length: 18 }, (_, i) => 2020 - i)

  return (
    <section className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <img
          src="/images/hero-player-walk.png"
          alt="Young hockey player walking toward the ice"
          className="size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/80 via-primary/65 to-primary/85" />
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-28 pt-16 sm:px-6 sm:pt-20 lg:px-8 lg:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-balance font-display text-4xl font-extrabold leading-tight tracking-tight text-primary-foreground sm:text-5xl lg:text-6xl">
            Find. Prepare. Make the Team.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-base leading-relaxed text-primary-foreground/85 sm:text-lg">
            Find hockey tryouts, discover elite coaches, and prepare your player
            for success across Canada.
          </p>
        </div>

        {/* Search panel */}
        <div className="mx-auto mt-8 max-w-4xl sm:mt-10">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              onSearch?.({
                team,
                city,
                province,
                birthYear,
                ageGroup,
                level,
                upcomingOnly,
              })
            }}
            className="rounded-3xl bg-card p-4 shadow-2xl ring-1 ring-border/60 sm:p-5"
          >
            {/* Text filters */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-2.5 focus-within:border-primary">
                <Users className="size-5 shrink-0 text-primary" />
                <span className="flex flex-1 flex-col text-left">
                  <span className="text-xs font-semibold text-foreground">
                    Team or organization
                  </span>
                  <input
                    value={team}
                    onChange={(e) => setTeam(e.target.value)}
                    placeholder="e.g. Toronto Jr. Marlies"
                    className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                </span>
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-2.5 focus-within:border-primary">
                <MapPin className="size-5 shrink-0 text-primary" />
                <span className="flex flex-1 flex-col text-left">
                  <span className="text-xs font-semibold text-foreground">
                    City
                  </span>
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Anywhere in Canada"
                    className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                </span>
              </label>
            </div>

            {/* Select filters */}
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-2.5 focus-within:border-primary">
                <Map className="size-5 shrink-0 text-primary" />
                <span className="flex flex-1 flex-col text-left">
                  <span className="text-xs font-semibold text-foreground">
                    Province
                  </span>
                  <select
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    className="w-full bg-transparent text-sm text-foreground focus:outline-none"
                  >
                    <option value="">Any province</option>
                    {provinces.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </span>
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-2.5 focus-within:border-primary">
                <CalendarDays className="size-5 shrink-0 text-primary" />
                <span className="flex flex-1 flex-col text-left">
                  <span className="text-xs font-semibold text-foreground">
                    Birth year
                  </span>
                  <select
                    value={birthYear}
                    onChange={(e) => setBirthYear(e.target.value)}
                    className="w-full bg-transparent text-sm text-foreground focus:outline-none"
                  >
                    <option value="">Any year</option>
                    {years.map((y) => (
                      <option key={y}>{y}</option>
                    ))}
                  </select>
                </span>
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-2.5 focus-within:border-primary">
                <Users className="size-5 shrink-0 text-primary" />
                <span className="flex flex-1 flex-col text-left">
                  <span className="text-xs font-semibold text-foreground">
                    Age group
                  </span>
                  <select
                    value={ageGroup}
                    onChange={(e) => setAgeGroup(e.target.value)}
                    className="w-full bg-transparent text-sm text-foreground focus:outline-none"
                  >
                    <option value="">Any age</option>
                    {ageGroups.map((a) => (
                      <option key={a.label}>{a.label}</option>
                    ))}
                  </select>
                </span>
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-2.5 focus-within:border-primary">
                <TrendingUp className="size-5 shrink-0 text-primary" />
                <span className="flex flex-1 flex-col text-left">
                  <span className="text-xs font-semibold text-foreground">
                    Level
                  </span>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full bg-transparent text-sm text-foreground focus:outline-none"
                  >
                    <option value="">Any level</option>
                    <option>AAA</option>
                    <option>AA</option>
                    <option>A</option>
                    <option>Local League</option>
                  </select>
                </span>
              </label>
            </div>

            {/* Upcoming toggle + submit */}
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-foreground">
                <input
                  type="checkbox"
                  checked={upcomingOnly}
                  onChange={(e) => setUpcomingOnly(e.target.checked)}
                  className="size-4 rounded border-border text-primary accent-primary focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <span className="flex items-center gap-1.5">
                  <Layers className="size-4 text-primary" />
                  Show upcoming tryouts only
                </span>
              </label>

              <Button
                type="submit"
                size="lg"
                className="h-12 w-full gap-2 rounded-full px-8 text-base font-semibold sm:w-auto"
              >
                <Search className="size-5" />
                Search tryouts
              </Button>
            </div>
          </form>
        </div>

        {/* Stats */}
        <dl className="mx-auto mt-10 grid max-w-2xl grid-cols-3 gap-4 sm:mt-12">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <dt className="sr-only">{s.label}</dt>
              <dd className="text-balance font-display text-xl font-bold leading-tight text-primary-foreground sm:text-3xl">
                {s.value}
              </dd>
              <p className="mt-1 text-xs text-primary-foreground/75 sm:text-sm">
                {s.label}
              </p>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
