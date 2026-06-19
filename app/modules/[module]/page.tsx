"use client"

import { useAuth } from "@/components/providers/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { 
    ArrowRight, Play, FileText, Calendar, Layers, Code2, Scan, PenTool, 
    LayoutDashboard, CheckCircle2, Star, Zap, Clock, Shield, ChevronDown, 
    ChevronRight, Trophy, BarChart3, Users, MessageSquare, Mic, Image as ImageIcon
} from "lucide-react"
import Link from "next/link"
import { notFound, useRouter } from "next/navigation"
import { use, useEffect, useState } from "react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { toast } from "sonner"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

// Extended Data definition
const MODULES: any = {
    "resume-builder": {
        title: "AI Resume Architect",
        subtitle: "Don't just write a resume. Engineer a career document that beats the ATS bots and lands interviews.",
        icon: FileText,
        color: "text-purple-600",
        bg: "bg-purple-600/10",
        border: "border-purple-200",
        redirect: "/dashboard/resume-builder",
        stat: "2 Minutes",
        statLabel: "Average Build Time",
        problems: [
            "Getting rejected instantly by ATS bots due to bad formatting.",
            "Staring at a blank screen with writer's block for hours.",
            "Unsure how to phrase achievements to sound professional."
        ],
        solutions: [
            "We use the exact same parsing algorithms as Fortune 500 HR systems.",
            "AI suggests bullet points based on your specific job role.",
            "One-click formatting into clean, professional PDF templates."
        ],
        steps: [
            { label: "Import or Input", text: "Upload an old resume or start fresh with our wizard." },
            { label: "AI Optimization", text: "Our AI rewrites your descriptions for maximum impact." },
            { label: "Export & Apply", text: "Download a perfectly formatted PDF ready for submission." }
        ],
        features: ["ATS Score Checker", "Contextual AI Writing", "Cover Letter Generator", "Multi-Format Export"],
        who: ["Job Seekers", "Students", "Career Switchers"],
        minPlan: "free",
    },
    "study-planner": {
        title: "Smart Study Planner",
        subtitle: "Stop cramming. Start engineering your grades with a schedule that adapts to your life.",
        icon: Calendar,
        color: "text-blue-600",
        bg: "bg-blue-600/10",
        border: "border-blue-200",
        redirect: "/dashboard/study-planner",
        stat: "98%",
        statLabel: "Deadline Completion",
        problems: [
            "Overwhelmed by a massive syllabus with no idea where to start.",
            "Procrastinating until the night before the exam.",
            "Burning out because of inefficient time management."
        ],
        solutions: [
            "Input your exam date and syllabus, we calculate the daily path.",
            "Miss a day? The AI automatically rebalances your schedule.",
            "Visual progress bars keep you addicted to finishing tasks."
        ],
        steps: [
            { label: "Define Goals", text: "Tell us your subjects and exam dates." },
            { label: "Set Availability", text: "Block out time for sleep, classes, and life." },
            { label: "Execute Plan", text: "Follow your daily generated task list." }
        ],
        features: ["Dynamic Rescheduling", "Calendar Sync (Google/Outlook)", "Burnout Prevention", "Exam Mode"],
        who: ["University Students", "High Schoolers", "Lifelong Learners"],
        minPlan: "free",
    },
    "flashcards": {
        title: "FlashCard System",
        subtitle: "Hack your memory using Spaced Repetition algorithms designed for long-term retention.",
        icon: Layers,
        color: "text-pink-600",
        bg: "bg-pink-600/10",
        border: "border-pink-200",
        redirect: "/dashboard/flashcards",
        stat: "3x",
        statLabel: "Faster Memorization",
        problems: [
            "Reading notes over and over but forgetting them the next day.",
            "Wasting hours manually writing flashcards by hand.",
            "Not knowing which concepts you are weak on."
        ],
        solutions: [
            "Algorithms show you cards right before you are about to forget them.",
            "Upload your PDF notes and AI generates the cards for you.",
            "Visual mastery tracking shows exactly what you know."
        ],
        steps: [
            { label: "Upload Material", text: "Upload lecture slides, PDFs, or notes." },
            { label: "AI Generation", text: "Watch as 100+ cards are created in seconds." },
            { label: "Spaced Review", text: "Review daily based on the algorithm's queue." }
        ],
        features: ["PDF-to-Flashcard", "Spaced Repetition (SRS)", "Mobile Optimized", "Progress Analytics"],
        who: ["Med Students", "Language Learners", "Certification Preppers"],
        minPlan: "standard",
    },
    "interview-prep": {
        title: "AI Interview Simulator",
        subtitle: "Practice with an AI interviewer that listens, analyzes, and gives brutal feedback.",
        icon: Code2,
        color: "text-orange-600",
        bg: "bg-orange-600/10",
        border: "border-orange-200",
        redirect: "/dashboard/interview-prep",
        stat: "90%",
        statLabel: "Higher Offer Rate",
        problems: [
            "Freezing up when asked technical or behavioral questions.",
            "Rambling answers without structure (STAR method).",
            "No one to practice with who gives honest feedback."
        ],
        solutions: [
            "Real-time voice conversation with an AI trained on your industry.",
            "Instant feedback on confidence, pace, and answer quality.",
            "Question banks from top companies (Google, Goldman, etc)."
        ],
        steps: [
            { label: "Configure Role", text: "Select target job (e.g., PM, Dev) and level." },
            { label: "Mock Interview", text: "Speak your answers into the microphone." },
            { label: "Analyze Report", text: "Get a score and specific improvement tips." }
        ],
        features: ["Voice & Text Mode", "Behavioral & Technical", "Tone Analysis", "Answer Grading"],
        who: ["Job Seekers", "New Grads", "Professionals"],
        minPlan: "pro",
    },
    "note-summarizer": {
        title: "Note Summarizer",
        subtitle: "Turn hours of lectures and 100-page PDFs into concise, actionable intelligence.",
        icon: PenTool,
        color: "text-emerald-600",
        bg: "bg-emerald-600/10",
        border: "border-emerald-200",
        redirect: "/dashboard/note-summarizer",
        stat: "100+",
        statLabel: "Hours Saved / Mo",
        problems: [
            "Drowning in academic papers and long textbook chapters.",
            "Missing the professor's key points during fast lectures.",
            "Notes are messy, unorganized, and hard to review."
        ],
        solutions: [
            "AI reads documents in seconds and extracts core concepts.",
            "Automatically formats messy text into clean bullet points.",
            "Chat with your notes to ask specific questions."
        ],
        steps: [
            { label: "Upload Source", text: "Drop a PDF, Doc, or Paste Text." },
            { label: "Processing", text: "Deep learning models analyze the content." },
            { label: "Review", text: "Read the executive summary and key points." }
        ],
        features: ["Multi-File Support", "Key Concept Extraction", "Action Items", "Chat-to-PDF"],
        who: ["Researchers", "Students", "Executives"],
        minPlan: "standard",
    },
    "document-scanner": {
        title: "Document Scanner",
        subtitle: "Bridge the gap between paper and digital. Make your handwriting searchable.",
        icon: Scan,
        color: "text-indigo-600",
        bg: "bg-indigo-600/10",
        border: "border-indigo-200",
        redirect: "/dashboard/document-scanner",
        stat: "99%",
        statLabel: "Accuracy",
        problems: [
            "Losing physical notebooks or loose papers.",
            "Unable to Ctrl+F (Search) your handwritten class notes.",
            "Hard to share notes with study groups."
        ],
        solutions: [
            "High-contrast scanning enhances readability instantly.",
            "Powerful OCR turns handwriting into selectable digital text.",
            "Cloud sync ensures you never lose a page."
        ],
        steps: [
            { label: "Capture", text: "Take a photo or upload an image." },
            { label: "Enhance & OCR", text: "Our engine cleans and extracts text." },
            { label: "Digitalize", text: "Save as PDF or Text to your dashboard." }
        ],
        features: ["Handwriting Recognition", "Perspective Correction", "Smart Tagging", "PDF Export"],
        who: ["Students", "Archivists", "Creatives"],
        minPlan: "standard",
    }
}

