import "server-only"
import crypto from "crypto"
import { cookies } from "next/headers"

export const ADMIN_COOKIE = "__adm_s"
export const SESSION_MAX_AGE = 8 * 60 * 60 // 8 hours in seconds

function secret(): Buffer {
  const s = process.env.ADMIN_SESSION_SECRET
  if (!s) throw new Error("ADMIN_SESSION_SECRET is not set")
  return Buffer.from(s, "hex")
}

export function createSessionToken(): string {
  const ts = Date.now().toString(36)
  const nonce = crypto.randomBytes(16).toString("hex")
  const payload = `${ts}.${nonce}`
  const sig = crypto.createHmac("sha256", secret()).update(payload).digest("hex")
  return `${payload}.${sig}`
}

export function verifySessionToken(token: string): boolean {
  try {
    const dotCount = (token.match(/\./g) ?? []).length
    if (dotCount !== 2) return false

    const lastDot = token.lastIndexOf(".")
    const payload = token.slice(0, lastDot)
    const providedSig = token.slice(lastDot + 1)

    const expectedSig = crypto
      .createHmac("sha256", secret())
      .update(payload)
      .digest("hex")

    // Constant-time comparison (both are 64-char hex → 32 bytes)
    if (providedSig.length !== expectedSig.length) return false
    const a = Buffer.from(providedSig, "hex")
    const b = Buffer.from(expectedSig, "hex")
    if (a.length !== b.length) return false
    if (!crypto.timingSafeEqual(a, b)) return false

    // Check expiry
    const tsPart = payload.split(".")[0]
    const ts = parseInt(tsPart, 36)
    if (isNaN(ts)) return false
    if (Date.now() - ts > SESSION_MAX_AGE * 1000) return false

    return true
  } catch {
    return false
  }
}

export async function getAdminSession(): Promise<boolean> {
  try {
    const store = await cookies()
    const token = store.get(ADMIN_COOKIE)?.value
    if (!token) return false
    return verifySessionToken(token)
  } catch {
    return false
  }
}
