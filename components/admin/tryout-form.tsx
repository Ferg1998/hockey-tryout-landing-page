"use client"

import { useActionState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createTryout, updateTryout, type ActionState } from "@/app/admin/actions"
import type { TryoutListing } from "@/lib/data"

const LEVELS = ["AAA", "AA", "A", "Local League", "House League", "Prep"]
const AGE_GROUPS = ["U7", "U9", "U11", "U13", "U15", "U18", "Junior", "Adult"]
const PROVINCES = [
  "AB", "BC", "MB", "NB", "NL", "NS", "NT", "NU", "ON", "PE", "QC", "SK", "YT",
]
const STATUSES = ["Open", "Closing Soon", "Waitlist", "Closed"]

const fieldClass =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none ring-ring/50 focus-visible:ring-2"
const labelClass = "mb-1.5 block text-sm font-medium text-foreground"

function Field({
  label,
  name,
  defaultValue,
  required,
  placeholder,
  type = "text",
}: {
  label: string
  name: string
  defaultValue?: string
  required?: boolean
  placeholder?: string
  type?: string
}) {
  return (
    <div>
      <label htmlFor={name} className={labelClass}>
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className={fieldClass}
      />
    </div>
  )
}

function SelectField({
  label,
  name,
  options,
  defaultValue,
}: {
  label: string
  name: string
  options: string[]
  defaultValue?: string
}) {
  return (
    <div>
      <label htmlFor={name} className={labelClass}>
        {label}
      </label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue ?? options[0]}
        className={fieldClass}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  )
}

export function TryoutForm({
  tryout,
  onDone,
}: {
  tryout: TryoutListing | null // null = create new
  onDone: () => void
}) {
  const router = useRouter()
  const isEdit = Boolean(tryout)
  const action = isEdit ? updateTryout : createTryout
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
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-foreground">
          {isEdit ? "Edit tryout" : "Add tryout"}
        </h2>
        <button
          type="button"
          onClick={onDone}
          aria-label="Close form"
          className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <X className="size-5" />
        </button>
      </div>

      <form action={formAction} className="mt-5 space-y-4">
        {isEdit ? <input type="hidden" name="id" value={tryout!.id} /> : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Team" name="team" required defaultValue={tryout?.team} />
          <Field label="City" name="city" required defaultValue={tryout?.city} />
          <SelectField
            label="Province"
            name="province"
            options={PROVINCES}
            defaultValue={tryout?.province}
          />
          <Field
            label="Birth year"
            name="birthYear"
            placeholder="2013"
            defaultValue={tryout?.birthYear}
          />
          <SelectField
            label="Age group"
            name="ageGroup"
            options={AGE_GROUPS}
            defaultValue={tryout?.ageGroup}
          />
          <SelectField
            label="Level"
            name="level"
            options={LEVELS}
            defaultValue={tryout?.level}
          />
          <Field
            label="Dates"
            name="dates"
            required
            placeholder="Apr 12–14, 2026"
            defaultValue={tryout?.dates}
          />
          <Field
            label="Arena"
            name="arena"
            placeholder="Mastercard Centre"
            defaultValue={tryout?.arena}
          />
          <Field
            label="Cost"
            name="cost"
            placeholder="$249"
            defaultValue={tryout?.cost}
          />
          <SelectField
            label="Status"
            name="status"
            options={STATUSES}
            defaultValue={tryout?.status}
          />
        </div>

        <Field
          label="Registration link"
          name="registrationLink"
          type="url"
          placeholder="https://…"
          defaultValue={tryout?.registrationLink}
        />
        <Field
          label="Image path or URL"
          name="image"
          placeholder="/images/tryout-aaa.png"
          defaultValue={tryout?.image}
        />

        {state?.error ? (
          <p className="text-sm font-medium text-destructive">{state.error}</p>
        ) : null}

        <div className="flex gap-3 pt-1">
          <Button type="submit" className="rounded-lg" disabled={pending}>
            {pending
              ? "Saving…"
              : isEdit
                ? "Save changes"
                : "Add tryout"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-lg"
            onClick={onDone}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
