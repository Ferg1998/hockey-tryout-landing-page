import { cache } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import {
  ArrowLeft,
  MapPin,
  CalendarDays,
  Clock,
  AlarmClock,
  Trophy,
  Cake,
  Users,
  DollarSign,
  CircleDot,
  Star,
  ArrowRight,
  Mail,
  Phone,
  Globe,
  ClipboardList,
  FileText,
  BadgeCheck,
  Shirt,
  UserCheck,
  User,
} from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { ShareButton } from "@/components/tryout/share-button"
import { TryoutMap } from "@/components/tryout/tryout-map"
import { RelatedTryouts } from "@/components/tryout/related-tryouts"
import { TryoutImage } from "@/components/tryout/tryout-image"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { resolveTryoutImage } from "@/lib/tryout-image"
import {
  getTryoutById,
  coachCategories,
  tryouts as sampleTryouts,
  type TryoutListing,
} from "@/lib/data"
import { isSupabaseConfigured } from "@/lib/supabase/client"
import {
  fetchTryoutFullById,
  fetchRelatedTryouts,
  type TryoutFull,
} from "@/lib/supabase/tryouts"
import { fetchOrganizationById } from "@/lib/supabase/organizations"
import { fetchTeamById } from "@/lib/supabase/teams"

// Read live data on each request so newly added tryouts appear immediately.
export const dynamic = "force-dynamic"

type ResolvedTryout = TryoutFull & {
  title?: string
  rating?: number
  reviews?: number
}

const statusStyles: Record<string, string> = {
  Open: "bg-emerald-100 text-emerald-700",
  "Closing Soon": "bg-amber-100 text-amber-700",
  Waitlist: "bg-sky-100 text-sky-700",
  Full: "bg-amber-100 text-amber-700",
  Closed: "bg-muted text-muted-foreground",
}

// Cached so the page body and generateMetadata share a single fetch per request.
const resolveTryout = cache(
  async (id: string): Promise<ResolvedTryout | null> => {
    if (isSupabaseConfigured) {
      const row = await fetchTryoutFullById(id)
      if (row) return { ...row, title: `${row.level} Tryouts` }
    }
    return getTryoutById(id) ?? null
  },
)

