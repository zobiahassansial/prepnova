// In-memory token bucket rate limiter — 5 AI requests per 60 seconds per user.
// Works per-process; sufficient for single-instance deployments.
const MAX_TOKENS = 5
const REFILL_PER_SECOND = MAX_TOKENS / 60 // fills back up over 1 minute

interface Bucket {
    tokens: number
    lastRefill: number // ms timestamp
}

const buckets = new Map<string, Bucket>()

export function checkRateLimit(userId: string): { allowed: boolean; retryAfter?: number } {
    const now = Date.now()
    const bucket = buckets.get(userId) ?? { tokens: MAX_TOKENS, lastRefill: now }

    const elapsed = (now - bucket.lastRefill) / 1000 // seconds
    const refilled = Math.min(MAX_TOKENS, bucket.tokens + elapsed * REFILL_PER_SECOND)

    if (refilled < 1) {
        // How many seconds until 1 token is available
        const retryAfter = Math.ceil((1 - refilled) / REFILL_PER_SECOND)
        buckets.set(userId, { tokens: refilled, lastRefill: now })
        return { allowed: false, retryAfter }
    }

    buckets.set(userId, { tokens: refilled - 1, lastRefill: now })
    return { allowed: true }
}
