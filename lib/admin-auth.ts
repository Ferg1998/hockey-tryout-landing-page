import "server-only"
import { createHash } from "crypto"
import { cookies } from "next/headers"

export const ADMIN_COOKIE = "ht_admin_session"

const adminPassword = process.env.ADMIN_PASSWORD

export const isAdminPasswordSet =
  typeof adminPassword === "string" && adminPassword.length > 0

/**
 * Derives a non-reversible session token from the admin password. Storing this
 * (rather than the plaintext password) in the cookie means the value can be
 * verified server-side but cannot be forged without knowing the password.
 */
export function sessionToken(): string {
  return createHash("sha256")
    .update(`ht-admin::${adminPassword ?? ""}`)
    .digest("hex")
}

/** Constant-time-ish check that the provided password matches ADMIN_PASSWORD. */
export function isValidPassword(candidate: string): boolean {
  if (!isAdminPasswordSet) return false
  const a = createHash("sha256").update(candidate).digest("hex")
  const b = createHash("sha256").update(adminPassword as string).digest("hex")
  return a === b
}

/** Whether the current request carries a valid admin session cookie. */
export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies()
  const token = store.get(ADMIN_COOKIE)?.value
  return Boolean(token) && token === sessionToken()
}
