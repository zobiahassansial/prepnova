import { NextResponse } from "next/server"
import { getAdminSession } from "@/lib/admin-session"
import { adminDb } from "@/lib/firebase-admin"
import { getCache, setCache, CACHE_KEYS } from "@/lib/admin-cache"

const TTL = 60_000 // 60 s — analytics tolerate slightly stale data

export async function GET() {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const cached = getCache<object>(CACHE_KEYS.analytics)
  if (cached) return NextResponse.json(cached)

  try {
    // Fetch last 500 sessions ordered by lastSeen
    const snap = await adminDb
      .collection("analytics")
      .orderBy("lastSeen", "desc")
      .limit(500)
      .get()

    const sessions = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as AnalyticsSession[]

    // --- Aggregate stats ---
    const now = Date.now()
    const DAY = 86_400_000
    const WEEK = 7 * DAY
    const MONTH = 30 * DAY

    const sessionAge = (s: AnalyticsSession) =>
      now - new Date(s.startedAt ?? s.lastSeen ?? now).getTime()

    const todaySessions  = sessions.filter((s) => sessionAge(s) < DAY)
    const weekSessions   = sessions.filter((s) => sessionAge(s) < WEEK)
    const monthSessions  = sessions.filter((s) => sessionAge(s) < MONTH)

    const pageFreq: Record<string, number> = {}
    for (const s of monthSessions) {
      for (const p of s.paths ?? []) {
        pageFreq[p] = (pageFreq[p] ?? 0) + 1
      }
    }
    const topPages = Object.entries(pageFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([path, count]) => ({ path, count }))

    const avgDuration =
      monthSessions.length > 0
        ? Math.round(
            monthSessions.reduce((a, s) => a + (s.totalSeconds ?? 0), 0) /
              monthSessions.length
          )
        : 0

    const payload = {
      stats: {
        today: todaySessions.length,
        week: weekSessions.length,
        month: monthSessions.length,
        total: sessions.length,
        authenticated: monthSessions.filter((s) => s.uid).length,
        anonymous: monthSessions.filter((s) => !s.uid).length,
        avgDurationSeconds: avgDuration,
      },
      topPages,
      sessions: sessions.slice(0, 200),
    }
    setCache(CACHE_KEYS.analytics, payload, TTL)
    return NextResponse.json(payload)
  } catch (err) {
    console.error("[Admin] analytics error:", err)
    return NextResponse.json({ error: "Failed to load analytics" }, { status: 500 })
  }
}

interface AnalyticsSession {
  id: string
  uid?: string | null
  email?: string | null
  startedAt?: string
  lastSeen?: string
  totalSeconds?: number
  pageCount?: number
  paths?: string[]
  lastPath?: string
  referrer?: string | null
  device?: string
}
