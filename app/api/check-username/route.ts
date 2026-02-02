import { collection, query, where, getDocs, limit } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const username = searchParams.get("username")?.trim().toLowerCase()

        if (!username) {
            return NextResponse.json({ available: false })
        }

        const q = query(
            collection(db, "users"),
            where("username", "==", username),
            limit(1)
        )

        const snap = await getDocs(q)

        if (snap.empty) {
            return NextResponse.json({ available: true })
        }

        return NextResponse.json({
            available: false,
            suggestions: [
                `${username}_01`,
                `${username}_dev`,
                `${username}${Math.floor(Math.random() * 1000)}`
            ]
        })
    } catch (error) {
        console.error("check-username error:", error)
        return NextResponse.json({ available: false })
    }
}
