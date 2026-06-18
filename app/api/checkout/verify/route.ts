import { NextResponse } from "next/server"

// Replaced by Firebase Cloud Function `verifyPayment`.
// The frontend now calls it directly via httpsCallable.
export async function POST() {
    return NextResponse.json(
        { error: "This endpoint has moved. Use the Firebase Cloud Function 'verifyPayment'." },
        { status: 410 }
    )
}
