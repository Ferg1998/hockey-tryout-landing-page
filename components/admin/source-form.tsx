"use client"

import { useActionState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Field,
  SelectField,
  CheckboxField,
  PROVINCE_OPTIONS,
} from "@/components/admin/form-fields"
import { createSource, updateSource, type ActionState } from "@/app/admin/import-actions"
import type { SourcePage } from "@/lib/supabase/import"
import type { Organization } from "@/lib/supabase/organizations"

const SOURCE_TYPES = ["webpage", "association", "league", "team", "other"].map(
  (v) => ({ value: v, label: v }),
)

export function SourceForm({
  source,
  organizations,
  onDone,
}: {
  source: SourcePage | null // null = create new
  organizations: Organization[]
  onDone: () => void
}) {
  const router = useRouter()
  const isEdit = Boolean(source)
  const action = isEdit ? updateSource : createSource
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    action,
    null,
  )

  useEffect(() => {
    if (state?.success) {
      router.refresh()
      onDone()
    }
  }, [state, router, onDone])

  return (
    <form
      action={formAction}
      className="rounded-2xl border border-border bg-card p-5 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-bold text-foreground">
          {isEdit ? "Edit source" : "Add source"}
        </h3>
        <button
          type="button"
          onClick={onDone}
          aria-label="Close form"
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary"
        >
          <X className="size-4" />
        </button>
      </div>

      {source ? <input type="hidden" name="id" value={source.id} /> : null}

      <div className="mt-4 grid grid-cols-1 gap-4">
        <Field
          label="Source URL"
          name="sourceUrl"
          required
          type="url"
          placeholder="https://example-hockey-association.ca/tryouts"
          defaultValue={source?.sourceUrl}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectField
            label="Organization"
            name="organizationId"
            placeholder={organizations.length ? "No organization" : "No organizations yet"}
            defaultValue={source?.organizationId}
            options={organizations.map((o) => ({ value: o.id, label: o.name }))}
          />
          <SelectField
            label="Source type"
            name="sourceType"
            defaultValue={source?.sourceType ?? "webpage"}
            options={SOURCE_TYPES}
          />
        </div>
        <SelectField
          label="Province"
          name="province"
          placeholder="Select province"
          defaultValue={source?.province}
          options={PROVINCE_OPTIONS}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <CheckboxField
            label="Scraping allowed"
            name="scrapeAllowed"
            defaultChecked={source ? source.scrapeAllowed : true}
            hint="Only check if this site permits automated access."
          />
          <CheckboxField
            label="Active"
            name="active"
            defaultChecked={source ? source.active : true}
            hint="Inactive sources are never checked."
          />
        </div>
      </div>

      {state?.error ? (
        <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <div className="mt-5 flex items-center gap-3">
        <Button type="submit" disabled={pending} className="rounded-lg">
          {pending ? "Saving..." : isEdit ? "Save changes" : "Add source"}
        </Button>
        <Button type="button" variant="outline" onClick={onDone} className="rounded-lg">
          Cancel
        </Button>
      </div>
    </form>
  )
}
