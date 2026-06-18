import { NextResponse } from "next/server"
import { getAdminSession } from "@/lib/admin-session"
import { adminDb, adminAuth } from "@/lib/firebase-admin"
import { getCache, setCache, CACHE_KEYS } from "@/lib/admin-cache"

const TTL = 30_000 // 30 s

export async function GET() {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const cached = getCache<object>(CACHE_KEYS.users)
  if (cached) return NextResponse.json(cached)

  try {
    const [listResult] = await Promise.all([adminAuth().listUsers(1000)])
    const authUsers = listResult.users

    if (authUsers.length === 0) {
      const payload = { users: [] }
      setCache(CACHE_KEYS.users, payload, TTL)
      return NextResponse.json(payload)
    }

    const month = new Date().toISOString().slice(0, 7)

    // Build all DocumentRefs up front
    const planRefs    = authUsers.map((u) => adminDb.collection("users").doc(u.uid).collection("subscription").doc("info"))
    const flagsRefs   = authUsers.map((u) => adminDb.collection("users").doc(u.uid).collection("admin").doc("flags"))
    const usageRefs   = authUsers.map((u) => adminDb.collection("users").doc(u.uid).collection("usage").doc(month))

    // 3 RPCs total instead of N×3 — Firestore getAll() batches into a single round-trip per call
    const [planSnaps, flagsSnaps, usageSnaps] = await Promise.all([
      adminDb.getAll(...planRefs),
      adminDb.getAll(...flagsRefs),
      adminDb.getAll(...usageRefs),
    ])

    const users = authUsers.map((u, i) => {
      const plan  = (planSnaps[i].data()?.plan  as string) ?? "free"
      const flags = flagsSnaps[i].data() ?? {}
      const usage = usageSnaps[i].data() ?? {}
      return {
        uid:            u.uid,
        email:          u.email          ?? "",
        displayName:    u.displayName    ?? "",
        photoURL:       u.photoURL       ?? "",
        disabled:       u.disabled,
        createdAt:      u.metadata.creationTime,
        lastSignIn:     u.metadata.lastSignInTime,
        plan,
        blocked:        flags.blocked === true,
        blockedFeatures:(flags.blockedFeatures  as string[])               ?? [],
        adminNote:      (flags.adminNote         as string)                ?? "",
        limitOverrides: (flags.limitOverrides    as Record<string, number>) ?? {},
        usage,
      }
    })

    users.sort(
      (a, b) =>
        new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
    )

    const payload = { users }
    setCache(CACHE_KEYS.users, payload, TTL)
    return NextResponse.json(payload)
  } catch (err) {
    console.error("[Admin] users fetch error:", err)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}
