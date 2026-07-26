"use client"

import { useActionState, useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { X, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  createTryout,
  updateTryout,
  createOrganizationInline,
  createTeamInline,
  type ActionState,
} from "@/app/admin/actions"
import type { TryoutFull } from "@/lib/supabase/tryouts"
import type { Organization } from "@/lib/supabase/organizations"
import type { Team } from "@/lib/supabase/teams"

type OrgOpt = { id: string; name: string }
type TeamOpt = { id: string; name: string; organizationId?: string }

const LEVELS = [
  "AAA", "AA", "A", "BB", "B", "House League", "Junior", "College", "Pro",
]
const AGE_GROUPS = ["U7", "U9", "U11", "U13", "U15", "U18", "Junior", "Adult"]
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
  wrapperClassName,
}: {
  label: string
  name: string
  defaultValue?: string
  placeholder?: string
  rows?: number
  wrapperClassName?: string
}) {
  return (
    <div className={wrapperClassName}>
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
  organizations,
  teams,
  onDone,
}: {
  tryout: TryoutFull | null // null = create new
  organizations: Organization[]
  teams: Team[]
  onDone: () => void
}) {
  const router = useRouter()
  const isEdit = Boolean(tryout)
  const action = isEdit ? updateTryout : createTryout
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    action,
    null,
  )

  // Local, extendable copies so inline "quick create" can append + auto-select.
  const [orgs, setOrgs] = useState<OrgOpt[]>(
    organizations.map((o) => ({ id: o.id, name: o.name })),
  )
  const [teamList, setTeamList] = useState<TeamOpt[]>(
    teams.map((t) => ({ id: t.id, name: t.name, organizationId: t.organizationId })),
  )

  // Organization drives which teams are selectable. Pre-select from the linked
  // team when editing so the dependent dropdown is populated correctly.
  const linkedTeam = teamList.find((t) => t.id === tryout?.teamId)
  const [orgId, setOrgId] = useState<string>(
    tryout?.organizationId ?? linkedTeam?.organizationId ?? "",
  )
  const [teamId, setTeamId] = useState<string>(tryout?.teamId ?? "")

  const teamOptions = teamList.filter((t) =>
    orgId ? t.organizationId === orgId : true,
  )

  // Inline quick-create state.
  const [isPending, startTransition] = useTransition()
  const [showNewOrg, setShowNewOrg] = useState(false)
  const [showNewTeam, setShowNewTeam] = useState(false)
  const [newOrgName, setNewOrgName] = useState("")
  const [newTeamName, setNewTeamName] = useState("")
  const [newTeamAge, setNewTeamAge] = useState(AGE_GROUPS[0])
  const [newTeamLevel, setNewTeamLevel] = useState(LEVELS[0])
  const [newTeamBirthYear, setNewTeamBirthYear] = useState("")
  const [quickError, setQuickError] = useState<string | null>(null)

  function handleCreateOrg() {
    setQuickError(null)
    const name = newOrgName.trim()
    if (!name) {
      setQuickError("Organization name is required.")
      return
    }
    const fd = new FormData()
    fd.set("organizationName", name)
    startTransition(async () => {
      const res = await createOrganizationInline(null, fd)
      if (res && res.ok) {
        setOrgs((prev) => [...prev, { id: res.id, name: res.name }])
        setOrgId(res.id)
        setTeamId("")
        setNewOrgName("")
        setShowNewOrg(false)
      } else if (res && !res.ok) {
        setQuickError(res.error)
      }
    })
  }

  function handleCreateTeam() {
    setQuickError(null)
    const name = newTeamName.trim()
    if (!orgId) {
      setQuickError("Select an organization before adding a team.")
      return
    }
    if (!name) {
      setQuickError("Team name is required.")
      return
    }
    const fd = new FormData()
    fd.set("teamName", name)
    fd.set("organizationId", orgId)
    fd.set("ageGroup", newTeamAge)
    fd.set("level", newTeamLevel)
    fd.set("birthYear", newTeamBirthYear.trim())
    startTransition(async () => {
      const res = await createTeamInline(null, fd)
      if (res && res.ok) {
        setTeamList((prev) => [
          ...prev,
          { id: res.id, name: res.name, organizationId: res.organizationId },
        ])
        setTeamId(res.id)
        setNewTeamName("")
        setNewTeamBirthYear("")
        setShowNewTeam(false)
      } else if (res && !res.ok) {
        setQuickError(res.error)
      }
    })
  }

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

        {/* Organization & team (single source of truth) */}
        <div className="space-y-4">
          <SectionHeading>Organization &amp; team</SectionHeading>
          <p className="text-xs text-muted-foreground">
            Tryouts belong to a team, which belongs to an organization. The team
            name, logo, level, age group, birth year, city, and province all come
            from the selected team.
          </p>

          {/* Hidden inputs carry the selected ids into the form submission. */}
          <input type="hidden" name="organizationId" value={orgId} />
          <input type="hidden" name="teamId" value={teamId} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Organization selector + quick create */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="organizationSelect" className="text-sm font-medium text-foreground">
                  Organization <span className="text-destructive">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewOrg((v) => !v)
                    setQuickError(null)
                  }}
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  <Plus className="size-3.5" />
                  New organization
                </button>
              </div>
              <select
                id="organizationSelect"
                value={orgId}
                onChange={(e) => {
                  setOrgId(e.target.value)
                  setTeamId("")
                }}
                className={fieldClass}
              >
                <option value="">
                  {orgs.length ? "Select an organization" : "No organizations yet"}
                </option>
                {orgs.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
              {showNewOrg ? (
                <div className="mt-2 space-y-2 rounded-lg border border-dashed border-input bg-secondary/40 p-3">
                  <input
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                    placeholder="New organization name"
                    className={fieldClass}
                  />
                  <Button
                    type="button"
                    size="sm"
                    className="rounded-lg"
                    onClick={handleCreateOrg}
                    disabled={isPending}
                  >
                    {isPending ? "Creating…" : "Create & select"}
                  </Button>
                </div>
              ) : null}
            </div>

            {/* Team selector + quick create */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="teamSelect" className="text-sm font-medium text-foreground">
                  Team <span className="text-destructive">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewTeam((v) => !v)
                    setQuickError(null)
                  }}
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline disabled:opacity-40"
                  disabled={!orgId}
                >
                  <Plus className="size-3.5" />
                  New team
                </button>
              </div>
              <select
                id="teamSelect"
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                className={fieldClass}
                disabled={!orgId}
              >
                <option value="">
                  {!orgId
                    ? "Select an organization first"
                    : teamOptions.length
                      ? "Select a team"
                      : "No teams — create one"}
                </option>
                {teamOptions.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              {showNewTeam ? (
                <div className="mt-2 space-y-2 rounded-lg border border-dashed border-input bg-secondary/40 p-3">
                  <input
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    placeholder="New team name"
                    className={fieldClass}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={newTeamAge}
                      onChange={(e) => setNewTeamAge(e.target.value)}
                      className={fieldClass}
                      aria-label="Age group"
                    >
                      {AGE_GROUPS.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                    <select
                      value={newTeamLevel}
                      onChange={(e) => setNewTeamLevel(e.target.value)}
                      className={fieldClass}
                      aria-label="Level"
                    >
                      {LEVELS.map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </div>
                  <input
                    value={newTeamBirthYear}
                    onChange={(e) => setNewTeamBirthYear(e.target.value)}
                    placeholder="Birth years (e.g. 2011, 2012)"
                    className={fieldClass}
                  />
                  <Button
                    type="button"
                    size="sm"
                    className="rounded-lg"
                    onClick={handleCreateTeam}
                    disabled={isPending}
                  >
                    {isPending ? "Creating…" : "Create & select"}
                  </Button>
                </div>
              ) : null}
            </div>
          </div>

          {quickError ? (
            <p className="text-sm font-medium text-destructive">{quickError}</p>
          ) : null}
        </div>

        {/* Location (event-specific) */}
        <div className="space-y-4">
          <SectionHeading>Arena &amp; location</SectionHeading>
          <p className="text-xs text-muted-foreground">
            City and province are inherited from the team. Add the specific arena
            for this tryout event.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Arena name"
              name="arena"
              placeholder="Mastercard Centre"
              defaultValue={tryout?.arena}
            />
            <Field
              label="Arena address"
              name="address"
              placeholder="400 Kipling Ave, Toronto"
              defaultValue={tryout?.address}
            />
            <Field
              label="Google Maps link"
              name="googleMapsLink"
              type="url"
              placeholder="https://maps.google.com/…"
              defaultValue={tryout?.googleMapsLink}
            />
            <Field
              label="Hero image (URL or path)"
              name="heroImage"
              placeholder="/images/hero.png"
              defaultValue={tryout?.heroImage}
            />
          </div>
        </div>

        {/* Positions */}
        <div className="space-y-4">
          <SectionHeading>Positions needed</SectionHeading>
          <div>
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
            <TextAreaField
              label="Tryout times"
              name="times"
              rows={4}
              wrapperClassName="sm:col-span-2"
              placeholder={"Sat Sep 6: 6:00–8:00 PM\nSun Sep 7: 9:00–11:00 AM\n(one session per line — press Enter for a new line)"}
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
              name="registrations"
              type="number"
              placeholder="0"
              defaultValue={tryout?.registrations}
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
