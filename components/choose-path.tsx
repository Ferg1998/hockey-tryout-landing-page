import { Search, Dumbbell, ArrowRight } from "lucide-react"

const paths = [
  {
    href: "#featured",
    icon: Search,
    title: "Find Tryouts",
    blurb: "Browse every hockey tryout by city, age and level.",
    cta: "Browse tryouts",
  },
  {
    href: "#prepare",
    icon: Dumbbell,
    title: "Prepare for Tryouts",
    blurb:
      "Find skating coaches, skills coaches, goalie coaches, off-ice training and camps near you.",
    cta: "Find coaches",
  },
]

export function ChoosePath() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          Get started
        </p>
        <h2 className="mt-2 text-balance font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Choose your path
        </h2>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
        {paths.map((p) => (
          <a
            key={p.title}
            href={p.href}
            className="group relative flex flex-col overflow-hidden rounded-3xl border border-border bg-card p-8 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl sm:p-10"
          >
            <span className="flex size-14 items-center justify-center rounded-2xl bg-accent text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <p.icon className="size-7" />
            </span>
            <h3 className="mt-6 font-display text-2xl font-bold text-foreground">
              {p.title}
            </h3>
            <p className="mt-2 max-w-md text-pretty leading-relaxed text-muted-foreground">
              {p.blurb}
            </p>
            <span className="mt-6 inline-flex items-center gap-1.5 font-semibold text-primary">
              {p.cta}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </span>
          </a>
        ))}
      </div>
    </section>
  )
}
