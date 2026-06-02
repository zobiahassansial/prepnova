import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { name, email, category, subject, message } = body

        if (!name || !email || !category || !subject || !message) {
            return NextResponse.json({ error: "All fields are required." }, { status: 400 })
        }

        await adminDb.collection("contactSubmissions").add({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            category,
            subject: subject.trim(),
            message: message.trim(),
            status: "unread",
            createdAt: new Date().toISOString(),
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("contact route error:", error)
        return NextResponse.json({ error: "Failed to submit. Please try again." }, { status: 500 })
    }
}
