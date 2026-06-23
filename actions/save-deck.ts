"use server"

import { auth } from "@/auth"
import { adminDb } from "@/lib/firebase-admin"
import { FieldValue } from "firebase-admin/firestore"
import { PLAN_LIMITS } from "@/lib/plan-config"

function currentMonth(): string {
    return new Date().toISOString().slice(0, 7)
}

interface DeckData {
    title: string
    cards: { front: string; back: string }[]
    mastery?: number
}

export async function saveDeck(deckData: DeckData) {
    const session = await auth()
    if (!session?.user?.id) {
        return { success: false, error: "Authentication required." }
    }
    const userId = session.user.id
    const month = currentMonth()

    const usageRef = adminDb.collection("users").doc(userId).collection("usage").doc(month)
    const subRef   = adminDb.collection("users").doc(userId).collection("subscription").doc("info")
    const flagsRef = adminDb.collection("users").doc(userId).collection("admin").doc("flags")
    const decksRef = adminDb.collection("decks")

    try {
        const docId = await adminDb.runTransaction(async (tx) => {
            const [usageSnap, subSnap, flagsSnap] = await Promise.all([
                tx.get(usageRef),
                tx.get(subRef),
                tx.get(flagsRef),
            ])

            const flags = flagsSnap.data() ?? {}
            if (flags.blocked) {
                throw new Error("Account suspended. Contact support.")
            }
            if (Array.isArray(flags.blockedFeatures) && (flags.blockedFeatures as string[]).includes("flashcards")) {
                throw new Error("Flashcards feature is not available on your account.")
            }

            const planRaw = subSnap.exists ? (subSnap.data()?.plan as string) : "free"
            const plan = (planRaw in PLAN_LIMITS) ? planRaw as keyof typeof PLAN_LIMITS : "free"
            const usageData = usageSnap.data() ?? {}
            const used = (usageData.flashcards as number) || 0

            const overrides = flags.limitOverrides as Record<string, number> | undefined
            const limit = typeof overrides?.flashcards === "number" && overrides.flashcards >= 0
                ? overrides.flashcards
                : PLAN_LIMITS[plan].flashcards

            if (used >= limit) {
                throw new Error(
                    `You've used ${used}/${limit} flashcard decks this month. Upgrade to create more.`
                )
            }

            const newDocRef = decksRef.doc()
            tx.set(newDocRef, {
                userId,
                title: deckData.title,
                cards: deckData.cards,
                mastery: deckData.mastery ?? 0,
                count: deckData.cards.length,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            })
            tx.set(usageRef, { flashcards: FieldValue.increment(1) }, { merge: true })

            return newDocRef.id
        })

        return { success: true, id: docId }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to save deck."
        return { success: false, error: message }
    }
}
