import { ArrowRight, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { coachCategories } from "@/lib/data"

export function PrepareSection() {
  return (
    <section id="prepare" className="bg-primary">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary-foreground/70">
              Prepare for tryouts
            </p>
            <h2 className="mt-2 text-balance font-display text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
              Show up ready. Book an elite coach.
            </h2>
            <p className="mt-3 max-w-xl text-pretty leading-relaxed text-primary-foreground/80">
              Give your player the edge with vetted, background-checked coaches
              across skills, skating, goaltending, and off-ice performance.
            </p>
          </div>
          <Button
            variant="secondary"
            size="lg"
            className="gap-2 rounded-full bg-background px-5 text-primary hover:bg-background/90"
          >
            Explore all coaches
            <ArrowRight className="size-4" />
          </Button>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {coachCategories.map((c) => (
            <article
              key={c.slug}
              className="group overflow-hidden rounded-3xl bg-card shadow-lg transition-transform hover:-translate-y-1"
            >
              <div className="relative aspect-[5/4] overflow-hidden">
                <img
                  src={c.image || "/placeholder.svg"}
                  alt={c.title}
                  className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-card/95 px-3 py-1 text-xs font-semibold text-foreground shadow-sm">
                  <Users className="size-3.5 text-primary" />
                  {c.coaches} coaches
                </span>
              </div>
              <div className="p-5">
                <h3 className="font-display text-lg font-bold text-foreground">
                  {c.title}
                </h3>
                <p className="mt-1.5 min-h-10 text-sm leading-relaxed text-muted-foreground">
                  {c.blurb}
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                  <span className="text-sm text-muted-foreground">
                    From{" "}
                    <span className="font-bold text-foreground">{c.from}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                    Find Coaches
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
