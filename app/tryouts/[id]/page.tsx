import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import {
  ArrowLeft,
  MapPin,
  CalendarDays,
  Building2,
  Users,
  Trophy,
  Cake,
  DollarSign,
  Star,
  ArrowRight,
} from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getTryoutById, coachCategories, type TryoutDetail } from "@/lib/data"
import { isSupabaseConfigured } from "@/lib/supabase/client"
import { fetchTryoutById } from "@/lib/supabase/tryouts"

// Read live data on each request so newly added tryouts appear immediately.
export const dynamic = "force-dynamic"

const statusStyles: Record<string, string> = {
  Open: "bg-emerald-100 text-emerald-700",
  "Closing Soon": "bg-amber-100 text-amber-700",
  Waitlist: "bg-sky-100 text-sky-700",
  Closed: "bg-muted text-muted-foreground",
}

async function resolveTryout(id: string): Promise<TryoutDetail | null> {
  // Prefer live Supabase data; fall back to bundled sample data when Supabase
  // is not configured or the id belongs to a sample listing.
  if (isSupabaseConfigured) {
    const row = await fetchTryoutById(id)
    if (row) {
      return { ...row, title: `${row.level} Tryouts` }
    }
  }
  return getTryoutById(id) ?? null
}

export default async function TryoutDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const tryout = await resolveTryout(id)

  if (!tryout) {
    notFound()
  }

  const facts = [
    { icon: Users, label: "Team", value: tryout.team },
    { icon: MapPin, label: "Location", value: `${tryout.city}, ${tryout.province}` },
    { icon: Cake, label: "Birth Year", value: tryout.birthYear },
    { icon: Users, label: "Age Group", value: tryout.ageGroup },
    { icon: Trophy, label: "Level", value: tryout.level },
    { icon: CalendarDays, label: "Dates", value: tryout.dates },
    { icon: Building2, label: "Arena", value: tryout.arena },
    { icon: DollarSign, label: "Cost", value: tryout.cost },
  ]

  const isClosed = tryout.status === "Closed"

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative">
          <div className="relative h-56 w-full sm:h-72 lg:h-80">
            <Image
              src={tryout.image || "/placeholder.svg"}
              alt={`${tryout.team} tryout`}
              fill
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/25 to-transparent" />
          </div>

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="-mt-14 sm:-mt-16">
              <Link
                href="/"
                className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1.5 text-sm font-medium text-foreground shadow-sm backdrop-blur transition-colors hover:bg-background"
              >
                <ArrowLeft className="size-4" />
                Back to search
              </Link>

              <div className="rounded-3xl border border-border bg-card p-6 shadow-lg sm:p-8">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
                        {tryout.level}
                      </span>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
                          statusStyles[tryout.status],
                        )}
                      >
                        {tryout.status}
                      </span>
                      {tryout.rating ? (
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-foreground">
                          <Star className="size-4 fill-amber-400 text-amber-400" />
                          {tryout.rating}
                          <span className="text-muted-foreground">
                            ({tryout.reviews})
                          </span>
                        </span>
                      ) : null}
                    </div>

                    <h1 className="mt-3 text-balance font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                      {tryout.title ?? `${tryout.level} Tryouts`}
                    </h1>
                    <p className="mt-2 flex items-center gap-1.5 text-lg text-muted-foreground">
                      <span className="font-semibold text-foreground">
                        {tryout.team}
                      </span>
                      <span aria-hidden>·</span>
                      <MapPin className="size-4" />
                      {tryout.city}, {tryout.province}
                    </p>
                  </div>

                  <div className="shrink-0 rounded-2xl border border-border bg-secondary/50 p-5 lg:w-64">
                    <p className="text-sm text-muted-foreground">Registration</p>
                    <p className="mt-1 font-display text-3xl font-extrabold text-foreground">
                      {tryout.cost}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      per player
                    </p>
                    {isClosed ? (
                      <span
                        className={cn(
                          buttonVariants({ size: "lg" }),
                          "pointer-events-none mt-4 w-full rounded-full opacity-50",
                        )}
                      >
                        Registration Closed
                      </span>
                    ) : (
                      <a
                        href={tryout.registrationLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          buttonVariants({ size: "lg" }),
                          "mt-4 w-full rounded-full",
                        )}
                      >
                        Register Now
                      </a>
                    )}
                    <p className="mt-3 text-center text-xs text-muted-foreground">
                      You&apos;ll be redirected to the team&apos;s registration.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Details grid */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl font-bold text-foreground">
            Tryout details
          </h2>
          <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {facts.map((f) => (
              <div
                key={f.label}
                className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                  <f.icon className="size-5" />
                </span>
                <div className="min-w-0">
                  <dt className="text-sm text-muted-foreground">{f.label}</dt>
                  <dd className="font-semibold text-foreground">{f.value}</dd>
                </div>
              </div>
            ))}
          </dl>
        </section>

        {/* Prepare for this tryout */}
        <section className="border-t border-border bg-secondary/40">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <span className="text-sm font-semibold uppercase tracking-wide text-primary">
                Prepare for this tryout
              </span>
              <h2 className="mt-2 text-balance font-display text-3xl font-bold text-foreground">
                Coaches near {tryout.city}
              </h2>
              <p className="mt-3 text-pretty text-muted-foreground">
                Sharpen up before {tryout.team} evaluations. Book vetted coaches
                and camps close to {tryout.city}, {tryout.province}.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {coachCategories.map((c) => (
                <a
                  key={c.slug}
                  href="#"
                  className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="relative h-32 w-full">
                    <Image
                      src={c.image || "/placeholder.svg"}
                      alt={c.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-display font-bold text-foreground group-hover:text-primary">
                      {c.title}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">{c.blurb}</p>
                    <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                      <span className="text-xs text-muted-foreground">
                        {c.coaches} near {tryout.city}
                      </span>
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                        From {c.from}
                        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
