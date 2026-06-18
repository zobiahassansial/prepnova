// Shared constants and types used by both the frontend and Cloud Functions.
// Secret-key operations (createTracker, getTrackerState, verifyWebhookSignature)
// have moved to Firebase Cloud Functions — see functions/src/index.ts.

export const SAFEPAY_BASE =
    process.env.NODE_ENV === "production"
        ? "https://api.getsafepay.com"
        : "https://sandbox.api.getsafepay.com"

export const PLAN_PRICES: Record<string, {
    monthly: number
    yearly: number
    monthlyPKR: number
    yearlyPKR: number
    label: string
}> = {
    standard: { monthly: 5.99,  yearly: 59.99,  monthlyPKR: 1680,  yearlyPKR: 16800,  label: "Standard Plan" },
    pro:      { monthly: 11.99, yearly: 119.99, monthlyPKR: 3360,  yearlyPKR: 33600,  label: "Pro Plan"      },
    max:      { monthly: 19.99, yearly: 199.99, monthlyPKR: 5600,  yearlyPKR: 56000,  label: "Max Plan"      },
}

export const PAYMENT_METHODS = {
    card:      { label: "Visa / Mastercard", intent: "CYBERSOURCE"   },
    jazzcash:  { label: "JazzCash",          intent: "JAZZCASH_V2"   },
    easypaisa: { label: "EasyPaisa",         intent: "EASYPAISA_MA"  },
    bank:      { label: "Bank Transfer",     intent: "NIFT_TRANSFER" },
} as const

export type PaymentMethodKey = keyof typeof PAYMENT_METHODS

export interface TrackerResult {
    token: string
    checkoutUrl: string
}
