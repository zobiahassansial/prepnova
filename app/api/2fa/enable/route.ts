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

    if (!snap.exists) return NextResponse.json({ error: "No pending 2FA setup found" }, { status: 400 })

    const { pendingSecret } = snap.data()!
    if (!pendingSecret) return NextResponse.json({ error: "No pending 2FA setup found" }, { status: 400 })

    const isValid = authenticator.verify({ token: code, secret: pendingSecret })
    if (!isValid) return NextResponse.json({ error: "Invalid code. Make sure your authenticator app is synced." }, { status: 400 })

    await ref.set({
        enabled: true,
        secret: pendingSecret,
        pendingSecret: null,
        enabledAt: new Date().toISOString(),
    })

    return NextResponse.json({ success: true })
}
