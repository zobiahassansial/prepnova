"use client"

import { useAuth } from "@/components/providers/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Lock, CheckCircle2, ArrowRight, Play, FileText, Calendar, Layers, Code2, Scan, PenTool, LayoutDashboard } from "lucide-react"
import Link from "next/link"
import { notFound, useRouter } from "next/navigation"
import { use, useEffect, useState } from "react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { toast } from "sonner"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"

// Data definition
const MODULES: any = {
    "resume-builder": {
        title: "AI Resume Builder",
        subtitle: "Create ATS-friendly resumes in minutes that help you get hired.",
        icon: FileText,
        color: "text-purple-600 bg-purple-100",
        redirect: "/dashboard/resume-builder",
        problems: [
            "Struggling to format resumes correctly",
            "Getting rejected by ATS bots",
            "Writer's block describing experience"
        ],
        solutions: [
            "Professional, ATS-optimized templates",
            "Real-time content suggestions",
            "Instant PDF export"
        ],
        steps: [
            { label: "Input Data", text: "Enter your experience and skills." },
            { label: "Choose Template", text: "Select a professional design." },
            { label: "Download", text: "Export as ATS-ready PDF." }
        ],
        features: ["ATS Checker", "AI Writing Aid", "Multiple Layouts", "Cover Letter"],
        who: ["Job Seekers", "Students", "Career Switchers"],
        minPlan: "free",
        cta: "Build Your Resume"
    },
    "study-planner": {
        title: "Smart Study Planner",
        subtitle: "Automate your study schedule and never miss a deadline again.",
        icon: Calendar,
        color: "text-blue-600 bg-blue-100",
        redirect: "/dashboard/study-planner",
        problems: [
            "Overwhelmed by massive syllabus",
            "Procrastination and cramming",
            "No clear daily goals"
        ],
        solutions: [
            "AI-generated adaptive schedules",
            "Visual progress tracking",
            "Burnout prevention"
        ],
        steps: [
            { label: "Add Subjects", text: "Input your exams and topics." },
            { label: "Set Availability", text: "Define your study hours." },
            { label: "Start Learning", text: "Follow your daily plan." }
        ],
        features: ["Drag & Drop", "Calendar Sync", "Exam Mode", "Analytics"],
        who: ["University Students", "High Schoolers", "Lifelong Learners"],
        minPlan: "free",
        cta: "Plan Your Study"
    },
    "flashcards": {
        title: "Intelligent Flashcards",
        subtitle: "Memorize faster with spaced repetition and AI generation.",
        icon: Layers,
        color: "text-pink-600 bg-pink-100",
        redirect: "/dashboard/flashcards",
        problems: [
            "Forgetting concepts quickly",
            "Boring, static notes",
            "Time-consuming to make cards"
        ],
        solutions: [
            "Active recall with Spaced Repetition",
            "Generate cards from PDF/Notes instantly",
            "Gamified mastery tracking"
        ],
        steps: [
            { label: "Upload Content", text: "Upload notes or PDFs." },
            { label: "AI Generation", text: "AI creates questions & answers." },
            { label: "Review", text: "Practice with spaced repetition." }
        ],
        features: ["PDF to Flashcards", "Smart Scheduling", "Mobile Ready", "Progress Bars"],
        who: ["Med Students", "Language Learners", "Certification Preppers"],
        minPlan: "standard",
        cta: "Start Memorizing"
    },
    "interview-prep": {
        title: "AI Interview Prep",
        subtitle: "Ace your interviews with realistic AI mock sessions and feedback.",
        icon: Code2,
        color: "text-orange-600 bg-orange-100",
        redirect: "/dashboard/interview-prep",
        problems: [
            "Nervousness during interviews",
            "Not knowing what questions to expect",
            "Lack of constructive feedback"
        ],
        solutions: [
            "Realistic AI mock interviews",
            "Instant feedback on tone and answers",
            "Industry-specific question banks"
        ],
        steps: [
            { label: "Select Role", text: "Choose job role and difficulty." },
            { label: "Practice", text: "Speak or type your answers." },
            { label: "Get Feedback", text: "Review scores and improvements." }
        ],
        features: ["Voice Interaction", "Behavioral Questions", "Technical Coding", "Sentiment Analysis"],
        who: ["Job Seekers", "New Grads", "Professionals"],
        minPlan: "pro",
        cta: "Practice Interview"
    },
    "note-summarizer": {
        title: "Note Summarizer",
        subtitle: "Turn long documents and lectures into concise, actionable summaries.",
        icon: PenTool,
        color: "text-emerald-600 bg-emerald-100",
        redirect: "/dashboard/note-summarizer",
        problems: [
            "Drowning in long readings",
            "Missing key lecture points",
            "Unorganized messy notes"
        ],
        solutions: [
            "Instant AI summaries",
            "Extraction of key takeaways",
            "Chat with your documents"
        ],
        steps: [
            { label: "Upload File", text: "Upload PDF, DOCX, or Audio." },
            { label: "Analyze", text: "AI processes the content." },
            { label: "Learn", text: "Read summaries & key points." }
        ],
        features: ["Multi-format Support", "Bullet Points", "Action Items", "Flashcard Export"],
        who: ["Researchers", "Students", "Executives"],
        minPlan: "standard",
        cta: "Summarize Notes"
    },
    "document-scanner": {
        title: "Document Scanner",
        subtitle: "Digitize your handwritten notes and make them searchable instantly.",
        icon: Scan,
        color: "text-indigo-600 bg-indigo-100",
        redirect: "/dashboard/document-scanner",
        problems: [
            "Losing physical notebooks",
            "Cannot search handwritten notes",
            "Hard to share notes"
        ],
        solutions: [
            "High-quality scanning",
            "OCR to editable text",
            "Cloud synchronization"
        ],
        steps: [
            { label: "Scan", text: "Photo or upload image." },
            { label: "Process", text: "Enhance and extract text." },
            { label: "Organize", text: "Save to digital notebook." }
        ],
        features: ["Handwriting OCR", "Auto-Crop", "PDF Export", "Tagging"],
        who: ["Students", "Archivists", "Creatives"],
        minPlan: "standard",
        cta: "Scan Documents"
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

    // Fetch user plan
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

    const handleAccess = () => {
        if (!user) {
            router.push(`/login?callbackUrl=/dashboard/${String(slug)}`) // Direct to dashboard after login
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

    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />

            <main className="flex-1">
                {/* Hero Section */}
                <section className="py-20 bg-muted/20">
                    <div className="container px-4 mx-auto text-center max-w-4xl">
                        <div className={`inline-flex p-4 rounded-full mb-6 ${moduleInfo.color}`}>
                            <Icon className="h-10 w-10" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold mb-6">{moduleInfo.title}</h1>
                        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                            {moduleInfo.subtitle}
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            {user ? (
                                <Button size="lg" className="h-14 text-lg px-8" onClick={handleAccess}>
                                    Go to {moduleInfo.title} <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            ) : (
                                <Button size="lg" className="h-14 text-lg px-8" onClick={() => router.push("/signup")}>
                                    Get Started Free
                                </Button>
                            )}
                            <Button variant="outline" size="lg" className="h-14 text-lg px-8">
                                View Demo <Play className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </section>

                {/* Problems Section */}
                <section className="py-20 bg-background">
                    <div className="container px-4 mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold mb-4">Why you need this</h2>
                            <p className="text-muted-foreground">The struggle is real.</p>
                        </div>
                        <div className="grid md:grid-cols-3 gap-8">
                            {moduleInfo.problems.map((p: string, i: number) => (
                                <Card key={i} className="border-none shadow-none bg-muted/30">
                                    <CardContent className="pt-6 text-center">
                                        <div className="mx-auto bg-red-100 w-12 h-12 rounded-full flex items-center justify-center mb-4 text-red-600 font-bold">
                                            {i + 1}
                                        </div>
                                        <p className="font-medium text-lg">{p}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Solution Section */}
                <section className="py-20 bg-primary/5">
                    <div className="container px-4 mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold mb-4">How we solve it</h2>
                            <p className="text-muted-foreground">Better, faster, smarter.</p>
                        </div>
                        <div className="grid md:grid-cols-3 gap-8">
                            {moduleInfo.solutions.map((s: string, i: number) => (
                                <div key={i} className="flex flex-col items-center text-center p-6 bg-background rounded-xl shadow-sm border">
                                    <CheckCircle2 className="h-10 w-10 text-green-500 mb-4" />
                                    <p className="font-medium text-lg">{s}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Steps Section */}
                <section className="py-20">
                    <div className="container px-4 mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold mb-4">How it works</h2>
                            <p className="text-muted-foreground">Simple as 1-2-3.</p>
                        </div>
                        <div className="grid md:grid-cols-3 gap-8 relative">
                            {/* Connecting Line (Desktop) */}
                            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-muted -z-10" />

                            {moduleInfo.steps.map((step: any, i: number) => (
                                <div key={i} className="flex flex-col items-center text-center">
                                    <div className="w-24 h-24 bg-background border-4 border-primary/20 rounded-full flex items-center justify-center mb-6 text-2xl font-bold text-primary">
                                        {i + 1}
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">{step.label}</h3>
                                    <p className="text-muted-foreground">{step.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Key Features */}
                <section className="py-20 bg-muted/30">
                    <div className="container px-4 mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold mb-4">Key Features</h2>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {moduleInfo.features.map((f: string, i: number) => (
                                <Card key={i} className="hover:shadow-lg transition-shadow">
                                    <CardContent className="p-6 flex items-center gap-3">
                                        <div className="bg-primary/10 p-2 rounded-lg">
                                            <LayoutDashboard className="h-5 w-5 text-primary" />
                                        </div>
                                        <span className="font-semibold">{f}</span>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Visual Proof */}
                <section className="py-20">
                    <div className="container px-4 mx-auto max-w-5xl">
                        <div className="bg-muted aspect-video rounded-2xl border-4 border-dashed border-muted-foreground/20 flex flex-col items-center justify-center relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-primary/5 opacity-50" />
                            <Scan className="h-16 w-16 text-muted-foreground/50 mb-4 group-hover:scale-110 transition-transform" />
                            <p className="text-xl font-medium text-muted-foreground">
                                {moduleInfo.title} Demo Placeholder
                            </p>
                            <p className="text-sm text-muted-foreground mt-2">Add Screenshot or Video Here</p>
                        </div>
                    </div>
                </section>

                {/* Who It's For */}
                <section className="py-20 bg-primary text-primary-foreground">
                    <div className="container px-4 mx-auto text-center">
                        <h2 className="text-3xl font-bold mb-12 text-white">Perfect For</h2>
                        <div className="flex flex-wrap justify-center gap-4">
                            {moduleInfo.who.map((w: string, i: number) => (
                                <div key={i} className="bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full text-lg font-medium border border-white/20">
                                    {w}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Final CTA */}
                <section className="py-24 bg-background text-center">
                    <div className="container px-4 mx-auto max-w-2xl">
                        <h2 className="text-4xl font-bold mb-6">Ready to get started?</h2>
                        <p className="text-xl text-muted-foreground mb-10">Start using {moduleInfo.title} today.</p>

                        <div className="flex flex-col items-center gap-4">
                            {user ? (
                                <Button size="lg" className="h-16 text-xl px-12 w-full sm:w-auto" onClick={handleAccess}>
                                    Start Using {moduleInfo.title}
                                </Button>
                            ) : (
                                <Button size="lg" className="h-16 text-xl px-12 w-full sm:w-auto" onClick={() => router.push("/signup")}>
                                    Start Using {moduleInfo.title}
                                </Button>
                            )}
                            <p className="text-sm text-muted-foreground">Free. No credit card required.</p>
                        </div>
                    </div>
                </section>

            </main>
            <Footer />
        </div>
    )
}
