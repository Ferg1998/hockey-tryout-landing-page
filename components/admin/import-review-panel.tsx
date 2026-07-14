"use client"

import { Inbox } from "lucide-react"
import {
  ImportReviewCard,
  type DuplicateCandidate,
} from "@/components/admin/import-review-card"
import type { ImportItem } from "@/lib/supabase/import"

export function ImportReviewPanel({
  items,
  duplicatesByItem,
}: {
  items: ImportItem[]
  duplicatesByItem: Record<string, DuplicateCandidate[]>
}) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">
        {items.length} item{items.length === 1 ? "" : "s"} awaiting review. Nothing is
        published until you approve it.
      </p>

      <div className="mt-6 space-y-4">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-secondary/40 p-10 text-center">
            <Inbox className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">
              The review queue is empty. Trigger a source check to import tryouts.
            </p>
          </div>
        ) : (
          items.map((item) => (
            <ImportReviewCard
              key={item.id}
              item={item}
              duplicates={duplicatesByItem[item.id] ?? []}
            />
          ))
        )}
      </div>
    </div>
  )
}
