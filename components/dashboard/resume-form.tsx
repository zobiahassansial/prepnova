"use client"

import { ResumeData } from "@/types/resume"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, Sparkles, Loader2 } from "lucide-react"
import { useState, useRef, useCallback } from "react"
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

    // Refs for auto-scrolling
    const fullNameRef = useRef<HTMLInputElement>(null)
    const emailRef = useRef<HTMLInputElement>(null)
    const experienceRef = useRef<HTMLButtonElement>(null)
    const educationRef = useRef<HTMLButtonElement>(null)
    const skillsRef = useRef<HTMLButtonElement>(null)
    const jobDescriptionRef = useRef<HTMLTextAreaElement>(null)

    const handleAIGenerate = useCallback(async (e: React.MouseEvent) => {
        e.preventDefault()

        setGenerating(true)
        try {
            const { generateResumeContent } = await import("@/actions/generate-resume")
            const newContent = await generateResumeContent(data, data.resumeTone, jobDescription.trim() || undefined)

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
    }, [data, onChange])

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
                        <h3 className="font-semibold flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> AI Resume Generator</h3>
                        <p className="text-xs text-muted-foreground">Enter any amount of info and AI will generate a full professional resume for you.</p>
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
                        {generating ? "Generating Full Resume..." : "Generate Full Resume with AI"}
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
                                    if (jobDescription.trim().length < 10) {
                                        toast.error("Please enter a job description first to use Match Job")
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
                    Target Job Description
                    <span className="text-xs font-normal text-muted-foreground">(Optional — for tailored AI matching)</span>
                </Label>
                <Textarea
                    ref={jobDescriptionRef}
                    placeholder="Paste a job description here to tailor your resume to this specific role..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    rows={4}
                />
                <p className="text-xs text-muted-foreground">AI will generate a full professional resume even without this. Adding a job description makes it more targeted.</p>
            </div>

            <Accordion type="single" collapsible defaultValue="personal">
                {/* Personal Info */}
                <AccordionItem value="personal">
                    <AccordionTrigger>Personal Information</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-2">
                        <div className="space-y-2">
                            <Label>Full Name</Label>
                            <Input
                                ref={fullNameRef}
                                className={""}
                                value={data.personalInfo.fullName}
                                onChange={(e) => updatePersonalInfo("fullName", e.target.value)}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input
                                    ref={emailRef}
                                    className={""}
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
                                            className={""}
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
                                            className={""}
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
                                    <Label className="text-xs">Description</Label>
                                    <Textarea
                                        className={""}
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
                                            className={""}
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
                                            className={""}
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
                    <AccordionContent className="pt-2 space-y-3">
                        {/* Tag display */}
                        <div className="flex flex-wrap gap-2 min-h-[32px]">
                            {data.skills.filter(s => s.trim()).map((skill, index) => (
                                <span
                                    key={index}
                                    className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-medium px-2.5 py-1 rounded-full border border-primary/20"
                                >
                                    {skill}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newSkills = data.skills.filter((_, i) => i !== index)
                                            onChange({ ...data, skills: newSkills })
                                        }}
                                        className="text-primary/60 hover:text-destructive transition-colors leading-none ml-0.5"
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>
                        {/* Add skill input */}
                        <div className="flex gap-2">
                            <Input
                                placeholder="Type a skill and press Enter..."
                                className="flex-1 text-sm h-9"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ',') {
                                        e.preventDefault()
                                        const val = (e.target as HTMLInputElement).value.trim().replace(/,$/, '')
                                        if (val && !data.skills.includes(val)) {
                                            onChange({ ...data, skills: [...data.skills.filter(s => s.trim()), val] });
                                            (e.target as HTMLInputElement).value = ''
                                        }
                                    }
                                }}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-9 px-3"
                                onClick={(e) => {
                                    const input = (e.currentTarget.previousElementSibling as HTMLInputElement)
                                    const val = input.value.trim()
                                    if (val && !data.skills.includes(val)) {
                                        onChange({ ...data, skills: [...data.skills.filter(s => s.trim()), val] })
                                        input.value = ''
                                    }
                                }}
                            >
                                <Plus className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">Press Enter or comma to add a skill. Click × to remove.</p>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>

            {/* Custom Sections */}
            {(data.customSections || []).map((section: any, index: number) => (
                <div key={section.id} className="border rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b">
                        <input
                            type="text"
                            value={section.title}
                            onChange={(e) => {
                                const updated = [...(data.customSections || [])]
                                updated[index] = { ...updated[index], title: e.target.value }
                                onChange({ ...data, customSections: updated })
                            }}
                            placeholder="Section Title (e.g. Publications, Awards)"
                            className="bg-transparent font-semibold text-sm outline-none flex-1 text-foreground"
                        />
                        <button
                            type="button"
                            onClick={() => {
                                const updated = (data.customSections || []).filter((_: any, i: number) => i !== index)
                                onChange({ ...data, customSections: updated })
                            }}
                            className="text-muted-foreground hover:text-destructive transition-colors ml-2 text-xl leading-none"
                        >
                            ×
                        </button>
                    </div>
                    <div className="p-4">
                        <Textarea
                            value={section.content}
                            onChange={(e) => {
                                const updated = [...(data.customSections || [])]
                                updated[index] = { ...updated[index], content: e.target.value }
                                onChange({ ...data, customSections: updated })
                            }}
                            placeholder="Add your content here..."
                            rows={3}
                            className="resize-none text-sm"
                        />
                    </div>
                </div>
            ))}

            {/* Add Section Button */}
            <button
                type="button"
                onClick={() => {
                    const newSection = { id: Date.now().toString(), title: '', content: '' }
                    onChange({ ...data, customSections: [...(data.customSections || []), newSection] })
                }}
                className="w-full py-3 border border-dashed border-border hover:border-primary rounded-lg text-muted-foreground hover:text-primary text-sm font-medium transition-all flex items-center justify-center gap-2 mt-2"
            >
                <Plus className="h-4 w-4" /> Add Custom Section
            </button>
        </div >
    )
}
