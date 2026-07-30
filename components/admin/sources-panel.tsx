"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Plus,
  Pencil,
  ExternalLink,
  CircleCheck,
  CircleAlert,
  CircleDot,
  Ban,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { SourceForm } from "@/components/admin/source-form"
import { DeleteButton } from "@/components/admin/delete-button"
import { TriggerCheckButton } from "@/components/admin/trigger-check-button"
import { BulkSourceCheckButton } from "@/components/admin/bulk-source-check-button"
import { deleteSource, type ActionState } from "@/app/admin/import-actions"
import type { SourcePage } from "@/lib/supabase/import"
import type { Organization } from "@/lib/supabase/organizations"

function formatDate(value?: string) {
  if (!value) return "Never"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return "Never"
  return d.toLocaleString("en-CA", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export function SourcesPanel({
  sources,
  organizations,
}: {
  sources: SourcePage[]
  organizations: Organization[]
}) {
  const router = useRouter()
  const [editing, setEditing] = useState<SourcePage | "new" | null>(null)
  const [feedback, setFeedback] = useState<{ id: string; state: ActionState } | null>(
    null,
  )
  const orgName = (id?: string) =>
    id ? organizations.find((o) => o.id === id)?.name : undefined

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            {sources.length} source{sources.length === 1 ? "" : "s"}. Scraped content is
            never auto-published; it lands in Import Review.
          </p>
        </div>
        {editing === null ? (
          <Button className="rounded-lg" onClick={() => setEditing("new")}>
            <Plus className="size-4" />
            Add source
          </Button>
        ) : null}
      </div>

      {editing !== null ? (
        <div className="mt-6">
          <SourceForm
            source={editing === "new" ? null : editing}
            organizations={organizations}
            onDone={() => setEditing(null)}
          />
        </div>
      ) : null}

      <div className="mt-6">
        <BulkSourceCheckButton
          sourceIds={sources
            .filter((source) => source.active && source.scrapeAllowed)
            .map((source) => source.id)}
        />
      </div>

      <div className="mt-6 space-y-3">
        {sources.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-secondary/40 p-10 text-center">
            <p className="text-sm text-muted-foreground">
              No sources yet. Add a public tryout page to begin importing.
            </p>
          </div>
        ) : (
          sources.map((s) => (
            <div
              key={s.id}
              className="rounded-2xl border border-border bg-card p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {!s.active ? (
                      <span className="flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                        <CircleDot className="size-3" />
                        Inactive
                      </span>
                    ) : null}
                    {s.scrapeAllowed ? (
                      <span className="flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-primary">
                        <CircleCheck className="size-3" />
                        Scraping allowed
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
                        <Ban className="size-3" />
                        Scraping blocked
                      </span>
                    )}
                    {orgName(s.organizationId) ? (
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-secondary-foreground">
                        {orgName(s.organizationId)}
                      </span>
                    ) : null}
                    {s.province ? (
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-secondary-foreground">
                        {s.province}
                      </span>
                    ) : null}
                  </div>
                  <a
                    href={s.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 flex items-center gap-1.5 break-all text-sm font-medium text-primary hover:underline"
                  >
                    {s.sourceUrl}
                    <ExternalLink className="size-3.5 shrink-0" />
                  </a>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CircleCheck className="size-3.5 text-primary" />
                      Last success: {formatDate(s.lastSuccessAt)}
                    </span>
                    <span>Last checked: {formatDate(s.lastCheckedAt)}</span>
                  </div>
                  {s.errorMessage ? (
                    <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
                      <CircleAlert className="mt-0.5 size-3.5 shrink-0" />
                      {s.errorMessage}
                    </p>
                  ) : null}
                  {feedback?.id === s.id && feedback.state ? (
                    <p
                      className={`mt-2 rounded-lg px-3 py-2 text-xs ${
                        feedback.state.error
                          ? "bg-destructive/10 text-destructive"
                          : "bg-accent text-primary"
                      }`}
                    >
                      {feedback.state.error ?? feedback.state.success}
                    </p>
                  ) : null}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditing(s)}
                    aria-label={`Edit source ${s.sourceUrl}`}
                    className="flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:bg-accent hover:text-primary"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <DeleteButton
                    id={s.id}
                    label={s.sourceUrl}
                    action={deleteSource}
                    onDeleted={() => router.refresh()}
                  />
                </div>
              </div>

              <div className="mt-3 border-t border-border pt-3">
                <TriggerCheckButton
                  id={s.id}
                  onResult={(state) => setFeedback({ id: s.id, state })}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
