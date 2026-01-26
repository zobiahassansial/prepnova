"use client"

import * as React from "react"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/providers/auth-provider"
import {
    Brain,
    LayoutDashboard,
    FileText,
    Calendar,
    ScanLine,
    Code2,
    Layers,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Menu
} from "lucide-react"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    isCollapsed: boolean
    toggleSidebar: () => void
}

import { doc, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"

export function Sidebar({ className, isCollapsed, toggleSidebar }: SidebarProps) {
    const pathname = usePathname()
    const { user, logout } = useAuth()
    const [profile, setProfile] = useState<{ name: string, role: string } | null>(null)

    // Listen to profile changes
    React.useEffect(() => {
        if (!user) {
            setProfile(null)
            return
        }

        // Initial set
        setProfile({
            name: user.displayName || "User",
            role: "Student" // default
        })

        const unsub = onSnapshot(doc(db, "users", user.uid), (doc: any) => {
            if (doc.exists()) {
                const data = doc.data()
                setProfile({
                    name: data.name || user.displayName || "User",
                    role: data.role || "Student"
                })
            }
        })

        return () => unsub()

    }, [user])

    const routes = [
        // ... (routes stay same, just skip listing them here for brevity of the tool call context, assumes context is sufficient if I don't touch them)
        {
            label: "Dashboard",
            icon: LayoutDashboard,
            href: "/dashboard",
            color: "text-sky-500",
        },
        {
            label: "Resume Builder",
            icon: FileText,
            href: "/dashboard/resume-builder",
            color: "text-violet-500",
        },
        {
            label: "Study Planner",
            icon: Calendar,
            href: "/dashboard/study-planner",
            color: "text-pink-700",
        },
        {
            label: "Flashcards",
            icon: Layers,
            href: "/dashboard/flashcards",
            color: "text-indigo-500",
        },
        {
            label: "Interview Prep",
            icon: Code2,
            href: "/dashboard/interview-prep",
            color: "text-green-700",
        },
        {
            label: "Note Summarizer",
            icon: Brain,
            href: "/dashboard/note-summarizer",
            color: "text-orange-700",
        },
        {
            label: "Doc Scanner",
            icon: ScanLine,
            href: "/dashboard/document-scanner",
            color: "text-emerald-500",
        },
    ]

    return (
        <div className={cn("relative flex h-full flex-col bg-card border-r transition-all duration-300",
            isCollapsed ? "w-20" : "w-72",
            className
        )}>
            <div className="flex h-16 items-center px-4 py-4 border-b gap-2 overflow-hidden">
                <Link href="/" className="flex items-center gap-2">
                    <div className="relative h-8 w-8 flex items-center justify-center rounded-lg bg-primary/10">
                        <Brain className="h-5 w-5 text-primary" />
                    </div>
                    {!isCollapsed && (
                        <h1 className="text-xl font-bold tracking-tight truncate">
                            PrepNova
                        </h1>
                    )}
                </Link>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
                <nav className="grid gap-1 px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
                    {routes.map((route) => (
                        <Link
                            key={route.href}
                            href={route.href}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground",
                                pathname === route.href ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                                isCollapsed && "justify-center px-2"
                            )}
                            title={isCollapsed ? route.label : undefined}
                        >
                            <route.icon className={cn("h-5 w-5", route.color)} />
                            {!isCollapsed && <span>{route.label}</span>}
                        </Link>
                    ))}
                </nav>
            </div>

            <div className="p-4 border-t">
                {!isCollapsed ? (
                    <div className="flex items-center gap-3 mb-4 p-2 rounded-lg bg-muted/50">
                        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold uppercase">
                            {profile?.name ? profile.name.substring(0, 2) : "JD"}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{profile?.name || "User"}</p>
                            <p className="text-xs text-muted-foreground truncate">{profile?.role || "Student"}</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-center mb-4">
                        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs uppercase" title={`${profile?.name} (${profile?.role})`}>
                            {profile?.name ? profile.name.substring(0, 2) : "JD"}
                        </div>
                    </div>
                )}

                <nav className="grid gap-1">
                    <Link
                        href="/dashboard/settings"
                        className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-accent hover:text-accent-foreground",
                            pathname === "/dashboard/settings" && "bg-accent text-accent-foreground",
                            isCollapsed && "justify-center"
                        )}
                    >
                        <Settings className="h-5 w-5" />
                        {!isCollapsed && <span>Settings</span>}
                    </Link>
                    <button
                        onClick={logout}
                        className={cn(
                            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-500 transition-all hover:bg-red-50 dark:hover:bg-red-950/20",
                            isCollapsed && "justify-center"
                        )}
                    >
                        <LogOut className="h-5 w-5" />
                        {!isCollapsed && <span>Logout</span>}
                    </button>
                </nav>
            </div>

            <Button
                variant="ghost"
                size="icon"
                className="absolute -right-3 top-20 z-40 h-6 w-6 rounded-full border bg-background shadow-md hidden md:flex"
                onClick={toggleSidebar}
            >
                {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
            </Button>
        </div>
    )
}
