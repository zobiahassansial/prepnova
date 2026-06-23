import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { Shield } from "lucide-react"

export const metadata = {
    title: "Privacy Policy — PrepNova",
    description: "How PrepNova collects, uses, and protects your personal data.",
}

export default function PrivacyPolicyPage() {
    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            <Navbar />
            <main className="flex-1 pt-28 pb-20">
                <div className="container px-4 md:px-6 mx-auto max-w-3xl">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Shield className="h-5 w-5 text-primary" />
                        </div>
                        <p className="text-sm text-muted-foreground">Last updated: June 2, 2026</p>
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight mb-3">Privacy Policy</h1>
                    <p className="text-muted-foreground text-lg mb-10 leading-relaxed">
                        At PrepNova, your privacy is a priority. This policy explains what data we collect, why we collect it, and how we keep it safe.
                    </p>

                    <div className="prose prose-neutral dark:prose-invert max-w-none space-y-10">

                        <section className="space-y-3">
                            <h2 className="text-xl font-semibold text-foreground">1. Information We Collect</h2>
                            <p className="text-muted-foreground leading-relaxed">We collect the following categories of information when you use PrepNova:</p>
                            <ul className="space-y-2 text-muted-foreground list-disc pl-5">
                                <li><span className="text-foreground font-medium">Account Information:</span> Your name, email address, and password when you register.</li>
                                <li><span className="text-foreground font-medium">Profile Data:</span> Role (Student / Professional), username, profile photo, and study preferences you set in onboarding or settings.</li>
                                <li><span className="text-foreground font-medium">Content You Create:</span> Resumes, study plans, flashcard decks, note summaries, and scanned documents you generate on the platform.</li>
                                <li><span className="text-foreground font-medium">Usage Data:</span> Pages visited, features used, AI generation counts, and session timestamps — used to enforce plan limits and improve the product.</li>
                                <li><span className="text-foreground font-medium">Device & Technical Data:</span> IP address, browser type, and operating system, collected automatically through standard web logs.</li>
                            </ul>
                        </section>

                        <div className="border-t border-border/60" />

                        <section className="space-y-3">
                            <h2 className="text-xl font-semibold text-foreground">2. How We Use Your Information</h2>
                            <ul className="space-y-2 text-muted-foreground list-disc pl-5">
                                <li>To provide, maintain, and improve PrepNova&apos;s features.</li>
                                <li>To personalise your experience and remember your preferences.</li>
                                <li>To enforce plan limits and prevent API abuse.</li>
                                <li>To send account-related emails (e.g. password reset, billing receipts).</li>
                                <li>To send optional product updates and weekly reports if you opt in.</li>
                                <li>To comply with legal obligations and resolve disputes.</li>
                            </ul>
                            <p className="text-muted-foreground leading-relaxed">We do <span className="text-foreground font-medium">not</span> sell your personal data to third parties.</p>
                        </section>

                        <div className="border-t border-border/60" />

                        <section className="space-y-3">
                            <h2 className="text-xl font-semibold text-foreground">3. Data Storage & Security</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                Your data is stored in <span className="text-foreground font-medium">Google Firebase</span> (Firestore and Firebase Storage), hosted in secure, SOC 2-compliant data centres. We use industry-standard encryption in transit (TLS) and at rest. Passwords are hashed and never stored in plain text.
                            </p>
                            <p className="text-muted-foreground leading-relaxed">
                                While we take significant measures to protect your data, no method of transmission over the Internet is 100% secure. Please keep your credentials confidential and use a strong, unique password.
                            </p>
                        </section>

                        <div className="border-t border-border/60" />

                        <section className="space-y-3">
                            <h2 className="text-xl font-semibold text-foreground">4. Third-Party Services</h2>
                            <p className="text-muted-foreground leading-relaxed">We integrate with the following third-party services to power PrepNova:</p>
                            <ul className="space-y-2 text-muted-foreground list-disc pl-5">
                                <li><span className="text-foreground font-medium">Google Firebase:</span> Authentication, database, and file storage.</li>
                                <li><span className="text-foreground font-medium">Groq:</span> AI model inference for summaries, flashcards, and interview prep.</li>
                                <li><span className="text-foreground font-medium">Google Generative AI:</span> Additional AI features.</li>
                                <li><span className="text-foreground font-medium">Stripe (planned):</span> Secure payment processing. We never store your card details.</li>
                            </ul>
                            <p className="text-muted-foreground leading-relaxed">Each of these services has their own privacy policies. We only share the minimum data needed for them to function.</p>
                        </section>

                        <div className="border-t border-border/60" />

                        <section className="space-y-3">
                            <h2 className="text-xl font-semibold text-foreground">5. Your Rights</h2>
                            <p className="text-muted-foreground leading-relaxed">Depending on your location, you may have the right to:</p>
                            <ul className="space-y-2 text-muted-foreground list-disc pl-5">
                                <li><span className="text-foreground font-medium">Access</span> the personal data we hold about you.</li>
                                <li><span className="text-foreground font-medium">Correct</span> inaccurate data via your account settings.</li>
                                <li><span className="text-foreground font-medium">Delete</span> your account and all associated data at any time.</li>
                                <li><span className="text-foreground font-medium">Export</span> your content (resumes, summaries, decks).</li>
                                <li><span className="text-foreground font-medium">Opt out</span> of non-essential communications in your notification settings.</li>
                            </ul>
                            <p className="text-muted-foreground leading-relaxed">
                                To exercise any of these rights, contact us at <a href="mailto:support@prepnova.online" className="text-primary hover:underline">support@prepnova.online</a>.
                            </p>
                        </section>

                        <div className="border-t border-border/60" />

                        <section className="space-y-3">
                            <h2 className="text-xl font-semibold text-foreground">6. Data Retention</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                We retain your account data for as long as your account is active. If you delete your account, we remove your personal data within 30 days, except where retention is required by law (e.g. billing records, which are kept for 7 years).
                            </p>
                        </section>

                        <div className="border-t border-border/60" />

                        <section className="space-y-3">
                            <h2 className="text-xl font-semibold text-foreground">7. Children&apos;s Privacy</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                PrepNova is not directed at children under 13. We do not knowingly collect personal data from children. If you believe a child has created an account, please contact us immediately at <a href="mailto:support@prepnova.online" className="text-primary hover:underline">support@prepnova.online</a>.
                            </p>
                        </section>

                        <div className="border-t border-border/60" />

                        <section className="space-y-3">
                            <h2 className="text-xl font-semibold text-foreground">8. Changes to This Policy</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                We may update this Privacy Policy from time to time. We will notify you of significant changes by email or via an in-app notice. Continued use of PrepNova after changes take effect constitutes acceptance of the updated policy.
                            </p>
                        </section>

                        <div className="border-t border-border/60" />

                        <section className="space-y-3">
                            <h2 className="text-xl font-semibold text-foreground">9. Contact Us</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                If you have questions about this Privacy Policy, please contact us at:<br />
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
