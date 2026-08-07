"use client"

import { useActionState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { RefreshCw, RotateCcw } from "lucide-react"
import { triggerSourceCheck, type ActionState } from "@/app/admin/import-actions"

export function TriggerCheckButton({
  id,
  force = false,
  onResult,
}: {
  id: string
  force?: boolean
  onResult?: (state: ActionState) => void
}) {
  const router = useRouter()
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    triggerSourceCheck,
    null,
  )

  // Keep the latest onResult without making it an effect dependency (parents
  // pass an inline function that changes identity every render).
  const onResultRef = useRef(onResult)
  useEffect(() => {
    onResultRef.current = onResult
  })

  // Only react once per NEW action result. useActionState returns a fresh
  // object each completion, so comparing by identity prevents an update loop.
  const handledRef = useRef<ActionState | null>(null)
  useEffect(() => {
    if (state && state !== handledRef.current) {
      handledRef.current = state
      onResultRef.current?.(state)
      router.refresh()
    }
  }, [state, router])

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={id} />
      {force ? <input type="hidden" name="force" value="true" /> : null}
      <button
        type="submit"
        disabled={pending}
        className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:bg-accent hover:text-primary disabled:opacity-50"
      >
        {force ? (
          <RotateCcw className={`size-4 ${pending ? "animate-spin" : ""}`} />
        ) : (
          <RefreshCw className={`size-4 ${pending ? "animate-spin" : ""}`} />
        )}
        {pending
          ? force
            ? "Re-importing..."
            : "Checking..."
          : force
            ? "Force re-import"
            : "Check now"}
      </button>
    </form>
  )
}