export default function ModulePage({ params }: { params: Promise<{ module: string }> }) {
    const resolvedParams = use(params)
    const slug = resolvedParams.module as keyof typeof MODULES
    const moduleInfo = MODULES[slug]

    const { user } = useAuth()
    const router = useRouter()
    const [userPlan, setUserPlan] = useState("free")

    if (!moduleInfo) {
        return notFound()
    }

    const Icon = moduleInfo.icon

    // Fetch user plan logic
    useEffect(() => {
        async function checkPlan() {
            if (user) {
                try {
                    const snap = await getDoc(doc(db, "users", user.uid, "subscription", "info"))
                    if (snap.exists()) {
                        setUserPlan(snap.data().plan || "free")
                    }
                } catch (e) {
                    console.error("Failed to fetch plan", e)
                }
            }
        }
        checkPlan()
    }, [user])

    // Access Logic
    const handleAccess = () => {
        if (!user) {
            router.push(`/login?callbackUrl=/dashboard/${String(slug)}`)
            return
        }

        const levels = { "free": 0, "standard": 1, "pro": 2, "lifetime": 3 }
        const userLevel = levels[userPlan as keyof typeof levels] || 0
        const reqLevel = levels[moduleInfo.minPlan as keyof typeof levels] || 0

        if (userLevel < reqLevel) {
            toast.error(`Upgrade to ${moduleInfo.minPlan.charAt(0).toUpperCase() + moduleInfo.minPlan.slice(1)} to unlock this feature!`)
            return
        }

        router.push(moduleInfo.redirect)
    }

    // ================= DYNAMIC MOCKUP RENDERER =================
    // This renders the specific UI inside the Hero Window based on the active module
    const renderMockup = () => {
        switch(slug) {
            case "resume-builder":
                return (
                    <div className="flex h-full bg-muted/20">
                        {/* Sidebar */}
                        <div className="w-1/4 h-full border-r bg-background p-3 space-y-3 hidden sm:block">
                            <div className="h-2 w-12 bg-muted rounded-full"/>
                            <div className="space-y-2 pt-2">
                                <div className="h-8 w-full bg-purple-50 rounded-md border border-purple-100 flex items-center px-2">
                                    <div className="h-2 w-12 bg-purple-200 rounded-full"/>
                                </div>
                                <div className="h-8 w-full bg-background rounded-md border flex items-center px-2">
                                    <div className="h-2 w-16 bg-muted rounded-full"/>
                                </div>
                                <div className="h-8 w-full bg-background rounded-md border flex items-center px-2">
                                    <div className="h-2 w-10 bg-muted rounded-full"/>
                                </div>
                            </div>
                        </div>
                        {/* Resume Paper */}
                        <div className="flex-1 p-4 flex justify-center bg-muted/10 overflow-hidden">
                            <div className="w-full max-w-[280px] bg-white h-full shadow-sm border p-3 space-y-3">
                                <div className="flex justify-between items-end border-b pb-2">
                                    <div>
                                        <div className="h-3 w-24 bg-gray-800 rounded-sm mb-1"/>
                                        <div className="h-1.5 w-32 bg-gray-400 rounded-sm"/>
                                    </div>
                                    <div className="h-8 w-8 bg-gray-100 rounded-full"/>
                                </div>
                                <div className="space-y-2">
                                    <div className="h-2 w-16 bg-purple-100 rounded-sm"/>
                                    <div className="space-y-1">
                                        <div className="h-1.5 w-full bg-gray-200 rounded-sm"/>
                                        <div className="h-1.5 w-5/6 bg-gray-200 rounded-sm"/>
                                        <div className="h-1.5 w-full bg-gray-200 rounded-sm"/>
                                    </div>
                                </div>
                                <div className="space-y-2 pt-2">
                                    <div className="h-2 w-16 bg-purple-100 rounded-sm"/>
                                    <div className="space-y-1">
                                        <div className="h-1.5 w-full bg-gray-200 rounded-sm"/>
                                        <div className="h-1.5 w-4/6 bg-gray-200 rounded-sm"/>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Overlay Score */}
                        <div className="absolute bottom-6 right-6 bg-white border border-green-200 text-green-700 px-3 py-2 rounded-xl shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                            <CheckCircle2 className="h-4 w-4" />
                            <div className="text-xs font-bold">ATS Score: 98%</div>
                        </div>
                    </div>
                );
            case "study-planner":
                return (
                    <div className="flex h-full flex-col bg-background p-4">
                        <div className="flex justify-between items-center mb-4">
                            <div className="h-4 w-32 bg-blue-100 rounded-md"/>
                            <div className="flex gap-1">
                                <div className="h-6 w-6 rounded-md bg-muted"/>
                                <div className="h-6 w-6 rounded-md bg-muted"/>
                            </div>
                        </div>
                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-2 h-full">
                            {[...Array(28)].map((_, i) => (
                                <div key={i} className={`rounded-md border ${i === 12 ? 'bg-blue-50 border-blue-200' : 'bg-background border-muted/30'} flex flex-col p-1`}>
                                    <div className="text-[8px] text-muted-foreground mb-1">{i + 1}</div>
                                    {i === 12 && <div className="h-1.5 w-full bg-blue-400 rounded-full mb-0.5"/>}
                                    {(i === 12 || i === 15 || i === 5) && <div className="h-1.5 w-3/4 bg-blue-200 rounded-full"/>}
                                </div>
                            ))}
                        </div>
                        {/* Overlay Streak */}
                        <div className="absolute bottom-6 right-6 bg-orange-50 border border-orange-200 text-orange-700 px-3 py-2 rounded-xl shadow-lg flex items-center gap-2">
                            <Zap className="h-4 w-4 fill-orange-500 text-orange-500" />
                            <div className="text-xs font-bold">7 Day Streak!</div>
                        </div>
                    </div>
                );
            case "note-summarizer":
                return (
                    <div className="flex h-full bg-background">
                        {/* Left: Source Text */}
                        <div className="w-1/2 p-4 border-r space-y-2 bg-muted/5">
                            <div className="flex items-center gap-2 mb-2">
                                <FileText className="h-3 w-3 text-muted-foreground"/>
                                <div className="h-2 w-16 bg-muted rounded-full"/>
                            </div>
                            <div className="space-y-1.5 opacity-50">
                                <div className="h-1.5 w-full bg-gray-300 rounded-full"/>
                                <div className="h-1.5 w-5/6 bg-gray-300 rounded-full"/>
                                <div className="h-1.5 w-full bg-gray-300 rounded-full"/>
                                <div className="h-1.5 w-full bg-gray-300 rounded-full"/>
                                <div className="h-1.5 w-4/6 bg-gray-300 rounded-full"/>
                            </div>
                        </div>
                        {/* Right: Summary */}
                        <div className="w-1/2 p-4 space-y-3">
                            <div className="flex items-center gap-2 mb-2">
                                <Star className="h-3 w-3 text-emerald-500 fill-emerald-500"/>
                                <div className="h-2 w-20 bg-emerald-100 rounded-full"/>
                            </div>
                            <div className="space-y-2">
                                {[1,2,3].map(i => (
                                    <div key={i} className="flex gap-2">
                                        <div className="h-1.5 w-1.5 mt-1 rounded-full bg-emerald-500 shrink-0"/>
                                        <div className="space-y-1 w-full">
                                            <div className="h-1.5 w-full bg-gray-700 rounded-full"/>
                                            <div className="h-1.5 w-3/4 bg-gray-700 rounded-full"/>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case "flashcards":
                return (
                    <div className="flex h-full items-center justify-center bg-muted/20 relative overflow-hidden">
                        {/* Back Cards */}
                        <div className="absolute w-40 h-24 bg-white border shadow-sm rounded-xl rotate-[-6deg] translate-x-[-10px] opacity-60"/>
                        <div className="absolute w-40 h-24 bg-white border shadow-sm rounded-xl rotate-[6deg] translate-x-[10px] opacity-60"/>
                        
                        {/* Main Card */}
                        <div className="relative w-48 h-32 bg-white border border-pink-100 shadow-xl rounded-xl flex flex-col items-center justify-center p-4 text-center z-10">
                            <div className="text-[10px] text-pink-500 font-bold uppercase tracking-wider mb-2">Question</div>
                            <div className="h-2 w-3/4 bg-gray-200 rounded-full mb-1"/>
                            <div className="h-2 w-1/2 bg-gray-200 rounded-full"/>
                            
                            <div className="absolute bottom-2 flex gap-2 w-full px-4">
                                <div className="h-1.5 flex-1 bg-red-100 rounded-full"/>
                                <div className="h-1.5 flex-1 bg-yellow-100 rounded-full"/>
                                <div className="h-1.5 flex-1 bg-green-100 rounded-full"/>
                            </div>
                        </div>
                    </div>
                );
            case "interview-prep":
                return (
                    <div className="flex h-full flex-col bg-slate-900 p-3 relative">
                        {/* Video Feed Placeholder */}
                        <div className="flex-1 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"/>
                            <div className="h-16 w-16 rounded-full bg-slate-700 flex items-center justify-center">
                                <Users className="h-8 w-8 text-slate-500"/>
                            </div>
                            
                            {/* Chat Bubble overlay */}
                            <div className="absolute bottom-4 left-4 right-4 space-y-2">
                                <div className="bg-orange-500/90 text-white text-[10px] p-2 rounded-lg rounded-tl-none w-3/4">
                                    Tell me about a time you failed?
                                </div>
                                <div className="bg-slate-600/90 text-white text-[10px] p-2 rounded-lg rounded-tr-none w-3/4 ml-auto">
                                    In my previous role...
                                </div>
                            </div>
                        </div>
                        {/* Controls */}
                        <div className="h-8 mt-2 flex justify-center gap-3 items-center">
                            <div className="h-6 w-6 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/50"><Mic className="h-3 w-3 text-red-500"/></div>
                            <div className="h-6 w-6 rounded-full bg-slate-700"/>
                            <div className="h-6 w-6 rounded-full bg-slate-700"/>
                        </div>
                    </div>
                );
            case "document-scanner":
                return (
                    <div className="flex h-full items-center justify-center bg-zinc-900 p-4">
                        <div className="relative w-40 h-52 bg-white rounded-sm shadow-2xl overflow-hidden">
                            <div className="absolute inset-0 bg-indigo-500/10"/>
                            <div className="p-3 space-y-2 opacity-30">
                                <div className="h-1.5 w-full bg-black rounded-full"/>
                                <div className="h-1.5 w-full bg-black rounded-full"/>
                                <div className="h-1.5 w-3/4 bg-black rounded-full"/>
                                <div className="mt-4 h-16 w-full border-2 border-dashed border-black/50 rounded-md"/>
                            </div>
                            
                            {/* Scanning Line */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.8)] animate-[scan_2s_ease-in-out_infinite]"/>
                            
                            {/* Crop Corners */}
                            <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-indigo-500"/>
                            <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-indigo-500"/>
                            <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-indigo-500"/>
                            <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-indigo-500"/>
                        </div>
                        <style jsx>{`
                            @keyframes scan {
                                0%, 100% { top: 0%; }
                                50% { top: 100%; }
                            }
                        `}</style>
                    </div>
                );
            default:
                return (
                    <div className="flex items-center justify-center h-full bg-muted/20">
                        <div className="text-muted-foreground text-sm">Preview</div>
                    </div>
                );
        }
    }

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground font-sans antialiased selection:bg-primary/20 selection:text-primary">
            <Navbar />

            <main className="flex-1">
                
                {/* ================= 1. BIG HERO SECTION ================= */}
                <section className="relative w-full py-24 lg:py-32 overflow-hidden bg-background border-b">
                    <div className="absolute inset-0 w-full h-full">
                        <div className="absolute inset-0 z-0 bg-noise opacity-20 mix-blend-soft-light pointer-events-none"></div>
                        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-primary/10 blur-[120px] rounded-full mix-blend-multiply filter animate-blob"></div>
                        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-500/10 blur-[120px] rounded-full mix-blend-multiply filter animate-blob-delay"></div>
                    </div>
                    
                    <div className="container px-4 md:px-6 mx-auto relative z-10">
                        <div className="grid lg:grid-cols-2 gap-12 items-center">
                            {/* Text Side */}
                            <div className="text-left space-y-8">
                                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${moduleInfo.bg} ${moduleInfo.color} border border-current/20`}>
                                    <Icon className="h-4 w-4" />
                                    <span>{moduleInfo.title}</span>
                                </div>
                                <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
                                    {moduleInfo.title.split(" ")[0]} <br/>
                                    <span className={`bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent`}>
                                        {moduleInfo.title.split(" ").slice(1).join(" ")}
                                    </span>
                                </h1>
                                <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-lg">
                                    {moduleInfo.subtitle}
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <Button size="lg" className="h-11 text-base px-6 rounded-full shadow-lg shadow-primary/20 hover:scale-105 transition-all" onClick={handleAccess}>
                                        Launch Tool <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" size="lg" className="h-11 text-base px-6 rounded-full">
                                        Watch Demo <Play className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground pt-4">
                                    <div className="flex -space-x-2">
                                        {[1,2,3,4].map(i => (
                                            <div key={i} className="w-8 h-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px] font-bold">
                                                U{i}
                                            </div>
                                        ))}
                                    </div>
                                    <p>Used by 10,000+ students this week</p>
                                </div>
                            </div>

                            {/* Visual Mockup Side (Dynamic) */}
                            <div className="relative">
                                <div className="relative aspect-square md:aspect-video lg:aspect-square bg-gradient-to-br from-muted to-muted/50 rounded-3xl border border-border/50 shadow-2xl p-3 md:p-4 flex flex-col overflow-hidden group">
                                    {/* Browser Interface Header */}
                                    <div className="w-full h-8 bg-background rounded-full mb-3 flex items-center px-4 gap-2 border shadow-sm shrink-0">
                                        <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                                        <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                                        <div className="mx-auto w-1/2 h-4 bg-muted/50 rounded-md text-[8px] flex items-center justify-center text-muted-foreground opacity-50">
                                            prepnova.com/app/{String(slug)}
                                        </div>
                                    </div>
                                    
                                    {/* Dynamic Inner Content */}
                                    <div className="flex-1 bg-background rounded-xl border shadow-inner overflow-hidden relative">
                                        {renderMockup()}
                                    </div>
                                    
                                    {/* Floating Badge (Kept outside for effect) */}
                                    <div className="absolute bottom-8 right-8 bg-background/90 backdrop-blur-md border p-3 rounded-xl shadow-xl flex items-center gap-3 animate-bounce duration-[3000ms] z-20">
                                        <div className={`p-2 rounded-lg ${moduleInfo.bg}`}>
                                            <Icon className={`h-5 w-5 ${moduleInfo.color}`} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-muted-foreground font-semibold uppercase">Performance</p>
                                            <p className="text-sm font-bold">{moduleInfo.stat}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ================= 2. STATS BAR ================= */}
                <section className="border-b bg-muted/30 py-8">
                    <div className="container px-4 mx-auto">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            {[
                                { label: moduleInfo.statLabel, value: moduleInfo.stat, icon: Zap },
                                { label: "User Rating", value: "4.9/5.0", icon: Star },
                                { label: "Active Users", value: "50k+", icon: Users },
                                { label: "Uptime", value: "99.9%", icon: Shield },
                            ].map((stat, i) => (
                                <div key={i} className="flex items-center justify-center gap-3 opacity-80 hover:opacity-100 transition-opacity">
                                    <stat.icon className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-lg font-bold leading-none">{stat.value}</p>
                                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ================= 3. PROBLEM & SOLUTION (Split View) ================= */}
                <section className="py-24 bg-background">
                    <div className="container px-4 mx-auto max-w-6xl">
                        <div className="grid md:grid-cols-2 gap-12">
                            {/* The Struggle */}
                            <Card className="border-red-100 bg-red-50/50 dark:bg-red-950/10 dark:border-red-900/50">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                                        <ChevronDown className="h-5 w-5" /> The Old Way
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {moduleInfo.problems.map((p: string, i: number) => (
                                        <div key={i} className="flex gap-4 items-start">
                                            <div className="mt-1 min-w-[24px] h-6 rounded-full bg-red-200 dark:bg-red-900/50 text-red-700 dark:text-red-300 flex items-center justify-center text-xs font-bold">✕</div>
                                            <p className="text-sm md:text-base text-muted-foreground">{p}</p>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>

                            {/* The Fix */}
                            <Card className="border-green-100 bg-green-50/50 dark:bg-green-950/10 dark:border-green-900/50 relative overflow-hidden">
                                <div className="absolute top-0 right-0 bg-green-500 text-white text-xs px-3 py-1 rounded-bl-lg font-bold">PREPNOVA WAY</div>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                        <Zap className="h-5 w-5" /> The Solution
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {moduleInfo.solutions.map((s: string, i: number) => (
                                        <div key={i} className="flex gap-4 items-start">
                                            <div className="mt-1 min-w-[24px] h-6 rounded-full bg-green-200 dark:bg-green-900/50 text-green-700 dark:text-green-300 flex items-center justify-center text-xs font-bold">✓</div>
                                            <p className="text-sm md:text-base font-medium">{s}</p>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </section>

                {/* ================= 4. HOW IT WORKS (Timeline) ================= */}
                <section className="py-24 bg-muted/10 relative overflow-hidden">
                    <div className="container px-4 mx-auto relative z-10">
                        <div className="text-center mb-20 max-w-2xl mx-auto">
                            <h2 className="text-3xl font-bold mb-4">Workflow Engineered for Speed</h2>
                            <p className="text-lg text-muted-foreground">From start to finish in three simple steps.</p>
                        </div>
                        
                        <div className="grid md:grid-cols-3 gap-8">
                            {moduleInfo.steps.map((step: any, i: number) => (
                                <div key={i} className="relative group">
                                    {/* Connector Line */}
                                    {i !== moduleInfo.steps.length - 1 && (
                                        <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-border -z-10 group-hover:bg-primary/30 transition-colors" />
                                    )}
                                    
                                    <Card className="h-full hover:-translate-y-2 transition-transform duration-300 border-border/50 hover:border-primary/30 hover:shadow-lg">
                                        <CardContent className="p-8 flex flex-col items-center text-center">
                                            <div className={`w-16 h-16 rounded-2xl ${moduleInfo.bg} flex items-center justify-center text-xl font-bold ${moduleInfo.color} mb-6 shadow-sm`}>
                                                {i + 1}
                                            </div>
                                            <h3 className="text-xl font-bold mb-3">{step.label}</h3>
                                            <p className="text-muted-foreground leading-relaxed">{step.text}</p>
                                        </CardContent>
                                    </Card>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ================= 5. FEATURE DEEP DIVE (Bento) ================= */}
                <section className="py-24 bg-background">
                    <div className="container px-4 mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold mb-4">Under the Hood</h2>
                            <p className="text-muted-foreground">Advanced capabilities powered by our core AI engine.</p>
                        </div>
                        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                            {moduleInfo.features.map((f: string, i: number) => (
                                <div key={i} className="group flex items-start gap-6 p-6 rounded-2xl border bg-card hover:bg-muted/30 transition-colors">
                                    <div className={`shrink-0 p-3 rounded-xl bg-muted group-hover:${moduleInfo.bg} group-hover:${moduleInfo.color} transition-colors`}>
                                        <LayoutDashboard className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold mb-2">{f}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Enterprise-grade functionality designed to handle complex academic and professional workflows with ease.
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ================= 6. FAQ (Dynamic) ================= */}
                <section className="py-24 bg-muted/20">
                    <div className="container px-4 mx-auto max-w-3xl">
                        <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
                        <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="item-1">
                                <AccordionTrigger>Is the {moduleInfo.title} free to use?</AccordionTrigger>
                                <AccordionContent>
                                    Yes! We offer a Free tier that allows you to try out the {moduleInfo.title} with generous limits. For unlimited access and advanced AI features, you can upgrade to Pro.
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-2">
                                <AccordionTrigger>How accurate is the AI?</AccordionTrigger>
                                <AccordionContent>
                                    We use the latest LLM models (GPT-4 class) specifically fine-tuned for academic and professional use cases to ensure high accuracy and relevance.
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-3">
                                <AccordionTrigger>Can I export my data?</AccordionTrigger>
                                <AccordionContent>
                                    Absolutely. All data generated in {moduleInfo.title} belongs to you and can be exported in standard formats (PDF, DOCX, etc.) at any time.
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>
                </section>

                {/* ================= 7. FINAL CTA ================= */}
                <section className="py-32 relative overflow-hidden bg-background border-t">
                    <div className="absolute inset-0 bg-primary/5 -z-10" />
                    <div className="container px-4 mx-auto text-center max-w-3xl">
                        <div className={`inline-flex p-4 rounded-full mb-8 ${moduleInfo.bg} ${moduleInfo.color}`}>
                            <Icon className="h-8 w-8" />
                        </div>
                        <h2 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight">
                            Master your {moduleInfo.title.toLowerCase().includes("resume") ? "career" : "studies"} today.
                        </h2>
                        <p className="text-xl text-muted-foreground mb-10">
                            Join thousands of students and professionals using PrepNova to work smarter.
                        </p>

                        <div className="flex flex-col items-center gap-6">
                            {user ? (
                                <Button size="lg" className="h-16 text-xl px-12 w-full sm:w-auto rounded-full shadow-2xl hover:scale-105 transition-transform" onClick={handleAccess}>
                                    Launch {moduleInfo.title}
                                </Button>
                            ) : (
                                <Button size="lg" className="h-16 text-xl px-12 w-full sm:w-auto rounded-full shadow-2xl hover:scale-105 transition-transform" onClick={() => router.push("/signup")}>
                                    Start for Free
                                </Button>
                            )}
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500" /> No credit card required
                            </p>
                        </div>
                    </div>
                </section>

            </main>
            <Footer />
        </div>
    )
}