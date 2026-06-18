import { NextResponse } from "next/server"

// Replaced by Firebase Cloud Function `createPaymentSession`.
// The frontend now calls it directly via httpsCallable — no Next.js proxy needed.
export async function POST() {
    return NextResponse.json(
        { error: "This endpoint has moved. Use the Firebase Cloud Function 'createPaymentSession'." },
        { status: 410 }
    )
}
