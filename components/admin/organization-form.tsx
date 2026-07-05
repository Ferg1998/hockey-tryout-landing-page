"use client"

import { useActionState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  createOrganization,
  updateOrganization,
  type ActionState,
} from "@/app/admin/actions"
import type { Organization } from "@/lib/supabase/organizations"
import {
  Field,
  SelectField,
  TextAreaField,
  CheckboxField,
  SectionHeading,
  PROVINCE_OPTIONS,
} from "@/components/admin/form-fields"

export function OrganizationForm({
  organization,
  onDone,
}: {
  organization: Organization | null // null = create new
  onDone: () => void
}) {
  const router = useRouter()
  const isEdit = Boolean(organization)
  const action = isEdit ? updateOrganization : createOrganization
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
          {isEdit ? "Edit organization" : "Add organization"}
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
        {isEdit ? (
          <input type="hidden" name="id" value={organization!.id} />
        ) : null}

        <div className="space-y-4">
          <SectionHeading>Identity</SectionHeading>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Organization name"
              name="organizationName"
              required
              placeholder="Toronto Marlboros"
              defaultValue={organization?.name}
            />
            <Field
              label="Website"
              name="website"
              type="url"
              placeholder="https://…"
              defaultValue={organization?.website}
            />
            <Field
              label="Logo (URL or path)"
              name="logo"
              placeholder="/images/logo.png"
              defaultValue={organization?.logo}
            />
            <Field
              label="Banner image (URL or path)"
              name="bannerImage"
              placeholder="/images/banner.png"
              defaultValue={organization?.bannerImage}
            />
          </div>
        </div>

        <div className="space-y-4">
          <SectionHeading>Location</SectionHeading>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="City" name="city" defaultValue={organization?.city} />
            <SelectField
              label="Province"
              name="province"
              options={PROVINCE_OPTIONS}
              placeholder="Select province"
              defaultValue={organization?.province}
            />
            <Field
              label="Address"
              name="address"
              placeholder="400 Kipling Ave"
              defaultValue={organization?.address}
            />
            <Field
              label="Google Maps link"
              name="googleMapsLink"
              type="url"
              placeholder="https://maps.google.com/…"
              defaultValue={organization?.googleMapsLink}
            />
          </div>
        </div>

        <div className="space-y-4">
          <SectionHeading>Contact</SectionHeading>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Email"
              name="email"
              type="email"
              defaultValue={organization?.email}
            />
            <Field
              label="Phone"
              name="phone"
              type="tel"
              defaultValue={organization?.phone}
            />
          </div>
        </div>

        <div className="space-y-4">
          <SectionHeading>Details</SectionHeading>
          <TextAreaField
            label="Description"
            name="description"
            rows={4}
            placeholder="About the organization, its history, and programs."
            defaultValue={organization?.description}
          />
          <CheckboxField
            label="Verified organization"
            name="verified"
            hint="Show a verified badge on the organization's public page"
            defaultChecked={organization?.verified}
          />
        </div>

        {state?.error ? (
          <p className="text-sm font-medium text-destructive">{state.error}</p>
        ) : null}

        <div className="flex gap-3 border-t border-border pt-5">
          <Button type="submit" className="rounded-lg" disabled={pending}>
            {pending ? "Saving…" : isEdit ? "Save changes" : "Add organization"}
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
