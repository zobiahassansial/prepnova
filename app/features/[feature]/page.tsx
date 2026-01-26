"use client"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/providers/auth-provider"
import Link from "next/link"
import { notFound, useRouter } from "next/navigation"
import { ArrowLeft, Lock } from "lucide-react"

const FEATURES = {
    "resume-builder": {
        title: "AI Resume Builder",
        description: "Create ATS-friendly resumes in minutes.",
        details: "Our AI-powered builder helps you craft professional resumes that pass Applicant Tracking Systems. Choose from multiple templates, get real-time feedback, and export to PDF.",
        subFeature: "Standard Plan"
    },
    "study-planner": {
        title: "Smart Study Planner",
        description: "Your personal study schedule automation.",
        details: "Stop worrying about what to study when. Input your exam date and subjects, and our AI generates a balanced study plan for you. Drag & drop to reschedule easily.",
        subFeature: "Standard Plan"
    },
    "note-summarizer": {
        title: "Note Summarizer",
        description: "Condense long lectures instantly.",
        details: "Paste your notes or upload a transcript. Our AI will analyze the content and generate concise summaries, key takeaways, and bullet points to help you review faster.",
        subFeature: "Standard Plan"
    },
    "document-scanner": {
        title: "Document Scanner",
        description: "Digitalize your handwritten notes.",
        details: "Take a photo of your whiteboard or notebook. We'll crop, enhance, and extract the text using OCR so you can search, edit, and summarize it with AI.",
        subFeature: "Standard Plan"
    },
    "flashcards": {
        title: "AI Flashcards",
        description: "Turn notes into flashcards instantly.",
        details: "Upload your PDF notes or lecture slides. Our AI extracts key concepts and creates spaced-repetition flashcard decks for you.",
        subFeature: "Standard Plan"
    },
    "interview-prep": {
        title: "Interview Prep Hub",
        description: "Practice with an AI Interviewer.",
        details: "Simulate real behavioral interviews. Get instant feedback on your answers, clarity, and tone. Prepare for top tech and behavioral questions.",
        subFeature: "Pro Plan"
    }
}

export default function FeaturePage({ params }: { params: { feature: string } }) {
    const { user } = useAuth()
    const router = useRouter()

    const featureKey = params.feature as keyof typeof FEATURES
    const feature = FEATURES[featureKey]

    if (!feature) {
        return notFound()
    }

    const handleContinue = () => {
        if (user) {
            router.push(`/dashboard/${featureKey}`)
        } else {
            router.push(`/login?callbackUrl=/dashboard/${featureKey}`)
        }
    }

    return (
        <div className="min-h-screen bg-background flex flex-col items-center py-20 px-4">
            <div className="max-w-3xl w-full space-y-8 text-center">
                <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-8 self-start">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
                </Link>

                <div className="space-y-4">
                    <div className="inline-block rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                        {feature.subFeature}
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">{feature.title}</h1>
                    <p className="text-xl text-muted-foreground">{feature.description}</p>
                </div>

                <div className="bg-muted/50 p-8 rounded-xl border space-y-4">
                    <h2 className="text-xl font-semibold">What is it?</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        {feature.details}
                    </p>
                    <div className="h-40 bg-muted rounded-lg flex items-center justify-center border-dashed border-2">
                        <span className="text-muted-foreground">Screenshot / Demo Placeholder</span>
                    </div>
                </div>

                <div className="space-y-4 pt-8">
                    <Button size="lg" className="h-12 px-8 text-lg w-full md:w-auto" onClick={handleContinue}>
                        {user ? "Go to Dashboard" : "Login to Continue"}
                    </Button>
                    {!user && (
                        <p className="text-sm text-muted-foreground">
                            You will be redirected back here after login.
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}
