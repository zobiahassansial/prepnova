import { NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const username = searchParams.get("username")?.trim().toLowerCase()

        if (!username) {
            return NextResponse.json({ available: false })
        }

        const snap = await adminDb
            .collection("users")
            .where("username", "==", username)
            .limit(1)
            .get()

        if (snap.empty) {
            return NextResponse.json({ available: true })
        }

        return NextResponse.json({
            available: false,
            suggestions: [
                `${username}${Math.floor(Math.random() * 100)}`,
                `${username}_01`,
                `${username.replace(/\d+$/, '')}${Math.floor(Math.random() * 1000)}`,
                `${username}_dev`,
                `${username}123`
            ].filter((v, i, a) => a.indexOf(v) === i && v !== username).slice(0, 5)
        })
    } catch (error) {
        console.error("check-username error:", error)
        return NextResponse.json({ available: false })
    }
}
