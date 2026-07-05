"use client"

import { useActionState } from "react"
import { Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { login, type ActionState } from "@/app/admin/actions"

export function AdminLogin() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    login,
    null,
  )

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="flex size-12 items-center justify-center rounded-full bg-accent text-primary">
          <Lock className="size-6" />
        </div>
        <h1 className="mt-5 font-display text-2xl font-bold text-foreground">
          Admin sign in
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter the admin password to manage tryouts.
        </p>

        <form action={formAction} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none ring-ring/50 focus-visible:ring-2"
            />
          </div>

          {state?.error ? (
            <p className="text-sm font-medium text-destructive">{state.error}</p>
          ) : null}

          <Button type="submit" className="w-full rounded-lg" disabled={pending}>
            {pending ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  )
}
