"use client"

import { useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

function CallbackContent() {
    const searchParams = useSearchParams()
    const router = useRouter()

    useEffect(() => {
        const orderId = searchParams.get("order_id") || ""
        const cancelled = searchParams.get("status") === "cancel"
        // SafePay sometimes appends its own token param — pass it along for verification
        const token = searchParams.get("token") || searchParams.get("beacon") || ""

        const payload = { type: "SAFEPAY_CALLBACK", success: !cancelled, orderId, token }
        const origin = window.location.origin

        if (window.opener && !window.opener.closed) {
            // Opened as a popup — notify parent tab and close
            window.opener.postMessage(payload, origin)
            window.close()
        } else if (window.parent !== window) {
            // Inside an iframe — notify parent frame
            window.parent.postMessage(payload, origin)
        } else {
            // Direct navigation — redirect normally
            if (cancelled) {
                router.replace(`/checkout/cancel?order_id=${encodeURIComponent(orderId)}`)
            } else {
                router.replace(`/checkout/success?order_id=${encodeURIComponent(orderId)}&token=${encodeURIComponent(token)}`)
            }
        }
    }, [searchParams, router])

    return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    )
}

export default function CallbackPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <CallbackContent />
        </Suspense>
    )
}
