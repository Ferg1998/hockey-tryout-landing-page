import type { Metadata } from "next"
import { AdminLogin } from "@/components/admin/admin-login"
import { AdminDashboard } from "@/components/admin/admin-dashboard"
import { isAuthenticated, isAdminPasswordSet } from "@/lib/admin-auth"
import { getSupabaseAdminClient, isAdminConfigured } from "@/lib/supabase/admin"
import { mapFullRow, type TryoutFull } from "@/lib/supabase/tryouts"

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

  const tryouts = await loadTryouts()

  return (
    <main className="min-h-screen bg-background">
      <AdminDashboard tryouts={tryouts} />
    </main>
  )
}
