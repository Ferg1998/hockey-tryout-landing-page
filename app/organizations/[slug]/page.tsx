import { cache } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import {
  ArrowLeft,
  MapPin,
  Mail,
  Phone,
  Globe,
  BadgeCheck,
  Users,
} from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { TryoutMap } from "@/components/tryout/tryout-map"
import { TryoutCardGrid } from "@/components/tryout/tryout-card-grid"
import {
  fetchOrganizationBySlug,
  type Organization,
} from "@/lib/supabase/organizations"
import { fetchActiveTeamsByOrganization, type Team } from "@/lib/supabase/teams"
import { fetchTryoutsByOrganization } from "@/lib/supabase/tryouts"
import type { TryoutListing } from "@/lib/data"
import { organizationSeo, serializeJsonLd } from "@/lib/public-listing-seo"

// Read live data on each request so admin changes appear immediately.
export const dynamic = "force-dynamic"

const resolveOrg = cache(async (slug: string): Promise<Organization | null> => {
  return fetchOrganizationBySlug(slug)
})

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const org = await resolveOrg(slug)
  if (!org) return { title: "Organization not found — HockeyTryouts.ca" }

  return organizationSeo(org).metadata
}

export default async function OrganizationPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const org = await resolveOrg(slug)
  if (!org) notFound()

  const [teams, tryouts] = await Promise.all([
    fetchActiveTeamsByOrganization(org.id),
    fetchTryoutsByOrganization(org.id),
  ])

  const { jsonLd } = organizationSeo(org)

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />

      {/* Banner */}
      <div className="relative h-48 w-full overflow-hidden bg-secondary sm:h-64">
        {org.bannerImage ? (
          <Image
            src={org.bannerImage || "/placeholder.svg"}
            alt={`${org.name} banner`}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="size-full bg-gradient-to-br from-primary/15 to-accent" />
        )}
      </div>

      <main className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to home
        </Link>

        {/* Header */}
        <div className="-mt-2 flex flex-col gap-5 sm:flex-row sm:items-end">
          <div className="relative -mt-16 size-28 shrink-0 overflow-hidden rounded-3xl border-4 border-background bg-card shadow-lg sm:-mt-20">
            {org.logo ? (
              <Image
                src={org.logo || "/placeholder.svg"}
                alt={`${org.name} logo`}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center bg-accent text-primary">
                <Users className="size-10" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <h1 className="flex flex-wrap items-center gap-2 text-balance font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              {org.name}
              {org.verified ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                  <BadgeCheck className="size-4" />
                  Verified
                </span>
              ) : null}
            </h1>
            {org.city ? (
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="size-4 text-primary" />
                {org.city}
                {org.province ? `, ${org.province}` : ""}
              </p>
            ) : null}
          </div>
        </div>

        {org.description ? (
          <p className="mt-6 max-w-3xl text-pretty leading-relaxed text-muted-foreground">
            {org.description}
          </p>
        ) : null}

        {/* Contact chips */}
        {(org.website || org.email || org.phone) && (
          <div className="mt-6 flex flex-wrap gap-3">
            {org.website ? (
              <a
                href={org.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
              >
                <Globe className="size-4 text-primary" />
                Website
              </a>
            ) : null}
            {org.email ? (
              <a
                href={`mailto:${org.email}`}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
              >
                <Mail className="size-4 text-primary" />
                {org.email}
              </a>
            ) : null}
            {org.phone ? (
              <a
                href={`tel:${org.phone}`}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
              >
                <Phone className="size-4 text-primary" />
                {org.phone}
              </a>
            ) : null}
          </div>
        )}

        {/* Teams */}
        <section className="mt-12">
          <h2 className="font-display text-2xl font-bold text-foreground">
            Teams
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {teams.length} active team{teams.length === 1 ? "" : "s"}
          </p>
          {teams.length > 0 ? (
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {teams.map((team) => (
                <TeamCard key={team.id} team={team} />
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-3xl border border-dashed border-border bg-secondary/40 px-6 py-12 text-center">
              <p className="text-sm text-muted-foreground">
                No teams listed yet.
              </p>
            </div>
          )}
        </section>

        {/* Tryouts */}
        <section className="mt-12">
          <h2 className="font-display text-2xl font-bold text-foreground">
            Tryouts
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {tryouts.length} tryout{tryouts.length === 1 ? "" : "s"} from this
            organization
          </p>
          <div className="mt-6">
            <TryoutCardGrid
              tryouts={tryouts as TryoutListing[]}
              emptyMessage="No tryouts posted by this organization yet."
            />
          </div>
        </section>

        {/* Location */}
        {(org.address || org.city) && (
          <section className="mt-12">
            <h2 className="font-display text-2xl font-bold text-foreground">
              Location
            </h2>
            <div className="mt-6">
              <TryoutMap
                arena={org.name}
                city={org.city ?? ""}
                province={org.province ?? ""}
                address={org.address}
                mapLink={org.googleMapsLink}
              />
            </div>
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  )
}

function TeamCard({ team }: { team: Team }) {
  return (
    <Link
      href={`/teams/${team.slug}`}
      className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-accent">
        {team.logo ? (
          <Image
            src={team.logo || "/placeholder.svg"}
            alt={`${team.name} logo`}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-primary">
            <Users className="size-6" />
          </div>
        )}
      </div>
      <div className="min-w-0">
        <h3 className="truncate font-display font-bold text-foreground group-hover:text-primary">
          {team.name}
        </h3>
        <p className="mt-0.5 truncate text-sm text-muted-foreground">
          {[team.level, team.ageGroup].filter(Boolean).join(" · ") ||
            "View team"}
        </p>
      </div>
    </Link>
  )
}
