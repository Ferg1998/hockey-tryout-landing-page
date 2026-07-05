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

const STATUSES = ["Open", "Closing Soon", "Waitlist", "Closed"] as const

function parseTryoutForm(formData: FormData) {
  const get = (k: string) => String(formData.get(k) ?? "").trim()

  const team = get("team")
  const city = get("city")
  const province = get("province")
  const level = get("level")
  const dates = get("dates")

  if (!team || !city || !province || !level || !dates) {
    throw new Error("Team, city, province, level, and dates are required.")
  }

  const statusRaw = get("status")
  const status = (STATUSES as readonly string[]).includes(statusRaw)
    ? statusRaw
    : "Open"

  return {
    team,
    city,
    province,
    birth_year: get("birthYear"),
    age_group: get("ageGroup"),
    level,
    dates,
    arena: get("arena") || null,
    cost: get("cost") || null,
    status,
    registration_link: get("registrationLink") || null,
    image: get("image") || null,
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
