"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet" // Need to create Sheet if not exists? Assuming not.
// Actually, let's skip Sheet for now and just use mobile Sidebar.

import { useAuth } from "@/components/providers/auth-provider"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { signOut } from "next-auth/react"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [isMobileOpen, setIsMobileOpen] = useState(false)
    const { user, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!user && !loading) {
            // Firebase has no user, so we must clear NextAuth session too
            // otherwise middleware will force us back to /dashboard
            signOut({ callbackUrl: "/login" })
        }
    }, [user, loading])

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-muted/20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!user && !loading) {
        return null // Prevent flash
    }

    return (
        <div className="flex min-h-screen w-full bg-muted/20">
            {/* Desktop Sidebar */}
            <div className="hidden md:flex h-full fixed inset-y-0 z-50">
                <Sidebar
                    isCollapsed={isCollapsed}
                    toggleSidebar={() => setIsCollapsed(!isCollapsed)}
                />
            </div>

            {/* Main Content */}
            <div className={`flex flex-col flex-1 transition-all duration-300 w-full ${isCollapsed ? 'md:pl-20' : 'md:pl-72'}`}>
                <header className="sticky top-0 z-20 flex h-16 items-center gap-4 bg-background/95 backdrop-blur px-6 border-b">

                    <div className="md:hidden">
                        {/* Mobile Menu Trigger Placeholder - would use Sheet here */}
                        <Button variant="ghost" size="icon" onClick={() => setIsMobileOpen(!isMobileOpen)}>
                            <Menu className="h-6 w-6" />
                        </Button>
                    </div>

                    <div className="w-full flex justify-end gap-2 items-center">
                        {/* Add UserNav or ThemeToggle here later */}
                    </div>
                </header>
                <main className="flex-1 p-4 md:p-6 text-foreground overflow-y-auto w-full">
                    {children}
                </main>
            </div>

            {/* Mobile Sidebar Overlay (Simple implementation) */}
            {isMobileOpen && (
                <div className="fixed inset-0 z-50 md:hidden flex">
                    <div className="fixed inset-0 bg-black/50" onClick={() => setIsMobileOpen(false)} />
                    <Sidebar
                        className="bg-background relative z-10 w-72"
                        isCollapsed={false}
                        toggleSidebar={() => setIsMobileOpen(false)}
                    />
                </div>
            )}
        </div>
    );
}
