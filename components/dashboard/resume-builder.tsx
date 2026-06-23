"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { ResumeForm } from "./resume-form"
import { ResumePreview } from "./resume-preview"
import { ResumeData, defaultSections } from "@/types/resume"
import { Button } from "@/components/ui/button"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { toast } from "sonner"
import { Eye, FileText, Loader2, Save, Sparkles } from "lucide-react"

import { saveResume } from "@/actions/save-resume"
import { UpgradeModal } from "@/components/pricing/upgrade-modal"
import { logActivity } from "@/lib/logger"

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { TemplateGallery } from "./template-gallery"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Code } from "lucide-react"
import { UploadTemplateEditor } from "./upload-template-editor"
import type { TemplateDefinition } from "@/types/template-definition"

// ── Resume Score ──────────────────────────────────────────────────────────────

interface ScoreBreakdown {
    label: string
    earned: number
    max: number
    tip: string
}

function calculateResumeScore(data: ResumeData): { score: number; breakdown: ScoreBreakdown[] } {
    const breakdown: ScoreBreakdown[] = []

    // Personal Info (20 pts)
    const pi = data.personalInfo
    let piScore = 0
    if (pi.fullName?.trim()) piScore += 4
    if (pi.email?.trim()) piScore += 4
    if (pi.phone?.trim()) piScore += 3
    if (pi.location?.trim()) piScore += 3
    if (pi.linkedin?.trim()) piScore += 3
    if (pi.website?.trim()) piScore += 3
    breakdown.push({
        label: "Contact Info",
        earned: piScore,
        max: 20,
        tip: "Add name, email, phone, location, LinkedIn & website for full marks."
    })

    // Summary (15 pts)
    const sumLen = data.summary?.trim().length ?? 0
    const sumScore = sumLen >= 120 ? 15 : sumLen >= 60 ? 10 : sumLen > 0 ? 5 : 0
    breakdown.push({
        label: "Summary",
        earned: sumScore,
        max: 15,
        tip: "Write a 120+ character professional summary for full marks."
    })

    // Experience (25 pts)
    const expCount = data.experience?.length ?? 0
    let expScore = 0
    if (expCount >= 1) expScore += 10
    if (expCount >= 2) expScore += 5
    const expWithDesc = data.experience?.filter(e => e.description?.trim().length >= 50).length ?? 0
    expScore += Math.min(expWithDesc * 5, 10)
    breakdown.push({
        label: "Experience",
        earned: expScore,
        max: 25,
        tip: "Add 2+ jobs with detailed descriptions (50+ chars each)."
    })

    // Education (15 pts)
    const eduCount = data.education?.length ?? 0
    const eduScore = eduCount >= 2 ? 15 : eduCount === 1 ? 10 : 0
    breakdown.push({
        label: "Education",
        earned: eduScore,
        max: 15,
        tip: "Add 2+ education entries for full marks."
    })

    // Skills (15 pts)
    const skillCount = data.skills?.length ?? 0
    const skillScore = skillCount >= 10 ? 15 : skillCount >= 6 ? 10 : skillCount >= 3 ? 5 : 0
    breakdown.push({
        label: "Skills",
        earned: skillScore,
        max: 15,
        tip: "Add 10+ skills for full marks."
    })

    // Projects (10 pts)
    const projCount = data.projects?.length ?? 0
    const projScore = projCount >= 2 ? 10 : projCount === 1 ? 5 : 0
    breakdown.push({
        label: "Projects",
        earned: projScore,
        max: 10,
        tip: "Add 2+ projects to stand out."
    })

    const score = breakdown.reduce((acc, b) => acc + b.earned, 0)
    return { score, breakdown }
}

