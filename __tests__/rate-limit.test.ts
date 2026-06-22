import { describe, it, expect, beforeEach, vi } from "vitest"

// Isolate the module between tests by resetting the module registry
let checkRateLimit: (userId: string) => { allowed: boolean; retryAfter?: number }

beforeEach(async () => {
    vi.resetModules()
    const mod = await import("@/lib/rate-limit")
    checkRateLimit = mod.checkRateLimit
})

describe("checkRateLimit", () => {
    const userId = "test-user-1"

    it("allows the first request", () => {
        const result = checkRateLimit(userId)
        expect(result.allowed).toBe(true)
        expect(result.retryAfter).toBeUndefined()
    })

    it("allows up to 5 requests in quick succession", () => {
        for (let i = 0; i < 5; i++) {
            expect(checkRateLimit(userId).allowed).toBe(true)
        }
    })

    it("blocks the 6th request within the same window", () => {
        for (let i = 0; i < 5; i++) {
            checkRateLimit(userId)
        }
        const result = checkRateLimit(userId)
        expect(result.allowed).toBe(false)
        expect(typeof result.retryAfter).toBe("number")
        expect(result.retryAfter!).toBeGreaterThan(0)
    })

    it("tracks different users independently", () => {
        // Exhaust tokens for user A
        for (let i = 0; i < 5; i++) {
            checkRateLimit("user-A")
        }
        expect(checkRateLimit("user-A").allowed).toBe(false)
        // User B should still be allowed
        expect(checkRateLimit("user-B").allowed).toBe(true)
    })

    it("provides a positive retryAfter when blocked", () => {
        for (let i = 0; i < 5; i++) checkRateLimit(userId)
        const { allowed, retryAfter } = checkRateLimit(userId)
        expect(allowed).toBe(false)
        expect(retryAfter).toBeGreaterThanOrEqual(1)
    })
})
