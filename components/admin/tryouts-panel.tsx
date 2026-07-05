"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Pencil, MapPin, CalendarDays, Star, BadgeCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TryoutForm } from "@/components/admin/tryout-form"
import { DeleteButton } from "@/components/admin/delete-button"
import { deleteTryout } from "@/app/admin/actions"
import type { TryoutFull } from "@/lib/supabase/tryouts"
import type { Organization } from "@/lib/supabase/organizations"
import type { Team } from "@/lib/supabase/teams"

const statusStyles: Record<string, string> = {
  Open: "bg-primary/10 text-primary",
  "Closing Soon": "bg-amber-100 text-amber-700",
  Waitlist: "bg-secondary text-secondary-foreground",
  Full: "bg-amber-100 text-amber-700",
  Closed: "bg-muted text-muted-foreground",
}

export function TryoutsPanel({
  tryouts,
  organizations,
  teams,
}: {
  tryouts: TryoutFull[]
  organizations: Organization[]
  teams: Team[]
}) {
  const router = useRouter()
  const [editing, setEditing] = useState<TryoutFull | "new" | null>(null)
  const closeForm = () => setEditing(null)

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {tryouts.length} tryout{tryouts.length === 1 ? "" : "s"} in the database.
        </p>
        {editing === null ? (
          <Button className="rounded-lg" onClick={() => setEditing("new")}>
            <Plus className="size-4" />
            Add tryout
          </Button>
        ) : null}
      </div>

      {editing !== null ? (
        <div className="mt-6">
          <TryoutForm
            tryout={editing === "new" ? null : editing}
            organizations={organizations}
            teams={teams}
            onDone={closeForm}
          />
        </div>
      ) : null}

      <div className="mt-6 space-y-3">
        {tryouts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-secondary/40 p-10 text-center">
            <p className="text-sm text-muted-foreground">
              No tryouts yet. Click &ldquo;Add tryout&rdquo; to create your first
              listing.
            </p>
          </div>
        ) : (
          tryouts.map((t) => (
            <div
              key={t.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-base font-bold text-foreground">
                    {t.team}
                  </h3>
                  <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-primary">
                    {t.level}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      statusStyles[t.status] ?? "bg-muted text-muted-foreground"
                    }`}
                  >
                    {t.status}
                  </span>
                  {t.teamId ? (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                      Linked
                    </span>
                  ) : null}
                  {t.featured ? (
                    <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                      <Star className="size-3" />
                      Featured
                    </span>
                  ) : null}
                  {t.verified ? (
                    <span className="flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-secondary-foreground">
                      <BadgeCheck className="size-3" />
                      Verified
                    </span>
                  ) : null}
                </div>
                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-primary" />
                    {t.city}, {t.province}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="size-3.5 text-primary" />
                    {t.dates}
                  </span>
                  <span>
                    {t.ageGroup} · {t.birthYear} · {t.cost}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(t)}
                  aria-label={`Edit ${t.team}`}
                  className="flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:bg-accent hover:text-primary"
                >
                  <Pencil className="size-4" />
                </button>
                <DeleteButton
                  id={t.id}
                  label={t.team}
                  action={deleteTryout}
                  onDeleted={() => router.refresh()}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
