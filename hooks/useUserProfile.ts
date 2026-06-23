"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { doc, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"

export function useUserProfile() {
    const { user } = useAuth()
    const [profile, setProfile] = useState<{
        name: string
        email: string
        photoURL: string
        role: string
        username: string
    } | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!user) {
            // Resetting to null synchronously is intentional here: we need to
            // clear the profile immediately when the user signs out, and the
            // alternative (a ref + callback) would add complexity without benefit.
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setProfile(null)
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setLoading(false)
            return
        }

        // Listen to realtime updates on user document
        const unsub = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data()
                setProfile({
                    name: data.name || user.displayName || "Student",
                    email: data.email || user.email || "",
                    photoURL: data.photoURL || user.photoURL || "",
                    role: data.role || "Student",
                    username: data.username || "",
                })
            }
            setLoading(false)
        })

        return () => unsub()
    }, [user])

    return { profile, loading }
}
