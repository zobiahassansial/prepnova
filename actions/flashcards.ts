"use server"

import { z } from "zod"

// This file previously contained Prisma code which caused build errors.
// The project uses Firebase Client SDK for most operations.
// Deck creation logic has been moved to the client component (components/dashboard/flashcards.tsx).

export async function createFlashcardDeck(data: any) {
    return { error: "Please use client-side saving." }
}
