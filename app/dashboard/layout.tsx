"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { Menu, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { useAuth } from "@/components/providers/auth-provider"
import { useRouter } from "next/navigation"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [isMobileOpen, setIsMobileOpen] = useState(false)
    const { user, loading, logout } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!user && !loading) {
            logout()
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
        return null
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

            {/* Mobile Sidebar (Sheet) */}
            <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                <SheetContent side="left" className="p-0 w-72">
                    <Sidebar
                        isCollapsed={false}
                        toggleSidebar={() => setIsMobileOpen(false)}
                    />
                </SheetContent>
            </Sheet>

            {/* Main Content */}
            <div className={`flex flex-col flex-1 transition-all duration-300 w-full ${isCollapsed ? 'md:pl-20' : 'md:pl-72'}`}>
                <header className="sticky top-0 z-20 flex h-16 items-center gap-4 bg-background/95 backdrop-blur px-4 md:px-6 border-b">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden shrink-0"
                        onClick={() => setIsMobileOpen(true)}
                    >
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Open menu</span>
                    </Button>
                    <div className="flex-1" />
                </header>
                <main className="flex-1 p-4 md:p-6 text-foreground overflow-y-auto w-full">
                    {children}
                </main>
            </div>
        </div>
    )
}
