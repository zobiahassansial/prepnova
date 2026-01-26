"use client"

import { ResumeData } from "@/types/resume"
import { useRef } from "react"
import { useReactToPrint } from "react-to-print"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

interface ResumePreviewProps {
    data: ResumeData
}

export function ResumePreview({ data }: ResumePreviewProps) {
    const componentRef = useRef<HTMLDivElement>(null)

    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
        documentTitle: `Resume - ${data.personalInfo.fullName || "User"}`,
        pageStyle: `@page { size: A4; margin: 0; } @media print { body { -webkit-print-color-adjust: exact; } }`
    } as any)

    const getTemplateStyle = () => {
        switch (data.template) {
            case "modern":
                return {
                    font: 'Inter, sans-serif',
                    headerClass: 'bg-slate-900 text-white p-8 mb-6',
                    titleClass: 'text-4xl font-bold uppercase tracking-tight',
                    sectionTitleClass: 'text-lg font-bold uppercase text-slate-800 border-b-2 border-slate-900 mb-3 pb-1',
                    gridClass: 'grid grid-cols-[1fr_2fr] gap-8 p-8 pt-0'
                }
            case "minimal":
                return {
                    font: 'Inter, sans-serif',
                    headerClass: 'text-center mb-8 pb-8 border-b',
                    titleClass: 'text-3xl font-light tracking-widest uppercase',
                    sectionTitleClass: 'text-sm font-semibold uppercase tracking-widest text-gray-500 mb-4 mt-2',
                    gridClass: 'p-8 max-w-2xl mx-auto'
                }
            case "classic":
            default:
                return {
                    font: 'Georgia, serif',
                    headerClass: 'text-center border-b-2 border-black pb-4 mb-6',
                    titleClass: 'text-3xl font-bold uppercase tracking-wider mb-2',
                    sectionTitleClass: 'text-sm font-bold uppercase border-b border-gray-400 mb-2 pb-1',
                    gridClass: 'p-[20mm]'
                }
        }
    }

    const styles = getTemplateStyle()

    return (
        <div className="w-full h-full flex flex-col bg-slate-100/50 overflow-hidden">
            {/* 1. Header (Fixed, not sticky inside scroll) */}
            <div className="w-full flex justify-end p-4 bg-white border-b shadow-sm z-10 flex-shrink-0">
                <Button onClick={() => handlePrint && handlePrint()} size="sm" className="shadow-sm">
                    <Download className="h-4 w-4 mr-2" /> Download PDF
                </Button>
            </div>

            {/* 2. Scrollable Preview Container */}
            {/* 2. Scrollable Preview Container */}
            <div className="flex-1 w-full overflow-y-auto overflow-x-hidden relative min-h-0 pt-20">

                {/* 3. Centering Wrapper */}
                <div className="min-h-full w-full flex justify-center py-10 px-8">
                    {/* 4. Resume Page (A4 Fixed, Natural Height) */}
                    <div
                        ref={componentRef}
                        className="w-[210mm] min-h-[297mm] bg-white text-black shadow-2xl flex-shrink-0"
                        style={{ fontFamily: styles.font }}
                    >
                        {/* Print styles override this to ensure proper print size */}
                        <style jsx global>{`
                            @media print {
                                @page { size: auto; margin: 0mm; }
                                body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
                            }
                        `}</style>

                        {/* Template Content */}
                        {data.template === "modern" ? (
                            <div className="h-full">
                                <div className={styles.headerClass}>
                                    <h1 className={styles.titleClass}>{data.personalInfo.fullName || "Your Name"}</h1>
                                    <div className="flex flex-wrap gap-4 text-sm text-slate-300 mt-2">
                                        {data.personalInfo.email && <span>{data.personalInfo.email}</span>}
                                        {data.personalInfo.phone && <span>{data.personalInfo.phone}</span>}
                                        {data.personalInfo.location && <span>{data.personalInfo.location}</span>}
                                    </div>
                                </div>
                                <div className={styles.gridClass}>
                                    <div className="space-y-6">
                                        {/* Left Column: Skills, Education */}
                                        {data.skills.length > 0 && (
                                            <section>
                                                <h2 className={styles.sectionTitleClass}>Skills</h2>
                                                <div className="flex flex-wrap gap-2">
                                                    {data.skills.map((skill, i) => (
                                                        <span key={i} className="bg-slate-100 px-2 py-1 rounded text-sm">{skill}</span>
                                                    ))}
                                                </div>
                                            </section>
                                        )}
                                        {data.education.length > 0 && (
                                            <section>
                                                <h2 className={styles.sectionTitleClass}>Education</h2>
                                                <div className="space-y-4">
                                                    {data.education.map((edu, i) => (
                                                        <div key={i}>
                                                            <h3 className="font-bold text-sm">{edu.school}</h3>
                                                            <p className="text-sm">{edu.degree}</p>
                                                            <p className="text-xs text-gray-500">{edu.startDate} - {edu.endDate}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </section>
                                        )}
                                    </div>
                                    <div className="space-y-6">
                                        {/* Right Column: Summary, Experience */}
                                        {data.summary && (
                                            <section>
                                                <h2 className={styles.sectionTitleClass}>Profile</h2>
                                                <p className="text-sm leading-relaxed">{data.summary}</p>
                                            </section>
                                        )}
                                        {data.experience.length > 0 && (
                                            <section>
                                                <h2 className={styles.sectionTitleClass}>Experience</h2>
                                                <div className="space-y-5">
                                                    {data.experience.map((exp, i) => (
                                                        <div key={i}>
                                                            <h3 className="font-bold text-base">{exp.position}</h3>
                                                            <div className="text-sm text-primary font-medium mb-1">{exp.company} | {exp.startDate} – {exp.endDate}</div>
                                                            <p className="text-sm whitespace-pre-line text-slate-700">{exp.description}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </section>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // Classic and Minimal share single column structure mostly
                            <div className={styles.gridClass}>
                                <div className={styles.headerClass}>
                                    <h1 className={styles.titleClass}>{data.personalInfo.fullName || "Your Name"}</h1>
                                    <div className="flex flex-wrap justify-center gap-x-6 gap-y-1 text-sm text-gray-700 mt-2">
                                        {data.personalInfo.email && <span>{data.personalInfo.email}</span>}
                                        {data.personalInfo.phone && <span>{data.personalInfo.phone}</span>}
                                        {data.personalInfo.location && <span>{data.personalInfo.location}</span>}
                                        {data.personalInfo.linkedin && <span>{data.personalInfo.linkedin}</span>}
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {data.summary && (
                                        <section>
                                            <h2 className={styles.sectionTitleClass}>Professional Summary</h2>
                                            <p className="text-sm leading-relaxed">{data.summary}</p>
                                        </section>
                                    )}

                                    {data.experience.length > 0 && (
                                        <section>
                                            <h2 className={styles.sectionTitleClass}>Experience</h2>
                                            <div className="space-y-4">
                                                {data.experience.map((exp, i) => (
                                                    <div key={i}>
                                                        {styles.font.includes('serif') ? (
                                                            <>
                                                                <div className="flex justify-between items-baseline font-bold text-sm">
                                                                    <h3>{exp.position}</h3>
                                                                    <span>{exp.startDate} – {exp.current ? "Present" : exp.endDate}</span>
                                                                </div>
                                                                <div className="flex justify-between items-baseline text-sm italic mb-1">
                                                                    <span>{exp.company}</span>
                                                                    <span>{exp.location}</span>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            // Minimal/cleaner styles
                                                            <div className="mb-2">
                                                                <h3 className="font-bold">{exp.position}</h3>
                                                                <div className="text-sm text-gray-600">{exp.company} | {exp.startDate} – {exp.endDate}</div>
                                                            </div>
                                                        )}
                                                        <p className="text-sm whitespace-pre-line">{exp.description}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    )}

                                    {data.education.length > 0 && (
                                        <section>
                                            <h2 className={styles.sectionTitleClass}>Education</h2>
                                            <div className="space-y-2">
                                                {data.education.map((edu, i) => (
                                                    <div key={i} className="flex justify-between">
                                                        <div>
                                                            <div className="font-bold text-sm">{edu.school}</div>
                                                            <div className="text-sm">{edu.degree}</div>
                                                        </div>
                                                        <div className="text-sm text-right">
                                                            <div>{edu.startDate} - {edu.endDate}</div>
                                                            <div className="text-xs text-gray-500">{edu.location}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    )}

                                    {data.skills.length > 0 && (
                                        <section>
                                            <h2 className={styles.sectionTitleClass}>Skills</h2>
                                            <p className="text-sm">{data.skills.join(", ")}</p>
                                        </section>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
