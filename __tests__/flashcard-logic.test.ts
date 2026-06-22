import { describe, it, expect } from "vitest"
import { filterValidFlashcards, scoreFlashcardDeck } from "@/lib/flashcard-logic"

describe("filterValidFlashcards", () => {
    it("returns cards with non-empty front and back", () => {
        const cards = [
            { front: "What is X?", back: "X is Y." },
            { front: "", back: "Empty front" },
            { front: "No back", back: "" },
            { front: "  ", back: "Whitespace front" },
        ]
        const result = filterValidFlashcards(cards)
        expect(result).toHaveLength(1)
        expect(result[0].front).toBe("What is X?")
    })

    it("returns empty array for all-invalid input", () => {
        expect(filterValidFlashcards([{ front: "", back: "" }])).toHaveLength(0)
    })

    it("returns empty array for empty input", () => {
        expect(filterValidFlashcards([])).toHaveLength(0)
    })

    it("handles null/undefined gracefully", () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(filterValidFlashcards(null as any)).toHaveLength(0)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(filterValidFlashcards(undefined as any)).toHaveLength(0)
    })

    it("does not modify valid cards", () => {
        const cards = [{ front: "Q", back: "A" }]
        const result = filterValidFlashcards(cards)
        expect(result[0]).toEqual({ front: "Q", back: "A" })
    })
})

describe("scoreFlashcardDeck", () => {
    it("returns 0 for empty deck", () => {
        expect(scoreFlashcardDeck([], [])).toBe(0)
    })

    it("returns 100 for all correct", () => {
        const cards = [{ front: "Q1", back: "A1" }, { front: "Q2", back: "A2" }]
        const answers = [true, true]
        expect(scoreFlashcardDeck(cards, answers)).toBe(100)
    })

    it("returns 50 for half correct", () => {
        const cards = [{ front: "Q1", back: "A1" }, { front: "Q2", back: "A2" }]
        const answers = [true, false]
        expect(scoreFlashcardDeck(cards, answers)).toBe(50)
    })

    it("returns 0 for all incorrect", () => {
        const cards = [{ front: "Q", back: "A" }]
        expect(scoreFlashcardDeck(cards, [false])).toBe(0)
    })
})
