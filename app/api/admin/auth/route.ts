import { NextResponse } from "next/server"
import crypto from "crypto"
import {
  createSessionToken,
  ADMIN_COOKIE,
  SESSION_MAX_AGE,
} from "@/lib/admin-session"

// In-memory rate limiter — resets on cold start, fine for a single-admin panel
const attempts = new Map<string, { count: number; until: number }>()
const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 15 * 60 * 1000 // 15 min

function getIP(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "127.0.0.1"
  )
}

export async function POST(req: Request) {
  const ip = getIP(req)
  const now = Date.now()

  const record = attempts.get(ip)
  if (record) {
    if (now < record.until && record.count >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { error: "Too many failed attempts. Try again in 15 minutes." },
        { status: 429 }
      )
    }
    if (now >= record.until) attempts.delete(ip)
  }

  const body = await req.json().catch(() => ({}))
  const { username, password } = body as Record<string, unknown>

  const envUser = process.env.ADMIN_USERNAME ?? ""
  const envPass = process.env.ADMIN_PASSWORD ?? ""

  // Constant-time comparison — prevents timing oracle attacks
  function safeEq(a: string, b: string): boolean {
    const ab = Buffer.from(a.padEnd(256, "\0"))
    const bb = Buffer.from(b.padEnd(256, "\0"))
    return crypto.timingSafeEqual(ab, bb) && a.length === b.length
  }

  const ok =
    typeof username === "string" &&
    typeof password === "string" &&
    safeEq(username, envUser) &&
    safeEq(password, envPass)

  if (!ok) {
    const cur = attempts.get(ip) ?? { count: 0, until: now + LOCKOUT_MS }
    cur.count++
    attempts.set(ip, cur)
    // Deliberate delay to slow brute-force even further
    await new Promise((r) => setTimeout(r, 600))
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 })
  }

  attempts.delete(ip)
  const token = createSessionToken()
  const res = NextResponse.json({ ok: true })
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  })
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete(ADMIN_COOKIE)
  return res
}
