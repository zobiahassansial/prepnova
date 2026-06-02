import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { FileText } from "lucide-react"

export const metadata = {
    title: "Terms of Service — PrepNova",
    description: "The terms and conditions governing your use of PrepNova.",
}

export default function TermsOfServicePage() {
    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            <Navbar />
            <main className="flex-1 pt-28 pb-20">
                <div className="container px-4 md:px-6 mx-auto max-w-3xl">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <p className="text-sm text-muted-foreground">Last updated: June 2, 2026</p>
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight mb-3">Terms of Service</h1>
                    <p className="text-muted-foreground text-lg mb-10 leading-relaxed">
                        Please read these Terms carefully before using PrepNova. By creating an account or using our services, you agree to be bound by them.
                    </p>

                    <div className="space-y-10">

                        <section className="space-y-3">
                            <h2 className="text-xl font-semibold text-foreground">1. Acceptance of Terms</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                By accessing or using PrepNova ("the Service"), you agree to these Terms of Service and our Privacy Policy. If you do not agree, do not use the Service. We may update these Terms at any time; continued use after changes constitutes acceptance.
                            </p>
                        </section>

                        <div className="border-t border-border/60" />

                        <section className="space-y-3">
                            <h2 className="text-xl font-semibold text-foreground">2. Eligibility</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                You must be at least 13 years old to use PrepNova. If you are under 18, you represent that you have parental or guardian consent. By using the Service, you confirm that you meet these requirements.
                            </p>
                        </section>

                        <div className="border-t border-border/60" />

                        <section className="space-y-3">
                            <h2 className="text-xl font-semibold text-foreground">3. Your Account</h2>
                            <ul className="space-y-2 text-muted-foreground list-disc pl-5">
                                <li>You are responsible for keeping your login credentials secure and for all activity under your account.</li>
                                <li>You must not share your account with others or allow multiple users to use it simultaneously.</li>
                                <li>Notify us immediately at <a href="mailto:support@prepnova.online" className="text-primary hover:underline">support@prepnova.online</a> if you suspect unauthorised access.</li>
                                <li>We reserve the right to suspend or terminate accounts that violate these Terms.</li>
                            </ul>
                        </section>

                        <div className="border-t border-border/60" />

                        <section className="space-y-3">
                            <h2 className="text-xl font-semibold text-foreground">4. Acceptable Use</h2>
                            <p className="text-muted-foreground leading-relaxed">You agree <span className="text-foreground font-medium">not</span> to:</p>
                            <ul className="space-y-2 text-muted-foreground list-disc pl-5">
                                <li>Use automated scripts, bots, or other means to abuse AI generation features or circumvent plan limits.</li>
                                <li>Attempt to reverse-engineer, decompile, or extract proprietary AI models or infrastructure.</li>
                                <li>Upload content that is illegal, harmful, offensive, or infringes on third-party intellectual property rights.</li>
                                <li>Use PrepNova for bulk academic dishonesty (e.g. submitting AI-generated work as your own where prohibited by your institution).</li>
                                <li>Resell, sublicense, or commercially redistribute PrepNova content or features without written permission.</li>
                                <li>Interfere with the security, integrity, or availability of the Service.</li>
                            </ul>
                        </section>

                        <div className="border-t border-border/60" />

                        <section className="space-y-3">
                            <h2 className="text-xl font-semibold text-foreground">5. Subscription Plans & Billing</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                PrepNova offers Free, Standard ($5.99/mo), Pro ($11.99/mo), and Max ($19.99/mo) plans. Yearly plans are billed annually at a discounted rate.
                            </p>
                            <ul className="space-y-2 text-muted-foreground list-disc pl-5">
                                <li>All fees are charged in USD and are non-refundable except as required by law or at our sole discretion.</li>
                                <li>Subscriptions renew automatically at the end of each billing period unless cancelled beforehand.</li>
                                <li>You may cancel at any time; access continues until the end of the current billing period.</li>
                                <li>We reserve the right to change pricing with 30 days' notice. Changes do not apply to the current billing period.</li>
                                <li>Plan limits (resumes, summaries, flashcards, etc.) reset at the start of each calendar month.</li>
                            </ul>
                        </section>

                        <div className="border-t border-border/60" />

                        <section className="space-y-3">
                            <h2 className="text-xl font-semibold text-foreground">6. Intellectual Property</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                <span className="text-foreground font-medium">Your content:</span> You retain ownership of the content you create on PrepNova (resumes, notes, flashcards). By uploading content, you grant PrepNova a limited, non-exclusive licence to store and process it solely to provide the Service.
                            </p>
                            <p className="text-muted-foreground leading-relaxed">
                                <span className="text-foreground font-medium">Our content:</span> PrepNova's branding, UI, code, and AI-generated templates are owned by PrepNova or its licensors. You may not copy, reproduce, or distribute them without permission.
                            </p>
                        </section>

                        <div className="border-t border-border/60" />

                        <section className="space-y-3">
                            <h2 className="text-xl font-semibold text-foreground">7. AI-Generated Content Disclaimer</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                PrepNova uses large language models to generate summaries, flashcards, resume suggestions, and interview feedback. AI output may be inaccurate, incomplete, or outdated. You are responsible for reviewing and verifying any AI-generated content before relying on it academically or professionally. PrepNova is not liable for decisions made based on AI output.
                            </p>
                        </section>

                        <div className="border-t border-border/60" />

                        <section className="space-y-3">
                            <h2 className="text-xl font-semibold text-foreground">8. Limitation of Liability</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                To the fullest extent permitted by law, PrepNova and its team shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service — including loss of data, academic outcomes, or employment outcomes — even if advised of the possibility of such damages.
                            </p>
                            <p className="text-muted-foreground leading-relaxed">
                                Our total liability to you in any matter is limited to the amount you paid us in the 3 months preceding the claim.
                            </p>
                        </section>

                        <div className="border-t border-border/60" />

                        <section className="space-y-3">
                            <h2 className="text-xl font-semibold text-foreground">9. Service Availability</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                We strive for high availability but do not guarantee uninterrupted access. We may perform maintenance, apply updates, or suspend the Service at any time. We are not liable for any loss resulting from downtime.
                            </p>
                        </section>

                        <div className="border-t border-border/60" />

                        <section className="space-y-3">
                            <h2 className="text-xl font-semibold text-foreground">10. Termination</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                We reserve the right to suspend or permanently terminate your account for violations of these Terms, fraudulent activity, or abuse of AI resources — without prior notice. You may also delete your account at any time from Settings. Upon termination, your right to use the Service ceases immediately.
                            </p>
                        </section>

                        <div className="border-t border-border/60" />

                        <section className="space-y-3">
                            <h2 className="text-xl font-semibold text-foreground">11. Governing Law</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                These Terms are governed by the laws of the jurisdiction in which PrepNova operates. Any disputes shall be resolved through good-faith negotiation, or if necessary, through the courts of that jurisdiction.
                            </p>
                        </section>

                        <div className="border-t border-border/60" />

                        <section className="space-y-3">
                            <h2 className="text-xl font-semibold text-foreground">12. Contact</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                For questions about these Terms, contact us at <a href="mailto:support@prepnova.online" className="text-primary hover:underline">support@prepnova.online</a>.
                            </p>
                        </section>

                    </div>
                </div>
            </main>
            <Footer />
        </div>
    )
}
