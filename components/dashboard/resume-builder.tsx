"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { ResumeForm } from "./resume-form"
import { ResumePreview } from "./resume-preview"
import { ResumeData, defaultSections } from "@/types/resume"
import { Button } from "@/components/ui/button"
import { addDoc, collection, doc, getDoc, setDoc, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { toast } from "sonner"
import { Eye, FileText, Loader2, Save } from "lucide-react"

import { checkQuota, incrementQuota } from "@/lib/subscription"
import { UpgradeModal } from "@/components/pricing/upgrade-modal"
import { logActivity } from "@/lib/logger"

export function ResumeBuilder() {
    const { user } = useAuth()
    const [loading, setLoading] = useState(false)
    const [showUpgrade, setShowUpgrade] = useState(false)
    const [resumeData, setResumeData] = useState<ResumeData>({
        userId: "",
        title: "My Resume",
        template: "modern",
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
        sections: defaultSections
    })
    const [activeTab, setActiveTab] = useState<"editor" | "preview">("editor")

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

    const handleSave = async () => {
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
    }

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)]">
            <UpgradeModal open={showUpgrade} onOpenChange={setShowUpgrade} featureName="Resume Generation" />
            {/* Toolbar */}
            <div className="flex items-center justify-between border-b pb-4 mb-4 bg-background z-10">
                <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <h1 className="text-xl font-bold">Resume Builder</h1>
                    <div className="ml-4">
                        <select
                            className="bg-transparent border rounded p-1 text-sm"
                            value={resumeData.template}
                            onChange={(e) => setResumeData({ ...resumeData, template: e.target.value as any })}
                        >
                            <option value="modern">Modern</option>
                            <option value="classic">Classic</option>
                            <option value="minimal">Minimal</option>
                        </select>
                    </div>
                </div>
                <div className="flex items-center gap-2">
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
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-0">

                {/* Editor Pane */}
                <div className={`flex flex-col overflow-y-auto pr-2 min-h-0 ${activeTab === "preview" ? "hidden md:flex" : "flex"}`}>

                    <ResumeForm data={resumeData} onChange={setResumeData} />
                </div>

                {/* Preview Pane */}
                <div className={`bg-muted/30 border rounded-lg flex flex-col min-h-0 ${activeTab === "editor" ? "hidden md:flex" : "flex"}`}>
                    <ResumePreview data={resumeData} />
                </div>

            </div>
        </div>
    )
}
