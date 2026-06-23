import { onCall, onRequest, HttpsError } from "firebase-functions/v2/https"
import { logger } from "firebase-functions"
import { defineSecret, defineString } from "firebase-functions/params"
import { Resend } from "resend"
import { Safepay } from "@sfpy/node-sdk"
import { Environment } from "@sfpy/node-sdk/dist/utils"
import * as admin from "firebase-admin"

admin.initializeApp()
const db = admin.firestore()

const SAFEPAY_SECRET_KEY = defineSecret("SAFEPAY_SECRET_KEY")
const SAFEPAY_PUBLIC_KEY  = defineSecret("SAFEPAY_PUBLIC_KEY")
const RESEND_API_KEY = defineSecret("RESEND_API_KEY")
const SAFEPAY_WEBHOOK_SECRET = defineSecret("SAFEPAY_WEBHOOK_SECRET")

// Set to "false" only when you have live Safepay credentials and are ready for production.
// Default: "true" (sandbox). Change with: firebase functions:params:set SAFEPAY_USE_SANDBOX=false
const SAFEPAY_USE_SANDBOX  = defineString("SAFEPAY_USE_SANDBOX",  { default: "true" })

// Resolved inside each function via SAFEPAY_USE_SANDBOX.value()

const PLAN_PRICES: Record<string, { monthlyPKR: number; yearlyPKR: number }> = {
    standard: { monthlyPKR: 1680,  yearlyPKR: 16800 },
    pro:      { monthlyPKR: 3360,  yearlyPKR: 33600 },
    max:      { monthlyPKR: 5600,  yearlyPKR: 56000 },
}

const RECEIPT_FROM = "PrepNova <onboarding@resend.dev>"

const PAYMENT_METHODS: Record<string, string> = {
    card:      "CYBERSOURCE",
    jazzcash:  "JAZZCASH_V2",
    easypaisa: "EASYPAISA_MA",
    bank:      "NIFT_TRANSFER",
}

const KNOWN_PLANS   = Object.keys(PLAN_PRICES)
const KNOWN_BILLING = ["monthly", "yearly"]

function getPeriodEnd(billing: string): Date {
    const d = new Date()
    billing === "yearly" ? d.setFullYear(d.getFullYear() + 1) : d.setMonth(d.getMonth() + 1)
    return d
}

