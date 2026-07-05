"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Plus, Pencil, MapPin, Globe, BadgeCheck, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { OrganizationForm } from "@/components/admin/organization-form"
import { DeleteButton } from "@/components/admin/delete-button"
import { deleteOrganization } from "@/app/admin/actions"
import type { Organization } from "@/lib/supabase/organizations"

export function OrganizationsPanel({
  organizations,
  teamCounts,
}: {
  organizations: Organization[]
  teamCounts: Record<string, number>
}) {
  const router = useRouter()
  const [editing, setEditing] = useState<Organization | "new" | null>(null)
  const closeForm = () => setEditing(null)

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {organizations.length} organization
          {organizations.length === 1 ? "" : "s"}.
        </p>
        {editing === null ? (
          <Button className="rounded-lg" onClick={() => setEditing("new")}>
            <Plus className="size-4" />
            Add organization
          </Button>
        ) : null}
      </div>

      {editing !== null ? (
        <div className="mt-6">
          <OrganizationForm
            organization={editing === "new" ? null : editing}
            onDone={closeForm}
          />
        </div>
      ) : null}

      <div className="mt-6 space-y-3">
        {organizations.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-secondary/40 p-10 text-center">
            <p className="text-sm text-muted-foreground">
              No organizations yet. Add one to start grouping teams and tryouts.
            </p>
          </div>
        ) : (
          organizations.map((o) => (
            <div
              key={o.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-base font-bold text-foreground">
                    {o.name}
                  </h3>
                  {o.verified ? (
                    <span className="flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-secondary-foreground">
                      <BadgeCheck className="size-3" />
                      Verified
                    </span>
                  ) : null}
                  <span className="flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-primary">
                    <Users className="size-3" />
                    {teamCounts[o.id] ?? 0} team
                    {(teamCounts[o.id] ?? 0) === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  {o.city || o.province ? (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="size-3.5 text-primary" />
                      {[o.city, o.province].filter(Boolean).join(", ")}
                    </span>
                  ) : null}
                  {o.website ? (
                    <span className="flex items-center gap-1.5">
                      <Globe className="size-3.5 text-primary" />
                      {o.website.replace(/^https?:\/\//, "")}
                    </span>
                  ) : null}
                  <Link
                    href={`/organizations/${o.slug}`}
                    className="font-medium text-primary hover:underline"
                    target="_blank"
                  >
                    /organizations/{o.slug}
                  </Link>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(o)}
                  aria-label={`Edit ${o.name}`}
                  className="flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:bg-accent hover:text-primary"
                >
                  <Pencil className="size-4" />
                </button>
                <DeleteButton
                  id={o.id}
                  label={o.name}
                  action={deleteOrganization}
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
