import type { Metadata } from "next"
import { AdminLogin } from "@/components/admin/admin-login"
import { AdminDashboard } from "@/components/admin/admin-dashboard"
import { isAuthenticated, isAdminPasswordSet } from "@/lib/admin-auth"
import { getSupabaseAdminClient, isAdminConfigured } from "@/lib/supabase/admin"
import { mapFullRow, type TryoutFull } from "@/lib/supabase/tryouts"
import { mapOrganization, type Organization, type OrganizationRow } from "@/lib/supabase/organizations"
import { mapTeam, type Team, type TeamRow } from "@/lib/supabase/teams"
import {
  fetchSourcePages,
  fetchImportQueue,
  fetchOrganizationImportQueue,
  type ImportItem,
} from "@/lib/supabase/import"
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

// The Organizations/Teams tables can return a Postgres "permission denied"
// (42501) or "does not exist" (42P01) error when their grants/migration have
// not been applied to the Supabase API roles yet. In that case we return an
// empty list AND signal it, so the dashboard renders a setup notice instead of
// crashing the entire admin route.
function isTableAccessBlocked(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false
  const msg = error.message ?? ""
  return (
    error.code === "42501" ||
    error.code === "42P01" ||
    /permission denied/i.test(msg) ||
    /does not exist/i.test(msg)
  )
}

async function loadOrganizations(): Promise<{ data: Organization[]; blocked: boolean }> {
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from("Organizations")
    .select("*")
    .order("organization_name", { ascending: true })

  if (error) {
    if (isTableAccessBlocked(error)) return { data: [], blocked: true }
    throw new Error(error.message)
  }
  return {
    data: (data ?? []).map((row) => mapOrganization(row as OrganizationRow)),
    blocked: false,
  }
}

async function loadTeams(): Promise<{ data: Team[]; blocked: boolean }> {
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from("Teams")
    .select("*")
    .order("team_name", { ascending: true })

  if (error) {
    if (isTableAccessBlocked(error)) return { data: [], blocked: true }
    throw new Error(error.message)
  }
  return {
    data: (data ?? []).map((row) => mapTeam(row as TeamRow)),
    blocked: false,
  }
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
        // Compare a candidate field only when both sides are meaningful. An
        // empty string is a substring of everything, so without this guard any
        // tryout with a blank team/org would match every import.
        const overlaps = (a: string, b: string) =>
          a.length > 2 && b.length > 2 && (a.includes(b) || b.includes(a))
        return names.some((n) => overlaps(n, team) || overlaps(n, org))
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

  const [tryouts, orgResult, teamResult, sources, queue, organizationImportQueue] = await Promise.all([
    loadTryouts(),
    loadOrganizations(),
    loadTeams(),
    fetchSourcePages(),
    fetchImportQueue(),
    fetchOrganizationImportQueue(),
  ])

  const organizations = orgResult.data
  const teams = teamResult.data
  // Grants/migration not applied yet -> relational management is unavailable.
  const relationsUnavailable = orgResult.blocked || teamResult.blocked

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
        organizationImportQueue={organizationImportQueue}
        duplicatesByItem={duplicatesByItem}
        relationsUnavailable={relationsUnavailable}
      />
    </main>
  )
}
