"use client"

import { useActionState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createTryout, updateTryout, type ActionState } from "@/app/admin/actions"
import type { TryoutFull } from "@/lib/supabase/tryouts"

const LEVELS = [
  "AAA", "AA", "A", "BB", "B", "House League", "Junior", "College", "Pro",
]
const AGE_GROUPS = ["U7", "U9", "U11", "U13", "U15", "U18", "Junior", "Adult"]
const PROVINCES = [
  "AB", "BC", "MB", "NB", "NL", "NS", "NT", "NU", "ON", "PE", "QC", "SK", "YT",
]
const STATUSES = ["Open", "Waitlist", "Full", "Closed"]
const POSITIONS = ["Forward", "Defense", "Goalie"]

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
  defaultValue?: string | number
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

function TextAreaField({
  label,
  name,
  defaultValue,
  placeholder,
  rows = 3,
}: {
  label: string
  name: string
  defaultValue?: string
  placeholder?: string
  rows?: number
}) {
  return (
    <div>
      <label htmlFor={name} className={labelClass}>
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        rows={rows}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className={`${fieldClass} resize-y`}
      />
    </div>
  )
}

function CheckboxField({
  label,
  name,
  defaultChecked,
  hint,
}: {
  label: string
  name: string
  defaultChecked?: boolean
  hint?: string
}) {
  return (
    <label
      htmlFor={name}
      className="flex items-start gap-3 rounded-lg border border-input bg-background px-3 py-2.5"
    >
      <input
        id={name}
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
        className="mt-0.5 size-4 rounded border-input accent-primary"
      />
      <span>
        <span className="block text-sm font-medium text-foreground">{label}</span>
        {hint ? (
          <span className="block text-xs text-muted-foreground">{hint}</span>
        ) : null}
      </span>
    </label>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="border-b border-border pb-2 text-sm font-semibold uppercase tracking-wide text-primary">
      {children}
    </h3>
  )
}

