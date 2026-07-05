"use client"

import Link from "next/link"
import useSWR from "swr"
import { Star, MapPin, CalendarDays, Heart, ArrowRight, Loader2 } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { featuredTryouts, type TryoutListing } from "@/lib/data"
import { fetchTryouts } from "@/lib/supabase/tryouts"

type FeaturedCard = {
  id: string
  level: string
  title: string
  org: string
  city: string
  province: string
  meta: string
  date: string
  price: string
  image: string
  badge?: string
  rating?: number
}

const statusStyles: Record<string, string> = {
  Open: "bg-emerald-100 text-emerald-700",
  "Closing Soon": "bg-amber-100 text-amber-700",
  Waitlist: "bg-sky-100 text-sky-700",
  Closed: "bg-muted text-muted-foreground",
}

function fromListing(t: TryoutListing): FeaturedCard {
  return {
    id: t.id,
    level: t.level,
    title: `${t.level} Tryouts`,
    org: t.team,
    city: t.city,
    province: t.province,
    meta: t.ageGroup,
    date: t.dates,
    price: t.cost,
    image: t.image,
    badge: t.status,
  }
}

function fromSample(t: (typeof featuredTryouts)[number]): FeaturedCard {
  return {
    id: t.id,
    level: t.level,
    title: t.title,
    org: t.org,
    city: t.city,
    province: t.province,
    meta: t.age,
    date: t.date,
    price: t.price,
    image: t.image,
    badge: t.spotsLeft <= 6 ? `Only ${t.spotsLeft} spots left` : undefined,
    rating: t.rating,
  }
}

export function FeaturedTryouts() {
  const { data, isLoading } = useSWR("tryouts", fetchTryouts, {
    revalidateOnFocus: false,
  })

  const usingSupabase = data?.source === "supabase"
  const cards: FeaturedCard[] = usingSupabase
    ? data!.data.slice(0, 4).map(fromListing)
    : featuredTryouts.map(fromSample)

  // When Supabase is connected but has no rows, hide the section entirely.
  if (usingSupabase && data!.data.length === 0) {
    return null
  }

  return (
    <section id="featured" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            Trending now
          </p>
          <h2 className="mt-2 text-balance font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Featured tryouts
          </h2>
        </div>
        <Button variant="ghost" className="hidden gap-1 rounded-full text-primary sm:inline-flex">
          View all
          <ArrowRight className="size-4" />
        </Button>
      </div>

      {isLoading && !data ? (
        <div className="mt-10 flex items-center justify-center rounded-3xl border border-dashed border-border bg-secondary/40 py-16">
          <Loader2 className="size-6 animate-spin text-primary" />
          <span className="ml-3 text-sm text-muted-foreground">Loading featured tryouts…</span>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((t) => (
            <article
              key={t.id}
              className="group overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <Link href={`/tryouts/${t.id}`} className="block size-full">
                  <img
                    src={t.image || "/placeholder.svg"}
                    alt={t.title}
                    className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </Link>
                <span className="absolute left-3 top-3 rounded-full bg-card/95 px-3 py-1 text-xs font-bold text-primary shadow-sm">
                  {t.level}
                </span>
                <button
                  type="button"
                  aria-label="Save tryout"
                  className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-card/90 text-foreground shadow-sm transition-colors hover:text-primary"
                >
                  <Heart className="size-4" />
                </button>
                {t.badge && (
                  <span
                    className={cn(
                      "absolute bottom-3 left-3 rounded-full px-3 py-1 text-xs font-semibold shadow-sm",
                      statusStyles[t.badge] ?? "bg-primary text-primary-foreground",
                    )}
                  >
                    {t.badge}
                  </span>
                )}
              </div>

              <div className="p-4">
                <Link href={`/tryouts/${t.id}`} className="block">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display text-base font-bold leading-snug text-foreground group-hover:text-primary">
                      {t.title}
                    </h3>
                    {t.rating ? (
                      <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-foreground">
                        <Star className="size-4 fill-primary text-primary" />
                        {t.rating}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{t.org}</p>

                  <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <MapPin className="size-4 text-primary" />
                      {t.city}, {t.province} · {t.meta}
                    </p>
                    <p className="flex items-center gap-2">
                      <CalendarDays className="size-4 text-primary" />
                      {t.date}
                    </p>
                  </div>
                </Link>

                <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                  <p className="text-sm text-muted-foreground">
                    <span className="text-base font-bold text-foreground">{t.price}</span> / player
                  </p>
                  <Link
                    href={`/tryouts/${t.id}`}
                    className={cn(buttonVariants({ size: "sm" }), "rounded-full")}
                  >
                    View
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
