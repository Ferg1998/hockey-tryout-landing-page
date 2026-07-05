"use client"

import { useState } from "react"
import { Search, MapPin, Users, TrendingUp, CalendarDays } from "lucide-react"
import { Button } from "@/components/ui/button"

const stats = [
  { value: "6,400+", label: "Tryouts listed" },
  { value: "1,200+", label: "Vetted coaches" },
  { value: "10 provinces", label: "Coast to coast" },
]

export type SearchFilters = {
  team: string
  city: string
  birthYear: string
  level: string
}

export function HeroSearch({
  onSearch,
}: {
  onSearch?: (filters: SearchFilters) => void
}) {
  const [team, setTeam] = useState("")
  const [city, setCity] = useState("")
  const [birthYear, setBirthYear] = useState("")
  const [level, setLevel] = useState("")

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

        {/* Search bar */}
        <div className="mx-auto mt-8 max-w-5xl sm:mt-10">
          <div className="rounded-3xl bg-card p-2 shadow-2xl ring-1 ring-border/60 sm:rounded-full sm:p-2">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                onSearch?.({ team, city, birthYear, level })
              }}
              className="flex flex-col gap-1 sm:flex-row sm:items-center"
            >
              <label className="group flex flex-1 items-center gap-3 rounded-2xl px-4 py-3 transition-colors hover:bg-secondary sm:rounded-full">
                <Users className="size-5 shrink-0 text-primary" />
                <span className="flex flex-1 flex-col text-left">
                  <span className="text-xs font-semibold text-foreground">Team</span>
                  <input
                    value={team}
                    onChange={(e) => setTeam(e.target.value)}
                    placeholder="Team or club"
                    className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                </span>
              </label>

              <span className="mx-1 hidden h-8 w-px bg-border sm:block" />

              <label className="group flex flex-1 items-center gap-3 rounded-2xl px-4 py-3 transition-colors hover:bg-secondary sm:rounded-full">
                <MapPin className="size-5 shrink-0 text-primary" />
                <span className="flex flex-1 flex-col text-left">
                  <span className="text-xs font-semibold text-foreground">City</span>
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Anywhere in Canada"
                    className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                </span>
              </label>

              <span className="mx-1 hidden h-8 w-px bg-border sm:block" />

              <label className="group flex flex-1 items-center gap-3 rounded-2xl px-4 py-3 transition-colors hover:bg-secondary sm:rounded-full">
                <CalendarDays className="size-5 shrink-0 text-primary" />
                <span className="flex flex-1 flex-col text-left">
                  <span className="text-xs font-semibold text-foreground">Birth Year</span>
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

              <span className="mx-1 hidden h-8 w-px bg-border sm:block" />

              <label className="group flex flex-1 items-center gap-3 rounded-2xl px-4 py-3 transition-colors hover:bg-secondary sm:rounded-full">
                <TrendingUp className="size-5 shrink-0 text-primary" />
                <span className="flex flex-1 flex-col text-left">
                  <span className="text-xs font-semibold text-foreground">Level</span>
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

              <Button
                type="submit"
                size="lg"
                className="h-14 gap-2 rounded-2xl px-6 text-base font-semibold sm:h-14 sm:rounded-full"
              >
                <Search className="size-5" />
                <span className="sm:inline">Search</span>
              </Button>
            </form>
          </div>
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
