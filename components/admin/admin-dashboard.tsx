"use client"

import { useState } from "react"
import { Building2, Users, ClipboardList, Globe, Inbox, LogOut, AlertTriangle, Radar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { OrganizationsPanel } from "@/components/admin/organizations-panel"
import { TeamsPanel } from "@/components/admin/teams-panel"
import { TryoutsPanel } from "@/components/admin/tryouts-panel"
import { SourcesPanel } from "@/components/admin/sources-panel"
import { ImportReviewPanel } from "@/components/admin/import-review-panel"
import { OrganizationDiscoveryPanel } from "@/components/admin/organization-discovery-panel"
import { logout } from "@/app/admin/actions"
import type { TryoutFull } from "@/lib/supabase/tryouts"
import type { Organization } from "@/lib/supabase/organizations"
import type { Team } from "@/lib/supabase/teams"
import type { SourcePage, ImportItem, OrganizationImportItem } from "@/lib/supabase/import"
import type { DuplicateCandidate } from "@/components/admin/import-review-card"

type Tab = "organizations" | "discovery" | "teams" | "tryouts" | "sources" | "review"

const TABS: { id: Tab; label: string; icon: typeof Building2 }[] = [
  { id: "organizations", label: "Organizations", icon: Building2 },
  { id: "discovery", label: "Discovery", icon: Radar },
  { id: "teams", label: "Teams", icon: Users },
  { id: "tryouts", label: "Tryouts", icon: ClipboardList },
  { id: "sources", label: "Sources", icon: Globe },
  { id: "review", label: "Import Review", icon: Inbox },
]

export function AdminDashboard({
  tryouts,
  organizations,
  teams,
  sources,
  importQueue,
  organizationImportQueue,
  duplicatesByItem,
  relationsUnavailable = false,
}: {
  tryouts: TryoutFull[]
  organizations: Organization[]
  teams: Team[]
  sources: SourcePage[]
  importQueue: ImportItem[]
  organizationImportQueue: OrganizationImportItem[]
  duplicatesByItem: Record<string, DuplicateCandidate[]>
  relationsUnavailable?: boolean
}) {
  const [tab, setTab] = useState<Tab>("organizations")
  const pendingCount = importQueue.length

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

      {relationsUnavailable ? (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
          <div className="text-sm">
            <p className="font-semibold text-foreground">
              Organizations &amp; Teams tables aren&apos;t accessible yet
            </p>
            <p className="mt-1 text-muted-foreground">
              The database is refusing reads/writes to these tables (missing
              grants). Run{" "}
              <code className="rounded bg-secondary px-1.5 py-0.5 text-xs">
                scripts/grant-organizations-teams.sql
              </code>{" "}
              in the Supabase SQL editor to enable organization and team
              management. Tryouts continue to work in the meantime.
            </p>
          </div>
        </div>
      ) : null}

      <div
        role="tablist"
        aria-label="Admin sections"
        className="mt-8 flex gap-1 overflow-x-auto rounded-xl border border-border bg-secondary/50 p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:overflow-visible"
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
              className={`flex flex-shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors sm:flex-1 sm:flex-shrink ${
                active
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="size-4 shrink-0" />
              {label}
              {id === "review" && pendingCount > 0 ? (
                <span className="ml-1 flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground">
                  {pendingCount}
                </span>
              ) : null}
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
        {tab === "discovery" ? (
          <OrganizationDiscoveryPanel items={organizationImportQueue} />
        ) : null}
        {tab === "tryouts" ? (
          <TryoutsPanel
            tryouts={tryouts}
            organizations={organizations}
            teams={teams}
          />
        ) : null}
        {tab === "sources" ? (
          <SourcesPanel sources={sources} organizations={organizations} />
        ) : null}
        {tab === "review" ? (
          <ImportReviewPanel
            items={importQueue}
            duplicatesByItem={duplicatesByItem}
          />
        ) : null}
      </div>
    </div>
  )
}
