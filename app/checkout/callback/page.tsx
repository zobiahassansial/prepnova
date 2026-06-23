"use client"

import { useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

function CallbackContent() {
    const searchParams = useSearchParams()
    const router = useRouter()

    useEffect(() => {
        const orderId   = searchParams.get("order_id") || ""
        const cancelled = searchParams.get("status")   === "cancel"
        // SafePay appends its own beacon/token and, for signed redirects, sig+tracker
        const token  = searchParams.get("token")   || searchParams.get("beacon")  || ""
        const sig    = searchParams.get("sig")      || ""
        const trackerFromSafepay = searchParams.get("tracker") || token

        const payload = { type: "SAFEPAY_CALLBACK", success: !cancelled, orderId, token, sig, tracker: trackerFromSafepay }
        const origin  = window.location.origin

        if (window.opener && !window.opener.closed) {
            window.opener.postMessage(payload, origin)
            window.close()
        } else if (window.parent !== window) {
            window.parent.postMessage(payload, origin)
        } else {
            if (cancelled) {
                router.replace(`/checkout/cancel?order_id=${encodeURIComponent(orderId)}`)
            } else {
                const qs = new URLSearchParams({ order_id: orderId, token })
                if (sig)              qs.set("sig",     sig)
                if (trackerFromSafepay) qs.set("tracker", trackerFromSafepay)
                router.replace(`/checkout/success?${qs.toString()}`)
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
