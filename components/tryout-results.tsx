import Link from "next/link"
import { MapPin, CalendarDays, Building2, SearchX, DatabaseZap, Loader2, ArrowRight } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { TryoutListing } from "@/lib/data"

const statusStyles: Record<TryoutListing["status"], string> = {
  Open: "bg-emerald-50 text-emerald-700",
  "Closing Soon": "bg-amber-50 text-amber-700",
  Waitlist: "bg-sky-50 text-sky-700",
  Closed: "bg-muted text-muted-foreground",
}

export function TryoutResults({
  results,
  total,
  loading = false,
  datasetEmpty = false,
  onClear,
}: {
  results: TryoutListing[]
  total: number
  loading?: boolean
  datasetEmpty?: boolean
  onClear: () => void
}) {
  return (
    <section
      id="search-results"
      className="mx-auto max-w-7xl scroll-mt-24 px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            Search results
          </p>
          <h2 className="mt-2 text-balance font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {datasetEmpty
              ? "No tryouts posted yet"
              : results.length > 0
                ? `${results.length} tryout${results.length === 1 ? "" : "s"} found`
                : "No results found"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {datasetEmpty
              ? "Check back soon as teams add their tryouts."
              : `Searched ${total} listed tryouts across Canada.`}
          </p>
        </div>
        <Button variant="outline" className="rounded-full" onClick={onClear}>
          Clear search
        </Button>
      </div>

      {loading ? (
        <div className="mt-10 flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-secondary/40 px-6 py-16 text-center">
          <Loader2 className="size-7 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Loading tryouts…</p>
        </div>
      ) : datasetEmpty ? (
        <div className="mt-10 flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-secondary/40 px-6 py-16 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-accent text-primary">
            <DatabaseZap className="size-7" />
          </span>
          <h3 className="mt-4 font-display text-xl font-bold text-foreground">
            No tryouts have been added yet
          </h3>
          <p className="mt-2 max-w-md text-pretty text-sm leading-relaxed text-muted-foreground">
            Once tryouts are added to the database, they&apos;ll appear here and
            become searchable by team, city, birth year, and level.
          </p>
        </div>
      ) : results.length === 0 ? (
        <div className="mt-10 flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-secondary/40 px-6 py-16 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-accent text-primary">
            <SearchX className="size-7" />
          </span>
          <h3 className="mt-4 font-display text-xl font-bold text-foreground">
            No results found
          </h3>
          <p className="mt-2 max-w-md text-pretty text-sm leading-relaxed text-muted-foreground">
            We couldn&apos;t find any tryouts matching your search. Try a
            different team, city, birth year, or level.
          </p>
          <Button className="mt-6 rounded-full" onClick={onClear}>
            Reset filters
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {results.map((t) => (
            <article
              key={t.id}
              className="group overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
            >
              <Link href={`/tryouts/${t.id}`} className="block">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={t.image || "/placeholder.svg"}
                    alt={`${t.team} tryout`}
                    className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute left-3 top-3 rounded-full bg-card/95 px-3 py-1 text-xs font-bold text-primary shadow-sm">
                    {t.level}
                  </span>
                  <span
                    className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-semibold shadow-sm ${statusStyles[t.status]}`}
                  >
                    {t.status}
                  </span>
                </div>

                <div className="p-4 pb-0">
                  {t.organizationName ? (
                    <div className="mb-1.5 flex items-center gap-1.5">
                      {t.organizationLogo ? (
                        <img
                          src={t.organizationLogo || "/placeholder.svg"}
                          alt=""
                          className="size-4 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <Building2 className="size-3.5 shrink-0 text-muted-foreground" />
                      )}
                      <span className="truncate text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {t.organizationName}
                      </span>
                    </div>
                  ) : null}
                  <h3 className="font-display text-base font-bold leading-snug text-foreground group-hover:text-primary">
                    {t.team}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t.ageGroup} · Birth year {t.birthYear}
                  </p>

                  <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <MapPin className="size-4 shrink-0 text-primary" />
                      {t.city}, {t.province}
                    </p>
                    <p className="flex items-center gap-2">
                      <Building2 className="size-4 shrink-0 text-primary" />
                      {t.arena}
                    </p>
                    <p className="flex items-center gap-2">
                      <CalendarDays className="size-4 shrink-0 text-primary" />
                      {t.dates}
                    </p>
                  </div>
                </div>
              </Link>

              <div className="p-4">
                <div className="flex items-center justify-between border-t border-border pt-3">
                  <p className="text-sm text-muted-foreground">
                    <span className="text-base font-bold text-foreground">
                      {t.cost}
                    </span>{" "}
                    / player
                  </p>
                  <Link
                    href={`/tryouts/${t.id}`}
                    className={cn(
                      buttonVariants({ size: "sm" }),
                      "gap-1 rounded-full",
                    )}
                  >
                    View details
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
