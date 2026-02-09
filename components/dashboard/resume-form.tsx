"use client"

import { ResumeData } from "@/types/resume"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, Sparkles, Loader2 } from "lucide-react"
import { useState, useRef, useCallback, useMemo } from "react"
import { toast } from "sonner"

interface ResumeFormProps {
    data: ResumeData
    onChange: (data: ResumeData) => void
}

export function ResumeForm({ data, onChange }: ResumeFormProps) {
    const [jobDescription, setJobDescription] = useState("")

    const updatePersonalInfo = useCallback((field: string, value: string) => {
        onChange({
            ...data,
            personalInfo: { ...data.personalInfo, [field]: value }
        })
    }, [data, onChange])

    const addExperience = useCallback(() => {
        const newItem = {
            id: Date.now().toString(),
            company: "New Company",
            position: "Position",
            startDate: "",
            endDate: "",
            current: false,
            location: "",
            description: ""
        }
        onChange({ ...data, experience: [...data.experience, newItem] })
    }, [data, onChange])

    // Generic update handler could be cleaner with a custom hook or specialized components
    // For now, inline handlers for speed given this phase


    const [generating, setGenerating] = useState(false)
    const [showErrors, setShowErrors] = useState(false)

    // Refs for auto-scrolling
    const fullNameRef = useRef<HTMLInputElement>(null)
    const emailRef = useRef<HTMLInputElement>(null)
    const experienceRef = useRef<HTMLButtonElement>(null)
    const educationRef = useRef<HTMLButtonElement>(null)
    const skillsRef = useRef<HTMLButtonElement>(null)
    const jobDescriptionRef = useRef<HTMLTextAreaElement>(null)

    // STRICT Validation Logic
    const validation = useMemo(() => {
        const isFullNameValid = !!data.personalInfo.fullName?.trim()
        const isEmailValid = !!data.personalInfo.email?.trim()
        const isJobDescriptionValid = jobDescription.trim().length >= 20

        const hasValidExperience = data.experience.some(res =>
            res.company.trim() && res.company !== "New Company" &&
            res.position.trim() && res.position !== "Position" &&
            res.description.trim().length > 20
        )

        const hasValidEducation = data.education.some(edu =>
            edu.school.trim() && edu.school !== "University" &&
            edu.degree.trim() && edu.degree !== "Degree"
        )

        const hasValidSkills = data.skills.filter(s => s.trim().length > 0).length >= 2

        return {
            isFullNameValid,
            isEmailValid,
            isJobDescriptionValid,
            hasValidExperience,
            hasValidEducation,
            hasValidSkills,
            hasContent: hasValidExperience || hasValidEducation || hasValidSkills
        }
    }, [data, jobDescription])

    const handleAIGenerate = useCallback(async (e: React.MouseEvent) => {
        // Prevent default if it's a form submission (though it's a button here)
        e.preventDefault()

        const { isFullNameValid, isEmailValid, hasValidExperience, hasValidEducation, hasValidSkills, hasContent, isJobDescriptionValid } = validation

        if (!isFullNameValid || !isEmailValid || !hasContent || !isJobDescriptionValid) {
            setShowErrors(true)
            toast.error("Please fill required fields (including Job Description) to use AI")

            // Auto-scroll to first error
            if (!isFullNameValid) fullNameRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
            else if (!isEmailValid) emailRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
            else if (!isJobDescriptionValid) jobDescriptionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
            else {
                // Scroll to the first missing/invalid section in order
                if (!hasValidExperience) experienceRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
                else if (!hasValidEducation) educationRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
                else if (!hasValidSkills) skillsRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
            }
            return
        }

        setGenerating(true)
        try {
            const { generateResumeContent } = await import("@/actions/generate-resume")
            const newContent = await generateResumeContent(data, data.resumeTone)

            onChange({
                ...data,
                ...newContent,
                // Preserve personal info to prevent AI hallucination override
                personalInfo: { ...data.personalInfo, ...newContent.personalInfo }
            })
            toast.success("Resume content enhanced by AI!")
        } catch (error) {
            console.error(error)
            toast.error("AI generation failed.")
        } finally {
            setGenerating(false)
        }
    }, [data, validation, onChange])

    const addEducation = useCallback(() => {
        const newItem = {
            id: Date.now().toString(),
            school: "University",
            degree: "Degree",
            field: "Field of Study",
            startDate: "",
            endDate: "",
            location: "",
        }
        onChange({ ...data, education: [...data.education, newItem] })
    }, [data, onChange])

    return (
        <div className="space-y-6">
            <div className="bg-primary/5 p-4 rounded-lg flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> AI Assistant</h3>
                        <p className="text-xs text-muted-foreground">Enhance your resume content automatically.</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Tone:</span>
                        {["professional", "formal", "minimal"].map((tone) => (
                            <label key={tone} className="flex items-center gap-1 cursor-pointer">
                                <input
                                    type="radio"
                                    name="resumeTone"
                                    checked={data.resumeTone === tone || (!data.resumeTone && tone === "professional")} // Default to professional
                                    onChange={() => onChange({ ...data, resumeTone: tone as any })}
                                    className="text-primary focus:ring-primary"
                                />
                                <span className="capitalize">{tone}</span>
                            </label>
                        ))}
                    </div>
                    <Button onClick={handleAIGenerate} disabled={generating} size="sm" className="ml-auto">
                        {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                        Optimize with AI
                    </Button>
                </div>
            </div>

            {/* Cover Letter Toggle & Input */}
            <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                        <input
                            type="checkbox"
                            checked={data.includeCover || false}
                            onChange={(e) => onChange({ ...data, includeCover: e.target.checked })}
                            className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                        />
                        Include Cover Letter
                    </label>


                </div>

                {data.includeCover && (
                    <div className="relative">
                        <Textarea
                            value={data.coverLetter || ""}
                            onChange={(e) => onChange({ ...data, coverLetter: e.target.value })}
                            placeholder="Write your cover letter here..."
                            className="w-full min-h-[150px] pr-8"
                        />

                        {/* REMOVED TONE SELECTOR - SINGLE SOURCE OF TRUTH */}
                        {/* <div className="mt-2 flex items-center gap-4 text-sm">
                            <span className="font-medium">Tone:</span>
                             {["professional", "formal", "minimal"].map((tone) => (
                                <label key={tone} className="flex items-center gap-1 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="coverTone"
                                        checked={data.coverLetterTone === tone || (!data.coverLetterTone && tone === "professional")} // Default to professional
                                        onChange={() => onChange({ ...data, coverLetterTone: tone as any })}
                                        className="text-primary focus:ring-primary"
                                    />
                                    <span className="capitalize">{tone}</span>
                                </label>
                            ))}
                        </div> */}
                        <div className="absolute top-2 right-2 flex gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs text-muted-foreground hover:text-primary"
                                onClick={async () => {
                                    setGenerating(true)
                                    try {
                                        const { generateCoverLetter } = await import("@/actions/generate-resume")
                                        // Use data.resumeTone instead of data.coverLetterTone
                                        const generated = await generateCoverLetter(data, data.resumeTone)
                                        onChange({ ...data, coverLetter: generated })
                                        toast.success("Cover letter generated!")
                                    } catch (error) {
                                        toast.error("Failed to generate cover letter")
                                    } finally {
                                        setGenerating(false)
                                    }
                                }}
                                disabled={generating}
                            >
                                <Sparkles className="h-3 w-3 mr-1" />
                                Generate
                            </Button>

                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs text-muted-foreground hover:text-primary"
                                onClick={async () => {
                                    if (jobDescription.trim().length < 20) {
                                        setShowErrors(true)
                                        toast.error("Please enter a valid Job Description first (min 20 chars)")
                                        jobDescriptionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
                                        return
                                    }
                                    setGenerating(true)
                                    try {
                                        const { matchCoverLetterToJob } = await import("@/actions/generate-resume")
                                        // Use data.resumeTone instead of data.coverLetterTone
                                        const optimized = await matchCoverLetterToJob(data.coverLetter || "", jobDescription, data, data.resumeTone)
                                        onChange({ ...data, coverLetter: optimized })
                                        toast.success("Cover letter matched to job!")
                                    } catch (error) {
                                        toast.error("Failed to match cover letter")
                                    } finally {
                                        setGenerating(false)
                                    }
                                }}
                                disabled={generating}
                            >
                                <Sparkles className="h-3 w-3 mr-1" />
                                Match Job
                            </Button>

                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs text-muted-foreground hover:text-primary"
                                onClick={async () => {
                                    setGenerating(true)
                                    try {
                                        const { optimizeCoverLetter } = await import("@/actions/generate-resume")
                                        // Use data.resumeTone instead of data.coverLetterTone
                                        const optimized = await optimizeCoverLetter(data.coverLetter || "", data, data.resumeTone)
                                        onChange({ ...data, coverLetter: optimized })
                                        toast.success("Cover letter optimized!")
                                    } catch (error) {
                                        toast.error("Failed to optimize cover letter")
                                    } finally {
                                        setGenerating(false)
                                    }
                                }}
                                disabled={generating}
                            >
                                <Sparkles className="h-3 w-3 mr-1" />
                                Optimize
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Job Description Input (for AI) */}
            <div className="space-y-2 border rounded-lg p-4 bg-muted/20">
                <Label className="font-semibold flex items-center gap-2">
                    Target Job Description <span className="text-red-500">*</span>
                    <span className="text-xs font-normal text-muted-foreground">(Required for AI matching)</span>
                </Label>
                <Textarea
                    ref={jobDescriptionRef}
                    className={showErrors && jobDescription.trim().length < 20 ? "border-red-500 shake" : ""}
                    placeholder="Paste job description here..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    rows={4}
                />
                {showErrors && jobDescription.trim().length < 20 && (
                    <p className="text-xs text-red-500 font-medium">Job description is required for AI matching (Min 20 chars)</p>
                )}
            </div>

            <Accordion type="single" collapsible defaultValue="personal">
                {/* Personal Info */}
                <AccordionItem value="personal">
                    <AccordionTrigger>Personal Information</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-2">
                        <div className="space-y-2">
                            <Label>Full Name <span className="text-red-500">*</span></Label>
                            <Input
                                ref={fullNameRef}
                                className={showErrors && !data.personalInfo.fullName ? "border-red-500 shake focus:ring-red-500" : ""}
                                value={data.personalInfo.fullName}
                                onChange={(e) => updatePersonalInfo("fullName", e.target.value)}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Email <span className="text-red-500">*</span></Label>
                                <Input
                                    ref={emailRef}
                                    className={showErrors && !data.personalInfo.email ? "border-red-500 shake focus:ring-red-500" : ""}
                                    value={data.personalInfo.email}
                                    onChange={(e) => updatePersonalInfo("email", e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Phone</Label>
                                <Input
                                    value={data.personalInfo.phone}
                                    onChange={(e) => updatePersonalInfo("phone", e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Location</Label>
                            <Input
                                value={data.personalInfo.location}
                                onChange={(e) => updatePersonalInfo("location", e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>LinkedIn / Website</Label>
                            <Input
                                value={data.personalInfo.linkedin || ""}
                                onChange={(e) => updatePersonalInfo("linkedin", e.target.value)}
                                placeholder="linkedin.com/in/username"
                            />
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* Professional Summary */}
                <AccordionItem value="summary">
                    <AccordionTrigger>Professional Summary</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-2">
                        <Textarea
                            rows={5}
                            value={data.summary}
                            onChange={(e) => onChange({ ...data, summary: e.target.value })}
                            placeholder="Briefly describe your professional background..."
                        />
                    </AccordionContent>
                </AccordionItem>

                {/* Experience */}
                <AccordionItem value="experience">
                    <AccordionTrigger ref={experienceRef}>Experience</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-2">
                        {showErrors && !validation.hasContent && (
                            <p className="text-xs text-red-500 mb-2 font-bold animate-pulse">
                                Add at least one valid: Experience, Education, or Skills (Must have description &gt; 20 chars)
                            </p>
                        )}
                        {data.experience.map((exp, index) => (
                            <div key={exp.id} className="border rounded-lg p-4 space-y-3 relative group">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-2 right-2 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => {
                                        const newExp = [...data.experience]
                                        newExp.splice(index, 1)
                                        onChange({ ...data, experience: newExp })
                                    }}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label className="text-xs">Company</Label>
                                        <Input
                                            className={showErrors && (!exp.company.trim() || exp.company === "New Company") ? "border-red-500 shake" : ""}
                                            value={exp.company}
                                            onChange={(e) => {
                                                const newExp = [...data.experience]
                                                newExp[index].company = e.target.value
                                                onChange({ ...data, experience: newExp })
                                            }}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Position</Label>
                                        <Input
                                            className={showErrors && (!exp.position.trim() || exp.position === "Position") ? "border-red-500 shake" : ""}
                                            value={exp.position}
                                            onChange={(e) => {
                                                const newExp = [...data.experience]
                                                newExp[index].position = e.target.value
                                                onChange({ ...data, experience: newExp })
                                            }}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Start Date</Label>
                                        <Input
                                            value={exp.startDate}
                                            placeholder="MM/YYYY"
                                            onChange={(e) => {
                                                const newExp = [...data.experience]
                                                newExp[index].startDate = e.target.value
                                                onChange({ ...data, experience: newExp })
                                            }}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">End Date</Label>
                                        <Input
                                            value={exp.endDate}
                                            placeholder="Present"
                                            onChange={(e) => {
                                                const newExp = [...data.experience]
                                                newExp[index].endDate = e.target.value
                                                onChange({ ...data, experience: newExp })
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Description {exp.description && exp.description.trim().length < 20 && showErrors && <span className="text-red-500 text-[10px] ml-2">(Min 20 chars)</span>}</Label>
                                    <Textarea
                                        className={showErrors && exp.description.trim().length < 20 ? "border-red-500 shake" : ""}
                                        rows={3}
                                        value={exp.description}
                                        onChange={(e) => {
                                            const newExp = [...data.experience]
                                            newExp[index].description = e.target.value
                                            onChange({ ...data, experience: newExp })
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                        <Button variant="outline" className="w-full" onClick={addExperience}>
                            <Plus className="mr-2 h-4 w-4" /> Add Experience
                        </Button>
                    </AccordionContent>
                </AccordionItem>

                {/* Education */}
                <AccordionItem value="education">
                    <AccordionTrigger ref={educationRef}>Education</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-2">
                        {data.education.map((edu, index) => (
                            <div key={edu.id} className="border rounded-lg p-4 space-y-3 relative group">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-2 right-2 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => {
                                        const newEdu = [...data.education]
                                        newEdu.splice(index, 1)
                                        onChange({ ...data, education: newEdu })
                                    }}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label className="text-xs">School</Label>
                                        <Input
                                            className={showErrors && (!edu.school.trim() || edu.school === "University") ? "border-red-500 shake" : ""}
                                            value={edu.school}
                                            onChange={(e) => {
                                                const newEdu = [...data.education]
                                                newEdu[index].school = e.target.value
                                                onChange({ ...data, education: newEdu })
                                            }}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Degree</Label>
                                        <Input
                                            className={showErrors && (!edu.degree.trim() || edu.degree === "Degree") ? "border-red-500 shake" : ""}
                                            value={edu.degree}
                                            onChange={(e) => {
                                                const newEdu = [...data.education]
                                                newEdu[index].degree = e.target.value
                                                onChange({ ...data, education: newEdu })
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                        <Button variant="outline" className="w-full" onClick={addEducation}>
                            <Plus className="mr-2 h-4 w-4" /> Add Education
                        </Button>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="skills">
                    <AccordionTrigger ref={skillsRef}>Skills</AccordionTrigger>
                    <AccordionContent className="pt-2">
                        <Label className="text-xs mb-2 block">Comma separated list
                            {showErrors && data.skills.filter(s => s.trim().length > 0).length < 2 && (
                                <span className="text-red-500 font-bold ml-2">(Please enter at least 2 skills)</span>
                            )}
                        </Label>
                        <Textarea
                            className={showErrors && data.skills.filter(s => s.trim().length > 0).length < 2 ? "border-red-500 shake" : ""}
                            rows={3}
                            value={data.skills.join(", ")}
                            onChange={(e) => onChange({ ...data, skills: e.target.value.split(",").map(s => s.trim()) })}
                            placeholder="React, TypeScript, Node.js (comma separated)"
                        />
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div >
    )
}
