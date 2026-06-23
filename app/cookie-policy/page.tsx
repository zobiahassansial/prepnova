import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { Cookie } from "lucide-react"

export const metadata = {
    title: "Cookie Policy — PrepNova",
    description: "How PrepNova uses cookies and similar tracking technologies.",
}

export default function CookiePolicyPage() {
    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            <Navbar />
            <main className="flex-1 pt-28 pb-20">
                <div className="container px-4 md:px-6 mx-auto max-w-3xl">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Cookie className="h-5 w-5 text-primary" />
                        </div>
                        <p className="text-sm text-muted-foreground">Last updated: June 2, 2026</p>
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight mb-3">Cookie Policy</h1>
                    <p className="text-muted-foreground text-lg mb-10 leading-relaxed">
                        This policy explains what cookies are, which ones PrepNova uses, and how you can control them.
                    </p>

                    <div className="space-y-10">

                        <section className="space-y-3">
                            <h2 className="text-xl font-semibold text-foreground">1. What Are Cookies?</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                Cookies are small text files stored on your device by your browser when you visit a website. They allow the site to remember information about your visit — such as your login session or theme preference — so you don&apos;t have to re-enter it each time.
                            </p>
                            <p className="text-muted-foreground leading-relaxed">
                                Similar technologies include <span className="text-foreground font-medium">localStorage</span> and <span className="text-foreground font-medium">sessionStorage</span>, which store data directly in your browser. PrepNova uses both cookies and browser storage.
                            </p>
                        </section>

                        <div className="border-t border-border/60" />

                        <section className="space-y-4">
                            <h2 className="text-xl font-semibold text-foreground">2. Cookies We Use</h2>

                            <div className="rounded-xl border border-border/60 overflow-hidden">
                                <div className="bg-muted/40 px-4 py-3 grid grid-cols-3 gap-4 text-xs font-semibold text-foreground uppercase tracking-wider">
                                    <span>Type</span>
                                    <span>Purpose</span>
                                    <span>Duration</span>
                                </div>
                                {[
                                    {
                                        type: "Essential",
                                        purpose: "Authentication session token (NextAuth). Required to keep you logged in.",
                                        duration: "Session / 30 days",
                                    },
                                    {
                                        type: "Functional",
                                        purpose: "Theme preference (light/dark/system) stored via next-themes.",
                                        duration: "1 year",
                                    },
                                    {
                                        type: "Functional",
                                        purpose: "Sidebar collapsed state and UI preferences stored in localStorage.",
                                        duration: "Persistent",
                                    },
                                    {
                                        type: "Analytics (planned)",
                                        purpose: "Aggregate, anonymised usage statistics to help us improve the product. No personal data is shared.",
                                        duration: "90 days",
                                    },
                                ].map((row, i) => (
                                    <div
                                        key={i}
                                        className="px-4 py-3 grid grid-cols-3 gap-4 text-sm border-t border-border/60"
                                    >
                                        <span className="text-foreground font-medium">{row.type}</span>
                                        <span className="text-muted-foreground">{row.purpose}</span>
                                        <span className="text-muted-foreground">{row.duration}</span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <div className="border-t border-border/60" />

                        <section className="space-y-3">
                            <h2 className="text-xl font-semibold text-foreground">3. Essential vs. Optional Cookies</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                <span className="text-foreground font-medium">Essential cookies</span> are strictly necessary for PrepNova to function. Without them, features like logging in and maintaining your session would not work. You cannot opt out of these while using the Service.
                            </p>
                            <p className="text-muted-foreground leading-relaxed">
                                <span className="text-foreground font-medium">Functional and analytics cookies</span> are optional. They improve your experience (e.g. remembering your theme) or help us understand how the product is used. You can disable these through your browser settings.
                            </p>
                        </section>

                        <div className="border-t border-border/60" />

                        <section className="space-y-3">
                            <h2 className="text-xl font-semibold text-foreground">4. Third-Party Cookies</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                PrepNova does not currently use third-party advertising or tracking cookies. If we integrate third-party analytics (e.g. Vercel Analytics) in the future, we will update this policy and provide an opt-out mechanism where required by law.
                            </p>
                        </section>

                        <div className="border-t border-border/60" />

                        <section className="space-y-3">
                            <h2 className="text-xl font-semibold text-foreground">5. How to Control Cookies</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                You can manage or delete cookies through your browser settings at any time. Here are links to cookie settings for common browsers:
                            </p>
                            <ul className="space-y-2 text-muted-foreground list-disc pl-5">
                                <li><span className="text-foreground font-medium">Google Chrome:</span> Settings → Privacy and security → Cookies and other site data</li>
                                <li><span className="text-foreground font-medium">Mozilla Firefox:</span> Settings → Privacy & Security → Cookies and Site Data</li>
                                <li><span className="text-foreground font-medium">Safari:</span> Preferences → Privacy → Manage Website Data</li>
                                <li><span className="text-foreground font-medium">Microsoft Edge:</span> Settings → Cookies and site permissions → Cookies and site data</li>
                            </ul>
                            <p className="text-muted-foreground leading-relaxed">
                                Note: Disabling essential cookies will prevent you from logging in to PrepNova.
                            </p>
                        </section>

                        <div className="border-t border-border/60" />

                        <section className="space-y-3">
                            <h2 className="text-xl font-semibold text-foreground">6. Changes to This Policy</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                We may update this Cookie Policy as we add new features or as regulations change. The &quot;Last updated&quot; date at the top of this page will always reflect the most recent version.
                            </p>
                        </section>

                        <div className="border-t border-border/60" />

                        <section className="space-y-3">
                            <h2 className="text-xl font-semibold text-foreground">7. Contact</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                Questions about our cookie use? Email us at <a href="mailto:support@prepnova.online" className="text-primary hover:underline">support@prepnova.online</a>.
                            </p>
                        </section>

                    </div>
                </div>
            </main>
            <Footer />
        </div>
    )
}
