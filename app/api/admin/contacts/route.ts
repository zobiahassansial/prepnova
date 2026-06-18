import { NextResponse } from "next/server"
import { getAdminSession } from "@/lib/admin-session"
import { adminDb } from "@/lib/firebase-admin"
import { getCache, setCache, invalidateCache, CACHE_KEYS } from "@/lib/admin-cache"

const TTL = 30_000 // 30 s

export async function GET() {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const cached = getCache<object>(CACHE_KEYS.contacts)
  if (cached) return NextResponse.json(cached)

  try {
    const snap = await adminDb
      .collection("contactSubmissions")
      .orderBy("createdAt", "desc")
      .limit(200)
      .get()

    const contacts = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    const payload = { contacts }
    setCache(CACHE_KEYS.contacts, payload, TTL)
    return NextResponse.json(payload)
  } catch (err) {
    console.error("[Admin] contacts error:", err)
    return NextResponse.json({ error: "Failed to load contacts" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const { id, status } = body as { id: string; status: string }

  if (!id || !["unread", "read", "resolved"].includes(status)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  try {
    await adminDb.collection("contactSubmissions").doc(id).update({ status })
    // Update cache in-place rather than invalidating — avoids a round-trip on next GET
    const cached = getCache<{ contacts: Array<Record<string, unknown>> }>(CACHE_KEYS.contacts)
    if (cached) {
      cached.contacts = cached.contacts.map((c) =>
        c.id === id ? { ...c, status } : c
      )
      setCache(CACHE_KEYS.contacts, cached, TTL)
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[Admin] contacts PATCH error:", err)
    return NextResponse.json({ error: "Failed to update" }, { status: 500 })
  }
}
