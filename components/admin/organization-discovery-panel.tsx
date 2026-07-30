"use client"

import { useActionState, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ExternalLink, Search, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  discoverOrganizations,
  approveOrganizationImport,
  bulkApproveOrganizationImports,
  rejectOrganizationImport,
  type ActionState,
} from "@/app/admin/import-actions"
import type { OrganizationImportItem } from "@/lib/supabase/import"

export function OrganizationDiscoveryPanel({
  items,
}: {
  items: OrganizationImportItem[]
}) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [state, action, pending] = useActionState<ActionState, FormData>(
    discoverOrganizations,
    null,
  )
  const [bulkState, bulkAction, bulkApproving] = useActionState<ActionState, FormData>(
    bulkApproveOrganizationImports,
    null,
  )
  useEffect(() => {
    if (state?.success) router.refresh()
  }, [state, router])
  useEffect(() => {
    if (bulkState?.success || bulkState?.error) {
      setSelectedIds(new Set())
      router.refresh()
    }
  }, [bulkState, router])

  const allSelected = items.length > 0 && selectedIds.size === items.length
  function toggleAll() {
    setSelectedIds(allSelected ? new Set() : new Set(items.map((item) => item.id)))
  }
  function toggleItem(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-6">
      <form action={action} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="font-display text-xl font-bold">Organization discovery</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Paste an official league or governing-body member directory. The system extracts every
          organization and official website, removes known duplicates, and sends new records here.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_180px]">
          <input
            name="sourceUrl"
            type="url"
            required
            placeholder="https://official-directory.ca/members"
            className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
          />
          <input
            name="sourceName"
            placeholder="League / branch"
            className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
          />
          <input type="hidden" name="province" value="Ontario" />
        </div>
        {state ? (
          <p className={`mt-3 rounded-lg px-3 py-2 text-sm ${
            state.error ? "bg-destructive/10 text-destructive" : "bg-accent text-primary"
          }`}>
            {state.error ?? state.success}
          </p>
        ) : null}
        <Button type="submit" disabled={pending} className="mt-4 rounded-lg">
          <Search className="size-4" />
          {pending ? "Scanning directory..." : "Scan directory"}
        </Button>
      </form>

      <div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h3 className="font-display text-lg font-bold">Ready for review</h3>
            <p className="text-sm text-muted-foreground">
              {items.length} new organization{items.length === 1 ? "" : "s"} found.
            </p>
          </div>
          {items.length > 0 ? (
            <form action={bulkAction} className="flex flex-wrap items-center gap-3">
              {[...selectedIds].map((id) => (
                <input key={id} type="hidden" name="selectedId" value={id} />
              ))}
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="size-4 rounded border-border accent-primary"
                />
                Select all
              </label>
              <Button
                type="submit"
                disabled={selectedIds.size === 0 || bulkApproving}
                className="rounded-lg"
              >
                <Check className="size-4" />
                {bulkApproving ? "Approving..." : `Approve selected (${selectedIds.size})`}
              </Button>
            </form>
          ) : null}
        </div>
        {bulkState ? (
          <p className={`mt-3 rounded-lg px-3 py-2 text-sm ${
            bulkState.error ? "bg-destructive/10 text-destructive" : "bg-accent text-primary"
          }`}>
            {bulkState.error ?? bulkState.success}
          </p>
        ) : null}
        <div className="mt-4 space-y-3">
          {items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              Scan an official directory to populate this queue.
            </div>
          ) : items.map((item) => (
            <OrganizationImportRow
              key={item.id}
              item={item}
              selected={selectedIds.has(item.id)}
              onToggle={() => toggleItem(item.id)}
              bulkApproving={bulkApproving}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function OrganizationImportRow({
  item,
  selected,
  onToggle,
  bulkApproving,
}: {
  item: OrganizationImportItem
  selected: boolean
  onToggle: () => void
  bulkApproving: boolean
}) {
  const router = useRouter()
  const [approveState, approveAction, approving] = useActionState<ActionState, FormData>(
    approveOrganizationImport,
    null,
  )
  const [rejectState, rejectAction, rejecting] = useActionState<ActionState, FormData>(
    rejectOrganizationImport,
    null,
  )
  useEffect(() => {
    if (approveState?.success || rejectState?.success) router.refresh()
  }, [approveState, rejectState, router])

  const confidence = Math.round(item.confidenceScore * 100)
  return (
    <div className={`rounded-2xl border bg-card p-4 shadow-sm ${
      selected ? "border-primary ring-1 ring-primary/20" : "border-border"
    }`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 gap-3">
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggle}
            aria-label={`Select ${item.organizationName}`}
            className="mt-1 size-4 shrink-0 rounded border-border accent-primary"
          />
          <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-semibold">{item.organizationName}</h4>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold">
              {confidence}% confidence
            </span>
            {item.leagueOrBranch ? (
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">
                {item.leagueOrBranch}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {[item.city, item.province].filter(Boolean).join(", ") || "Location not found"}
          </p>
          {item.website ? (
            <a href={item.website} target="_blank" rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline">
              {item.website}<ExternalLink className="size-3" />
            </a>
          ) : (
            <p className="mt-2 text-xs text-amber-700">Official website needs confirmation</p>
          )}
          </div>
        </div>
        <div className="flex gap-2">
          <form action={approveAction}>
            <input type="hidden" name="id" value={item.id} />
            <Button type="submit" disabled={approving || rejecting || bulkApproving} className="rounded-lg">
              <Check className="size-4" />Approve
            </Button>
          </form>
          <form action={rejectAction}>
            <input type="hidden" name="id" value={item.id} />
            <Button type="submit" variant="outline" disabled={approving || rejecting || bulkApproving} className="rounded-lg">
              <X className="size-4" />Reject
            </Button>
          </form>
        </div>
      </div>
      {approveState?.error || rejectState?.error ? (
        <p className="mt-3 text-sm text-destructive">{approveState?.error ?? rejectState?.error}</p>
      ) : null}
    </div>
  )
}
