import "server-only"
import crypto from "crypto"

export const SAFEPAY_BASE =
    process.env.NODE_ENV === "production"
        ? "https://api.getsafepay.com"
        : "https://sandbox.api.getsafepay.com"

export const SAFEPAY_ENV =
    process.env.NODE_ENV === "production" ? "production" : "sandbox"

// USD display prices + PKR amounts (SafePay sandbox works with PKR)
export const PLAN_PRICES: Record<string, {
    monthly: number        // USD display
    yearly: number         // USD display
    monthlyPKR: number     // PKR sent to SafePay
    yearlyPKR: number      // PKR sent to SafePay
    label: string
}> = {
    standard: { monthly: 5.99,  yearly: 59.99,  monthlyPKR: 1680,  yearlyPKR: 16800,  label: "Standard Plan" },
    pro:      { monthly: 11.99, yearly: 119.99, monthlyPKR: 3360,  yearlyPKR: 33600,  label: "Pro Plan"      },
    max:      { monthly: 19.99, yearly: 199.99, monthlyPKR: 5600,  yearlyPKR: 56000,  label: "Max Plan"      },
}

export interface TrackerResult {
    token: string
    checkoutUrl: string
}

/**
 * Extracts the tracker token from any SafePay response shape.
 */
function extractToken(data: any): string | null {
    // Log full response in dev for debugging
    if (process.env.NODE_ENV !== "production") {
        console.log("[SafePay] Full API response:", JSON.stringify(data, null, 2))
    }
    return (
        data?.data?.tracker?.token ??
        data?.tracker?.token ??
        data?.token ??
        data?.data?.token ??
        null
    )
}

/**
 * Creates a SafePay payment tracker and returns the hosted checkout URL.
 */
export async function createTracker(
    plan: string,
    billing: "monthly" | "yearly",
    orderId: string,
    appUrl: string
): Promise<TrackerResult> {
    const prices = PLAN_PRICES[plan]
    if (!prices) throw new Error(`Unknown plan: ${plan}`)

    const amount = billing === "yearly" ? prices.yearlyPKR : prices.monthlyPKR

    const body = {
        client: process.env.SAFEPAY_PUBLIC_KEY,
        environment: SAFEPAY_ENV,
        intent: "CYBERSOURCE",
        mode: "payment",
        currency: "PKR",
        amount,
        source: "custom",
    }

    console.log("[SafePay] Creating tracker:", { plan, billing, amount, orderId })
    console.log("[SafePay] Request body:", JSON.stringify(body))

    const res = await fetch(`${SAFEPAY_BASE}/order/v1/init`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-SFPY-MERCHANT-SECRET": process.env.SAFEPAY_SECRET_KEY!,
        },
        body: JSON.stringify(body),
    })

    const responseText = await res.text()
    console.log("[SafePay] Response status:", res.status)
    console.log("[SafePay] Response body:", responseText)

    if (!res.ok) {
        throw new Error(`SafePay API error (${res.status}): ${responseText}`)
    }

    let data: any
    try {
        data = JSON.parse(responseText)
    } catch {
        throw new Error(`SafePay returned non-JSON response: ${responseText}`)
    }

    const token = extractToken(data)
    if (!token) {
        throw new Error(
            `SafePay did not return a tracker token. Response: ${JSON.stringify(data)}`
        )
    }

    const webhookUrl  = `${appUrl}/api/checkout/webhook`
    const redirectUrl = `${appUrl}/checkout/success?order_id=${encodeURIComponent(orderId)}`
    const cancelUrl   = `${appUrl}/checkout/cancel?order_id=${encodeURIComponent(orderId)}`

    // SafePay expects the tracker as ?beacon= query param, not a path segment
    const checkoutUrl =
        `${SAFEPAY_BASE}/checkout/pay` +
        `?beacon=${encodeURIComponent(token)}` +
        `&env=${SAFEPAY_ENV}` +
        `&order_id=${encodeURIComponent(orderId)}` +
        `&source=custom` +
        `&redirect_url=${encodeURIComponent(redirectUrl)}` +
        `&cancel_url=${encodeURIComponent(cancelUrl)}` +
        `&webhook_url=${encodeURIComponent(webhookUrl)}`

    console.log("[SafePay] Checkout URL:", checkoutUrl)

    return { token, checkoutUrl }
}

/**
 * Verifies a SafePay webhook HMAC-SHA256 signature.
 */
export function verifyWebhookSignature(trackerToken: string, receivedSignature: string): boolean {
    try {
        const expected = crypto
            .createHmac("sha256", process.env.SAFEPAY_SECRET_KEY!)
            .update(trackerToken)
            .digest("hex")
        return crypto.timingSafeEqual(
            Buffer.from(expected, "hex"),
            Buffer.from(receivedSignature, "hex")
        )
    } catch {
        return false
    }
}

/**
 * Calculates subscription expiry date.
 */
export function getPeriodEnd(billing: "monthly" | "yearly"): Date {
    const d = new Date()
    billing === "yearly" ? d.setFullYear(d.getFullYear() + 1) : d.setMonth(d.getMonth() + 1)
    return d
}
