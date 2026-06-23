import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { RotateCcw } from "lucide-react"

export const metadata = {
    title: "Cancellation & Refund Policy — PrepNova",
    description: "PrepNova's policy on cancellations, returns, and refunds.",
}

export default function CancellationPolicyPage() {
    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            <Navbar />
            <main className="flex-1 pt-28 pb-20">
                <div className="container px-4 md:px-6 mx-auto max-w-3xl">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <RotateCcw className="h-5 w-5 text-primary" />
                        </div>
                        <p className="text-sm text-muted-foreground">Last updated: June 22, 2026</p>
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight mb-3">Cancellation &amp; Refund Policy</h1>
                    <p className="text-muted-foreground text-lg mb-10 leading-relaxed">
                        This policy explains how cancellations, returns, and refunds work for PrepNova subscriptions and purchases.
                    </p>

                    <div className="space-y-10">

                        <section className="space-y-3">
                            <h2 className="text-xl font-semibold text-foreground">1. Subscription Cancellations</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                You may cancel your PrepNova subscription at any time from your <span className="text-foreground font-medium">Account Settings → Subscription</span> page. Cancellation takes effect at the end of the current billing period — you retain full access to your plan features until then.
                            </p>
                            <ul className="space-y-2 text-muted-foreground list-disc pl-5">
                                <li>No partial refunds are issued for unused days remaining in the billing period after cancellation.</li>
                                <li>Your account reverts to the Free plan once the paid period ends.</li>
                                <li>All data you have created (resumes, flashcard decks, summaries) is preserved and remains accessible on the Free plan subject to free-tier limits.</li>
                            </ul>
                        </section>

                        <div className="border-t border-border/60" />

                        <section className="space-y-3">
                            <h2 className="text-xl font-semibold text-foreground">2. Refund Eligibility</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                Because PrepNova is a digital subscription service with immediate access to AI-powered features, all payments are generally <span className="text-foreground font-medium">non-refundable</span>. However, we consider refund requests in the following circumstances:
                            </p>
                            <ul className="space-y-2 text-muted-foreground list-disc pl-5">
                                <li><span className="text-foreground font-medium">Accidental double charge:</span> If you were billed twice for the same period, we will issue a full refund for the duplicate charge.</li>
                                <li><span className="text-foreground font-medium">Technical failure:</span> If a verified technical issue on our end prevented you from accessing any paid features for more than 72 consecutive hours and we were unable to resolve it, you may request a pro-rated refund for the affected period.</li>
                                <li><span className="text-foreground font-medium">7-day new-subscriber window:</span> First-time paid subscribers who request a refund within 7 days of their initial payment and have used fewer than 20% of their monthly AI credits will be eligible for a full refund at our discretion.</li>
                            </ul>
                            <p className="text-muted-foreground leading-relaxed">
                                All other refund requests are evaluated on a case-by-case basis and are not guaranteed.
                            </p>
                        </section>

                        <div className="border-t border-border/60" />

                        <section className="space-y-3">
                            <h2 className="text-xl font-semibold text-foreground">3. How to Request a Refund</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                To request a refund, email us at <a href="mailto:support@prepnova.online" className="text-primary hover:underline">support@prepnova.online</a> with:
                            </p>
                            <ul className="space-y-2 text-muted-foreground list-disc pl-5">
                                <li>The email address associated with your PrepNova account.</li>
                                <li>The date and amount of the charge in question.</li>
                                <li>A brief description of the reason for your request.</li>
                            </ul>
                            <p className="text-muted-foreground leading-relaxed">
                                We aim to respond to all refund requests within <span className="text-foreground font-medium">3 business days</span>. Approved refunds are processed through the original payment method and typically appear within 5–10 business days depending on your bank or card issuer.
                            </p>
                        </section>

                        <div className="border-t border-border/60" />

                        <section className="space-y-3">
                            <h2 className="text-xl font-semibold text-foreground">4. Annual Plan Cancellations</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                Annual subscriptions are billed upfront for the full year at a discounted rate. If you cancel an annual plan:
                            </p>
                            <ul className="space-y-2 text-muted-foreground list-disc pl-5">
                                <li>You will retain access through the end of the 12-month period.</li>
                                <li>Refunds for the unused portion of an annual plan are not issued except in the case of a verified technical failure or at our sole discretion.</li>
                            </ul>
                        </section>

                        <div className="border-t border-border/60" />

                        <section className="space-y-3">
                            <h2 className="text-xl font-semibold text-foreground">5. Non-Refundable Items</h2>
                            <p className="text-muted-foreground leading-relaxed">The following are not eligible for refunds under any circumstances:</p>
                            <ul className="space-y-2 text-muted-foreground list-disc pl-5">
                                <li>AI credits or generation tokens that have already been consumed.</li>
                                <li>Subscriptions cancelled after the 7-day new-subscriber window.</li>
                                <li>Accounts suspended or terminated due to violations of our <a href="/terms-of-service" className="text-primary hover:underline">Terms of Service</a>.</li>
                            </ul>
                        </section>

                        <div className="border-t border-border/60" />

                        <section className="space-y-3">
                            <h2 className="text-xl font-semibold text-foreground">6. Payment Processor</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                Payments on PrepNova are processed securely via <span className="text-foreground font-medium">Safepay</span>. PrepNova does not store your card details. Refunds are returned to the original payment method on file with Safepay. Processing times are subject to Safepay&apos;s and your bank&apos;s policies.
                            </p>
                        </section>

                        <div className="border-t border-border/60" />

                        <section className="space-y-3">
                            <h2 className="text-xl font-semibold text-foreground">7. Changes to This Policy</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                We may update this Cancellation &amp; Refund Policy at any time. Changes will be posted on this page with an updated date. Continued use of PrepNova after changes take effect constitutes acceptance of the revised policy.
                            </p>
                        </section>

                        <div className="border-t border-border/60" />

                        <section className="space-y-3">
                            <h2 className="text-xl font-semibold text-foreground">8. Contact Us</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                For any questions about cancellations or refunds, please reach out at:<br />
                                <a href="mailto:support@prepnova.online" className="text-primary hover:underline">support@prepnova.online</a>
                            </p>
                        </section>

                    </div>
                </div>
            </main>
            <Footer />
        </div>
    )
}
