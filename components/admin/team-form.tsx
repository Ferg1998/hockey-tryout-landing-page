"use client"

import { useActionState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createTeam, updateTeam, type ActionState } from "@/app/admin/actions"
import type { Team } from "@/lib/supabase/teams"
import type { Organization } from "@/lib/supabase/organizations"
import {
  Field,
  SelectField,
  TextAreaField,
  CheckboxField,
  SectionHeading,
  LEVELS,
  AGE_GROUPS,
  PROVINCE_OPTIONS,
} from "@/components/admin/form-fields"

export function TeamForm({
  team,
  organizations,
  onDone,
}: {
  team: Team | null // null = create new
  organizations: Organization[]
  onDone: () => void
}) {
  const router = useRouter()
  const isEdit = Boolean(team)
  const action = isEdit ? updateTeam : createTeam
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

  const orgOptions = organizations.map((o) => ({ value: o.id, label: o.name }))

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-foreground">
          {isEdit ? "Edit team" : "Add team"}
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
        {isEdit ? <input type="hidden" name="id" value={team!.id} /> : null}

        <div className="space-y-4">
          <SectionHeading>Team &amp; organization</SectionHeading>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Team name"
              name="teamName"
              required
              placeholder="Toronto Marlboros U16 AAA"
              defaultValue={team?.name}
            />
            <SelectField
              label="Organization"
              name="organizationId"
              options={orgOptions}
              placeholder={
                orgOptions.length ? "Select organization" : "No organizations yet"
              }
              defaultValue={team?.organizationId}
            />
            <Field
              label="Logo (URL or path)"
              name="logo"
              placeholder="/images/logo.png"
              defaultValue={team?.logo}
            />
            <Field
              label="Season"
              name="season"
              placeholder="2026–27"
              defaultValue={team?.season}
            />
          </div>
        </div>

        <div className="space-y-4">
          <SectionHeading>Level &amp; eligibility</SectionHeading>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SelectField
              label="Age group"
              name="ageGroup"
              options={AGE_GROUPS}
              placeholder="Select age group"
              defaultValue={team?.ageGroup}
            />
            <SelectField
              label="Level"
              name="level"
              options={LEVELS}
              placeholder="Select level"
              defaultValue={team?.level}
            />
            <Field
              label="Birth years"
              name="birthYear"
              placeholder="2011, 2012"
              defaultValue={team?.birthYear}
            />
          </div>
        </div>

        <div className="space-y-4">
          <SectionHeading>Location</SectionHeading>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="City" name="city" defaultValue={team?.city} />
            <SelectField
              label="Province"
              name="province"
              options={PROVINCE_OPTIONS}
              placeholder="Select province"
              defaultValue={team?.province}
            />
          </div>
        </div>

        <div className="space-y-4">
          <SectionHeading>Coaching staff</SectionHeading>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Head coach"
              name="headCoach"
              defaultValue={team?.headCoach}
            />
            <Field
              label="Assistant coach"
              name="assistantCoach"
              defaultValue={team?.assistantCoach}
            />
          </div>
        </div>

        <div className="space-y-4">
          <SectionHeading>Details</SectionHeading>
          <TextAreaField
            label="Description"
            name="description"
            rows={3}
            placeholder="About the team, playing style, and expectations."
            defaultValue={team?.description}
          />
          <CheckboxField
            label="Active team"
            name="active"
            hint="Active teams appear on the organization's public page"
            defaultChecked={team ? team.active : true}
          />
        </div>

        {state?.error ? (
          <p className="text-sm font-medium text-destructive">{state.error}</p>
        ) : null}

        <div className="flex gap-3 border-t border-border pt-5">
          <Button type="submit" className="rounded-lg" disabled={pending}>
            {pending ? "Saving…" : isEdit ? "Save changes" : "Add team"}
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
