import { cache } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import {
  ArrowLeft,
  MapPin,
  Trophy,
  Cake,
  Users,
  CalendarClock,
  UserCog,
  BadgeCheck,
} from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { TryoutCardGrid } from "@/components/tryout/tryout-card-grid"
import { fetchTeamBySlug, type Team } from "@/lib/supabase/teams"
import {
  fetchOrganizationById,
  type Organization,
} from "@/lib/supabase/organizations"
import { fetchTryoutsByTeam } from "@/lib/supabase/tryouts"
import type { TryoutListing } from "@/lib/data"

// Read live data on each request so admin changes appear immediately.
export const dynamic = "force-dynamic"

const resolveTeam = cache(async (slug: string): Promise<Team | null> => {
  return fetchTeamBySlug(slug)
})

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const team = await resolveTeam(slug)
  if (!team) return { title: "Team not found — HockeyTryouts.ca" }

  const bits = [team.level, team.ageGroup].filter(Boolean).join(" ")
  const title = `${team.name}${bits ? ` — ${bits}` : ""} Hockey Tryouts`
  const description =
    team.description ??
    `Tryout dates, roster details, and coaching staff for ${team.name}${
      team.city ? ` in ${team.city}, ${team.province ?? ""}` : ""
    }.`

  return {
    title,
    description,
    alternates: { canonical: `/teams/${team.slug}` },
    openGraph: {
      title,
      description,
      type: "website",
      images: team.logo ? [team.logo] : undefined,
    },
    twitter: { card: "summary_large_image", title, description },
  }
}

export default async function TeamPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const team = await resolveTeam(slug)
  if (!team) notFound()

  const [org, tryouts] = await Promise.all([
    team.organizationId
      ? fetchOrganizationById(team.organizationId)
      : Promise.resolve(null),
    fetchTryoutsByTeam(team.id),
  ])

  const facts = [
    { icon: Trophy, label: "Level", value: team.level },
    { icon: Users, label: "Age group", value: team.ageGroup },
    { icon: Cake, label: "Birth year", value: team.birthYear },
    { icon: CalendarClock, label: "Season", value: team.season },
    { icon: UserCog, label: "Head coach", value: team.headCoach },
    { icon: UserCog, label: "Assistant coach", value: team.assistantCoach },
  ].filter((f) => f.value)

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsTeam",
    name: team.name,
    sport: "Ice hockey",
    ...(team.logo ? { logo: team.logo } : {}),
    ...(org
      ? { memberOf: { "@type": "SportsOrganization", name: org.name } }
      : {}),
    ...(team.city
      ? {
          location: {
            "@type": "Place",
            address: {
              "@type": "PostalAddress",
              addressLocality: team.city,
              addressRegion: team.province,
            },
          },
        }
      : {}),
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <Link
          href={org ? `/organizations/${org.slug}` : "/"}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {org ? `Back to ${org.name}` : "Back to home"}
        </Link>

        {/* Header */}
        <div className="mt-6 flex flex-col gap-5 rounded-3xl border border-border bg-card p-6 shadow-sm sm:flex-row sm:items-center">
          <div className="relative size-24 shrink-0 overflow-hidden rounded-2xl bg-accent">
            {team.logo ? (
              <Image
                src={team.logo || "/placeholder.svg"}
                alt={`${team.name} logo`}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex size-full items-center justify-center text-primary">
                <Users className="size-10" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            {org ? (
              <Link
                href={`/organizations/${org.slug}`}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
              >
                {org.name}
                {org.verified ? <BadgeCheck className="size-4" /> : null}
              </Link>
            ) : null}
            <h1 className="mt-1 text-balance font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              {team.name}
            </h1>
            {team.city ? (
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="size-4 text-primary" />
                {team.city}
                {team.province ? `, ${team.province}` : ""}
              </p>
            ) : null}
          </div>
        </div>

        {/* Details grid */}
        {facts.length > 0 && (
          <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {facts.map((f) => (
              <div
                key={f.label}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                  <f.icon className="size-5" />
                </span>
                <div className="min-w-0">
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {f.label}
                  </dt>
                  <dd className="truncate font-semibold text-foreground">
                    {f.value}
                  </dd>
                </div>
              </div>
            ))}
          </dl>
        )}

        {team.description ? (
          <p className="mt-6 max-w-3xl text-pretty leading-relaxed text-muted-foreground">
            {team.description}
          </p>
        ) : null}

        {/* Tryouts */}
        <section className="mt-12">
          <h2 className="font-display text-2xl font-bold text-foreground">
            Tryouts
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {tryouts.length} tryout{tryouts.length === 1 ? "" : "s"} for this
            team
          </p>
          <div className="mt-6">
            <TryoutCardGrid
              tryouts={tryouts as TryoutListing[]}
              emptyMessage="No tryouts posted for this team yet."
            />
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
