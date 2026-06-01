"use client"

import Link from "next/link"
import { Brain, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { usePathname } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"

export function Navbar() {
    const pathname = usePathname()
    const isDashboard = pathname?.startsWith("/dashboard")

    if (isDashboard) return null

    return (
        // Changed layout: Now it's fixed with padding to create the "Floating" effect
        <header className="fixed top-0 left-0 right-0 z-50 flex justify-center p-4">
            <div className="flex w-full max-w-7xl items-center justify-between rounded-full border border-white/20 bg-background/70 px-6 py-3 shadow-xl backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 dark:border-white/10 dark:bg-black/50">
                
                {/* Logo Section */}
                <Link className="flex items-center gap-2 font-bold text-xl hover:opacity-80 transition-opacity" href="/">
                    <div className="rounded-lg bg-primary/10 p-1">
                        <Brain className="h-6 w-6 text-primary" />
                    </div>
                    <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                        PrepNova
                    </span>
                </Link>

                {/* Desktop Navigation - Centered & Clean */}
                <nav className="hidden md:flex items-center gap-8">
                    {["Home", "Tools", "Learning Hub"].map((item) => (
                        <Link
                            key={item}
                            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors relative group"
                            href={item === "Home" ? "/" : item === "Tools" ? "#features" : "#"}
                        >
                            {item}
                            {/* Hover Underline Animation */}
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
                        </Link>
                    ))}
                </nav>

                {/* Right Actions */}
                <div className="hidden md:flex items-center gap-3">
                    <ThemeToggle />
                    <div className="h-6 w-px bg-border/50 mx-1"></div> {/* Vertical Divider */}
                    
                    <Link href="/login">
                        <Button variant="ghost" className="rounded-full hover:bg-primary/10 hover:text-primary">
                            Log In
                        </Button>
                    </Link>
                    <Link href="/signup">
                        <Button className="rounded-full shadow-lg shadow-primary/20 transition-all hover:scale-105 hover:shadow-primary/30">
                            Get Started
                        </Button>
                    </Link>
                </div>

                {/* Mobile Menu Trigger */}
                <div className="md:hidden flex items-center gap-4">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <Menu className="h-6 w-6" />
                                <span className="sr-only">Toggle menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                            <VisuallyHidden>
                                <SheetTitle>Navigation Menu</SheetTitle>
                            </VisuallyHidden>
                            <div className="flex flex-col gap-6 mt-8">
                                <Link href="/" className="font-medium text-lg border-b pb-2">Home</Link>
                                <Link href="#features" className="font-medium text-lg border-b pb-2">Tools</Link>
                                <Link href="#" className="font-medium text-lg border-b pb-2">Learning Hub</Link>
                                
                                <div className="flex items-center justify-between border-b pb-4 pt-2">
                                    <span className="font-medium text-lg text-muted-foreground">App Theme</span>
                                    <ThemeToggle />
                                </div>

                                <div className="flex flex-col gap-3 mt-auto pt-8">
                                    <Link href="/login">
                                        <Button variant="outline" className="w-full rounded-full h-12">Log In</Button>
                                    </Link>
                                    <Link href="/signup">
                                        <Button className="w-full rounded-full h-12 shadow-md">Get Started</Button>
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