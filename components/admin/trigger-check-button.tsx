"use client"

import { useActionState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { RefreshCw } from "lucide-react"
import { triggerSourceCheck, type ActionState } from "@/app/admin/import-actions"

export function TriggerCheckButton({
  id,
  onResult,
}: {
  id: string
  onResult?: (state: ActionState) => void
}) {
  const router = useRouter()
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    triggerSourceCheck,
    null,
  )

  useEffect(() => {
    if (state) {
      onResult?.(state)
      router.refresh()
    }
  }, [state, onResult, router])

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending}
        className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:bg-accent hover:text-primary disabled:opacity-50"
      >
        <RefreshCw className={`size-4 ${pending ? "animate-spin" : ""}`} />
        {pending ? "Checking..." : "Check now"}
      </button>
    </form>
  )
}
