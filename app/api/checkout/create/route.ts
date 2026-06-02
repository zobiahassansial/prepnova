import { NextRequest, NextResponse } from "next/server"
import { verifyIdToken } from "@/lib/firebase-admin"
import { createTracker, PLAN_PRICES } from "@/lib/safepay"

export async function POST(req: NextRequest) {
    // Auth
    const token = req.headers.get("Authorization")?.replace("Bearer ", "")
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    let userId: string
    try {
        const decoded = await verifyIdToken(token)
        userId = decoded.uid
    } catch {
        return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }

    let body: any
    try {
        body = await req.json()
    } catch {
        return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const { plan, billing } = body

    if (!plan || !PLAN_PRICES[plan]) {
        return NextResponse.json({ error: `Invalid plan "${plan}". Valid plans: standard, pro, max` }, { status: 400 })
    }
    if (billing !== "monthly" && billing !== "yearly") {
        return NextResponse.json({ error: `Invalid billing "${billing}". Must be monthly or yearly` }, { status: 400 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000"
    const orderId = `${userId}_${plan}_${billing}_${Date.now()}`

    try {
        const { checkoutUrl } = await createTracker(plan, billing, orderId, appUrl)
        return NextResponse.json({ checkoutUrl, orderId })
    } catch (err: any) {
        console.error("[/api/checkout/create] Error:", err.message)
        return NextResponse.json(
            { error: err.message || "Failed to create checkout session" },
            { status: 500 }
        )
    }
}
