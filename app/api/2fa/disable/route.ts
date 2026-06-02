import { NextRequest, NextResponse } from "next/server"
import { authenticator } from "otplib"
import { verifyIdToken, adminDb } from "@/lib/firebase-admin"

export async function POST(req: NextRequest) {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "")
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    let userId: string
    try {
        const decoded = await verifyIdToken(token)
        userId = decoded.uid
    } catch {
        return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }

    const { code } = await req.json()
    if (!code) return NextResponse.json({ error: "Code is required" }, { status: 400 })

    const ref = adminDb.collection("users").doc(userId).collection("private").doc("2fa")
    const snap = await ref.get()

    if (!snap.exists || !snap.data()?.enabled) {
        return NextResponse.json({ error: "2FA is not enabled" }, { status: 400 })
    }

    const { secret } = snap.data()!
    const isValid = authenticator.verify({ token: code, secret })
    if (!isValid) return NextResponse.json({ error: "Invalid code" }, { status: 400 })

    await ref.set({ enabled: false, secret: null, disabledAt: new Date().toISOString() })

    return NextResponse.json({ success: true })
}
