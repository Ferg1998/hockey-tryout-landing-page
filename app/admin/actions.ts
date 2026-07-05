"use server"

import { randomUUID } from "crypto"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import {
  ADMIN_COOKIE,
  isAuthenticated,
  isValidPassword,
  sessionToken,
} from "@/lib/admin-auth"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"

export type ActionState = { error?: string; success?: string } | null

const STATUSES = ["Open", "Waitlist", "Full", "Closed"] as const

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

// Builds a human-readable display string from ISO start/end dates
// (e.g. "Apr 12–14, 2026" or "Apr 12, 2026"). Falls back to "Dates TBA".
function composeDates(start: string, end: string): string {
  if (!start) return "Dates TBA"
  const s = new Date(`${start}T00:00:00`)
  if (Number.isNaN(s.getTime())) return "Dates TBA"
  const sMonth = MONTHS[s.getMonth()]
  const sDay = s.getDate()
  const sYear = s.getFullYear()
  if (!end) return `${sMonth} ${sDay}, ${sYear}`
  const e = new Date(`${end}T00:00:00`)
  if (Number.isNaN(e.getTime())) return `${sMonth} ${sDay}, ${sYear}`
  if (s.getMonth() === e.getMonth() && sYear === e.getFullYear()) {
    return `${sMonth} ${sDay}–${e.getDate()}, ${sYear}`
  }
  const eMonth = MONTHS[e.getMonth()]
  return `${sMonth} ${sDay} – ${eMonth} ${e.getDate()}, ${e.getFullYear()}`
}

function parseTryoutForm(formData: FormData) {
  const get = (k: string) => String(formData.get(k) ?? "").trim()
  const getNum = (k: string) => {
    const v = get(k)
    if (v === "") return null
    const n = Number(v)
    return Number.isNaN(n) ? null : Math.trunc(n)
  }
  const getBool = (k: string) => formData.get(k) != null

  const team = get("team")
  const city = get("city")
  const province = get("province")
  const level = get("level")
  const startDate = get("startDate")

  if (!team || !city || !province || !level || !startDate) {
    throw new Error("Team, city, province, level, and start date are required.")
  }

  const endDate = get("endDate")

  const statusRaw = get("status")
  const status = (STATUSES as readonly string[]).includes(statusRaw)
    ? statusRaw
    : "Open"

  // Positions can arrive as multiple checkbox values under the same name.
  const positions = formData
    .getAll("positionsNeeded")
    .map((p) => String(p).trim())
    .filter(Boolean)
    .join(", ")

  return {
    team,
    organization: get("organization") || null,
    logo: get("logo") || null,
    hero_image: get("heroImage") || null,
    province,
    city,
    arena: get("arena") || null,
    arena_address: get("arenaAddress") || null,
    google_maps_link: get("googleMapsLink") || null,
    birth_year: get("birthYear"),
    age_group: get("ageGroup"),
    level,
    positions_needed: positions || null,
    start_date: startDate,
    end_date: endDate || null,
    dates: composeDates(startDate, endDate),
    times: get("times") || null,
    registration_deadline: get("registrationDeadline") || null,
    cost: get("cost") || null,
    registration_link: get("registrationLink") || null,
    website: get("website") || null,
    contact_name: get("contactName") || null,
    contact_email: get("contactEmail") || null,
    contact_phone: get("contactPhone") || null,
    description: get("description") || null,
    equipment: get("equipment") || null,
    max_players: getNum("maxPlayers"),
    current_registrations: getNum("currentRegistrations"),
    status,
    featured: getBool("featured"),
    verified: getBool("verified"),
    image: get("heroImage") || get("image") || null,
  }
}

export async function login(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const password = String(formData.get("password") ?? "")
  if (!isValidPassword(password)) {
    return { error: "Incorrect password." }
  }
  const store = await cookies()
  store.set(ADMIN_COOKIE, sessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours
  })
  return { success: "Signed in." }
}

export async function logout(): Promise<void> {
  const store = await cookies()
  store.delete(ADMIN_COOKIE)
  revalidatePath("/admin")
}

async function requireAuth() {
  if (!(await isAuthenticated())) {
    throw new Error("Not authorized.")
  }
}

export async function createTryout(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await requireAuth()
    const row = parseTryoutForm(formData)
    const id = String(formData.get("id") ?? "").trim() || randomUUID()

    const supabase = getSupabaseAdminClient()
    const { error } = await supabase.from("Tryouts").insert({ id, ...row })
    if (error) return { error: error.message }

    revalidatePath("/admin")
    revalidatePath("/")
    revalidatePath(`/tryouts/${id}`)
    return { success: `Added "${row.team}".` }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to add tryout." }
  }
}

export async function updateTryout(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await requireAuth()
    const id = String(formData.get("id") ?? "").trim()
    if (!id) return { error: "Missing tryout id." }
    const row = parseTryoutForm(formData)

    const supabase = getSupabaseAdminClient()
    const { error } = await supabase.from("Tryouts").update(row).eq("id", id)
    if (error) return { error: error.message }

    revalidatePath("/admin")
    revalidatePath("/")
    revalidatePath(`/tryouts/${id}`)
    return { success: `Updated "${row.team}".` }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update tryout." }
  }
}

export async function deleteTryout(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await requireAuth()
    const id = String(formData.get("id") ?? "").trim()
    if (!id) return { error: "Missing tryout id." }

    const supabase = getSupabaseAdminClient()
    const { error } = await supabase.from("Tryouts").delete().eq("id", id)
    if (error) return { error: error.message }

    revalidatePath("/admin")
    revalidatePath("/")
    return { success: "Tryout deleted." }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to delete tryout." }
  }
}
