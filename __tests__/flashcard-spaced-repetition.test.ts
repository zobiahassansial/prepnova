import { describe, it, expect } from "vitest"
import { calculateNextReview, type Flashcard } from "@/lib/flashcard-logic"

function makeCard(overrides: Partial<Flashcard> = {}): Flashcard {
    return {
        id: "1",
        front: "Q",
        back: "A",
        interval: 0,
        repetition: 0,
        easeFactor: 2.5,
        nextReviewDate: new Date(),
        status: "learning",
        ...overrides,
    }
}

describe("calculateNextReview — SM-2 algorithm", () => {
    it("rating 1 (Again) resets interval and repetition to 0", () => {
        const card = makeCard({ interval: 5, repetition: 3 })
        const result = calculateNextReview(card, 1)
        expect(result.interval).toBe(0)
        expect(result.repetition).toBe(0)
    })

    it("rating 3 (Good) on first pass sets interval to 3 days", () => {
        const result = calculateNextReview(makeCard(), 3)
        expect(result.interval).toBe(3)
        expect(result.repetition).toBe(1)
    })

    it("rating 4 (Easy) on first pass sets interval to 7 days", () => {
        const result = calculateNextReview(makeCard(), 4)
        expect(result.interval).toBe(7)
        expect(result.repetition).toBe(1)
    })

    it("rating 2 (Hard) on first pass sets interval to 1 day", () => {
        const result = calculateNextReview(makeCard(), 2)
        expect(result.interval).toBe(1)
        expect(result.repetition).toBe(1)
    })

    it("ease factor does not drop below 1.3", () => {
        // Rating 1 reduces ease factor each time
        let card = makeCard({ easeFactor: 1.3 })
        const result = calculateNextReview(card, 1)
        expect(result.easeFactor).toBeGreaterThanOrEqual(1.3)
    })

    it("returns 'mastered' status for interval > 10", () => {
        const card = makeCard({ interval: 10, repetition: 3, easeFactor: 2.5 })
        const result = calculateNextReview(card, 3)
        // interval = round(10 * 2.5) = 25 > 10
        expect(result.status).toBe("mastered")
    })

    it("returns 'review' status for 0 < interval <= 10", () => {
        const result = calculateNextReview(makeCard(), 3)
        expect(result.interval).toBe(3)
        expect(result.status).toBe("review")
    })

    it("returns 'learning' status for interval === 0", () => {
        const result = calculateNextReview(makeCard(), 1)
        expect(result.status).toBe("learning")
    })

    it("nextReviewDate is in the future for positive interval", () => {
        const before = new Date()
        const result = calculateNextReview(makeCard(), 4)
        expect(result.nextReviewDate.getTime()).toBeGreaterThanOrEqual(before.getTime())
    })
})
