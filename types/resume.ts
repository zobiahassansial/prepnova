export type ResumeSectionType = "personal" | "summary" | "experience" | "education" | "skills" | "projects"

export interface ResumeSection {
    id: string
    type: ResumeSectionType
    title: string
    isVisible: boolean
}

export interface PersonalInfo {
    fullName: string
    email: string
    phone: string
    location: string
    linkedin?: string
    website?: string
}

export interface ExperienceItem {
    id: string
    company: string
    position: string
    startDate: string
    endDate: string
    current: boolean
    location: string
    description: string
}

export interface EducationItem {
    id: string
    school: string
    degree: string
    field: string
    startDate: string
    endDate: string
    location: string
    description?: string
}

export interface ProjectItem {
    id: string
    name: string
    description: string
    link?: string
    technologies: string[]
}

import type { CustomOverlayTemplate } from "./overlay"
import type { TemplateDefinition } from "./template-definition"

export interface ResumeData {
    id?: string
    userId: string
    title: string
    template: string // Using string to support the 16 new template IDs flexibly
    activeTemplateId?: string
    customTemplateHtml?: string
    /** Populated when template === "custom-overlay" (legacy overlay system) */
    customOverlayTemplate?: CustomOverlayTemplate
    /** Populated when template === "imported-template" (new editable template system) */
    importedTemplateDefinition?: TemplateDefinition
    personalInfo: PersonalInfo
    summary: string
    experience: ExperienceItem[]
    education: EducationItem[]
    skills: string[]
    projects: ProjectItem[]
    sections: ResumeSection[] // Order of sections
    includeCover?: boolean
    coverLetter?: string
    coverTemplate?: string
    resumeTone?: "professional" | "formal" | "minimal"
    customSections?: Array<{ id: string; title: string; content: string }>

    createdAt?: any
    updatedAt?: any
}

export const defaultSections: ResumeSection[] = [
    { id: "personal", type: "personal", title: "Personal Info", isVisible: true },
    { id: "summary", type: "summary", title: "Professional Summary", isVisible: true },
    { id: "experience", type: "experience", title: "Experience", isVisible: true },
    { id: "education", type: "education", title: "Education", isVisible: true },
    { id: "skills", type: "skills", title: "Skills", isVisible: true },
    { id: "projects", type: "projects", title: "Projects", isVisible: true },
]
