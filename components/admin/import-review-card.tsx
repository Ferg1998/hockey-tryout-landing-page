"use client"

import { useActionState, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ExternalLink,
  CircleAlert,
  CheckCircle2,
  XCircle,
  Copy,
  ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Field, TextAreaField } from "@/components/admin/form-fields"
import {
  approveImportItem,
  updateImportItem,
  rejectImportItem,
  markImportDuplicate,
  type ActionState,
} from "@/app/admin/import-actions"
import type { ImportItem } from "@/lib/supabase/import"

export type DuplicateCandidate = {
  id: string
  team: string
  dates?: string
  location?: string
}

const REQUIRED_HINTS = ["teamName", "tryoutDates"] as const

export function ImportReviewCard({
  item,
  duplicates,
}: {
  item: ImportItem
  duplicates: DuplicateCandidate[]
}) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const [dupTarget, setDupTarget] = useState("")

  const [approveState, approveAction, approving] = useActionState<
    ActionState,
    FormData
  >(approveImportItem, null)
  const [rejectState, rejectAction, rejecting] = useActionState<
    ActionState,
    FormData
  >(rejectImportItem, null)
  const [dupState, dupAction, markingDup] = useActionState<ActionState, FormData>(
    markImportDuplicate,
    null,
  )

  useEffect(() => {
    if (approveState?.success || rejectState?.success || dupState?.success) {
      router.refresh()
    }
  }, [approveState, rejectState, dupState, router])

  const confidence = item.confidenceScore ?? 0
  const confidencePct = Math.round(confidence * 100)
  const lowConfidence = confidence < 0.6
  const missing = REQUIRED_HINTS.filter((k) => !item[k])
  const error = approveState?.error ?? rejectState?.error ?? dupState?.error

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-base font-bold text-foreground">
              {item.teamName || item.organizationName || "Untitled tryout"}
            </h3>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                lowConfidence
                  ? "bg-destructive/10 text-destructive"
                  : "bg-accent text-primary"
              }`}
            >
              {confidencePct}% confidence
            </span>
            {item.status === "needs_information" ? (
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                Needs information
              </span>
            ) : null}
          </div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
            {item.organizationName ? <span>{item.organizationName}</span> : null}
            {item.level ? <span>{item.level}</span> : null}
            {item.ageGroup ? <span>{item.ageGroup}</span> : null}
            {item.tryoutDates ? <span>{item.tryoutDates}</span> : null}
          </div>
          {item.sourceUrl ? (
            <a
              href={item.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 break-all text-sm font-medium text-primary hover:underline"
            >
              View original source
              <ExternalLink className="size-3.5 shrink-0" />
            </a>
          ) : null}
        </div>
      </div>

      {(lowConfidence || missing.length > 0) && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
          <CircleAlert className="size-3.5 shrink-0 text-destructive" />
          {lowConfidence ? <span>Low extraction confidence. Review carefully.</span> : null}
          {missing.length > 0 ? (
            <span>
              Missing: {missing.map((m) => humanize(m)).join(", ")}.
            </span>
          ) : null}
        </div>
      )}

      {duplicates.length > 0 && (
        <div className="mt-3 rounded-lg border border-border bg-secondary/40 p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <Copy className="size-3.5 text-primary" />
            Possible duplicate{duplicates.length === 1 ? "" : "s"}
          </p>
          <ul className="mt-2 space-y-1">
            {duplicates.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center gap-2 text-xs">
                <Link
                  href={`/tryouts/${d.id}`}
                  target="_blank"
                  className="font-medium text-primary hover:underline"
                >
                  {d.team}
                </Link>
                {d.location ? <span className="text-muted-foreground">{d.location}</span> : null}
                {d.dates ? <span className="text-muted-foreground">{d.dates}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-primary"
        aria-expanded={expanded}
      >
        <ChevronDown
          className={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`}
        />
        {expanded ? "Hide details" : "Edit extracted information"}
      </button>

      {/* Edit + approve form. Approve persists edits then publishes. */}
      <form action={approveAction} className={expanded ? "mt-4" : "hidden"}>
        <input type="hidden" name="id" value={item.id} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Organization name" name="organizationName" defaultValue={item.organizationName} />
          <Field label="Team name" name="teamName" defaultValue={item.teamName} />
          <Field label="Age group" name="ageGroup" defaultValue={item.ageGroup} />
          <Field label="Birth year" name="birthYear" defaultValue={item.birthYear} />
          <Field label="Level" name="level" defaultValue={item.level} />
          <Field label="Season" name="season" defaultValue={item.season} />
          <Field label="Tryout dates" name="tryoutDates" defaultValue={item.tryoutDates} />
          <Field label="Registration deadline" name="registrationDeadline" defaultValue={item.registrationDeadline} />
          <Field label="Cost" name="cost" defaultValue={item.cost} />
          <Field label="Registration link" name="registrationLink" type="url" defaultValue={item.registrationLink} />
          <Field label="Arena" name="arena" defaultValue={item.arena} />
          <Field label="Address" name="address" defaultValue={item.address} />
          <Field label="Google Maps link" name="googleMapsLink" type="url" defaultValue={item.googleMapsLink} />
          <Field label="Capacity" name="capacity" defaultValue={item.capacity} />
          <Field label="Positions needed" name="positionsNeeded" defaultValue={item.positionsNeeded} />
          <Field label="Contact information" name="contactInformation" defaultValue={item.contactInformation} />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4">
          <TextAreaField label="Equipment" name="equipment" defaultValue={item.equipment} rows={2} />
          <TextAreaField label="Description" name="description" defaultValue={item.description} rows={4} />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={approving} className="rounded-lg">
            <CheckCircle2 className="size-4" />
            {approving ? "Publishing..." : "Approve & publish"}
          </Button>
          <Button
            type="submit"
            formAction={updateImportItem}
            variant="outline"
            className="rounded-lg"
          >
            Save changes
          </Button>
        </div>
      </form>

      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-4">
        {!expanded ? (
          <form action={approveAction}>
            <input type="hidden" name="id" value={item.id} />
            <Button type="submit" disabled={approving} className="rounded-lg">
              <CheckCircle2 className="size-4" />
              {approving ? "Publishing..." : "Approve & publish"}
            </Button>
          </form>
        ) : null}

        <form action={rejectAction}>
          <input type="hidden" name="id" value={item.id} />
          <Button
            type="submit"
            variant="outline"
            disabled={rejecting}
            className="rounded-lg text-destructive hover:text-destructive"
          >
            <XCircle className="size-4" />
            {rejecting ? "Rejecting..." : "Reject"}
          </Button>
        </form>

        {duplicates.length > 0 ? (
          <form action={dupAction} className="flex items-center gap-2">
            <input type="hidden" name="id" value={item.id} />
            <select
              name="duplicateOfTryoutId"
              value={dupTarget}
              onChange={(e) => setDupTarget(e.target.value)}
              className="rounded-lg border border-input bg-background px-2 py-2 text-sm text-foreground"
              aria-label="Select duplicate tryout"
            >
              <option value="">Duplicate of...</option>
              {duplicates.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.team}
                </option>
              ))}
            </select>
            <Button
              type="submit"
              variant="outline"
              disabled={markingDup || !dupTarget}
              className="rounded-lg"
            >
              <Copy className="size-4" />
              Mark duplicate
            </Button>
          </form>
        ) : null}
      </div>

      {error ? (
        <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}

function humanize(key: string) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim()
    .toLowerCase()
}
