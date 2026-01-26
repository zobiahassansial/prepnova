import Link from "next/link"
import { Brain, Facebook, Instagram, Linkedin, Twitter } from "lucide-react"

export function Footer() {
    return (
        <footer className="w-full border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container px-4 md:px-6 py-10 md:py-12">
                <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
                    <div className="space-y-4 lg:col-span-2">
                        <Link className="flex items-center gap-2 font-bold text-xl" href="/">
                            <Brain className="h-6 w-6 text-primary" />
                            <span>PrepNova</span>
                        </Link>
                        <p className="max-w-[300px] text-muted-foreground text-sm">
                            Your AI-powered study companion. Ace exams, build resumes, and master new skills faster than ever.
                        </p>
                        <div className="flex items-center gap-4">
                            <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                                <Twitter className="h-5 w-5" />
                                <span className="sr-only">Twitter</span>
                            </Link>
                            <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                                <Instagram className="h-5 w-5" />
                                <span className="sr-only">Instagram</span>
                            </Link>
                            <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                                <Linkedin className="h-5 w-5" />
                                <span className="sr-only">LinkedIn</span>
                            </Link>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold tracking-wide uppercase text-foreground/60">Product</h4>
                        <ul className="space-y-3 text-sm">
                            <li>
                                <Link href="#features" className="text-muted-foreground hover:text-primary transition-colors">
                                    Features
                                </Link>
                            </li>
                            <li>
                                <Link href="#pricing" className="text-muted-foreground hover:text-primary transition-colors">
                                    Pricing
                                </Link>
                            </li>
                            <li>
                                <Link href="/dashboard" className="text-muted-foreground hover:text-primary transition-colors">
                                    Dashboard
                                </Link>
                            </li>
                        </ul>
                    </div>
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold tracking-wide uppercase text-foreground/60">Resources</h4>
                        <ul className="space-y-3 text-sm">
                            <li>
                                <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                                    Learning Hub
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                                    Blog
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                                    Help Center
                                </Link>
                            </li>
                        </ul>
                    </div>
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold tracking-wide uppercase text-foreground/60">Legal</h4>
                        <ul className="space-y-3 text-sm">
                            <li>
                                <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                                    Privacy Policy
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                                    Terms of Service
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>
                <div className="mt-10 border-t pt-8 text-center text-sm text-muted-foreground">
                    © {new Date().getFullYear()} PrepNova. All rights reserved.
                </div>
            </div>
        </footer>
    )
}
