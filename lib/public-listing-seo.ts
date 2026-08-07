import type { TryoutFull } from "@/lib/supabase/tryouts"
import type { Organization } from "@/lib/supabase/organizations"
import type { Team } from "@/lib/supabase/teams"

const PUBLIC_SITE_URL = "https://hockeytryouts.ca"

function canonical(path: string): string {
  return `${PUBLIC_SITE_URL}${path}`
}

export function organizationSeo(organization: Organization) {
  const location = [organization.city, organization.province].filter(Boolean).join(", ")
  const title = `${organization.name} — Hockey Tryouts & Teams`
  const description =
    organization.description ??
    `Find hockey tryouts, teams, and registration details for ${organization.name}${location ? ` in ${location}` : ""}.`

  return {
    metadata: {
      title,
      description,
      alternates: { canonical: canonical(`/organizations/${encodeURIComponent(organization.slug)}`) },
      openGraph: {
        title,
        description,
        type: "website" as const,
        images: organization.bannerImage || organization.logo
          ? [organization.bannerImage ?? organization.logo!]
          : undefined,
      },
      twitter: { card: "summary_large_image" as const, title, description },
    },
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "SportsOrganization",
      name: organization.name,
      sport: "Ice hockey",
      ...(organization.logo ? { logo: organization.logo } : {}),
      ...(organization.website ? { url: organization.website } : {}),
      ...(organization.email ? { email: organization.email } : {}),
      ...(organization.phone ? { telephone: organization.phone } : {}),
      ...(organization.city
        ? {
            address: {
              "@type": "PostalAddress",
              addressLocality: organization.city,
              ...(organization.province ? { addressRegion: organization.province } : {}),
              ...(organization.address ? { streetAddress: organization.address } : {}),
              addressCountry: "CA",
            },
          }
        : {}),
    },
  }
}

export function teamSeo(team: Team, organization?: Pick<Organization, "name"> | null) {
  const details = [team.level, team.ageGroup].filter(Boolean).join(" ")
  const location = [team.city, team.province].filter(Boolean).join(", ")
  const title = `${team.name}${details ? ` — ${details}` : ""} Hockey Tryouts`
  const description =
    team.description ??
    `Tryout dates, roster details, and coaching staff for ${team.name}${location ? ` in ${location}` : ""}.`

  return {
    metadata: {
      title,
      description,
      alternates: { canonical: canonical(`/teams/${encodeURIComponent(team.slug)}`) },
      openGraph: {
        title,
        description,
        type: "website" as const,
        images: team.logo ? [team.logo] : undefined,
      },
      twitter: { card: "summary_large_image" as const, title, description },
    },
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "SportsTeam",
      name: team.name,
      sport: "Ice hockey",
      ...(team.logo ? { logo: team.logo } : {}),
      ...(organization
        ? { memberOf: { "@type": "SportsOrganization", name: organization.name } }
        : {}),
      ...(team.city
        ? {
            location: {
              "@type": "Place",
              address: {
                "@type": "PostalAddress",
                addressLocality: team.city,
                ...(team.province ? { addressRegion: team.province } : {}),
                addressCountry: "CA",
              },
            },
          }
        : {}),
    },
  }
}

export function tryoutSeo(tryout: TryoutFull, image?: string) {
  const title = `${tryout.team} ${tryout.level} Tryouts — ${tryout.city}, ${tryout.province} | HockeyTryouts.ca`
  const description =
    tryout.description ??
    `${tryout.level} hockey tryouts for ${tryout.team}${tryout.organization ? ` (${tryout.organization})` : ""} — ${tryout.ageGroup}, birth year ${tryout.birthYear}, in ${tryout.city}, ${tryout.province}. ${tryout.dates}. Register on HockeyTryouts.ca.`
  const registrationUrl =
    tryout.registrationLink && tryout.registrationLink !== "#"
      ? tryout.registrationLink
      : undefined

  return {
    metadata: {
      title,
      description,
      alternates: { canonical: canonical(`/tryouts/${encodeURIComponent(tryout.id)}`) },
      openGraph: {
        title,
        description,
        type: "website" as const,
        images: image ? [{ url: image }] : undefined,
      },
      twitter: {
        card: "summary_large_image" as const,
        title,
        description,
        images: image ? [image] : undefined,
      },
    },
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "SportsEvent",
      name: `${tryout.team} ${tryout.level} Tryouts`,
      sport: "Ice hockey",
      description,
      ...(image ? { image } : {}),
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
      ...(registrationUrl
        ? {
            offers: {
              "@type": "Offer",
              url: registrationUrl,
              availability:
                tryout.status === "Closed"
                  ? "https://schema.org/SoldOut"
                  : "https://schema.org/InStock",
            },
          }
        : {}),
    },
  }
}

/** Prevent user-controlled text from terminating the JSON-LD script element. */
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c")
}
