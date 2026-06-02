import { NextRequest, NextResponse } from "next/server"
import { authenticator } from "otplib"
import QRCode from "qrcode"
import { verifyIdToken, adminDb } from "@/lib/firebase-admin"

export async function POST(req: NextRequest) {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "")
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    let userId: string
    let userEmail: string
    try {
        const decoded = await verifyIdToken(token)
        userId = decoded.uid
        userEmail = decoded.email || ""
    } catch {
        return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }

    // Generate a new TOTP secret
    const secret = authenticator.generateSecret()

    // Store it as pending (not yet verified/enabled)
    await adminDb
        .collection("users")
        .doc(userId)
        .collection("private")
        .doc("2fa")
        .set({ pendingSecret: secret }, { merge: true })

    // Generate otpauth URL for QR code
    const otpauthUrl = authenticator.keyuri(userEmail || userId, "PrepNova", secret)
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl)

    return NextResponse.json({ qrCodeDataUrl, secret })
}
