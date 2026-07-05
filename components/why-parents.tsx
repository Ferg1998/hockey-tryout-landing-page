import { Check } from "lucide-react"

const reasons = [
  {
    title: "Find every tryout",
    blurb: "One place for all Canadian hockey tryouts — nothing slips through.",
  },
  {
    title: "Trusted coaching partners",
    blurb: "Every coach and camp is vetted and background-checked.",
  },
  {
    title: "Save hours of searching",
    blurb: "Skip the group chats and scattered flyers. Search once.",
  },
  {
    title: "Prepare with confidence",
    blurb: "Give your player the tools to show up ready on evaluation day.",
  },
]

export function WhyParents() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          Trusted by families
        </p>
        <h2 className="mt-2 text-balance font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Why parents use HockeyTryouts.ca
        </h2>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {reasons.map((r) => (
          <div
            key={r.title}
            className="flex flex-col items-start rounded-2xl border border-border bg-card p-6 shadow-sm"
          >
            <span className="flex size-11 items-center justify-center rounded-full bg-accent text-primary">
              <Check className="size-6" />
            </span>
            <h3 className="mt-4 font-display text-lg font-bold text-foreground">
              {r.title}
            </h3>
            <p className="mt-1.5 text-pretty text-sm leading-relaxed text-muted-foreground">
              {r.blurb}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
