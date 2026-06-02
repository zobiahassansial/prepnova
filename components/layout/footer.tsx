import Link from "next/link"
import { Brain } from "lucide-react"

export function Footer() {
    return (
        <footer className="w-full border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto max-w-7xl px-4 md:px-6 py-12 md:py-16">
                
                {/* Top Section: Flex container for Desktop (Brand Left, Links Right) */}
                <div className="flex flex-col lg:flex-row lg:justify-between gap-12 lg:gap-8">
                    
                    {/* 1. Brand Section (Left Side) */}
                    <div className="space-y-4 lg:max-w-sm">
                        <Link className="flex items-center gap-2 font-bold text-xl" href="/">
                            <div className="rounded-lg bg-primary/10 p-1">
                                <Brain className="h-6 w-6 text-primary" />
                            </div>
                            <span>PrepNova</span>
                        </Link>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            Your AI-powered study companion. Ace exams, build resumes, and master new skills faster than ever.
                        </p>
                        
                    </div>

                    {/* 2. Links Section (Right Side - Grid) */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-8 lg:gap-16">
                        
                        {/* Product Column */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-semibold tracking-wider uppercase text-foreground">Product</h4>
                            <ul className="space-y-3 text-sm text-muted-foreground">
                                <li>
                                    <Link href="#features" className="hover:text-primary transition-colors">Features</Link>
                                </li>
                                <li>
                                    <Link href="#pricing" className="hover:text-primary transition-colors">Pricing</Link>
                                </li>
                                <li>
                                    <Link href="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link>
                                </li>
                            </ul>
                        </div>

                        {/* Resources Column */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-semibold tracking-wider uppercase text-foreground">Resources</h4>
                            <ul className="space-y-3 text-sm text-muted-foreground">
                                <li>
                                    <Link href="#" className="hover:text-primary transition-colors">Learning Hub</Link>
                                </li>
                                <li>
                                    <Link href="#" className="hover:text-primary transition-colors">Blog</Link>
                                </li>
                                <li>
                                    <Link href="#" className="hover:text-primary transition-colors">Help Center</Link>
                                </li>
                                <li>
                                    <Link href="/contact" className="hover:text-primary transition-colors">Contact Us</Link>
                                </li>
                            </ul>
                        </div>

                        {/* Legal Column */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-semibold tracking-wider uppercase text-foreground">Legal</h4>
                            <ul className="space-y-3 text-sm text-muted-foreground">
                                <li>
                                    <Link href="/privacy-policy" className="hover:text-primary transition-colors">Privacy Policy</Link>
                                </li>
                                <li>
                                    <Link href="/terms-of-service" className="hover:text-primary transition-colors">Terms of Service</Link>
                                </li>
                                <li>
                                    <Link href="/cookie-policy" className="hover:text-primary transition-colors">Cookie Policy</Link>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Bottom Section: Separator & Copyright */}
                <div className="mt-12 md:mt-16 border-t pt-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
                        <p>© {new Date().getFullYear()} PrepNova. All rights reserved.</p>
                        <div className="flex items-center gap-6">
                            <Link href="/privacy-policy" className="hover:text-primary transition-colors">Privacy</Link>
                            <Link href="/terms-of-service" className="hover:text-primary transition-colors">Terms</Link>
                            <Link href="/cookie-policy" className="hover:text-primary transition-colors">Cookies</Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}