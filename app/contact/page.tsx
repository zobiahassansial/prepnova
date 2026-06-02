import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { PublicContactForm } from "@/components/contact/public-contact-form"
import { Mail, MessageSquare, Lightbulb, AlertCircle } from "lucide-react"

export default function ContactPage() {
    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            <Navbar />

            <main className="flex-1 pt-28 pb-20">
                <div className="container px-4 md:px-6 mx-auto max-w-5xl">

                    {/* Header */}
                    <div className="text-center mb-14 space-y-4">
                        <div className="inline-flex items-center rounded-full border border-primary/20 bg-secondary/30 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-secondary-foreground">
                            <span className="mr-2 h-1.5 w-1.5 rounded-full bg-primary" />
                            We&apos;re here to help
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
                            Contact <span className="text-primary">Us</span>
                        </h1>
                        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                            Got a suggestion, complaint, or question? Drop us a message and we&apos;ll get back to you as soon as possible.
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-8 items-start">

                        {/* Left — Info Cards */}
                        <div className="flex flex-col gap-4">
                            <div className="rounded-xl border bg-card p-5 flex gap-4 items-start">
                                <div className="h-10 w-10 shrink-0 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                                    <Lightbulb className="h-5 w-5 text-yellow-500" />
                                </div>
                                <div>
                                    <p className="font-semibold text-sm">Suggestions</p>
                                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                        Have an idea to improve PrepNova? We&apos;d love to hear it.
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-xl border bg-card p-5 flex gap-4 items-start">
                                <div className="h-10 w-10 shrink-0 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                                    <AlertCircle className="h-5 w-5 text-red-500" />
                                </div>
                                <div>
                                    <p className="font-semibold text-sm">Complaints</p>
                                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                        Something not working right? Tell us and we&apos;ll fix it.
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-xl border bg-card p-5 flex gap-4 items-start">
                                <div className="h-10 w-10 shrink-0 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                                    <MessageSquare className="h-5 w-5 text-blue-500" />
                                </div>
                                <div>
                                    <p className="font-semibold text-sm">General Inquiries</p>
                                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                        Questions about pricing, features, or anything else? Ask away.
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-xl border bg-card p-5 flex gap-4 items-start">
                                <div className="h-10 w-10 shrink-0 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                                    <Mail className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="font-semibold text-sm">Email Us Directly</p>
                                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                        support@prepnova.online
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Right — Form */}
                        <div className="lg:col-span-2">
                            <PublicContactForm />
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
