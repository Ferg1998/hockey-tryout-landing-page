import type { Metadata } from "next"
import { AdminLogin } from "@/components/admin/admin-login"
import { AdminDashboard } from "@/components/admin/admin-dashboard"
import { isAuthenticated, isAdminPasswordSet } from "@/lib/admin-auth"
import { getSupabaseAdminClient, isAdminConfigured } from "@/lib/supabase/admin"
import { mapFullRow, type TryoutFull } from "@/lib/supabase/tryouts"
import { mapOrganization, type Organization, type OrganizationRow } from "@/lib/supabase/organizations"
import { mapTeam, type Team, type TeamRow } from "@/lib/supabase/teams"
import { fetchSourcePages, fetchImportQueue, type ImportItem } from "@/lib/supabase/import"
import type { DuplicateCandidate } from "@/components/admin/import-review-card"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Admin — HockeyTryouts.ca",
  robots: { index: false, follow: false },
}

async function loadTryouts(): Promise<TryoutFull[]> {
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from("Tryouts")
    .select("*")
    .order("dates", { ascending: true })

  if (error) throw new Error(error.message)

  return (data ?? []).map((row: Record<string, unknown>) => mapFullRow(row))
}

async function loadOrganizations(): Promise<Organization[]> {
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from("Organizations")
    .select("*")
    .order("organization_name", { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => mapOrganization(row as OrganizationRow))
}

async function loadTeams(): Promise<Team[]> {
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from("Teams")
    .select("*")
    .order("team_name", { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => mapTeam(row as TeamRow))
}

// Finds existing tryouts that likely match a pending import so admins can spot
// duplicates. Matches on normalized team/organization name overlap.
function computeDuplicates(
  items: ImportItem[],
  tryouts: TryoutFull[],
): Record<string, DuplicateCandidate[]> {
  const norm = (s?: string) =>
    (s ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()

  const result: Record<string, DuplicateCandidate[]> = {}
  for (const item of items) {
    const names = [norm(item.teamName), norm(item.organizationName)].filter(Boolean)
    if (names.length === 0) continue

    const matches = tryouts
      .filter((t) => {
        const team = norm(t.team)
        const org = norm(t.organization)
        return names.some(
          (n) =>
            n.length > 2 &&
            (team.includes(n) || n.includes(team) || org.includes(n) || n.includes(org)),
        )
      })
      .slice(0, 4)
      .map<DuplicateCandidate>((t) => ({
        id: t.id,
        team: t.team,
        dates: t.dates,
        location: [t.city, t.province].filter(Boolean).join(", ") || undefined,
      }))

    if (matches.length > 0) result[item.id] = matches
  }
  return result
}

function SetupNotice() {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="font-display text-2xl font-bold text-foreground">
        Admin not configured
      </h1>
      <p className="mt-3 text-pretty text-sm leading-relaxed text-muted-foreground">
        Set the <code className="rounded bg-secondary px-1.5 py-0.5">SUPABASE_SERVICE_ROLE_KEY</code>{" "}
        and <code className="rounded bg-secondary px-1.5 py-0.5">ADMIN_PASSWORD</code>{" "}
        environment variables in your project settings to enable the admin
        dashboard.
      </p>
    </div>
  )
}

export default async function AdminPage() {
  if (!isAdminConfigured || !isAdminPasswordSet) {
    return (
      <main className="min-h-screen bg-background">
        <SetupNotice />
      </main>
    )
  }

  if (!(await isAuthenticated())) {
    return (
      <main className="min-h-screen bg-background">
        <AdminLogin />
      </main>
    )
  }

  const [tryouts, organizations, teams, sources, queue] = await Promise.all([
    loadTryouts(),
    loadOrganizations(),
    loadTeams(),
    fetchSourcePages(),
    fetchImportQueue(),
  ])

  // Only surface items that still need a decision.
  const importQueue = queue.filter(
    (i) => i.status === "pending_review" || i.status === "needs_information",
  )
  const duplicatesByItem = computeDuplicates(importQueue, tryouts)

  return (
    <main className="min-h-screen bg-background">
      <AdminDashboard
        tryouts={tryouts}
        organizations={organizations}
        teams={teams}
        sources={sources}
        importQueue={importQueue}
        duplicatesByItem={duplicatesByItem}
      />
    </main>
  )
}
