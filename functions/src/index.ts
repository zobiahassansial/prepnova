import { onCall, onRequest, HttpsError } from "firebase-functions/v2/https"
import { logger } from "firebase-functions"
import { defineSecret, defineString } from "firebase-functions/params"
import * as admin from "firebase-admin"
import * as crypto from "crypto"

admin.initializeApp()
const db = admin.firestore()

const SAFEPAY_SECRET_KEY = defineSecret("SAFEPAY_SECRET_KEY")
const SAFEPAY_PUBLIC_KEY  = defineSecret("SAFEPAY_PUBLIC_KEY")

// Set to "false" only when you have live Safepay credentials and are ready for production.
// Default: "true" (sandbox). Change with: firebase functions:params:set SAFEPAY_USE_SANDBOX=false
const SAFEPAY_USE_SANDBOX  = defineString("SAFEPAY_USE_SANDBOX",  { default: "true" })
// Full URL of the safepayWebhook Cloud Function. Update functions/.env after each deploy if it changes.
const SAFEPAY_WEBHOOK_URL  = defineString("SAFEPAY_WEBHOOK_URL",  { default: "" })

// Resolved inside each function via SAFEPAY_USE_SANDBOX.value()

const PLAN_PRICES: Record<string, { monthlyPKR: number; yearlyPKR: number }> = {
    standard: { monthlyPKR: 1680,  yearlyPKR: 16800 },
    pro:      { monthlyPKR: 3360,  yearlyPKR: 33600 },
    max:      { monthlyPKR: 5600,  yearlyPKR: 56000 },
}

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
        const intent  = PAYMENT_METHODS[paymentMethod]
        const orderId = `${userId}_${plan}_${billing}_${Date.now()}`
        const baseUrl = (appUrl || "https://prepnova.online").replace(/\/$/, "")

        const webhookUrl = SAFEPAY_WEBHOOK_URL.value() ||
            `https://us-central1-${process.env.GCLOUD_PROJECT}.cloudfunctions.net/safepayWebhook`

        const trackerBody = {
            client:      SAFEPAY_PUBLIC_KEY.value(),
            environment: safepayEnv,
            intent,
            mode:        "payment",
            currency:    "PKR",
            amount,
            source:      "custom",
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
        const token: string | undefined =
            d?.data?.tracker?.token ?? d?.tracker?.token ?? d?.token ?? d?.data?.token

        if (!token) {
            throw new HttpsError("internal", `SafePay did not return a tracker token. Response: ${responseText}`)
        }

        const redirectUrl = `${baseUrl}/checkout/callback?order_id=${encodeURIComponent(orderId)}`
        const cancelUrl   = `${baseUrl}/checkout/callback?order_id=${encodeURIComponent(orderId)}&status=cancel`

        const checkoutUrl =
            `${safepayBase}/checkout/pay` +
            `?beacon=${encodeURIComponent(token)}` +
            `&env=${safepayEnv}` +
            `&order_id=${encodeURIComponent(orderId)}` +
            `&source=custom` +
            `&redirect_url=${encodeURIComponent(redirectUrl)}` +
            `&cancel_url=${encodeURIComponent(cancelUrl)}` +
            `&webhook_url=${encodeURIComponent(webhookUrl)}`

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
    { secrets: [SAFEPAY_SECRET_KEY] },
    async (req, res) => {
        if (req.method !== "POST") {
            res.status(405).json({ error: "Method not allowed" })
            return
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const body      = req.body as any
        const tracker   = String(body?.notification?.tracker ?? body?.token ?? "")
        const signature = String(body?.signature ?? "")

        if (tracker && signature) {
            try {
                const expected = crypto
                    .createHmac("sha256", SAFEPAY_SECRET_KEY.value())
                    .update(tracker)
                    .digest("hex")
                const expBuf = Buffer.from(expected, "hex")
                const sigBuf = Buffer.from(signature, "hex")
                const valid  =
                    expBuf.length === sigBuf.length &&
                    crypto.timingSafeEqual(expBuf, sigBuf)
                if (!valid) {
                    logger.error("[safepayWebhook] Invalid HMAC signature")
                    res.status(401).json({ error: "Invalid signature" })
                    return
                }
            } catch (err) {
                logger.error("[safepayWebhook] Signature check threw:", err)
                res.status(401).json({ error: "Signature check failed" })
                return
            }
        }

        const state = String(body?.notification?.state ?? body?.state ?? "").toUpperCase()
        if (!["PAID", "SETTLED", "COMPLETED"].includes(state)) {
            res.json({ received: true })
            return
        }

        const orderId = String(body?.notification?.metadata?.order_id ?? body?.order_id ?? "")
        const parsed  = parsePlanFromOrderId(orderId)
        if (!parsed || !parsed.userId) {
            logger.error("[safepayWebhook] Could not parse orderId:", orderId)
            res.json({ received: true })
            return
        }

        const { userId, plan, billing } = parsed
        const periodEnd = getPeriodEnd(billing)

        try {
            await db
                .collection("users").doc(userId)
                .collection("subscription").doc("info")
                .set({
                    plan,
                    status:            "active",
                    billing,
                    currentPeriodEnd:  periodEnd,
                    cancelAtPeriodEnd: false,
                    safepayTracker:    tracker,
                    safepayOrderId:    orderId,
                    updatedAt:         new Date().toISOString(),
                })

            await db
                .collection("users").doc(userId)
                .collection("billing")
                .add({
                    plan,
                    billing,
                    amount:         body?.notification?.amount   ?? 0,
                    currency:       body?.notification?.currency ?? "PKR",
                    status:         "paid",
                    safepayTracker: tracker,
                    orderId,
                    date:           new Date().toISOString(),
                })

            logger.info(`[safepayWebhook] Activated: user=${userId} plan=${plan} billing=${billing}`)
        } catch (err) {
            logger.error("[safepayWebhook] Firestore write failed:", err)
            res.status(500).json({ error: "DB write failed" })
            return
        }

        res.json({ received: true })
    }
)

interface VerifyInput  { orderId: string; trackerToken?: string }
interface VerifyOutput { paid: boolean; plan: string; billing: string; source: string; state?: string }

/**
 * Fallback verification: called from the success page if the webhook hasn't fired yet.
 * Queries the SafePay API directly and writes to Firestore if payment is confirmed.
 */
export const verifyPayment = onCall<VerifyInput, Promise<VerifyOutput>>(
    { secrets: [SAFEPAY_SECRET_KEY] },
    async (request) => {
        if (!request.auth) {
            throw new HttpsError("unauthenticated", "Must be signed in")
        }

        const { orderId, trackerToken } = request.data
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

        const subSnap = await db
            .collection("users").doc(userId)
            .collection("subscription").doc("info")
            .get()
        const existing = subSnap.data()

        if (
            existing?.status === "active" &&
            existing?.plan === plan &&
            existing?.safepayOrderId === orderId
        ) {
            return { paid: true, plan, billing, source: "firestore" }
        }

        if (trackerToken) {
            const isSandbox   = SAFEPAY_USE_SANDBOX.value() !== "false"
            const safepayBase = isSandbox ? "https://sandbox.api.getsafepay.com" : "https://api.getsafepay.com"
            const safepayEnv  = isSandbox ? "sandbox" : "production"
            let state = "UNKNOWN"
            try {
                const r = await fetch(
                    `${safepayBase}/order/v1/init?token=${encodeURIComponent(trackerToken)}&env=${safepayEnv}`,
                    { headers: { "X-SFPY-MERCHANT-SECRET": SAFEPAY_SECRET_KEY.value() } }
                )
                if (r.ok) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const d: any = await r.json()
                    state = String(d?.data?.tracker?.state ?? d?.tracker?.state ?? d?.state ?? "UNKNOWN").toUpperCase()
                }
            } catch { /* fall through to Firestore state */ }

            if (["PAID", "SETTLED", "COMPLETED", "SUCCESS"].includes(state)) {
                const periodEnd = getPeriodEnd(billing)
                await db.collection("users").doc(userId).collection("subscription").doc("info").set({
                    plan,
                    status:            "active",
                    billing,
                    currentPeriodEnd:  periodEnd,
                    cancelAtPeriodEnd: false,
                    safepayTracker:    trackerToken,
                    safepayOrderId:    orderId,
                    updatedAt:         new Date().toISOString(),
                })
                await db.collection("users").doc(userId).collection("billing").add({
                    plan,
                    billing,
                    amount:         0,
                    currency:       "PKR",
                    status:         "paid",
                    safepayTracker: trackerToken,
                    orderId,
                    date:           new Date().toISOString(),
                    source:         "verify-endpoint",
                })
                return { paid: true, plan, billing, source: "safepay-api" }
            }

            return { paid: false, plan, billing, source: "safepay-api", state }
        }

        return {
            paid:    existing?.status === "active" || false,
            plan:    existing?.plan    ?? "free",
            billing: existing?.billing ?? "monthly",
            source:  "firestore",
        }
    }
)
