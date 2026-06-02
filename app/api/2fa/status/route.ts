import { NextRequest, NextResponse } from "next/server"
import { verifyIdToken, adminDb } from "@/lib/firebase-admin"

export async function GET(req: NextRequest) {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "")
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    let userId: string
    try {
        const decoded = await verifyIdToken(token)
        userId = decoded.uid
    } catch {
        return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }

    const snap = await adminDb
        .collection("users")
        .doc(userId)
        .collection("private")
        .doc("2fa")
        .get()

    const enabled = snap.exists ? (snap.data()?.enabled === true) : false
    return NextResponse.json({ enabled })
}
