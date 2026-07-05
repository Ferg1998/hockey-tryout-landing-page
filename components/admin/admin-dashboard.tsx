"use client"

import { useState } from "react"
import { Building2, Users, ClipboardList, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { OrganizationsPanel } from "@/components/admin/organizations-panel"
import { TeamsPanel } from "@/components/admin/teams-panel"
import { TryoutsPanel } from "@/components/admin/tryouts-panel"
import { logout } from "@/app/admin/actions"
import type { TryoutFull } from "@/lib/supabase/tryouts"
import type { Organization } from "@/lib/supabase/organizations"
import type { Team } from "@/lib/supabase/teams"

type Tab = "organizations" | "teams" | "tryouts"

const TABS: { id: Tab; label: string; icon: typeof Building2 }[] = [
  { id: "organizations", label: "Organizations", icon: Building2 },
  { id: "teams", label: "Teams", icon: Users },
  { id: "tryouts", label: "Tryouts", icon: ClipboardList },
]

export function AdminDashboard({
  tryouts,
  organizations,
  teams,
}: {
  tryouts: TryoutFull[]
  organizations: Organization[]
  teams: Team[]
}) {
  const [tab, setTab] = useState<Tab>("organizations")

  // Team counts per organization for the organizations list.
  const teamCounts = teams.reduce<Record<string, number>>((acc, t) => {
    if (t.organizationId) acc[t.organizationId] = (acc[t.organizationId] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            Admin
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold text-foreground">
            Content management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage organizations, teams, and tryouts for HockeyTryouts.ca.
          </p>
        </div>
        <form action={logout}>
          <Button type="submit" variant="outline" className="rounded-lg">
            <LogOut className="size-4" />
            Sign out
          </Button>
        </form>
      </div>

      <div
        role="tablist"
        aria-label="Admin sections"
        className="mt-8 flex flex-wrap gap-1 rounded-xl border border-border bg-secondary/50 p-1"
      >
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id
          return (
            <button
              key={id}
              role="tab"
              aria-selected={active}
              type="button"
              onClick={() => setTab(id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                active
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="size-4" />
              {label}
            </button>
          )
        })}
      </div>

      <div className="mt-8">
        {tab === "organizations" ? (
          <OrganizationsPanel
            organizations={organizations}
            teamCounts={teamCounts}
          />
        ) : null}
        {tab === "teams" ? (
          <TeamsPanel teams={teams} organizations={organizations} />
        ) : null}
        {tab === "tryouts" ? (
          <TryoutsPanel
            tryouts={tryouts}
            organizations={organizations}
            teams={teams}
          />
        ) : null}
      </div>
    </div>
  )
}
