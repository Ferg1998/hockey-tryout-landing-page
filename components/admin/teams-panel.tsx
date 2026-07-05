"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Plus, Pencil, Building2, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TeamForm } from "@/components/admin/team-form"
import { DeleteButton } from "@/components/admin/delete-button"
import { deleteTeam } from "@/app/admin/actions"
import type { Team } from "@/lib/supabase/teams"
import type { Organization } from "@/lib/supabase/organizations"

export function TeamsPanel({
  teams,
  organizations,
}: {
  teams: Team[]
  organizations: Organization[]
}) {
  const router = useRouter()
  const [editing, setEditing] = useState<Team | "new" | null>(null)
  const closeForm = () => setEditing(null)

  const orgName = (id?: string) =>
    organizations.find((o) => o.id === id)?.name ?? "Unassigned"

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {teams.length} team{teams.length === 1 ? "" : "s"}.
        </p>
        {editing === null ? (
          <Button
            className="rounded-lg"
            onClick={() => setEditing("new")}
            disabled={organizations.length === 0}
          >
            <Plus className="size-4" />
            Add team
          </Button>
        ) : null}
      </div>

      {organizations.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Create an organization first — teams belong to an organization.
        </p>
      ) : null}

      {editing !== null ? (
        <div className="mt-6">
          <TeamForm
            team={editing === "new" ? null : editing}
            organizations={organizations}
            onDone={closeForm}
          />
        </div>
      ) : null}

      <div className="mt-6 space-y-3">
        {teams.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-secondary/40 p-10 text-center">
            <p className="text-sm text-muted-foreground">
              No teams yet. Add a team and assign it to an organization.
            </p>
          </div>
        ) : (
          teams.map((t) => (
            <div
              key={t.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-base font-bold text-foreground">
                    {t.name}
                  </h3>
                  {t.level ? (
                    <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-primary">
                      {t.level}
                    </span>
                  ) : null}
                  {!t.active ? (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                      Inactive
                    </span>
                  ) : null}
                </div>
                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="size-3.5 text-primary" />
                    {orgName(t.organizationId)}
                  </span>
                  {t.ageGroup || t.season ? (
                    <span className="flex items-center gap-1.5">
                      <Users className="size-3.5 text-primary" />
                      {[t.ageGroup, t.season].filter(Boolean).join(" · ")}
                    </span>
                  ) : null}
                  <Link
                    href={`/teams/${t.slug}`}
                    className="font-medium text-primary hover:underline"
                    target="_blank"
                  >
                    /teams/{t.slug}
                  </Link>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(t)}
                  aria-label={`Edit ${t.name}`}
                  className="flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:bg-accent hover:text-primary"
                >
                  <Pencil className="size-4" />
                </button>
                <DeleteButton
                  id={t.id}
                  label={t.name}
                  action={deleteTeam}
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
