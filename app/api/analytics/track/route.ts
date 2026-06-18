import { NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { FieldValue } from "firebase-admin/firestore"

// Never error loudly — analytics must never break the user experience
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    if (!body?.sessionId || !body?.type || !body?.path) {
      return NextResponse.json({ ok: false })
    }

    const { type, sessionId, path, uid, email, referrer, userAgent, enteredAt, duration } = body

    // Sanitize sessionId — only alphanumeric, dashes, underscores
    if (!/^[a-z0-9\-_]{8,64}$/i.test(sessionId)) {
      return NextResponse.json({ ok: false })
    }

    const ref = adminDb.collection("analytics").doc(sessionId as string)

    if (type === "pageview") {
      const device = detectDevice(userAgent ?? "")
      await ref.set(
        {
          uid: uid ?? null,
          email: email ?? null,
          lastPath: path,
          startedAt: enteredAt ?? new Date().toISOString(),
          lastSeen: new Date().toISOString(),
          totalSeconds: 0,
          pageCount: FieldValue.increment(1),
          paths: FieldValue.arrayUnion(path),
          referrer: referrer ?? null,
          device,
        },
        { merge: true }
      )
    } else if (type === "heartbeat") {
      await ref.set(
        {
          lastSeen: new Date().toISOString(),
          totalSeconds: FieldValue.increment(30),
          lastPath: path,
        },
        { merge: true }
      )
    } else if (type === "leave") {
      const secs = typeof duration === "number" && duration >= 0 ? Math.min(duration, 3600) : 0
      await ref.set(
        {
          lastSeen: new Date().toISOString(),
          totalSeconds: FieldValue.increment(secs),
          lastPath: path,
        },
        { merge: true }
      )
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}

function detectDevice(ua: string): string {
  if (/mobile|android|iphone|ipad|tablet/i.test(ua)) return "mobile"
  return "desktop"
}
