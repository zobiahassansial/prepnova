"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"

function getOrCreateSessionId(): string {
  const KEY = "pn_sid"
  try {
    let sid = sessionStorage.getItem(KEY)
    if (!sid) {
      sid = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
      sessionStorage.setItem(KEY, sid)
    }
    return sid
  } catch {
    return `${Date.now().toString(36)}-fallback`
  }
}

function send(payload: Record<string, unknown>) {
  fetch("/api/analytics/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {})
}

export function AnalyticsTracker() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const sessionId = useRef<string>("")
  const enterTime = useRef<number>(0)
  const heartbeat = useRef<ReturnType<typeof setInterval> | null>(null)

  // Init session ID once
  useEffect(() => {
    sessionId.current = getOrCreateSessionId()
  }, [])

  useEffect(() => {
    const sid = sessionId.current
    if (!sid) return

    const uid = (session?.user as { id?: string } | undefined)?.id ?? null
    const email = session?.user?.email ?? null

    enterTime.current = Date.now()

    send({
      type: "pageview",
      sessionId: sid,
      path: pathname,
      uid,
      email,
      referrer: typeof document !== "undefined" ? document.referrer || null : null,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      enteredAt: new Date().toISOString(),
    })

    // Heartbeat every 30 s to accumulate active time
    heartbeat.current = setInterval(() => {
      send({ type: "heartbeat", sessionId: sid, path: pathname })
    }, 30_000)

    function onLeave() {
      if (!heartbeat.current) return
      clearInterval(heartbeat.current)
      heartbeat.current = null
      const duration = Math.round((Date.now() - enterTime.current) / 1000)
      send({ type: "leave", sessionId: sid, path: pathname, duration })
    }

    window.addEventListener("beforeunload", onLeave)
    return () => {
      clearInterval(heartbeat.current!)
      heartbeat.current = null
      window.removeEventListener("beforeunload", onLeave)
      // Navigation within the app — record time on this page
      const duration = Math.round((Date.now() - enterTime.current) / 1000)
      if (duration > 1) {
        send({ type: "leave", sessionId: sid, path: pathname, duration })
      }
    }
  }, [pathname, session])

  return null
}
