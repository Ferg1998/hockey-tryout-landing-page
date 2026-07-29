import Link from "next/link"
import { MapPin, CalendarDays, ArrowRight } from "lucide-react"
import type { TryoutListing } from "@/lib/data"
import { TryoutImage } from "@/components/tryout/tryout-image"

export function RelatedTryouts({ tryouts }: { tryouts: TryoutListing[] }) {
  if (tryouts.length === 0) return null

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <span className="text-sm font-semibold uppercase tracking-wide text-primary">
            Keep exploring
          </span>
          <h2 className="mt-2 font-display text-2xl font-bold text-foreground sm:text-3xl">
            Related tryouts
          </h2>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {tryouts.map((t) => (
          <Link
            key={t.id}
            href={`/tryouts/${t.id}`}
            className="group overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="relative aspect-[4/3] overflow-hidden">
              <TryoutImage
                image={t.image}
                organizationBanner={t.organizationBanner}
                teamLogo={t.teamLogo}
                organizationLogo={t.organizationLogo}
                alt={`${t.team} tryout`}
                className="transition-transform duration-500 group-hover:scale-105"
              />
              <span className="absolute left-3 top-3 rounded-full bg-card/95 px-3 py-1 text-xs font-bold text-primary shadow-sm">
                {t.level}
              </span>
            </div>
            <div className="p-4">
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
                  <CalendarDays className="size-4 shrink-0 text-primary" />
                  {t.dates}
                </p>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                <span className="text-sm text-muted-foreground">
                  <span className="text-base font-bold text-foreground">
                    {t.cost}
                  </span>{" "}
                  / player
                </span>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  View
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
