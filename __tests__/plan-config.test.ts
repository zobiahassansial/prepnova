import { describe, it, expect } from "vitest"
import {
    PLAN_LIMITS,
    PLAN_DISPLAY_NAMES,
    getUpgradePlan,
    type PlanKey,
    type FeatureKey,
} from "@/lib/plan-config"

describe("PLAN_LIMITS", () => {
    const plans: PlanKey[] = ["free", "standard", "pro", "max"]
    const features: FeatureKey[] = ["resumes", "summaries", "flashcards", "interviews", "scanPages"]

    it("defines all four plans", () => {
        expect(Object.keys(PLAN_LIMITS)).toEqual(plans)
    })

    it("every plan has all numeric feature keys", () => {
        for (const plan of plans) {
            for (const feature of features) {
                const val = PLAN_LIMITS[plan][feature]
                expect(typeof val).toBe("number")
                expect(val).toBeGreaterThanOrEqual(0)
            }
        }
    })

    it("limits are non-decreasing from free → max", () => {
        for (const feature of features) {
            const vals = plans.map(p => PLAN_LIMITS[p][feature])
            for (let i = 1; i < vals.length; i++) {
                expect(vals[i]).toBeGreaterThanOrEqual(vals[i - 1])
            }
        }
    })

    it("free plan has 0 interviews and 0 scanPages", () => {
        expect(PLAN_LIMITS.free.interviews).toBe(0)
        expect(PLAN_LIMITS.free.scanPages).toBe(0)
    })

    it("max plan has highest limits across all features", () => {
        for (const feature of features) {
            const maxVal = Math.max(...plans.map(p => PLAN_LIMITS[p][feature]))
            expect(PLAN_LIMITS.max[feature]).toBe(maxVal)
        }
    })

    it("summaryMaxWords increases with plan tier", () => {
        expect(PLAN_LIMITS.free.summaryMaxWords).toBeLessThan(PLAN_LIMITS.standard.summaryMaxWords)
        expect(PLAN_LIMITS.standard.summaryMaxWords).toBeLessThan(PLAN_LIMITS.pro.summaryMaxWords)
        expect(PLAN_LIMITS.pro.summaryMaxWords).toBeLessThan(PLAN_LIMITS.max.summaryMaxWords)
    })
})

describe("getUpgradePlan", () => {
    it("returns Standard for free", () => {
        expect(getUpgradePlan("free")).toBe("Standard")
    })

    it("returns Pro for standard", () => {
        expect(getUpgradePlan("standard")).toBe("Pro")
    })

    it("returns Max for pro", () => {
        expect(getUpgradePlan("pro")).toBe("Max")
    })

    it("returns Max when already on max", () => {
        expect(getUpgradePlan("max")).toBe("Max")
    })
})

describe("PLAN_DISPLAY_NAMES", () => {
    it("has a display name for each plan", () => {
        const plans: PlanKey[] = ["free", "standard", "pro", "max"]
        for (const plan of plans) {
            expect(typeof PLAN_DISPLAY_NAMES[plan]).toBe("string")
            expect(PLAN_DISPLAY_NAMES[plan].length).toBeGreaterThan(0)
        }
    })
})
