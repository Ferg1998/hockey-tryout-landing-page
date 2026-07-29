"use client"

import { useActionState, useEffect } from "react"
import { Trash2 } from "lucide-react"
import type { ActionState } from "@/app/admin/actions"

type DeleteAction = (
  prev: ActionState,
  formData: FormData,
) => Promise<ActionState>

export function DeleteButton({
  id,
  label,
  action,
  onDeleted,
}: {
  id: string
  label: string
  action: DeleteAction
  onDeleted: () => void
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    action,
    null,
  )

  useEffect(() => {
    if (state?.success) onDeleted()
  }, [state, onDeleted])

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm(`Delete "${label}"? This cannot be undone.`)) {
          e.preventDefault()
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending}
        aria-label={`Delete ${label}`}
        className="flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
      >
        <Trash2 className="size-4" />
      </button>
    </form>
  )
}
