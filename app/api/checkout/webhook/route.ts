import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { verifyWebhookSignature, getPeriodEnd } from "@/lib/safepay"
import { FieldValue } from "firebase-admin/firestore"

export async function POST(req: NextRequest) {
    let body: any
    try {
        body = await req.json()
    } catch {
        return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    // Extract tracker token and signature
    const tracker: string = body?.notification?.tracker ?? body?.token ?? ""
    const signature: string = body?.signature ?? ""

    // Verify HMAC signature
    if (tracker && signature) {
        const valid = verifyWebhookSignature(tracker, signature)
        if (!valid) {
            console.error("[SafePay webhook] Invalid signature")
            return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
        }
    }

    // Only act on successful payment events
    const state: string = body?.notification?.state ?? body?.state ?? ""
    const paymentDone = ["PAID", "SETTLED", "COMPLETED"].includes(state.toUpperCase())
    if (!paymentDone) {
        // Acknowledge but take no action for non-payment events
        return NextResponse.json({ received: true })
    }

    // Parse order_id to extract userId, plan, billing
    // Format: {userId}_{plan}_{billing}_{timestamp}
    const orderId: string = body?.notification?.metadata?.order_id ?? body?.order_id ?? ""
    const parts = orderId.split("_")

    if (parts.length < 3) {
        console.error("[SafePay webhook] Unrecognised order_id:", orderId)
        return NextResponse.json({ received: true })
    }

    // userId is everything before the plan segment — plans are fixed words
    const KNOWN_PLANS = ["standard", "pro", "max"]
    const KNOWN_BILLING = ["monthly", "yearly"]

    // Find plan index by scanning from the right
    let planIndex = -1
    for (let i = parts.length - 1; i >= 0; i--) {
        if (KNOWN_PLANS.includes(parts[i])) { planIndex = i; break }
    }
    if (planIndex === -1) {
        console.error("[SafePay webhook] Plan not found in order_id:", orderId)
        return NextResponse.json({ received: true })
    }

    const userId = parts.slice(0, planIndex).join("_")
    const plan = parts[planIndex]
    const billing = KNOWN_BILLING.includes(parts[planIndex + 1]) ? parts[planIndex + 1] : "monthly"

    if (!userId || !plan) {
        console.error("[SafePay webhook] Could not parse user/plan from order_id:", orderId)
        return NextResponse.json({ received: true })
    }

    const periodEnd = getPeriodEnd(billing as "monthly" | "yearly")

    try {
        await adminDb
            .collection("users")
            .doc(userId)
            .collection("subscription")
            .doc("info")
            .set({
                plan,
                status: "active",
                billing,
                currentPeriodEnd: periodEnd,
                cancelAtPeriodEnd: false,
                safepayTracker: tracker,
                safepayOrderId: orderId,
                updatedAt: new Date().toISOString(),
            })

        // Log billing record
        await adminDb
            .collection("users")
            .doc(userId)
            .collection("billing")
            .add({
                plan,
                billing,
                amount: body?.notification?.amount ?? 0,
                currency: body?.notification?.currency ?? "USD",
                status: "paid",
                safepayTracker: tracker,
                orderId,
                date: new Date().toISOString(),
            })

        console.log(`[SafePay webhook] Subscription activated: user=${userId} plan=${plan} billing=${billing}`)
    } catch (err) {
        console.error("[SafePay webhook] Firestore write failed:", err)
        return NextResponse.json({ error: "DB write failed" }, { status: 500 })
    }

    return NextResponse.json({ received: true })
}