async function resolveRelated(
  current: Pick<TryoutListing, "id" | "province" | "level">,
): Promise<TryoutListing[]> {
  if (isSupabaseConfigured) {
    return fetchRelatedTryouts(current)
  }
  return sampleTryouts
    .filter(
      (t) =>
        t.id !== current.id &&
        (t.province === current.province || t.level === current.level),
    )
    .slice(0, 3)
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const tryout = await resolveTryout(id)

  if (!tryout) {
    return { title: "Tryout not found | HockeyTryouts.ca" }
  }

  const title = `${tryout.team} ${tryout.level} Tryouts — ${tryout.city}, ${tryout.province} | HockeyTryouts.ca`
  const description =
    tryout.description ??
    `${tryout.level} hockey tryouts for ${tryout.team}${
      tryout.organization ? ` (${tryout.organization})` : ""
    } — ${tryout.ageGroup}, birth year ${tryout.birthYear}, in ${tryout.city}, ${tryout.province}. ${tryout.dates}. Register on HockeyTryouts.ca.`
  const ogImage = resolveTryoutImage({
    heroImage: tryout.heroImage,
    image: tryout.image,
    organizationBanner: tryout.organizationBanner,
    teamLogo: tryout.teamLogo,
    organizationLogo: tryout.organizationLogo,
  }).src

  return {
    title,
    description,
    alternates: { canonical: `/tryouts/${tryout.id}` },
    openGraph: {
      title,
      description,
      type: "website",
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  }
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

  const related = await resolveRelated({
    id: tryout.id,
    province: tryout.province,
    level: tryout.level,
  })

  // Resolve linked organization/team (if any) to build cross-links.
  const [linkedOrg, linkedTeam] = await Promise.all([
    isSupabaseConfigured && tryout.organizationId
      ? fetchOrganizationById(tryout.organizationId)
      : Promise.resolve(null),
    isSupabaseConfigured && tryout.teamId
      ? fetchTeamById(tryout.teamId)
      : Promise.resolve(null),
  ])

  const heroImage = resolveTryoutImage({
    heroImage: tryout.heroImage,
    image: tryout.image,
    organizationBanner: linkedOrg?.bannerImage ?? tryout.organizationBanner,
    teamLogo: linkedTeam?.logo ?? tryout.teamLogo,
    organizationLogo: linkedOrg?.logo ?? tryout.organizationLogo,
  }).src
  const isClosed = tryout.status === "Closed"

  // Spots remaining, only when a maximum is configured.
  const spotsValue =
    tryout.maxPlayers != null
      ? `${tryout.registrations ?? 0} / ${tryout.maxPlayers} registered`
      : undefined

  const sessionLines = tryout.times
    ? tryout.times
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
    : []

  // Only include facts that have a value, so nothing is hardcoded/empty.
  // When a detailed schedule exists, it replaces the condensed dates summary.
  const facts = [
    { icon: Cake, label: "Birth years eligible", value: tryout.birthYear },
    { icon: Users, label: "Age group", value: tryout.ageGroup },
    { icon: Trophy, label: "Skill level", value: tryout.level },
    { icon: Shirt, label: "Positions needed", value: tryout.positionsNeeded },
    ...(sessionLines.length === 0
      ? [{ icon: CalendarDays, label: "Tryout dates", value: tryout.dates }]
      : []),
    { icon: AlarmClock, label: "Registration deadline", value: tryout.registrationDeadline },
    { icon: DollarSign, label: "Cost", value: tryout.cost },
    { icon: UserCheck, label: "Spots", value: spotsValue },
    { icon: CircleDot, label: "Status", value: tryout.status },
  ].filter((f) => f.value)

  const hasContact =
    tryout.contactName ||
    tryout.contactEmail ||
    tryout.contactPhone ||
    tryout.website

  // Structured data for SEO (Google rich results).
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: `${tryout.team} ${tryout.level} Tryouts`,
    sport: "Ice hockey",
    ...(tryout.description ? { description: tryout.description } : {}),
    ...(heroImage ? { image: heroImage } : {}),
    location: {
      "@type": "Place",
      name: tryout.arena,
      address: {
        "@type": "PostalAddress",
        addressLocality: tryout.city,
        addressRegion: tryout.province,
        addressCountry: "CA",
      },
    },
    ...(tryout.registrationLink && tryout.registrationLink !== "#"
      ? {
          offers: {
            "@type": "Offer",
            url: tryout.registrationLink,
            ...(tryout.cost ? { price: tryout.cost } : {}),
            availability: isClosed
              ? "https://schema.org/SoldOut"
              : "https://schema.org/InStock",
          },
        }
      : {}),
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative">
          <div className="relative h-56 w-full sm:h-72 lg:h-96">
            <TryoutImage
              heroImage={tryout.heroImage}
              image={tryout.image}
              organizationBanner={linkedOrg?.bannerImage ?? tryout.organizationBanner}
              teamLogo={linkedTeam?.logo ?? tryout.teamLogo}
              organizationLogo={linkedOrg?.logo ?? tryout.organizationLogo}
              alt={`${tryout.team} tryout`}
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/25 to-transparent" />
          </div>

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="-mt-16 sm:-mt-20">
              <Link
                href="/"
                className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1.5 text-sm font-medium text-foreground shadow-sm backdrop-blur transition-colors hover:bg-background"
              >
                <ArrowLeft className="size-4" />
                Back to search
              </Link>

              <div className="rounded-3xl border border-border bg-card p-6 shadow-lg sm:p-8">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex min-w-0 gap-4">
                    {tryout.logo ? (
                      <span className="relative hidden size-16 shrink-0 overflow-hidden rounded-2xl border border-border bg-secondary sm:block">
                        <Image
                          src={tryout.logo || "/placeholder.svg"}
                          alt={`${tryout.team} logo`}
                          fill
                          className="object-contain p-1.5"
                        />
                      </span>
                    ) : null}

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
                        {linkedTeam ? (
                          <Link
                            href={`/teams/${linkedTeam.slug}`}
                            className="transition-colors hover:text-primary"
                          >
                            {tryout.team}
                          </Link>
                        ) : (
                          tryout.team
                        )}
                      </h1>
                      {tryout.organization ? (
                        <p className="mt-1 flex flex-wrap items-center gap-2 text-base font-medium text-muted-foreground">
                          {linkedOrg ? (
                            <Link
                              href={`/organizations/${linkedOrg.slug}`}
                              className="font-semibold text-primary hover:underline"
                            >
                              {tryout.organization}
                            </Link>
                          ) : (
                            tryout.organization
                          )}
                          {tryout.verified ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                              <BadgeCheck className="size-3.5" />
                              Verified
                            </span>
                          ) : null}
                        </p>
                      ) : null}
                      <p className="mt-2 flex items-center gap-1.5 text-lg text-muted-foreground">
                        <MapPin className="size-4 text-primary" />
                        {tryout.city}, {tryout.province}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 rounded-2xl border border-border bg-secondary/50 p-5 lg:w-72">
                    <p className="text-sm text-muted-foreground">Registration</p>
                    <p className="mt-1 font-display text-3xl font-extrabold text-foreground">
                      {tryout.cost}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">per player</p>
                    {tryout.registrationDeadline ? (
                      <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-background px-3 py-2 text-sm text-foreground">
                        <AlarmClock className="size-4 text-primary" />
                        Deadline: {tryout.registrationDeadline}
                      </p>
                    ) : null}
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
                          "mt-4 w-full rounded-full text-base",
                        )}
                      >
                        Register Now
                      </a>
                    )}
                    <ShareButton
                      title={`${tryout.team} ${tryout.level} Tryouts`}
                      text={`Check out ${tryout.team} tryouts in ${tryout.city}, ${tryout.province}`}
                      className="mt-2 w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="space-y-10 lg:col-span-2">
              {/* Quick facts */}
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground">
                  Tryout details
                </h2>
                <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {facts.map((f) => (
                    <div
                      key={f.label}
                      className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm"
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                        <f.icon className="size-5" />
                      </span>
                      <div className="min-w-0">
                        <dt className="text-sm text-muted-foreground">
                          {f.label}
                        </dt>
                        <dd className="font-semibold text-foreground">
                          {f.value}
                        </dd>
                      </div>
                    </div>
                  ))}

                  {/* Multi-session dates span the full width, with one
                      complete session per line. */}
                  {sessionLines.length > 0 ? (
                    <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm sm:col-span-2">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                        <CalendarDays className="size-5" />
                      </span>
                      <div className="min-w-0">
                        <dt className="text-sm text-muted-foreground">Tryout dates</dt>
                        <dd className="mt-1.5">
                          <p className="font-semibold text-foreground">
                            {sessionLines.length} {sessionLines.length === 1 ? "session" : "sessions"}
                          </p>
                          <div className="mt-2 space-y-1.5">
                            {sessionLines.map((line, i) => (
                              <p
                                key={i}
                                className="font-semibold leading-relaxed text-foreground"
                              >
                                {line}
                              </p>
                            ))}
                          </div>
                        </dd>
                      </div>
                    </div>
                  ) : null}
                </dl>
              </div>

              {/* Description */}
              {tryout.description ? (
                <div>
                  <h2 className="flex items-center gap-2 font-display text-2xl font-bold text-foreground">
                    <FileText className="size-6 text-primary" />
                    About this tryout
                  </h2>
                  <p className="mt-4 whitespace-pre-line text-pretty leading-relaxed text-muted-foreground">
                    {tryout.description}
                  </p>
                </div>
              ) : null}

              {/* Equipment */}
              {tryout.equipment ? (
                <div>
                  <h2 className="flex items-center gap-2 font-display text-2xl font-bold text-foreground">
                    <ClipboardList className="size-6 text-primary" />
                    Equipment required
                  </h2>
                  <p className="mt-4 whitespace-pre-line text-pretty leading-relaxed text-muted-foreground">
                    {tryout.equipment}
                  </p>
                </div>
              ) : null}

              {/* Location + map */}
              <div>
                <h2 className="flex items-center gap-2 font-display text-2xl font-bold text-foreground">
                  <MapPin className="size-6 text-primary" />
                  Arena &amp; location
                </h2>
                <div className="mt-4">
                  <TryoutMap
                    arena={tryout.arena}
                    city={tryout.city}
                    province={tryout.province}
                    address={tryout.address}
                    mapLink={tryout.googleMapsLink}
                  />
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <aside className="lg:col-span-1">
              <div className="lg:sticky lg:top-24 lg:space-y-6">
                {hasContact ? (
                  <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                    <h2 className="font-display text-lg font-bold text-foreground">
                      Contact
                    </h2>
                    <ul className="mt-4 space-y-3 text-sm">
                      {tryout.contactName ? (
                        <li className="flex items-center gap-3 text-foreground">
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                            <User className="size-4" />
                          </span>
                          {tryout.contactName}
                        </li>
                      ) : null}
                      {tryout.contactEmail ? (
                        <li>
                          <a
                            href={`mailto:${tryout.contactEmail}`}
                            className="flex items-center gap-3 text-foreground transition-colors hover:text-primary"
                          >
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                              <Mail className="size-4" />
                            </span>
                            <span className="min-w-0 break-words">
                              {tryout.contactEmail}
                            </span>
                          </a>
                        </li>
                      ) : null}
                      {tryout.contactPhone ? (
                        <li>
                          <a
                            href={`tel:${tryout.contactPhone}`}
                            className="flex items-center gap-3 text-foreground transition-colors hover:text-primary"
                          >
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                              <Phone className="size-4" />
                            </span>
                            {tryout.contactPhone}
                          </a>
                        </li>
                      ) : null}
                      {tryout.website ? (
                        <li>
                          <a
                            href={tryout.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 text-foreground transition-colors hover:text-primary"
                          >
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                              <Globe className="size-4" />
                            </span>
                            <span className="min-w-0 break-words">
                              Visit website
                            </span>
                          </a>
                        </li>
                      ) : null}
                    </ul>
                  </div>
                ) : null}

                <div className="rounded-3xl border border-border bg-secondary/50 p-6 shadow-sm">
                  <p className="text-sm text-muted-foreground">Cost per player</p>
                  <p className="mt-1 font-display text-2xl font-extrabold text-foreground">
                    {tryout.cost}
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
                </div>
              </div>
            </aside>
          </div>
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
                    <p className="mt-1 text-sm text-muted-foreground">
                      {c.blurb}
                    </p>
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

        {/* Related tryouts */}
        <RelatedTryouts tryouts={related} />
      </main>

      <SiteFooter />
    </div>
  )
}
