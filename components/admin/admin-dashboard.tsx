"use client"

import { useActionState, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Pencil, Trash2, MapPin, CalendarDays, LogOut, Star, BadgeCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TryoutForm } from "@/components/admin/tryout-form"
import {
  deleteTryout,
  logout,
  type ActionState,
} from "@/app/admin/actions"
import type { TryoutFull } from "@/lib/supabase/tryouts"

function DeleteButton({
  id,
  team,
  onDeleted,
}: {
  id: string
  team: string
  onDeleted: () => void
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    deleteTryout,
    null,
  )

  useEffect(() => {
    if (state?.success) onDeleted()
  }, [state, onDeleted])

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm(`Delete "${team}"? This cannot be undone.`)) {
          e.preventDefault()
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending}
        aria-label={`Delete ${team}`}
        className="flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
      >
        <Trash2 className="size-4" />
      </button>
    </form>
  )
}

const statusStyles: Record<string, string> = {
  Open: "bg-primary/10 text-primary",
  "Closing Soon": "bg-amber-100 text-amber-700",
  Waitlist: "bg-secondary text-secondary-foreground",
  Full: "bg-amber-100 text-amber-700",
  Closed: "bg-muted text-muted-foreground",
}

export function AdminDashboard({ tryouts }: { tryouts: TryoutFull[] }) {
  const router = useRouter()
  // null = form closed, "new" = creating, otherwise the tryout being edited
  const [editing, setEditing] = useState<TryoutFull | "new" | null>(null)

  const closeForm = () => setEditing(null)

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            Admin
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold text-foreground">
            Manage tryouts
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {tryouts.length} tryout{tryouts.length === 1 ? "" : "s"} in the
            database.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {editing === null ? (
            <Button
              className="rounded-lg"
              onClick={() => setEditing("new")}
            >
              <Plus className="size-4" />
              Add tryout
            </Button>
          ) : null}
          <form action={logout}>
            <Button type="submit" variant="outline" className="rounded-lg">
              <LogOut className="size-4" />
              Sign out
            </Button>
          </form>
        </div>
      </div>

      {editing !== null ? (
        <div className="mt-8">
          <TryoutForm
            tryout={editing === "new" ? null : editing}
            onDone={closeForm}
          />
        </div>
      ) : null}

      <div className="mt-8 space-y-3">
        {tryouts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-secondary/40 p-10 text-center">
            <p className="text-sm text-muted-foreground">
              No tryouts yet. Click “Add tryout” to create your first listing.
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
                  team={t.team}
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
