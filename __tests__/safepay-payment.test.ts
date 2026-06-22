import { describe, it, expect } from "vitest"

/**
 * Tests for payment amount validation and orderId parsing logic.
 * These are pure-function tests extracted from the Cloud Function logic.
 */

const PLAN_PRICES: Record<string, { monthlyPKR: number; yearlyPKR: number }> = {
    standard: { monthlyPKR: 1680,  yearlyPKR: 16800 },
    pro:      { monthlyPKR: 3360,  yearlyPKR: 33600 },
    max:      { monthlyPKR: 5600,  yearlyPKR: 56000 },
}

const KNOWN_PLANS   = Object.keys(PLAN_PRICES)
const KNOWN_BILLING = ["monthly", "yearly"]

function parsePlanFromOrderId(
    orderId: string
): { userId: string; plan: string; billing: string } | null {
    const parts = orderId.split("_")
    let planIndex = -1
    for (let i = parts.length - 1; i >= 0; i--) {
        if (KNOWN_PLANS.includes(parts[i])) { planIndex = i; break }
    }
    if (planIndex === -1) return null
    return {
        userId:  parts.slice(0, planIndex).join("_"),
        plan:    parts[planIndex],
        billing: KNOWN_BILLING.includes(parts[planIndex + 1]) ? parts[planIndex + 1] : "monthly",
    }
}

describe("parsePlanFromOrderId", () => {
    it("parses a valid monthly orderId", () => {
        const result = parsePlanFromOrderId("uid123_pro_monthly_1718000000000")
        expect(result).toEqual({ userId: "uid123", plan: "pro", billing: "monthly" })
    })

    it("parses a valid yearly orderId", () => {
        const result = parsePlanFromOrderId("uid123_standard_yearly_1718000000000")
        expect(result).toEqual({ userId: "uid123", plan: "standard", billing: "yearly" })
    })

    it("parses userId with underscores correctly", () => {
        const result = parsePlanFromOrderId("user_with_underscores_max_monthly_1234")
        expect(result?.plan).toBe("max")
        expect(result?.userId).toBe("user_with_underscores")
        expect(result?.billing).toBe("monthly")
    })

    it("returns null for unrecognised plan", () => {
        expect(parsePlanFromOrderId("uid123_enterprise_monthly_1234")).toBeNull()
    })

    it("returns null for empty string", () => {
        expect(parsePlanFromOrderId("")).toBeNull()
    })

    it("returns null for orderId with no plan segment", () => {
        expect(parsePlanFromOrderId("uid123_monthly_1234")).toBeNull()
    })

    it("defaults billing to monthly when billing segment missing", () => {
        const result = parsePlanFromOrderId("uid123_pro_1234")
        expect(result?.billing).toBe("monthly")
    })

    it("returns the correct amount for each plan", () => {
        const cases: [string, string, number][] = [
            ["pro",      "monthly", 3360],
            ["pro",      "yearly",  33600],
            ["standard", "monthly", 1680],
            ["max",      "yearly",  56000],
        ]
        for (const [plan, billing, expectedAmount] of cases) {
            const amount = billing === "yearly"
                ? PLAN_PRICES[plan].yearlyPKR
                : PLAN_PRICES[plan].monthlyPKR
            expect(amount).toBe(expectedAmount)
        }
    })
})

describe("SSRF guard: fileUrl validation", () => {
    function isFirebaseStorageUrl(fileUrl: string, storageBucket: string): boolean {
        let parsedUrl: URL
        try {
            parsedUrl = new URL(fileUrl)
        } catch {
            return false
        }
        const allowedHosts = [
            "firebasestorage.googleapis.com",
            "storage.googleapis.com",
            storageBucket,
        ]
        return allowedHosts.some(h => parsedUrl.hostname.endsWith(h))
    }

    const bucket = "prepnova-b1ea3.firebasestorage.app"

    it("allows a Firebase Storage URL", () => {
        expect(isFirebaseStorageUrl("https://firebasestorage.googleapis.com/v0/b/x/o/file.pdf", bucket)).toBe(true)
    })

    it("allows storage.googleapis.com URL", () => {
        expect(isFirebaseStorageUrl("https://storage.googleapis.com/bucket/file.pdf", bucket)).toBe(true)
    })

    it("blocks AWS metadata endpoint", () => {
        expect(isFirebaseStorageUrl("http://169.254.169.254/latest/meta-data/", bucket)).toBe(false)
    })

    it("blocks arbitrary http URL", () => {
        expect(isFirebaseStorageUrl("http://evil.com/malware.exe", bucket)).toBe(false)
    })

    it("blocks localhost", () => {
        expect(isFirebaseStorageUrl("http://localhost:8080/secret", bucket)).toBe(false)
    })

    it("blocks internal network IP", () => {
        expect(isFirebaseStorageUrl("http://10.0.0.1/admin", bucket)).toBe(false)
    })

    it("rejects malformed URL", () => {
        expect(isFirebaseStorageUrl("not-a-url", bucket)).toBe(false)
    })

    it("rejects empty string", () => {
        expect(isFirebaseStorageUrl("", bucket)).toBe(false)
    })
})
