/**
 * Persistent serverless-safe rate limiter.
 *
 * Strategy (in priority order):
 *   1. Upstash Redis — if UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set.
 *   2. Firestore transaction-backed sliding window — always available, no extra config.
 *
 * The old in-memory Map is removed.  It provided zero protection in serverless
 * environments (Vercel / Cloud Run) where each request may hit a cold instance.
 *
 * Configuration:
 *   UPSTASH_REDIS_REST_URL   — Upstash REST endpoint (optional)
 *   UPSTASH_REDIS_REST_TOKEN — Upstash REST token    (optional)
 *   RATE_LIMIT_MAX           — max requests per window (default: 5)
 *   RATE_LIMIT_WINDOW_SEC    — window size in seconds  (default: 60)
 */

import "server-only"

const MAX_TOKENS      = Number(process.env.RATE_LIMIT_MAX        ?? 5)
const WINDOW_SECONDS  = Number(process.env.RATE_LIMIT_WINDOW_SEC ?? 60)

// ── Upstash Redis path ────────────────────────────────────────────────────────

async function checkUpstash(
    userId: string
): Promise<{ allowed: boolean; retryAfter?: number } | null> {
    const url   = process.env.UPSTASH_REDIS_REST_URL
    const token = process.env.UPSTASH_REDIS_REST_TOKEN
    if (!url || !token) return null

    try {
        const key     = `rl:${userId}`
        const now     = Math.floor(Date.now() / 1000)
        const windowStart = now - WINDOW_SECONDS

        // Use Upstash sorted-set sliding window via pipeline
        const pipeline = [
            ["ZREMRANGEBYSCORE", key, "-inf", String(windowStart)],
            ["ZADD", key, String(now), `${now}-${Math.random()}`],
            ["ZCARD", key],
            ["EXPIRE", key, String(WINDOW_SECONDS * 2)],
        ]

        const res = await fetch(`${url}/pipeline`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify(pipeline),
        })
        if (!res.ok) return null

        const data = await res.json() as { result: unknown }[]
        const count = data[2]?.result as number

        if (count > MAX_TOKENS) {
            return { allowed: false, retryAfter: WINDOW_SECONDS }
        }
        return { allowed: true }
    } catch {
        return null  // Fall through to Firestore
    }
}

// ── Firestore transaction-backed path ─────────────────────────────────────────

async function checkFirestore(
    userId: string
): Promise<{ allowed: boolean; retryAfter?: number }> {
    const { adminDb } = await import("@/lib/firebase-admin")

    const ref  = adminDb.collection("_rateLimits").doc(userId)
    const now  = Date.now()
    const cutoff = now - WINDOW_SECONDS * 1000

    try {
        const result = await adminDb.runTransaction(async (tx) => {
            const snap = await tx.get(ref)
            const data = snap.data() ?? {}

            // Timestamps of requests within the current window
            const hits: number[] = Array.isArray(data.hits)
                ? (data.hits as number[]).filter((t) => t > cutoff)
                : []

            if (hits.length >= MAX_TOKENS) {
                const oldest  = hits[0]
                const waitMs  = oldest + WINDOW_SECONDS * 1000 - now
                return { allowed: false, retryAfter: Math.ceil(waitMs / 1000) }
            }

            hits.push(now)
            tx.set(ref, { hits, updatedAt: now }, { merge: false })
            return { allowed: true }
        })
        return result
    } catch {
        // If Firestore is unavailable, fail open (don't block legitimate traffic).
        return { allowed: true }
    }
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function checkRateLimit(
    userId: string
): Promise<{ allowed: boolean; retryAfter?: number }> {
    const upstash = await checkUpstash(userId)
    if (upstash !== null) return upstash
    return checkFirestore(userId)
}