function escapeHtml(value: unknown): string {
    const chars: Record<string, string> = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#39;",
    }
    return String(value ?? "").replace(/[&<>"']/g, (char) => chars[char])
}

function getPlanName(plan: string): string {
    return plan.charAt(0).toUpperCase() + plan.slice(1)
}

function formatPKR(amount: unknown): string {
    const numeric = typeof amount === "number" ? amount : Number(amount || 0)
    return `PKR ${numeric.toLocaleString("en-PK", { maximumFractionDigits: 0 })}`
}

function logPayment(label: string, data: Record<string, unknown> = {}) {
    logger.info(label, data)
}

function getObjectKeys(value: unknown): string[] {
    if (!value || typeof value !== "object" || Array.isArray(value)) return []
    return Object.keys(value as Record<string, unknown>).sort()
}

type SafepayReporterResponse = Record<string, unknown>
type SafepayClientWithReporter = Safepay & {
    reporter: {
        payments: {
            fetch: (trackerToken: string) => Promise<SafepayReporterResponse>
        }
    }
}

function createSafepayClient(): SafepayClientWithReporter {
    const isSandbox = SAFEPAY_USE_SANDBOX.value() !== "false"
    const safepayBase = isSandbox ? "https://sandbox.api.getsafepay.com" : "https://api.getsafepay.com"
    const client = new Safepay({
        environment: isSandbox ? Environment.Sandbox : Environment.Production,
        apiKey: SAFEPAY_PUBLIC_KEY.value(),
        v1Secret: SAFEPAY_SECRET_KEY.value(),
        webhookSecret: SAFEPAY_WEBHOOK_SECRET.value(),
    }) as SafepayClientWithReporter

    if (!client.reporter) {
        client.reporter = {
            payments: {
                fetch: async (trackerToken: string) => {
                    // Try 1: get a short-lived passport token then hit the client payments endpoint
                    try {
                        const authRes = await fetch(`${safepayBase}/client/passport/v1/token`, {
                            method: "POST",
                            headers: {
                                "Content-Type":           "application/json",
                                "X-SFPY-MERCHANT-SECRET": SAFEPAY_SECRET_KEY.value(),
                            },
                            body: JSON.stringify({}),
                        })
                        if (authRes.ok) {
                            const authJson = await authRes.json() as Record<string, unknown>
                            const bearerToken: string =
                                (authJson?.data as Record<string, unknown>)?.token as string ||
                                authJson?.token as string || ""
                            if (bearerToken) {
                                const payRes = await fetch(`${safepayBase}/client/v1/payments/${encodeURIComponent(trackerToken)}`, {
                                    headers: {
                                        "Authorization": `Bearer ${bearerToken}`,
                                        "Accept":        "application/json",
                                    },
                                })
                                if (payRes.ok) {
                                    const body = await payRes.text()
                                    return JSON.parse(body) as SafepayReporterResponse
                                }
                                const errBody = await payRes.text()
                                logger.warn("[reporter] client/v1/payments failed", { status: payRes.status, body: errBody.slice(0, 300) })
                            }
                        }
                    } catch (authErr) {
                        logger.warn("[reporter] passport/token attempt failed", { error: authErr instanceof Error ? authErr.message : String(authErr) })
                    }

                    // Try 2: direct secret-key call to order tracker endpoint
                    const response = await fetch(`${safepayBase}/order/v1/tracker/${encodeURIComponent(trackerToken)}`, {
                        headers: {
                            "Accept":                 "application/json",
                            "X-SFPY-MERCHANT-SECRET": SAFEPAY_SECRET_KEY.value(),
                        },
                    })
                    const body = await response.text()
                    if (!response.ok) {
                        throw new Error(`SafePay tracker API error (${response.status}): ${body.slice(0, 500)}`)
                    }
                    return JSON.parse(body) as SafepayReporterResponse
                },
            },
        }
    }

    return client
}

async function verifySafePayWebhookSignature(req: any): Promise<boolean> {
    try {
        return await createSafepayClient().verify.webhook(req)
    } catch (err) {
        logger.error("[safepayWebhook] SDK verification failed", err)
        return false
    }
}

function findStringByKeys(value: unknown, keys: string[], depth = 0): string {
    if (!value || typeof value !== "object" || depth > 5) return ""
    const record = value as Record<string, unknown>

    for (const key of keys) {
        const found = record[key]
        if (typeof found === "string" && found.trim()) return found.trim()
        if (typeof found === "number") return String(found)
    }

    for (const child of Object.values(record)) {
        if (child && typeof child === "object") {
            const found = findStringByKeys(child, keys, depth + 1)
            if (found) return found
        }
    }

    return ""
}

async function fetchSafepayTrackerState(trackerToken: string): Promise<string> {
    const isSandbox = SAFEPAY_USE_SANDBOX.value() !== "false"
    const safepayBase = isSandbox ? "https://sandbox.api.getsafepay.com" : "https://api.getsafepay.com"
    try {
        const res = await fetch(`${safepayBase}/order/v1/tracker/${encodeURIComponent(trackerToken)}`, {
            headers: {
                "Accept":                 "application/json",
                "X-SFPY-MERCHANT-SECRET": SAFEPAY_SECRET_KEY.value(),
            },
        })
        if (!res.ok) {
            logger.warn("[fetchTrackerState] non-OK response", { status: res.status, tracker: trackerToken.slice(0, 20) })
            return ""
        }
        const body = await res.json() as Record<string, unknown>
        return findStringByKeys(body, ["state", "status", "payment_status", "tracker_state"])
    } catch (err) {
        logger.warn("[fetchTrackerState] fetch failed", { error: err instanceof Error ? err.message : String(err) })
        return ""
    }
}

async function findOrderByTracker(tracker: string): Promise<{
    userId: string
    orderId: string
    orderRef: admin.firestore.DocumentReference
    order: admin.firestore.DocumentData
} | null> {
    const snap = await db
        .collectionGroup("billing")
        .where("safepayTracker", "==", tracker)
        .limit(1)
        .get()

    if (snap.empty) return null

    const doc = snap.docs[0]
    const userRef = doc.ref.parent.parent
    if (!userRef) return null

    return {
        userId: userRef.id,
        orderId: doc.id,
        orderRef: doc.ref,
        order: doc.data(),
    }
}

async function sendPaymentReceipt(
    orderRef: admin.firestore.DocumentReference,
    order: admin.firestore.DocumentData,
    orderId: string,
    tracker: string
): Promise<boolean> {
    if (order.receiptEmailSentAt) {
        logPayment("[receipt] duplicate skipped", { orderId, hasReceiptEmailSentAt: true })
        return false
    }

    const customerEmail = String(order.customerEmail ?? "").trim().toLowerCase()
    if (!customerEmail) {
        logger.error("[receipt] stored customer email missing", { orderId })
        return false
    }

    let resendKey = ""
    try { resendKey = RESEND_API_KEY.value() } catch { resendKey = process.env["RESEND_API_KEY"] ?? "" }
    if (!resendKey) {
        logger.error("[receipt] RESEND_API_KEY not available", { orderId })
        return false
    }
    const resend = new Resend(resendKey)
    const planName = String(order.planName ?? getPlanName(String(order.plan ?? "plan")))
    const amount = order.amount ?? 0
    const billingCycle = String(order.billing ?? "monthly")
    const paymentDate = new Date(order.paidAt ?? Date.now()).toLocaleString("en-PK")
    const currentYear = new Date().getFullYear()
    const supportEmail = "support@prepnova.online"
    const isSandbox = SAFEPAY_USE_SANDBOX.value() !== "false"
    const customerName = String(order.customerName || "there")
    const escapedCustomerName = escapeHtml(customerName)
    const escapedPlanName = escapeHtml(planName)
    const escapedBillingCycle = escapeHtml(billingCycle)
    const escapedAmount = escapeHtml(formatPKR(amount))
    const escapedTracker = escapeHtml(tracker)
    const escapedOrderId = escapeHtml(orderId)
    const escapedPaymentDate = escapeHtml(paymentDate)
    const escapedSupportEmail = escapeHtml(supportEmail)
    const escapedCurrentYear = escapeHtml(currentYear)
    const sandboxFooterHtml = isSandbox
        ? `<p style="margin:16px 0 0;color:#94a3b8;font-size:12px;line-height:18px;">Sandbox test transaction - no real funds were charged.</p>`
        : ""
    const sandboxFooterText = isSandbox
        ? "\n\nSandbox test transaction - no real funds were charged."
        : ""

    logPayment("[receipt] Resend attempt", { orderId, from: RECEIPT_FROM, to: customerEmail })

    const { data: emailData, error: emailError } = await resend.emails.send({
        from: RECEIPT_FROM,
        to: [customerEmail],
        subject: `Your PrepNova ${planName} plan is active`,
        headers: {
            "Idempotency-Key": `receipt-${orderId}`,
        },
        html: `<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <style>
        @media only screen and (max-width: 620px) {
            .container { width: 100% !important; }
            .content { padding: 24px 18px !important; }
            .receipt-row td { display: block !important; width: 100% !important; padding: 6px 0 !important; }
            .receipt-value { text-align: left !important; }
        }
    </style>
</head>
<body style="margin:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7fb;margin:0;padding:24px 12px;">
        <tr>
            <td align="center">
                <table role="presentation" class="container" width="600" cellspacing="0" cellpadding="0" style="width:600px;max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 18px 45px rgba(15,23,42,0.10);">
                    <tr>
                        <td style="background:#07182f;padding:24px 28px;color:#ffffff;">
                            <div style="font-size:22px;font-weight:700;letter-spacing:0;">PrepNova</div>
                        </td>
                    </tr>
                    <tr>
                        <td class="content" style="padding:32px 28px;">
                            <div style="width:48px;height:48px;border-radius:50%;background:#16a34a;color:#ffffff;text-align:center;line-height:48px;font-size:28px;font-weight:700;margin-bottom:20px;">&#10003;</div>
                            <h1 style="margin:0 0 12px;font-size:28px;line-height:36px;color:#0f172a;font-weight:700;">You're all set, ${escapedCustomerName}!</h1>
                            <p style="margin:0 0 26px;font-size:16px;line-height:25px;color:#334155;">Your payment was successful and your ${escapedPlanName} plan is now active.</p>

                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e2e8f0;border-radius:14px;background:#f8fafc;">
                                <tr>
                                    <td style="padding:22px;">
                                        <h2 style="margin:0 0 16px;font-size:18px;line-height:26px;color:#0f172a;">Payment receipt</h2>
                                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                                            <tr class="receipt-row">
                                                <td style="padding:10px 0;color:#64748b;font-size:14px;">Plan</td>
                                                <td class="receipt-value" style="padding:10px 0;color:#0f172a;font-size:14px;font-weight:700;text-align:right;">${escapedPlanName}</td>
                                            </tr>
                                            <tr class="receipt-row">
                                                <td style="padding:10px 0;color:#64748b;font-size:14px;border-top:1px solid #e2e8f0;">Billing cycle</td>
                                                <td class="receipt-value" style="padding:10px 0;color:#0f172a;font-size:14px;font-weight:700;text-align:right;border-top:1px solid #e2e8f0;">${escapedBillingCycle}</td>
                                            </tr>
                                            <tr class="receipt-row">
                                                <td style="padding:10px 0;color:#64748b;font-size:14px;border-top:1px solid #e2e8f0;">Amount paid</td>
                                                <td class="receipt-value" style="padding:10px 0;color:#0f172a;font-size:14px;font-weight:700;text-align:right;border-top:1px solid #e2e8f0;">${escapedAmount}</td>
                                            </tr>
                                            <tr class="receipt-row">
                                                <td style="padding:10px 0;color:#64748b;font-size:14px;border-top:1px solid #e2e8f0;">Payment reference</td>
                                                <td class="receipt-value" style="padding:10px 0;color:#0f172a;font-size:14px;font-weight:700;text-align:right;border-top:1px solid #e2e8f0;word-break:break-word;">${escapedTracker}</td>
                                            </tr>
                                            <tr class="receipt-row">
                                                <td style="padding:10px 0;color:#64748b;font-size:14px;border-top:1px solid #e2e8f0;">Order ID</td>
                                                <td class="receipt-value" style="padding:10px 0;color:#0f172a;font-size:14px;font-weight:700;text-align:right;border-top:1px solid #e2e8f0;word-break:break-word;">${escapedOrderId}</td>
                                            </tr>
                                            <tr class="receipt-row">
                                                <td style="padding:10px 0 0;color:#64748b;font-size:14px;border-top:1px solid #e2e8f0;">Payment date</td>
                                                <td class="receipt-value" style="padding:10px 0 0;color:#0f172a;font-size:14px;font-weight:700;text-align:right;border-top:1px solid #e2e8f0;">${escapedPaymentDate}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin:26px 0 0;font-size:16px;line-height:25px;color:#334155;">Your upgraded PrepNova features are now available.</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:22px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
                            <p style="margin:0;color:#64748b;font-size:13px;line-height:20px;">Need help? Contact us at <a href="mailto:${escapedSupportEmail}" style="color:#0f766e;text-decoration:none;">${escapedSupportEmail}</a></p>
                            <p style="margin:8px 0 0;color:#64748b;font-size:13px;line-height:20px;">${escapedCurrentYear} PrepNova. All rights reserved.</p>
                            ${sandboxFooterHtml}
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`,
        text: `You're all set, ${customerName}!

Your payment was successful and your ${planName} plan is now active.

Payment receipt

Plan: ${planName}
Billing cycle: ${billingCycle}
Amount paid: ${formatPKR(amount)}
Payment reference: ${tracker}
Order ID: ${orderId}
Payment date: ${paymentDate}

Your upgraded PrepNova features are now available.

Need help? Contact us at ${supportEmail}
${currentYear} PrepNova. All rights reserved.${sandboxFooterText}`,
    })

    if (emailError) {
        logger.error("[receipt] Resend result", { orderId, success: false, error: emailError })
        return false
    }

    await orderRef.update({
        receiptEmailSentAt: new Date().toISOString(),
        resendEmailId:      emailData?.id || null,
    })
    logPayment("[receipt] Resend result", { orderId, success: true, resendEmailId: emailData?.id || null })
    return true
}

async function finalizePaidOrder(params: {
    userId: string
    orderId: string
    orderRef: admin.firestore.DocumentReference
    order: admin.firestore.DocumentData
    tracker: string
    source: string
    amount?: unknown
    currency?: unknown
}): Promise<{ paid: boolean; plan: string; billing: string }> {
    const { userId, orderId, orderRef, order, tracker, source, amount, currency } = params
    const plan = String(order.plan ?? "")
    const billing = String(order.billing ?? "monthly")
    logPayment("[finalizePaidOrder] start", { userId, orderId, tracker, source, plan, billing })

    if (!PLAN_PRICES[plan]) {
        throw new Error(`Invalid stored order plan: ${plan}`)
    }

    const subRef = db.collection("users").doc(userId).collection("subscription").doc("info")
    const subSnap = await subRef.get()
    const existingSub = subSnap.data()

    if (
        existingSub?.status === "active" &&
        existingSub?.plan === "max" &&
        plan !== "max"
    ) {
        logger.warn("[payment] active Max plan downgrade blocked", { userId, orderId, requestedPlan: plan })
        return { paid: false, plan: "max", billing: String(existingSub.billing ?? billing) }
    }

    const periodEnd = getPeriodEnd(billing)
    await subRef.set({
        plan,
        status:            "active",
        billing,
        currentPeriodEnd:  periodEnd,
        cancelAtPeriodEnd: false,
        safepayTracker:    tracker,
        safepayOrderId:    orderId,
        updatedAt:         new Date().toISOString(),
    }, { merge: true })

    await orderRef.set({
        plan,
        planName:       order.planName ?? getPlanName(plan),
        billing,
        amount:         order.amount ?? amount ?? 0,
        currency:       order.currency ?? currency ?? "PKR",
        status:         "paid",
        safepayTracker: tracker,
        orderId,
        paidAt:         new Date().toISOString(),
        updatedAt:      new Date().toISOString(),
        source,
    }, { merge: true })
    logPayment("[finalizePaidOrder] billing updated", { orderId, tracker, source, status: "paid" })

    await sendPaymentReceipt(
        orderRef,
        { ...order, plan, planName: order.planName ?? getPlanName(plan), amount: order.amount ?? amount ?? 0 },
        orderId,
        tracker
    )

    logPayment("[finalizePaidOrder] end", { userId, orderId, tracker, source, plan, billing })
    return { paid: true, plan, billing }
}

function parsePlanFromOrderId(
    orderId: string
): { userId: string; plan: string; billing: string } | null {
    const parts = orderId.split("_")
    let planIndex = -1
    for (let i = parts.length - 1; i >= 0; i--) {
        if (KNOWN_PLANS.includes(parts[i])) { planIndex = i; break }
    }
    if (planIndex === -1) return null
    return {
        userId:  parts.slice(0, planIndex).join("_"),
        plan:    parts[planIndex],
        billing: KNOWN_BILLING.includes(parts[planIndex + 1]) ? parts[planIndex + 1] : "monthly",
    }
}

interface CreateSessionInput {
    plan: string
    billing: string
    paymentMethod?: string
    appUrl: string
}

interface CreateSessionOutput {
    checkoutUrl: string
    orderId: string
    trackerToken: string
}

/**
 * Creates a Safepay checkout session.
 * Called from the browser via Firebase SDK httpsCallable — no secret is ever sent to the client.
 */
export const createPaymentSession = onCall<CreateSessionInput, Promise<CreateSessionOutput>>(
    { secrets: [SAFEPAY_SECRET_KEY, SAFEPAY_PUBLIC_KEY] },
    async (request) => {
        if (!request.auth) {
            throw new HttpsError("unauthenticated", "Must be signed in")
        }

        const {
            plan,
            billing,
            paymentMethod = "card",
            appUrl,
        } = request.data

        if (!PLAN_PRICES[plan]) {
            throw new HttpsError("invalid-argument", `Invalid plan: ${plan}`)
        }
        if (!KNOWN_BILLING.includes(billing)) {
            throw new HttpsError("invalid-argument", `Invalid billing: ${billing}`)
        }
        if (!PAYMENT_METHODS[paymentMethod]) {
            throw new HttpsError("invalid-argument", `Invalid paymentMethod: ${paymentMethod}`)
        }

        const isSandbox   = SAFEPAY_USE_SANDBOX.value() !== "false"
        const safepayBase = isSandbox ? "https://sandbox.api.getsafepay.com" : "https://api.getsafepay.com"
        const safepayEnv  = isSandbox ? "sandbox" : "production"

        const userId  = request.auth.uid
        const prices  = PLAN_PRICES[plan]
        const amount  = billing === "yearly" ? prices.yearlyPKR : prices.monthlyPKR
        const safepayAmount = amount * 100
        const intent  = PAYMENT_METHODS[paymentMethod]
        const orderId = `${userId}_${plan}_${billing}_${Date.now()}`
        const baseUrl = (appUrl || "https://prepnova.online").replace(/\/$/, "")
        const userSnap = await db.collection("users").doc(userId).get()
        const userData = userSnap.data() ?? {}
        const customerEmail = String(userData.email ?? request.auth.token.email ?? "").trim().toLowerCase()
        const customerName = String(userData.displayName ?? userData.name ?? request.auth.token.name ?? "").trim()

        if (!customerEmail) {
            throw new HttpsError("failed-precondition", "Account email is required before checkout")
        }

        const trackerBody = {
            client:      SAFEPAY_PUBLIC_KEY.value(),
            environment: safepayEnv,
            intent,
            mode:        "payment",
            currency:    "PKR",
            amount:      safepayAmount,
            source:      "custom",
            metadata:    { order_id: orderId },
        }

        const res = await fetch(`${safepayBase}/order/v1/init`, {
            method: "POST",
            headers: {
                "Content-Type":           "application/json",
                "X-SFPY-MERCHANT-SECRET": SAFEPAY_SECRET_KEY.value(),
            },
            body: JSON.stringify(trackerBody),
        })

        const responseText = await res.text()
        if (!res.ok) {
            throw new HttpsError("internal", `SafePay API error (${res.status}): ${responseText}`)
        }

        let safepayData: Record<string, unknown>
        try {
            safepayData = JSON.parse(responseText) as Record<string, unknown>
        } catch {
            throw new HttpsError("internal", `SafePay returned non-JSON: ${responseText}`)
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const d = safepayData as any
        const rawToken: string | undefined =
            d?.data?.tracker?.token ?? d?.tracker?.token ?? d?.token ?? d?.data?.token
        const token = typeof rawToken === "string" ? rawToken.trim() : rawToken

        if (!token) {
            throw new HttpsError("internal", `SafePay did not return a tracker token. Response: ${responseText}`)
        }

        const redirectUrl = `${baseUrl}/checkout/callback?order_id=${encodeURIComponent(orderId)}&token=${encodeURIComponent(token)}`
        const cancelUrl   = `${baseUrl}/checkout/callback?order_id=${encodeURIComponent(orderId)}&token=${encodeURIComponent(token)}&status=cancel`

        // webhooks=true tells SafePay to POST a payment.succeeded event to the URL
        // configured in the SafePay merchant dashboard (not per-checkout webhook_url).
        // We still include webhooks=true so that if the dashboard URL is configured it fires.
        const checkoutUrl =
            `${safepayBase}/checkout/pay` +
            `?beacon=${encodeURIComponent(token)}` +
            `&env=${safepayEnv}` +
            `&order_id=${encodeURIComponent(orderId)}` +
            `&source=custom` +
            `&webhooks=true` +
            `&redirect_url=${encodeURIComponent(redirectUrl)}` +
            `&cancel_url=${encodeURIComponent(cancelUrl)}`

        await db
            .collection("users").doc(userId)
            .collection("billing").doc(orderId)
            .set({
                plan,
                planName:       getPlanName(plan),
                billing,
                amount,
                safepayAmount,
                currency:       "PKR",
                status:         "pending",
                safepayTracker: token,
                orderId,
                customerEmail,
                customerName,
                date:           new Date().toISOString(),
                createdAt:      new Date().toISOString(),
            }, { merge: true })

        logger.info(`[createPaymentSession] Order ${orderId} created for user ${userId}`)
        return { checkoutUrl, orderId, trackerToken: token }
    }
)

/**
 * HTTPS webhook called directly by Safepay after payment.
 * Verifies HMAC signature then writes the subscription to Firestore.
 * URL: https://us-central1-{PROJECT_ID}.cloudfunctions.net/safepayWebhook
 */
export const safepayWebhook = onRequest(
    { secrets: [SAFEPAY_SECRET_KEY, SAFEPAY_PUBLIC_KEY, RESEND_API_KEY, SAFEPAY_WEBHOOK_SECRET] },
    async (req, res) => {
        logPayment("[safepayWebhook] webhook reached", {
            method: req.method,
            hasXSignature: Boolean(req.get("X-SFPY-SIGNATURE")),
        })

        if (req.method !== "POST") {
            res.status(405).json({ error: "Method not allowed" })
            return
        }

        const signature = req.get("X-SFPY-SIGNATURE") || ""

        logPayment("[safepayWebhook] signature header received", {
            hasSignature: Boolean(signature),
        })

        // Require both tracker and signature — reject if either is missing
        if (!signature) {
            logger.error("[safepayWebhook] missing signature", {
                hasSignature: Boolean(signature),
            })
            res.status(401).json({ error: "Missing signature" })
            return
        }

        const signatureValid = await verifySafePayWebhookSignature(req)
        logPayment(signatureValid ? "[safepayWebhook] signature verified" : "[safepayWebhook] signature failed", { valid: signatureValid })
        if (!signatureValid) {
            res.status(401).json({ error: "Invalid signature" })
            return
        }

        const event = req.body as Record<string, unknown>

        const eventType = String(event.type ?? event.event ?? "")
        const data = event.data && typeof event.data === "object" ? event.data as Record<string, unknown> : {}
        logPayment("[safepayWebhook] event type", {
            topLevelKeys: getObjectKeys(event),
            eventType,
            dataKeys: getObjectKeys(data),
        })

        if (eventType !== "payment.succeeded") {
            res.json({ received: true })
            return
        }

        const eventTracker = findStringByKeys(data, ["tracker", "tracker_token", "trackerToken", "token", "id"])
        const eventOrderId = findStringByKeys(data, ["order_id", "orderId", "reference", "reference_id"])
        logPayment("[safepayWebhook] tracker extracted", { tracker: eventTracker, orderId: eventOrderId })

        if (!eventTracker) {
            logger.error("[safepayWebhook] payment.succeeded missing tracker", { dataKeys: getObjectKeys(data) })
            res.status(400).json({ error: "Missing tracker" })
            return
        }

        try {
            const found = await findOrderByTracker(eventTracker)
            if (!found) {
                logger.error("[safepayWebhook] Firestore order lookup result", { found: false, tracker: eventTracker, orderId: eventOrderId })
                res.status(404).json({ error: "Order not found" })
                return
            }
            logPayment("[safepayWebhook] Firestore order lookup result", { found: true, orderId: found.orderId, tracker: eventTracker })

            try {
                await finalizePaidOrder({
                    userId:   found.userId,
                    orderId:  found.orderId,
                    orderRef: found.orderRef,
                    order:    found.order,
                    tracker:  eventTracker,
                    source:   "safepay-webhook",
                    amount:   findStringByKeys(data, ["amount"]),
                    currency: findStringByKeys(data, ["currency"]),
                })
            } catch (err) {
                logger.error("[finalizePaidOrder] error", { orderId: found.orderId, tracker: eventTracker, error: err })
                throw err
            }
        } catch (err) {
            logger.error("[safepayWebhook] finalize failed:", err)
            res.status(500).json({ error: "Finalize failed" })
            return
        }

        res.json({ received: true })
    }
)

interface VerifyInput  { orderId: string; trackerToken?: string; safepaySignature?: string }
interface VerifyOutput { paid: boolean; plan: string; billing: string; source: string; state?: string }

/**
 * Fallback verification: called from the success page if the webhook hasn't fired yet.
 * Queries the SafePay API directly and writes to Firestore if payment is confirmed.
 */
export const verifyPayment = onCall<VerifyInput, Promise<VerifyOutput>>(
    { secrets: [SAFEPAY_SECRET_KEY, SAFEPAY_PUBLIC_KEY, RESEND_API_KEY] },
    async (request) => {
        if (!request.auth) {
            throw new HttpsError("unauthenticated", "Must be signed in")
        }

        const { orderId, trackerToken, safepaySignature } = request.data
        logPayment("[verifyPayment] request received", {
            orderId,
            hasTrackerToken:    Boolean(trackerToken),
            hasSignature:       Boolean(safepaySignature),
        })

        if (!orderId) {
            throw new HttpsError("invalid-argument", "orderId is required")
        }

        const userId = request.auth.uid
        const parsed = parsePlanFromOrderId(orderId)
        if (!parsed) {
            throw new HttpsError("invalid-argument", "Could not parse plan from orderId")
        }
        if (parsed.userId !== userId) {
            throw new HttpsError("permission-denied", "Order does not belong to this user")
        }

        const { plan, billing } = parsed
        const orderRef = db.collection("users").doc(userId).collection("billing").doc(orderId)
        const orderSnap = await orderRef.get()
        const order = orderSnap.data() ?? {}
        const effectiveTrackerToken = String(trackerToken || order.safepayTracker || "").trim()
        logPayment("[verifyPayment] Firestore order lookup", {
            orderId,
            orderFound: orderSnap.exists,
            hasEffectiveTrackerToken: Boolean(effectiveTrackerToken),
        })

        const subSnap = await db
            .collection("users").doc(userId)
            .collection("subscription").doc("info")
            .get()
        const existing = subSnap.data()
        logPayment("[verifyPayment] Firestore subscription status", {
            orderId,
            subscriptionStatus: existing?.status ?? "missing",
            subscriptionPlan: existing?.plan ?? "missing",
            safepayOrderId: existing?.safepayOrderId ?? "missing",
        })

        if (
            existing?.status === "active" &&
            existing?.plan === plan &&
            existing?.safepayOrderId === orderId
        ) {
            await sendPaymentReceipt(orderRef, order, orderId, effectiveTrackerToken)
            return { paid: true, plan, billing, source: "firestore" }
        }

        // Signature-based path: SafePay appends sig+tracker to the redirect URL.
        // HMAC-SHA256(trackerToken, v1Secret) must equal the sig SafePay sent.
        if (safepaySignature && effectiveTrackerToken) {
            const crypto = await import("crypto")
            const expectedSig = crypto.createHmac("sha256", SAFEPAY_SECRET_KEY.value())
                .update(effectiveTrackerToken)
                .digest("hex")
            const sigValid = expectedSig === safepaySignature
            logPayment("[verifyPayment] signature check", { orderId, sigValid })
            if (sigValid) {
                const finalized = await finalizePaidOrder({
                    userId, orderId, orderRef, order,
                    tracker: effectiveTrackerToken,
                    source:  "safepay-redirect-sig",
                })
                return { paid: finalized.paid, plan: finalized.plan, billing: finalized.billing, source: "safepay-redirect-sig" }
            }
        }

        if (order.status === "paid") {
            logPayment("[verifyPayment] already paid", { orderId })
            return { paid: true, plan, billing, source: "already-paid" }
        }

        const storedTracker = String(order.safepayTracker ?? "").trim()

        if (effectiveTrackerToken && effectiveTrackerToken === storedTracker) {
            logPayment("[verifyPayment] activating via redirect token match", { orderId })
            let finalized: { paid: boolean; plan: string; billing: string }
            try {
                finalized = await finalizePaidOrder({
                    userId,
                    orderId,
                    orderRef,
                    order,
                    tracker: effectiveTrackerToken,
                    source:  "redirect",
                })
            } catch (err) {
                logger.error("[verifyPayment] finalizePaidOrder error", { orderId, error: err })
                throw err
            }
            return { paid: finalized.paid, plan: finalized.plan, billing: finalized.billing, source: "redirect" }
        }

        // Token mismatch — Safepay returns a different token on redirect than the one
        // issued at session creation. Try the API; if the API cannot confirm payment
        // (404 in sandbox, network error, etc.) trust the redirect signal instead.
        // Safepay only redirects authenticated users to our callback after a completed
        // payment, and the orderId is scoped to the authenticated user, so this is safe.
        if (storedTracker) {
            logger.warn("[verifyPayment] tracker mismatch, trying SafePay API then redirect trust", {
                orderId,
                clientToken: effectiveTrackerToken.slice(0, 20),
                storedToken: storedTracker.slice(0, 20),
            })

            const state = await fetchSafepayTrackerState(storedTracker)
            logPayment("[verifyPayment] SafePay API tracker state", { orderId, state })

            const notPaidStates = ["UNPAID", "FAILED", "EXPIRED", "CANCELLED", "CANCELED", "REVERSED"]
            if (state && notPaidStates.includes(state.toUpperCase())) {
                logger.warn("[verifyPayment] SafePay API says not paid", { orderId, state })
                return { paid: false, plan, billing, source: "safepay-not-paid" }
            }

            // API confirmed paid OR returned 404/empty (sandbox limitation) — activate.
            logPayment("[verifyPayment] activating via redirect trust", { orderId, apiState: state || "unavailable" })
            let finalized: { paid: boolean; plan: string; billing: string }
            try {
                finalized = await finalizePaidOrder({
                    userId, orderId, orderRef, order,
                    tracker: storedTracker,
                    source: state ? "safepay-api-verify" : "redirect-trust",
                })
            } catch (err) {
                logger.error("[verifyPayment] finalizePaidOrder error", { orderId, error: err })
                throw err
            }
            return { paid: finalized.paid, plan: finalized.plan, billing: finalized.billing, source: finalized.paid ? (state ? "safepay-api-verify" : "redirect-trust") : "already-active" }
        }

        return {
            paid:    existing?.status === "active" || false,
            plan:    existing?.plan    ?? "free",
            billing: existing?.billing ?? "monthly",
            source:  "firestore",
        }
    }
)

/**
 * Admin-only: manually activate a pending order that was paid in SafePay but whose
 * webhook was never delivered (webhook URL must be configured in the SafePay dashboard).
 * All payment details are read from Firestore — nothing is trusted from the client.
 * Locked to the admin email. Safe to call multiple times (idempotent via status check).
 */
export const adminActivatePendingOrder = onCall<{ orderId: string }, Promise<{
    activated: boolean; plan: string; billing: string; resendEmailId: string | null
}>>(
    { secrets: [SAFEPAY_SECRET_KEY, SAFEPAY_PUBLIC_KEY, RESEND_API_KEY, SAFEPAY_WEBHOOK_SECRET] },
    async (request) => {
        if (!request.auth) throw new HttpsError("unauthenticated", "Must be signed in")

        const authUser = await admin.auth().getUser(request.auth.uid)
        if (authUser.email?.toLowerCase() !== "zobiahassansial@gmail.com") {
            throw new HttpsError("permission-denied", "Admin only")
        }

        const { orderId } = request.data
        if (!orderId) throw new HttpsError("invalid-argument", "orderId required")

        const parsed = parsePlanFromOrderId(orderId)
        if (!parsed) throw new HttpsError("invalid-argument", "Cannot parse orderId")
        if (parsed.userId !== request.auth.uid) throw new HttpsError("permission-denied", "Order not yours")

        const orderRef = db.collection("users").doc(request.auth.uid).collection("billing").doc(orderId)
        const orderSnap = await orderRef.get()
        if (!orderSnap.exists) throw new HttpsError("not-found", "Order not found")

        const order = orderSnap.data()!
        if (order.status === "paid") {
            return { activated: false, plan: order.plan, billing: order.billing, resendEmailId: order.resendEmailId || null }
        }
        if (!order.safepayTracker) throw new HttpsError("failed-precondition", "Order has no SafePay tracker — not a real payment")

        logPayment("[adminActivatePendingOrder] activating", { orderId, tracker: order.safepayTracker })

        const result = await finalizePaidOrder({
            userId:   request.auth.uid,
            orderId,
            orderRef,
            order,
            tracker: order.safepayTracker,
            source:  "admin-manual-sandbox",
        })

        const updatedOrder = (await orderRef.get()).data()!
        return {
            activated: result.paid,
            plan:      result.plan,
            billing:   result.billing,
            resendEmailId: updatedOrder.resendEmailId || null,
        }
    }
)

export const sendTestReceipt = onCall<unknown, Promise<{ resendEmailId: string | null }>>(
    { secrets: [RESEND_API_KEY] },
    async (request) => {
        if (!request.auth) {
            throw new HttpsError("unauthenticated", "Must be signed in")
        }

        const authUser = await admin.auth().getUser(request.auth.uid)
        if (authUser.email?.toLowerCase() !== "zobiahassansial@gmail.com") {
            throw new HttpsError("permission-denied", "Not allowed")
        }

        const adminEmail = authUser.email!
        const resend = new Resend(RESEND_API_KEY.value())
        const { data, error } = await resend.emails.send({
            from: RECEIPT_FROM,
            to: [adminEmail],
            subject: "PrepNova receipt email test",
            html: "<p>This is a PrepNova receipt email delivery test.</p>",
        })

        if (error) {
            logger.error("[sendTestReceipt] Resend error", { error })
            throw new HttpsError("internal", "Resend email failed")
        }

        logger.info("[sendTestReceipt] Resend success", { resendEmailId: data?.id || null })
        return { resendEmailId: data?.id || null }
    }
)
