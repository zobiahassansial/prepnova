"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { ResumeForm } from "./resume-form"
import { ResumePreview } from "./resume-preview"
import { ResumeData, defaultSections } from "@/types/resume"
import { Button } from "@/components/ui/button"
import { addDoc, collection, doc, getDoc, setDoc, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { toast } from "sonner"
import { Eye, FileText, Loader2, Save, Sparkles } from "lucide-react"

import { checkQuota, incrementQuota } from "@/lib/subscription"
import { UpgradeModal } from "@/components/pricing/upgrade-modal"
import { logActivity } from "@/lib/logger"

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { TemplateGallery } from "./template-gallery"

function usePageCount(ref: React.RefObject<HTMLDivElement>) {
    const [pages, setPages] = useState(1)
    const A4_HEIGHT_PX = 1122 // @96dpi approx

    useEffect(() => {
        if (!ref.current) return

        const observer = new ResizeObserver(() => {
            if (!ref.current) return
            const height = ref.current.scrollHeight
            setPages(Math.max(1, Math.ceil(height / A4_HEIGHT_PX)))
        })

        observer.observe(ref.current)
        return () => observer.disconnect()
    }, [ref])

    return pages
}

export function ResumeBuilder() {
    const { user } = useAuth()
    const [loading, setLoading] = useState(false)
    const [showUpgrade, setShowUpgrade] = useState(false)
    const [resumeData, setResumeData] = useState<ResumeData>({
        userId: "",
        title: "My Resume",
        template: "basic",
        personalInfo: {
            fullName: "",
            email: "",
            phone: "",
            location: ""
        },
        summary: "",
        experience: [],
        education: [],
        skills: [],
        projects: [],
        sections: defaultSections,
        includeCover: false,
        coverTemplate: "modern"
    })
    const [activeTab, setActiveTab] = useState<"editor" | "preview">("editor")

    // Template State Logic
    const [resumeTemplateTouched, setResumeTemplateTouched] = useState(false)
    const [coverTemplateTouched, setCoverTemplateTouched] = useState(false)

    // Derived active templates (Default to 'basic' for resume if untouched, 'modern' for cover if untouched? 
    // User said: "Resume uses Basic template... If user never touches Templates... Resume stays Basic".
    // For cover, user didn't specify default, but "modern" seems safe or match resume? 
    // Let's stick to "modern" as default in data, but logic here overrides it? 
    // Actually, if data.template is initialized to "modern" in state, and we want "basic" until touched...
    // We should initialize data.template to "basic"? 
    // User prompt: "Default state: Resume uses Basic template".
    // "When user clicks a template... That template is applied".
    // So if I init data.template to "basic", then standard selection works naturally?
    // "State is saved... If user never touches Templates... Resume stays Basic".
    // So I can just init resumeData.template = "basic".
    // The "touched" state is for visual "Selected" badge? 
    // "Target: APPLY TEMPLATE ONLY IF USER TOUCHED". activeTemplate = templateTouched ? selectedTemplate : "basic".
    // This implies selectedTemplate might be "modern" but effectively it's "basic".
    // Okay, i'll implement that logic.

    const activeResumeTemplate = useMemo(() =>
        resumeTemplateTouched ? resumeData.template : "basic",
        [resumeTemplateTouched, resumeData.template])

    const activeCoverTemplate = useMemo(() =>
        coverTemplateTouched ? (resumeData.coverTemplate || "modern") : "modern",
        [coverTemplateTouched, resumeData.coverTemplate])



    // Page Count Hook
    // We need a ref to the preview container. 
    // Since ResumePreview is a child, we can either pass a ref down or wrap it.
    // The user requirement said "const pageCount = usePageCount(componentRef)" inside ResumeBuilder? 
    // No, componentRef is inside ResumePreview usually. 
    // User said: "Step 3: Use it in ResumePreview". Ah, okay.
    // But then "Step 4: Show it in UI (top-right)". The UI is in ResumeBuilder.
    // So ResumePreview needs to expose the count or allow a ref to be passed.
    // Let's pass a ref or a callback. Passing a ref is easier if ResumePreview forwards it, 
    // or we just lift the state of 'pageCount' up from ResumePreview.
    // Let's lift the page count state up.

    const [pageCount, setPageCount] = useState(1)

    // Load initial data or profile
    useEffect(() => {
        if (user) {
            setResumeData(prev => ({
                ...prev,
                userId: user.uid,
                personalInfo: {
                    ...prev.personalInfo,
                    fullName: user.displayName || "",
                    email: user.email || ""
                }
            }))
        }
    }, [user])

    const handleSave = useCallback(async () => {
        if (!user) return
        setLoading(true)

        // 1. Check Quota
        const allowed = await checkQuota(user.uid, "resume")
        if (!allowed) {
            setLoading(false)
            setShowUpgrade(true)
            return
        }

        try {
            // Save to root "resumes" collection to match dashboard query pattern
            await addDoc(collection(db, "resumes"), {
                ...resumeData,
                userId: user.uid, // Ensure userId is explicit
                updatedAt: Timestamp.now(),
                createdAt: Timestamp.now()
            })

            // 2. Increment Quota
            await incrementQuota(user.uid, "resume")

            // 3. Log Activity
            await logActivity(user.uid, "resume_created", { title: resumeData.title })

            toast.success("Resume saved successfully")
        } catch (error) {
            console.error(error)
            toast.error("Failed to save resume")
        } finally {
            setLoading(false)
        }
    }, [user, resumeData])

    const handlePrintClick = useCallback(() => {
        document.getElementById("print-resume")?.click()
    }, [])

    const handleSelectResumeTemplate = useCallback((id: string) => {
        setResumeTemplateTouched(true)
        setResumeData(prev => ({ ...prev, template: id as any }))
    }, [])

    const handleSelectCoverTemplate = useCallback((id: string) => {
        setResumeData(prev => ({ ...prev, coverTemplate: id as any }))
    }, [])

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)]">
            <UpgradeModal open={showUpgrade} onOpenChange={setShowUpgrade} featureName="Resume Generation" />
            {/* Toolbar */}
            <div className="flex items-center justify-between border-b pb-4 mb-4 bg-background z-10">
                <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <h1 className="text-xl font-bold">Resume Builder</h1>
                    <div className="ml-4 flex gap-2">
                        {/* Resume Templates Popover */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className="h-8">
                                    <Sparkles className="mr-2 h-3 w-3" />
                                    Resume Templates
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[400px] p-4" align="start">
                                <h3 className="font-semibold mb-2">Select Resume Template</h3>
                                <TemplateGallery
                                    selected={resumeData.template}
                                    activeTemplate={activeResumeTemplate}
                                    onSelect={handleSelectResumeTemplate}
                                />
                            </PopoverContent>
                        </Popover>

                        {/* Cover Letter Templates Popover */}
                        {resumeData.includeCover && (
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-8 border-dashed">
                                        <Sparkles className="mr-2 h-3 w-3" />
                                        Cover Templates
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[400px] p-4" align="start">
                                    <h3 className="font-semibold mb-2">Select Cover Letter Template</h3>
                                    <TemplateGallery
                                        selected={resumeData.coverTemplate || "modern"}
                                        activeTemplate={activeCoverTemplate}
                                        type="cover" // Active type
                                        onSelect={handleSelectCoverTemplate}
                                    />
                                </PopoverContent>
                            </Popover>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {/* Page Count Display */}
                    <span className="text-sm text-muted-foreground mr-2 hidden md:inline-block">
                        {pageCount} page{pageCount > 1 ? "s" : ""}
                    </span>

                    {/* Mobile Toggle */}
                    <div className="flex md:hidden bg-muted rounded-lg p-1">
                        <Button
                            variant={activeTab === "editor" ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setActiveTab("editor")}
                        >
                            Editor
                        </Button>
                        <Button
                            variant={activeTab === "preview" ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setActiveTab("preview")}
                        >
                            Preview
                        </Button>
                    </div>

                    <Button onClick={handleSave} disabled={loading} size="sm">
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save
                    </Button>

                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={handlePrintClick}
                    >
                        Export PDF
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-0">

                {/* Editor Pane */}
                <div className={`flex flex-col overflow-y-auto pr-2 min-h-0 ${activeTab === "preview" ? "hidden md:flex" : "flex"}`}>

                    <ResumeForm data={resumeData} onChange={setResumeData} />
                </div>

                {/* Preview Pane */}
                <div className={`bg-muted/30 border rounded-lg flex flex-col min-h-0 ${activeTab === "editor" ? "hidden md:flex" : "flex"}`}>
                    <ResumePreview
                        data={resumeData}
                        onPageCountChange={setPageCount}
                    />
                </div>

            </div>
        </div >
    )
}
