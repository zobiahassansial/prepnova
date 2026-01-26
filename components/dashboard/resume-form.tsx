"use client"

import { ResumeData } from "@/types/resume"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, Sparkles, Loader2 } from "lucide-react"
import { useState } from "react"

interface ResumeFormProps {
    data: ResumeData
    onChange: (data: ResumeData) => void
}

export function ResumeForm({ data, onChange }: ResumeFormProps) {
    const [jobDescription, setJobDescription] = useState("")

    const updatePersonalInfo = (field: string, value: string) => {
        onChange({
            ...data,
            personalInfo: { ...data.personalInfo, [field]: value }
        })
    }

    const addExperience = () => {
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
    }

    // Generic update handler could be cleaner with a custom hook or specialized components
    // For now, inline handlers for speed given this phase


    const [generating, setGenerating] = useState(false)
    const { toast } = require("sonner")

    const handleAIGenerate = async () => {
        setGenerating(true)
        try {
            const { generateResumeContent } = await import("@/actions/generate-resume")
            const newContent = await generateResumeContent(data)

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
    }

    const addEducation = () => {
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
    }

    return (
        <div className="space-y-6">
            <div className="bg-primary/5 p-4 rounded-lg flex items-center justify-between">
                <div>
                    <h3 className="font-semibold flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> AI Assistant</h3>
                    <p className="text-xs text-muted-foreground">Enhance your resume content automatically.</p>
                </div>
                <Button onClick={handleAIGenerate} disabled={generating} size="sm">
                    {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    Optimize with AI
                </Button>
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

                    {data.includeCover && (
                        <select
                            className="bg-transparent border rounded p-1 text-sm"
                            value={data.coverTemplate || "modern"}
                            onChange={(e) => onChange({ ...data, coverTemplate: e.target.value as any })}
                        >
                            <option value="modern">Modern</option>
                            <option value="formal">Formal</option>
                            <option value="minimal">Minimal</option>
                        </select>
                    )}
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
                                        const generated = await generateCoverLetter(data)
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
                                    if (!jobDescription) {
                                        toast.error("Please enter a Job Description below first")
                                        return
                                    }
                                    setGenerating(true)
                                    try {
                                        const { matchCoverLetterToJob } = await import("@/actions/generate-resume")
                                        const optimized = await matchCoverLetterToJob(data.coverLetter || "", jobDescription, data)
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
                                        const optimized = await optimizeCoverLetter(data.coverLetter || "", data)
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
                    <span className="text-xs font-normal text-muted-foreground">(for AI matching)</span>
                </Label>
                <Textarea
                    placeholder="Paste job description here..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    rows={4}
                />
            </div>

            <Accordion type="single" collapsible defaultValue="personal">
                {/* Personal Info */}
                <AccordionItem value="personal">
                    <AccordionTrigger>Personal Information</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-2">
                        <div className="space-y-2">
                            <Label>Full Name</Label>
                            <Input
                                value={data.personalInfo.fullName}
                                onChange={(e) => updatePersonalInfo("fullName", e.target.value)}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input
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
                    <AccordionTrigger>Experience</AccordionTrigger>
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
                    <AccordionTrigger>Education</AccordionTrigger>
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
                    <AccordionTrigger>Skills</AccordionTrigger>
                    <AccordionContent className="pt-2">
                        <Label className="text-xs mb-2 block">Comma separated list</Label>
                        <Textarea
                            rows={3}
                            value={data.skills.join(", ")}
                            onChange={(e) => onChange({ ...data, skills: e.target.value.split(",").map(s => s.trim()) })}
                            placeholder="React, TypeScript, Node.js (comma separated)"
                        />
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    )
}
