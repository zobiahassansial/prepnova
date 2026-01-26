"use client"

import Link from "next/link"
import { Brain, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export function Navbar() {
    const pathname = usePathname()
    const isDashboard = pathname?.startsWith("/dashboard")
    // In a real app, we'd check session here to toggle Login/Dashboard links

    if (isDashboard) return null // Don't show public navbar on dashboard

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center px-4 md:px-6 justify-between">
                <Link className="flex items-center gap-2 font-bold text-xl" href="/">
                    <Brain className="h-6 w-6 text-primary" />
                    <span>PrepNova</span>
                </Link>

                <nav className="hidden md:flex items-center gap-8">
                    <Link
                        className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                        href="/"
                    >
                        Home
                    </Link>
                    <Link
                        className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                        href="#features"
                    >
                        Tools
                    </Link>
                    <Link
                        className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                        href="#"
                    >
                        Learning Hub
                    </Link>
                </nav>

                <div className="hidden md:flex items-center gap-4">
                    <Link href="/login">
                        <Button variant="ghost">Log In</Button>
                    </Link>
                    <Link href="/signup">
                        <Button>Get Started</Button>
                    </Link>
                </div>

                {/* Mobile Menu */}
                <div className="md:hidden">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Menu className="h-6 w-6" />
                                <span className="sr-only">Toggle menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right">
                            <div className="flex flex-col gap-6 mt-6">
                                <Link href="/" className="font-medium text-lg">Home</Link>
                                <Link href="#features" className="font-medium text-lg">Tools</Link>
                                <Link href="#" className="font-medium text-lg">Learning Hub</Link>
                                <div className="flex flex-col gap-2 mt-4">
                                    <Link href="/login">
                                        <Button variant="outline" className="w-full">Log In</Button>
                                    </Link>
                                    <Link href="/signup">
                                        <Button className="w-full">Get Started</Button>
                                    </Link>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    )
}
