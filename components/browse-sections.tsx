import { ArrowRight, MapPin } from "lucide-react"
import { ageGroups, levels, regions, positions } from "@/lib/data"

function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string
  title: string
  subtitle: string
}) {
  return (
    <div className="max-w-2xl">
      <p className="text-sm font-semibold uppercase tracking-wide text-primary">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-balance font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        {title}
      </h2>
      <p className="mt-3 text-pretty leading-relaxed text-muted-foreground">
        {subtitle}
      </p>
    </div>
  )
}

export function BrowseByAge() {
  return (
    <section id="browse-age" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Browse by age"
        title="Every division, every age"
        subtitle="From first-timers to junior prospects — find tryouts built for the right stage of development."
      />
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {ageGroups.map((a) => (
          <a
            key={a.label}
            href="#"
            className="group flex flex-col items-center justify-center gap-1 rounded-2xl border border-border bg-card px-3 py-5 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
          >
            <span className="font-display text-xl font-bold text-foreground group-hover:text-primary">
              {a.label}
            </span>
            <span className="text-xs text-muted-foreground">{a.note}</span>
          </a>
        ))}
      </div>
    </section>
  )
}

export function BrowseByLevel() {
  return (
    <section id="browse-level" className="bg-secondary/60">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Browse by level"
          title="Match your competitive tier"
          subtitle="Whether it's house league fun or a AAA scouting showcase, filter tryouts by the level that fits your player."
        />
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {levels.map((l) => (
            <a
              key={l.label}
              href="#"
              className="group relative flex items-center justify-between overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="relative">
                <h3 className="font-display text-lg font-bold text-foreground">
                  {l.label}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">{l.note}</p>
              </div>
              <span
                className={`flex size-10 items-center justify-center rounded-full bg-gradient-to-br ${l.tone} text-white transition-transform group-hover:translate-x-0.5`}
              >
                <ArrowRight className="size-5" />
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

export function BrowseByPosition() {
  return (
    <section id="browse-position" className="bg-secondary/60">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Browse by position"
          title="Find your player's role"
          subtitle="Position-specific tryouts and coaching for forwards, defense, and goaltenders."
        />
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {positions.map((p) => (
            <a
              key={p.label}
              href="#"
              className="group flex items-center justify-between rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
            >
              <div>
                <h3 className="font-display text-xl font-bold text-foreground group-hover:text-primary">
                  {p.label}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">{p.note}</p>
              </div>
              <span className="flex size-10 items-center justify-center rounded-full bg-accent text-primary transition-transform group-hover:translate-x-0.5">
                <ArrowRight className="size-5" />
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

export function BrowseByRegion() {
  return (
    <section id="browse-region" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Browse by region"
        title="Tryouts across Canada"
        subtitle="Explore active tryouts and associations in your province."
      />
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {regions.map((r) => (
          <a
            key={r.label}
            href="#"
            className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
              <MapPin className="size-5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-display font-bold text-foreground group-hover:text-primary">
                {r.label}
              </span>
              <span className="text-xs text-muted-foreground">
                {r.teams.toLocaleString()} teams
              </span>
            </span>
          </a>
        ))}
      </div>
    </section>
  )
}
