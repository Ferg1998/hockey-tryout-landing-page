import Link from "next/link"
import { MapPin, CalendarDays, ArrowRight, Building2 } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { TryoutListing } from "@/lib/data"
import { TryoutImage } from "@/components/tryout/tryout-image"

const statusStyles: Record<TryoutListing["status"], string> = {
  Open: "bg-emerald-50 text-emerald-700",
  "Closing Soon": "bg-amber-50 text-amber-700",
  Waitlist: "bg-sky-50 text-sky-700",
  Full: "bg-rose-50 text-rose-700",
  Closed: "bg-muted text-muted-foreground",
}

/**
 * Reusable responsive grid of tryout cards, used on organization and team
 * pages. Renders nothing but an empty-state message when there are no tryouts.
 */
export function TryoutCardGrid({
  tryouts,
  emptyMessage = "No tryouts posted yet.",
}: {
  tryouts: TryoutListing[]
  emptyMessage?: string
}) {
  if (tryouts.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-secondary/40 px-6 py-14 text-center">
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {tryouts.map((t) => (
        <article
          key={t.id}
          className="group overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
        >
          <Link href={`/tryouts/${t.id}`} className="block">
            <div className="relative aspect-[4/3] overflow-hidden">
              <TryoutImage
                image={t.image}
                organizationBanner={t.organizationBanner}
                teamLogo={t.teamLogo}
                organizationLogo={t.organizationLogo}
                alt={`${t.team} tryout`}
                className="transition-transform duration-500 group-hover:scale-105"
              />
              <span className="absolute left-3 top-3 rounded-full bg-card/95 px-3 py-1 text-xs font-bold text-primary shadow-sm">
                {t.level}
              </span>
              <span
                className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-semibold shadow-sm ${statusStyles[t.status]}`}
              >
                {t.status}
              </span>
            </div>
            <div className="p-4 pb-0">
              {t.organizationName ? (
                <div className="mb-1.5 flex items-center gap-1.5">
                  {t.organizationLogo ? (
                    <img
                      src={t.organizationLogo || "/placeholder.svg"}
                      alt=""
                      className="size-4 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <Building2 className="size-3.5 shrink-0 text-muted-foreground" />
                  )}
                  <span className="truncate text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t.organizationName}
                  </span>
                </div>
              ) : null}
              <h3 className="font-display text-base font-bold leading-snug text-foreground group-hover:text-primary">
                {t.team}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t.ageGroup} · Birth year {t.birthYear}
              </p>
              <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  <MapPin className="size-4 shrink-0 text-primary" />
                  {t.city}, {t.province}
                </p>
                {t.arena ? (
                  <p className="flex items-center gap-2">
                    <Building2 className="size-4 shrink-0 text-primary" />
                    {t.arena}
                  </p>
                ) : null}
                <p className="flex items-center gap-2">
                  <CalendarDays className="size-4 shrink-0 text-primary" />
                  {t.dates}
                </p>
              </div>
            </div>
          </Link>
          <div className="p-4">
            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="text-sm text-muted-foreground">
                <span className="text-base font-bold text-foreground">
                  {t.cost}
                </span>{" "}
                / player
              </span>
              <Link
                href={`/tryouts/${t.id}`}
                className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
              >
                Details
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
            {t.status === "Closed" ? (
              <span
                className={cn(
                  buttonVariants({ size: "sm" }),
                  "pointer-events-none mt-3 w-full rounded-full opacity-50",
                )}
              >
                Registration Closed
              </span>
            ) : (
              <a
                href={t.registrationLink || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ size: "sm" }),
                  "mt-3 w-full rounded-full",
                )}
              >
                Register
              </a>
            )}
          </div>
        </article>
      ))}
    </div>
  )
}