export function TryoutForm({
  tryout,
  onDone,
}: {
  tryout: TryoutFull | null // null = create new
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

  const selectedPositions = (tryout?.positionsNeeded ?? "")
    .split(",")
    .map((p) => p.trim().toLowerCase())

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

      <form action={formAction} className="mt-5 space-y-8">
        {isEdit ? <input type="hidden" name="id" value={tryout!.id} /> : null}

        {/* Team & organization */}
        <div className="space-y-4">
          <SectionHeading>Team &amp; organization</SectionHeading>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Team name" name="team" required defaultValue={tryout?.team} />
            <Field
              label="Organization"
              name="organization"
              placeholder="Greater Toronto Hockey League"
              defaultValue={tryout?.organization}
            />
            <Field
              label="Team logo (URL or path)"
              name="logo"
              placeholder="/images/logo.png"
              defaultValue={tryout?.logo}
            />
            <Field
              label="Hero image (URL or path)"
              name="heroImage"
              placeholder="/images/hero.png"
              defaultValue={tryout?.heroImage}
            />
          </div>
        </div>

        {/* Location */}
        <div className="space-y-4">
          <SectionHeading>Location</SectionHeading>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="City" name="city" required defaultValue={tryout?.city} />
            <SelectField
              label="Province"
              name="province"
              options={PROVINCES}
              defaultValue={tryout?.province}
            />
            <Field
              label="Arena name"
              name="arena"
              placeholder="Mastercard Centre"
              defaultValue={tryout?.arena}
            />
            <Field
              label="Arena address"
              name="arenaAddress"
              placeholder="400 Kipling Ave, Toronto"
              defaultValue={tryout?.arenaAddress}
            />
            <Field
              label="Google Maps link"
              name="googleMapsLink"
              type="url"
              placeholder="https://maps.google.com/…"
              defaultValue={tryout?.googleMapsLink}
            />
          </div>
        </div>

        {/* Level & eligibility */}
        <div className="space-y-4">
          <SectionHeading>Level &amp; eligibility</SectionHeading>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Birth years"
              name="birthYear"
              placeholder="2011, 2012"
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
          </div>
          <div>
            <span className={labelClass}>Positions needed</span>
            <div className="flex flex-wrap gap-2">
              {POSITIONS.map((p) => (
                <label
                  key={p}
                  className="flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                >
                  <input
                    type="checkbox"
                    name="positionsNeeded"
                    value={p}
                    defaultChecked={selectedPositions.includes(p.toLowerCase())}
                    className="size-4 rounded border-input accent-primary"
                  />
                  {p}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="space-y-4">
          <SectionHeading>Schedule</SectionHeading>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Tryout start date"
              name="startDate"
              type="date"
              required
              defaultValue={tryout?.startDate}
            />
            <Field
              label="Tryout end date"
              name="endDate"
              type="date"
              defaultValue={tryout?.endDate}
            />
            <Field
              label="Tryout times"
              name="times"
              placeholder="6:00–8:00 PM"
              defaultValue={tryout?.times}
            />
            <Field
              label="Registration deadline"
              name="registrationDeadline"
              type="date"
              defaultValue={tryout?.registrationDeadline}
            />
          </div>
        </div>

        {/* Registration & cost */}
        <div className="space-y-4">
          <SectionHeading>Registration &amp; cost</SectionHeading>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Cost"
              name="cost"
              placeholder="$249"
              defaultValue={tryout?.cost}
            />
            <Field
              label="Registration URL"
              name="registrationLink"
              type="url"
              placeholder="https://…"
              defaultValue={tryout?.registrationLink}
            />
            <Field
              label="Website"
              name="website"
              type="url"
              placeholder="https://…"
              defaultValue={tryout?.website}
            />
          </div>
        </div>

        {/* Contact */}
        <div className="space-y-4">
          <SectionHeading>Contact</SectionHeading>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Contact name"
              name="contactName"
              defaultValue={tryout?.contactName}
            />
            <Field
              label="Contact email"
              name="contactEmail"
              type="email"
              defaultValue={tryout?.contactEmail}
            />
            <Field
              label="Contact phone"
              name="contactPhone"
              type="tel"
              defaultValue={tryout?.contactPhone}
            />
          </div>
        </div>

        {/* Details */}
        <div className="space-y-4">
          <SectionHeading>Details</SectionHeading>
          <TextAreaField
            label="Description"
            name="description"
            rows={4}
            placeholder="Overview of the tryout, expectations, and format."
            defaultValue={tryout?.description}
          />
          <TextAreaField
            label="Equipment required"
            name="equipment"
            placeholder="Full equipment, two jerseys (light & dark), water bottle."
            defaultValue={tryout?.equipment}
          />
        </div>

        {/* Capacity & status */}
        <div className="space-y-4">
          <SectionHeading>Capacity &amp; status</SectionHeading>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Maximum players"
              name="maxPlayers"
              type="number"
              placeholder="40"
              defaultValue={tryout?.maxPlayers}
            />
            <Field
              label="Current registrations"
              name="currentRegistrations"
              type="number"
              placeholder="0"
              defaultValue={tryout?.currentRegistrations}
            />
            <SelectField
              label="Status"
              name="status"
              options={STATUSES}
              defaultValue={tryout?.status}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <CheckboxField
              label="Featured tryout"
              name="featured"
              hint="Show in the Featured Tryouts section"
              defaultChecked={tryout?.featured}
            />
            <CheckboxField
              label="Verified organization"
              name="verified"
              hint="Mark the organization as verified"
              defaultChecked={tryout?.verified}
            />
          </div>
        </div>

        {state?.error ? (
          <p className="text-sm font-medium text-destructive">{state.error}</p>
        ) : null}

        <div className="flex gap-3 border-t border-border pt-5">
          <Button type="submit" className="rounded-lg" disabled={pending}>
            {pending ? "Saving…" : isEdit ? "Save changes" : "Add tryout"}
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
