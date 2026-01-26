"use server"

import { db } from "@/lib/firebase"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { doc, updateDoc } from "firebase/firestore"


export async function completeOnboarding(data: { educationLevel: string }) {
    const session = await auth()

    if (!session?.user?.id) {
        return { error: "Unauthorized" }
    }

    try {
        await updateDoc(doc(db, "users", session.user.id), {
            educationLevel: data.educationLevel,
            hasCompletedOnboarding: true
        })


        revalidatePath("/dashboard")
        return { success: true }
    } catch (error) {
        return { error: "Failed to update profile" }
    }
}
