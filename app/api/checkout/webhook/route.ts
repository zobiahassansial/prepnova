import { NextResponse } from "next/server"

// Replaced by Firebase Cloud Function `safepayWebhook`.
// New Safepay orders point their webhook URL to the Cloud Function.
// Returns 200 so Safepay does not retry stale webhook deliveries to this path.
export async function POST() {
    return NextResponse.json({ received: true })
}
