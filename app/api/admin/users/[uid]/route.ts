import { NextResponse } from "next/server"
import { getAdminSession } from "@/lib/admin-session"
import { adminDb, adminAuth } from "@/lib/firebase-admin"
import { invalidateCache, CACHE_KEYS } from "@/lib/admin-cache"

const ALLOWED_PLANS = ["free", "standard", "pro", "max"] as const
const ALLOWED_FEATURES = [
  "resumes",
  "summaries",
  "flashcards",
  "interviews",
  "scanPages",
] as const

type Ctx = { params: Promise<{ uid: string }> }

export async function GET(_req: Request, ctx: Ctx) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { uid } = await ctx.params

  try {
    const [authUser, planSnap, flagsSnap, usageSnap] = await Promise.all([
      adminAuth().getUser(uid).catch(() => null),
      adminDb.collection("users").doc(uid).collection("subscription").doc("info").get(),
      adminDb.collection("users").doc(uid).collection("admin").doc("flags").get(),
      adminDb
        .collection("users")
        .doc(uid)
        .collection("usage")
        .doc(new Date().toISOString().slice(0, 7))
        .get(),
    ])

    if (!authUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      uid,
      email: authUser.email ?? "",
      displayName: authUser.displayName ?? "",
      disabled: authUser.disabled,
      createdAt: authUser.metadata.creationTime,
      lastSignIn: authUser.metadata.lastSignInTime,
      plan: (planSnap.data()?.plan as string) ?? "free",
      blocked: flagsSnap.data()?.blocked === true,
      blockedFeatures: (flagsSnap.data()?.blockedFeatures as string[]) ?? [],
      adminNote: (flagsSnap.data()?.adminNote as string) ?? "",
      limitOverrides: (flagsSnap.data()?.limitOverrides as Record<string, number>) ?? {},
      usage: usageSnap.data() ?? {},
    })
  } catch (err) {
    console.error("[Admin] user GET error:", err)
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
  }
}

export async function PATCH(req: Request, ctx: Ctx) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { uid } = await ctx.params
  const body = await req.json().catch(() => ({}))

  const firestoreFlags: Record<string, unknown> = {}
  const planUpdate: Record<string, unknown> = {}

  // Plan change
  if (typeof body.plan === "string" && ALLOWED_PLANS.includes(body.plan as typeof ALLOWED_PLANS[number])) {
    planUpdate.plan = body.plan
  }

  // Block/unblock account
  if (typeof body.blocked === "boolean") {
    firestoreFlags.blocked = body.blocked
  }

  // Block specific features (validated against known feature keys)
  if (Array.isArray(body.blockedFeatures)) {
    firestoreFlags.blockedFeatures = (body.blockedFeatures as string[]).filter(
      (f) => ALLOWED_FEATURES.includes(f as typeof ALLOWED_FEATURES[number])
    )
  }

  // Admin note
  if (typeof body.adminNote === "string") {
    firestoreFlags.adminNote = body.adminNote.slice(0, 500)
  }

  // Custom per-feature limit overrides (null = remove override, number >= 0 = set override)
  if (body.limitOverrides !== undefined && typeof body.limitOverrides === "object") {
    const overrides: Record<string, number | null> = {}
    for (const feat of ALLOWED_FEATURES) {
      const val = (body.limitOverrides as Record<string, unknown>)[feat]
      if (val === null) {
        overrides[feat] = null
      } else if (typeof val === "number" && val >= 0 && Number.isFinite(val)) {
        overrides[feat] = Math.floor(val)
      }
    }
    firestoreFlags.limitOverrides = overrides
  }

  try {
    await Promise.all([
      // Update plan subcollection
      Object.keys(planUpdate).length > 0
        ? adminDb
            .collection("users")
            .doc(uid)
            .collection("subscription")
            .doc("info")
            .set(planUpdate, { merge: true })
        : Promise.resolve(),

      // Update admin flags subcollection
      Object.keys(firestoreFlags).length > 0
        ? adminDb
            .collection("users")
            .doc(uid)
            .collection("admin")
            .doc("flags")
            .set(firestoreFlags, { merge: true })
        : Promise.resolve(),

      // Sync block state with Firebase Auth (prevents any login)
      typeof body.blocked === "boolean"
        ? adminAuth().updateUser(uid, { disabled: body.blocked })
        : Promise.resolve(),
    ])

    invalidateCache(CACHE_KEYS.users)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[Admin] user PATCH error:", err)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}
