"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { RefreshCw, Square } from "lucide-react"
import { triggerSourceCheck } from "@/app/admin/import-actions"

type Totals = {
  completed: number
  imported: number
  unchanged: number
  skipped: number
  failed: number
}

const EMPTY_TOTALS: Totals = {
  completed: 0,
  imported: 0,
  unchanged: 0,
  skipped: 0,
  failed: 0,
}

export function BulkSourceCheckButton({ sourceIds }: { sourceIds: string[] }) {
  const router = useRouter()
  const [running, setRunning] = useState(false)
  const [stopRequested, setStopRequested] = useState(false)
  const [totals, setTotals] = useState<Totals>(EMPTY_TOTALS)
  const [current, setCurrent] = useState(0)
  const stopRef = useRef(false)

  async function runAll() {
    setRunning(true)
    setStopRequested(false)
    stopRef.current = false
    setTotals(EMPTY_TOTALS)
    setCurrent(0)
    for (let index = 0; index < sourceIds.length; index++) {
      if (stopRef.current) break
      setCurrent(index + 1)
      const formData = new FormData()
      formData.set("id", sourceIds[index])
      const result = await triggerSourceCheck(null, formData)
      setTotals((previous) => {
        const message = (result?.success ?? result?.error ?? "").toLowerCase()
        return {
          completed: previous.completed + 1,
          imported: previous.imported + (message.includes("imported") ? 1 : 0),
          unchanged:
            previous.unchanged +
            (message.includes("no changes") || message.includes("no tryout") ? 1 : 0),
          skipped:
            previous.skipped +
            (message.includes("recently") || message.includes("inactive") ? 1 : 0),
          failed: previous.failed + (result?.error ? 1 : 0),
        }
      })
    }

    setRunning(false)
    router.refresh()
  }

  const eligible = sourceIds.length
  return (
    <div className="rounded-2xl border border-primary/20 bg-accent/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Bulk source crawler</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Checks active sources one at a time. Results go only to Import Review.
          </p>
        </div>
        {running ? (
          <button
            type="button"
            onClick={() => {
              stopRef.current = true
              setStopRequested(true)
            }}
            disabled={stopRequested}
            className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold disabled:opacity-50"
          >
            <Square className="size-4" />
            {stopRequested ? "Stopping…" : "Stop after current"}
          </button>
        ) : (
          <button
            type="button"
            onClick={runAll}
            disabled={eligible === 0}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            <RefreshCw className="size-4" />
            Check all sources
          </button>
        )}
      </div>

      {(running || totals.completed > 0) && (
        <div className="mt-4">
          <div className="h-2 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${eligible ? (totals.completed / eligible) * 100 : 0}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {running ? `Checking ${current} of ${eligible}` : `Completed ${totals.completed} of ${eligible}`}
            {" · "}Imported {totals.imported}
            {" · "}No changes {totals.unchanged}
            {" · "}Skipped {totals.skipped}
            {" · "}Failed {totals.failed}
          </p>
        </div>
      )}
    </div>
  )
}