function getScoreColor(score: number) {
    if (score >= 80) return { bar: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400", label: "Excellent" }
    if (score >= 60) return { bar: "bg-blue-500", text: "text-blue-600 dark:text-blue-400", label: "Good" }
    if (score >= 35) return { bar: "bg-amber-500", text: "text-amber-600 dark:text-amber-400", label: "Fair" }
    return { bar: "bg-rose-500", text: "text-rose-600 dark:text-rose-400", label: "Weak" }
}

function ResumeScoreBar({ data }: { data: ResumeData }) {
    const { score, breakdown } = useMemo(() => calculateResumeScore(data), [data])
    const { bar, text, label } = getScoreColor(score)

    return (
        <div className="relative group flex items-center gap-2 cursor-default select-none">
            <div className="hidden sm:flex flex-col items-end gap-0.5">
                <span className={`text-[11px] font-semibold leading-none ${text}`}>{label}</span>
                <span className="text-[10px] text-muted-foreground leading-none">{score}/100</span>
            </div>
            <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${bar}`}
                    style={{ width: `${score}%` }}
                />
            </div>

            {/* Hover breakdown panel */}
            <div className="absolute right-0 top-full mt-2 w-64 z-50 hidden group-hover:block">
                <div className="rounded-lg border bg-popover shadow-lg p-3 text-popover-foreground">
                    <p className="font-semibold text-sm mb-2">Resume Score: {score}/100</p>
                    <div className="space-y-2">
                        {breakdown.map(b => (
                            <div key={b.label} className="space-y-0.5">
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">{b.label}</span>
                                    <span className={b.earned === b.max ? "text-emerald-500 font-medium" : "text-foreground"}>
                                        {b.earned}/{b.max}
                                    </span>
                                </div>
                                <div className="h-1 rounded-full bg-muted overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${bar} transition-all duration-300`}
                                        style={{ width: `${(b.earned / b.max) * 100}%` }}
                                    />
                                </div>
                                {b.earned < b.max && (
                                    <p className="text-[10px] text-muted-foreground/70 leading-snug">{b.tip}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────

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
    const [resumeTemplatePopoverOpen, setResumeTemplatePopoverOpen] = useState(false)
    const [coverTemplatePopoverOpen, setCoverTemplatePopoverOpen] = useState(false)
    const [uploadEditorOpen, setUploadEditorOpen] = useState(false)

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
        coverTemplateTouched ? (resumeData.coverTemplate || resumeData.template) : resumeData.template,
        [coverTemplateTouched, resumeData.coverTemplate, resumeData.template])

    // Auto-sync cover template to resume template whenever it changes (unless user picked one manually)
    useEffect(() => {
        if (resumeData.includeCover && !coverTemplateTouched) {
            setResumeData(prev => ({ ...prev, coverTemplate: prev.template as any }))
        }
    }, [resumeData.template, resumeData.includeCover, coverTemplateTouched])



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

        try {
            // Server action enforces quota atomically via Firestore transaction.
            // The client-side checkClientQuota call has been removed — it was
            // bypassable by writing directly to Firestore from the browser.
            const result = await saveResume(resumeData)

            if (!result.success) {
                if (result.error?.includes("used") && result.error?.includes("resumes")) {
                    setShowUpgrade(true)
                } else {
                    toast.error(result.error || "Failed to save resume.")
                }
                return
            }

            await logActivity(user.uid, "resume_created", `Saved resume: "${resumeData.title}"`)
            toast.success("Resume saved successfully!")
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "Unknown error"
            toast.error("Failed to save resume: " + msg)
        } finally {
            setLoading(false)
        }
    }, [user, resumeData])

    const handlePrintClick = useCallback(() => {
        document.getElementById("print-resume")?.click()
    }, [])

    const handleSelectResumeTemplate = useCallback((id: string, customHtml?: string) => {
        setResumeTemplateTouched(true)
        setResumeData(prev => ({
            ...prev,
            template: id as any,
            activeTemplateId: id,
            ...(customHtml ? { customTemplateHtml: customHtml } : {})
        }))
        setResumeTemplatePopoverOpen(false)
    }, [])

    const handleSelectCoverTemplate = useCallback((id: string, customHtml?: string) => {
        setCoverTemplateTouched(true)
        setResumeData(prev => ({ ...prev, coverTemplate: id as any }))
        setCoverTemplatePopoverOpen(false)
    }, [])

    const handleSaveOverlayTemplate = useCallback((def: TemplateDefinition) => {
        setResumeTemplateTouched(true)
        setResumeData(prev => ({
            ...prev,
            template:                   "imported-template",
            activeTemplateId:           "imported-template",
            importedTemplateDefinition: def,
        }))
        setUploadEditorOpen(false)
    }, [])

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)]">
            {showUpgrade && (
                <UpgradeModal
                    feature="Resume Generation"
                    description="You've reached your resume limit for this plan. Upgrade to create more resumes."
                    requiredPlan="standard"
                    onClose={() => setShowUpgrade(false)}
                />
            )}

            {/* Upload Template editor */}
            <UploadTemplateEditor
                open={uploadEditorOpen}
                onClose={() => setUploadEditorOpen(false)}
                resumeData={resumeData}
                initial={resumeData.importedTemplateDefinition}
                onSave={handleSaveOverlayTemplate}
            />
            {/* Toolbar */}
            <div className="flex items-center justify-between border-b pb-4 mb-4 bg-background z-10">
                <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <h1 className="text-xl font-bold">Resume Builder</h1>
                    <div className="ml-4 flex gap-2">
                        {/* Resume Templates Popover */}
                        <Popover open={resumeTemplatePopoverOpen} onOpenChange={setResumeTemplatePopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className="h-8">
                                    <Sparkles className="mr-2 h-3 w-3" />
                                    Resume Templates
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[580px] p-4" align="start">
                                <h3 className="font-semibold mb-3">Select Resume Template</h3>
                                <TemplateGallery
                                    selected={resumeData.template}
                                    activeTemplate={activeResumeTemplate}
                                    onSelect={handleSelectResumeTemplate}
                                    customTemplateHtml={resumeData.customTemplateHtml}
                                    importedTemplateDefinition={resumeData.importedTemplateDefinition}
                                    onUpload={() => {
                                        setResumeTemplatePopoverOpen(false)
                                        setUploadEditorOpen(true)
                                    }}
                                />
                            </PopoverContent>
                        </Popover>

                        {/* Custom Template Code dialog (HTML mode) */}
                        {resumeData.template === "custom" && (
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-8 bg-slate-900 text-white hover:bg-slate-800 hover:text-white">
                                        <Code className="mr-2 h-3 w-3" />
                                        Custom Template Code
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="w-[800px] max-w-[90vw]">
                                    <DialogHeader>
                                        <DialogTitle>Edit Custom Resume HTML</DialogTitle>
                                    </DialogHeader>
                                    <div className="py-4">
                                        <p className="text-sm text-muted-foreground mb-4">
                                            Use variables like <code>{`{{fullName}}`}</code>, <code>{`{{email}}`}</code>, <code>{`{{phone}}`}</code>, and <code>{`{{summary}}`}</code>.
                                        </p>
                                        <Textarea
                                            className="font-mono h-[400px]"
                                            value={resumeData.customTemplateHtml || ""}
                                            onChange={(e) => setResumeData(prev => ({ ...prev, customTemplateHtml: e.target.value }))}
                                            placeholder="<html>...</html>"
                                        />
                                    </div>
                                </DialogContent>
                            </Dialog>
                        )}

                        {/* Cover Letter Templates Popover */}
                        {resumeData.includeCover && (
                            <Popover open={coverTemplatePopoverOpen} onOpenChange={setCoverTemplatePopoverOpen}>
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
                                        type="cover"
                                        onSelect={handleSelectCoverTemplate}
                                    />
                                </PopoverContent>
                            </Popover>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {/* Resume Score Bar */}
                    <ResumeScoreBar data={resumeData} />

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
                <div className={`flex flex-col overflow-y-auto overflow-x-hidden pr-2 min-h-0 min-w-0 ${activeTab === "preview" ? "hidden md:flex" : "flex"}`}>

                    <ResumeForm data={resumeData} onChange={setResumeData} />
                </div>

                {/* Preview Pane */}
                <div className={`bg-muted/30 border rounded-lg flex flex-col min-h-0 min-w-0 overflow-hidden ${activeTab === "editor" ? "hidden md:flex" : "flex"}`}>
                    <ResumePreview
                        data={resumeData}
                        onPageCountChange={setPageCount}
                    />
                </div>

            </div>
        </div >
    )
}
