"use client"

import { ResumeData } from "@/types/resume"
import { useRef, useEffect, useCallback, useMemo } from "react"
import { useReactToPrint } from "react-to-print"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

interface ResumePreviewProps {
    data: ResumeData
    onPageCountChange?: (pages: number) => void
}

export function ResumePreview({ data, onPageCountChange }: ResumePreviewProps) {
    const componentRef = useRef<HTMLDivElement>(null)

    // PAGE COUNT LOGIC
    // We want to calculate the number of A4 pages based on height.
    useEffect(() => {
        if (!componentRef.current || !onPageCountChange) return

        const A4_HEIGHT_PX = 1122

        const calculatePages = () => {
            const height = componentRef.current!.scrollHeight
            const pages = Math.max(1, Math.ceil(height / A4_HEIGHT_PX))
            onPageCountChange(pages)
        }

        calculatePages()

        const observer = new ResizeObserver(calculatePages)
        observer.observe(componentRef.current)

        return () => observer.disconnect()
    }, [data, onPageCountChange])

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Resume - ${data.personalInfo.fullName || "User"}`,
    })

    const isSectionVisible = useCallback((type: string) => {
        const section = data.sections.find(s => s.type === type)
        return section?.isVisible ?? true
    }, [data.sections])

    return (
        <div className="w-full h-full flex flex-col overflow-hidden">
            {/* 1. Header (Fixed Toolbar) */}
            {/* 1. Header (Fixed Toolbar) - REMOVED, controlled by parent now */}
            <Button
                id="print-resume"
                onClick={() => handlePrint && handlePrint()}
                className="hidden"
            />

            {/* 2. The Canvas (Gray Background, Natural Scroll) */}
            <div className="flex-1 overflow-auto bg-white">

                <div className="min-h-full flex justify-center py-6">


                    {/* Print styles override */}
                    <style jsx global>{`
                        @media print {
                            @page { size: auto; margin: 0mm; }
                            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                            .page-break { page-break-after: always; }
                        }
                    `}</style>

                    {/* 3. The Real A4 Paper (Fixed Dimensions) */}
                    <div
                        ref={componentRef}
                        className="w-[210mm] bg-white text-black shadow-xl min-h-screen"
                    >
                        {/* COVER LETTER PAGE */}
                        {data.includeCover && data.coverLetter && (
                            <div className="w-full min-h-[1122px] bg-white relative page-break flex flex-col">
                                {(() => {
                                    const template = data.coverTemplate || "basic"

                                    // 1. MODERN PRO
                                    if (template === "template_modern_pro") {
                                        return (
                                            <div className="h-full font-sans text-left text-slate-900 bg-white flex flex-col">
                                                <header className="bg-slate-900 text-white p-12 text-center">
                                                    <h1 className="text-4xl font-bold tracking-widest uppercase mb-2">
                                                        {data.personalInfo.fullName}
                                                    </h1>
                                                    <div className="flex justify-center gap-4 text-xs tracking-wide text-gray-300">
                                                        {data.personalInfo.email && <span>{data.personalInfo.email}</span>}
                                                        {data.personalInfo.phone && <span>• {data.personalInfo.phone}</span>}
                                                        {data.personalInfo.location && <span>• {data.personalInfo.location}</span>}
                                                    </div>
                                                </header>
                                                <div className="flex-1 p-12 text-slate-800 text-base leading-loose whitespace-pre-wrap text-justify">
                                                    {data.coverLetter}
                                                </div>
                                                <div className="p-12 pt-0">
                                                    <p className="font-semibold text-lg">Sincerely,</p>
                                                    <p className="mt-2 text-xl">{data.personalInfo.fullName}</p>
                                                </div>
                                            </div>
                                        )
                                    }

                                    // 2. SIDEBAR
                                    if (template === "template_sidebar") {
                                        return (
                                            <div className="h-full flex font-sans">
                                                <div className="w-[30%] bg-slate-100 p-8 pt-12 border-r border-slate-200 min-h-full">
                                                    <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs mb-3 border-b border-slate-300 pb-1">Contact</h3>
                                                    <div className="text-sm text-slate-600 space-y-2 break-all">
                                                        {data.personalInfo.email && <div className="flex gap-2"><span>✉</span> {data.personalInfo.email}</div>}
                                                        {data.personalInfo.phone && <div className="flex gap-2"><span>📞</span> {data.personalInfo.phone}</div>}
                                                        {data.personalInfo.location && <div className="flex gap-2"><span>📍</span> {data.personalInfo.location}</div>}
                                                    </div>
                                                </div>
                                                <div className="flex-1 p-10 pt-12 flex flex-col">
                                                    <header className="mb-10 text-left border-b-4 border-slate-800 pb-6">
                                                        <h1 className="text-4xl font-extrabold text-slate-900 leading-tight">
                                                            {data.personalInfo.fullName.split(' ')[0]}<br />
                                                            <span className="text-slate-500 font-light">{data.personalInfo.fullName.split(' ').slice(1).join(' ')}</span>
                                                        </h1>
                                                    </header>
                                                    <div className="flex-1 text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                                                        {data.coverLetter}
                                                    </div>
                                                    <div className="mt-12 pt-8">
                                                        <p className="font-bold text-slate-900">Sincerely,</p>
                                                        <p className="mt-2">{data.personalInfo.fullName}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    }

                                    // 3. MINIMAL ELEGANT
                                    if (template === "template_minimal_elegant") {
                                        return (
                                            <div className="h-full p-12 font-serif text-center flex flex-col" style={{ fontFamily: 'Georgia, serif' }}>
                                                <header className="mb-12">
                                                    <h1 className="text-4xl italic mb-3 text-gray-900 tracking-wide">
                                                        {data.personalInfo.fullName}
                                                    </h1>
                                                    <div className="text-xs uppercase tracking-[0.25em] text-gray-500 mb-6">
                                                        Professional Portfolio
                                                    </div>
                                                    <div className="flex justify-center gap-4 text-xs font-sans text-gray-400">
                                                        {data.personalInfo.email && <span className="border-b border-transparent hover:border-gray-300 transition-colors">{data.personalInfo.email}</span>}
                                                        {data.personalInfo.phone && <span>{data.personalInfo.phone}</span>}
                                                    </div>
                                                </header>
                                                <div className="flex-1 text-left max-w-[85%] mx-auto text-sm leading-8 text-gray-700 whitespace-pre-wrap">
                                                    {data.coverLetter}
                                                </div>
                                                <div className="mt-12 max-w-[85%] mx-auto text-left w-full">
                                                    <p className="italic">Sincerely,</p>
                                                    <p className="mt-2 text-lg">{data.personalInfo.fullName}</p>
                                                </div>
                                            </div>
                                        )
                                    }

                                    // 4. CREATIVE BLOCKS
                                    if (template === "template_creative_blocks") {
                                        return (
                                            <div className="h-full p-8 font-sans bg-white relative flex flex-col">
                                                <header className="mb-8">
                                                    <div className="inline-block bg-black text-white p-6 transform -rotate-1 shadow-lg mb-6">
                                                        <h1 className="text-5xl font-black uppercase tracking-tight leading-none">
                                                            {data.personalInfo.fullName}
                                                        </h1>
                                                    </div>
                                                    <div className="flex flex-wrap gap-3 font-mono text-xs font-bold pl-2">
                                                        {data.personalInfo.email && <span className="bg-yellow-100 px-2 py-1 transform rotate-1 border border-black">{data.personalInfo.email}</span>}
                                                        {data.personalInfo.phone && <span className="bg-cyan-100 px-2 py-1 transform -rotate-2 border border-black">{data.personalInfo.phone}</span>}
                                                    </div>
                                                </header>
                                                <div className="flex-1 p-4 border-l-4 border-black ml-4">
                                                    <p className="text-sm font-medium leading-relaxed font-mono whitespace-pre-wrap">
                                                        {data.coverLetter}
                                                    </p>
                                                </div>
                                                <div className="mt-8 ml-4 pl-4">
                                                    <p className="font-black uppercase tracking-widest text-sm">Sincerely,</p>
                                                    <p className="mt-2 font-black text-xl transform -rotate-1 inline-block bg-purple-100 px-2 border-black border lowercase">
                                                        {data.personalInfo.fullName}
                                                    </p>
                                                </div>
                                            </div>
                                        )
                                    }

                                    // 5. DEFAULT / BASIC
                                    return (
                                        <div className="p-12 h-full flex flex-col">
                                            <header className="mb-12 border-b pb-6 text-center">
                                                <h1 className="text-3xl font-bold uppercase tracking-wide mb-2">{data.personalInfo.fullName}</h1>
                                                <div className="text-sm text-gray-500 flex justify-center gap-4">
                                                    <span>{data.personalInfo.email}</span>
                                                    <span>{data.personalInfo.phone}</span>
                                                </div>
                                            </header>

                                            <div className="flex-1 text-base leading-relaxed whitespace-pre-wrap text-justify text-slate-800 font-serif">
                                                {data.coverLetter}
                                            </div>

                                            <div className="mt-12 pt-12 border-t">
                                                <p className="font-semibold">Sincerely,</p>
                                                <p className="mt-2">{data.personalInfo.fullName}</p>
                                            </div>
                                        </div>
                                    )
                                })()}
                            </div>
                        )}

                        <div className="w-full min-h-[1122px] bg-white relative page-break flex flex-col">
                            {/* RESUME PAGE */}
                            {(() => {
                                switch (data.template) {
                                    case "template_modern_pro":
                                        return (
                                            <div className="h-full font-sans text-left text-slate-900 bg-white">
                                                <header className="bg-slate-900 text-white p-12 text-center">
                                                    <h1 className="text-4xl font-bold tracking-widest uppercase mb-2">
                                                        {data.personalInfo.fullName}
                                                    </h1>
                                                    <div className="flex justify-center gap-4 text-xs tracking-wide text-gray-300">
                                                        {data.personalInfo.email && <span>{data.personalInfo.email}</span>}
                                                        {data.personalInfo.phone && <span>• {data.personalInfo.phone}</span>}
                                                        {data.personalInfo.location && <span>• {data.personalInfo.location}</span>}
                                                    </div>
                                                </header>

                                                <div className="p-12 space-y-8">
                                                    {isSectionVisible("summary") && data.summary && (
                                                        <section>
                                                            <h2 className="text-sm font-bold text-blue-800 uppercase tracking-widest border-b-2 border-slate-100 pb-2 mb-3">Summary</h2>
                                                            <p className="text-sm leading-relaxed text-slate-700">
                                                                {data.summary}
                                                            </p>
                                                        </section>
                                                    )}

                                                    {isSectionVisible("experience") && data.experience.length > 0 && (
                                                        <section>
                                                            <h2 className="text-sm font-bold text-blue-800 uppercase tracking-widest border-b-2 border-slate-100 pb-2 mb-4">Experience</h2>
                                                            <div className="space-y-6">
                                                                {data.experience.map((exp, i) => (
                                                                    <div key={i} className="relative pl-6 border-l-2 border-slate-100">
                                                                        <div className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-blue-800"></div>
                                                                        <div className="flex justify-between items-baseline mb-1">
                                                                            <h3 className="font-bold text-slate-900">{exp.position}</h3>
                                                                            <span className="text-xs text-slate-500 font-medium whitespace-nowrap ml-4">{exp.startDate} – {exp.current ? "Present" : exp.endDate}</span>
                                                                        </div>
                                                                        <div className="text-sm text-blue-700 font-medium mb-2">{exp.company}</div>
                                                                        <ul className="list-disc ml-4 text-sm text-slate-600 space-y-1">
                                                                            {exp.description.split("\n").map((d, j) => (
                                                                                <li key={j}>{d}</li>
                                                                            ))}
                                                                        </ul>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </section>
                                                    )}

                                                    {isSectionVisible("education") && data.education.length > 0 && (
                                                        <section>
                                                            <h2 className="text-sm font-bold text-blue-800 uppercase tracking-widest border-b-2 border-slate-100 pb-2 mb-4">Education</h2>
                                                            <div className="grid grid-cols-1 gap-4">
                                                                {data.education.map((edu, i) => (
                                                                    <div key={i} className="flex justify-between items-start">
                                                                        <div>
                                                                            <div className="font-bold text-slate-900">{edu.school}</div>
                                                                            <div className="text-sm text-slate-600">{edu.degree}</div>
                                                                        </div>
                                                                        <div className="text-xs text-slate-500 font-medium">{edu.startDate} - {edu.endDate}</div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </section>
                                                    )}

                                                    {isSectionVisible("skills") && data.skills.length > 0 && (
                                                        <section>
                                                            <h2 className="text-sm font-bold text-blue-800 uppercase tracking-widest border-b-2 border-slate-100 pb-2 mb-3">Skills</h2>
                                                            <div className="flex flex-wrap gap-2">
                                                                {data.skills.map((skill, index) => (
                                                                    <span key={index} className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-medium">
                                                                        {skill}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </section>
                                                    )}
                                                </div>
                                            </div>
                                        )

                                    case "template_sidebar":
                                        return (
                                            <div className="h-full flex font-sans">
                                                {/* Sidebar */}
                                                <div className="w-[30%] bg-slate-100 p-8 pt-12 border-r border-slate-200 min-h-full">
                                                    <div className="space-y-8">
                                                        <div>
                                                            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs mb-3 border-b border-slate-300 pb-1">Contact</h3>
                                                            <div className="text-sm text-slate-600 space-y-2 break-all">
                                                                {data.personalInfo.email && <div className="flex gap-2"><span>✉</span> {data.personalInfo.email}</div>}
                                                                {data.personalInfo.phone && <div className="flex gap-2"><span>📞</span> {data.personalInfo.phone}</div>}
                                                                {data.personalInfo.location && <div className="flex gap-2"><span>📍</span> {data.personalInfo.location}</div>}
                                                                {data.personalInfo.linkedin && <div className="flex gap-2"><span>🔗</span> {data.personalInfo.linkedin}</div>}
                                                            </div>
                                                        </div>

                                                        {isSectionVisible("education") && data.education.length > 0 && (
                                                            <div>
                                                                <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs mb-3 border-b border-slate-300 pb-1">Education</h3>
                                                                <div className="space-y-4">
                                                                    {data.education.map((edu, i) => (
                                                                        <div key={i}>
                                                                            <div className="font-bold text-sm text-slate-800">{edu.school}</div>
                                                                            <div className="text-xs text-slate-600 mb-1">{edu.degree}</div>
                                                                            <div className="text-xs text-slate-500">{edu.endDate}</div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {isSectionVisible("skills") && data.skills.length > 0 && (
                                                            <div>
                                                                <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs mb-3 border-b border-slate-300 pb-1">Skills</h3>
                                                                <ul className="space-y-1.5">
                                                                    {data.skills.map((skill, index) => (
                                                                        <li key={index} className="text-sm text-slate-700 block bg-white px-2 py-1 rounded shadow-sm border border-slate-100">
                                                                            {skill}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Main Content */}
                                                <div className="flex-1 p-10 pt-12">
                                                    <header className="mb-10 text-left border-b-4 border-slate-800 pb-6">
                                                        <h1 className="text-4xl font-extrabold text-slate-900 leading-tight">
                                                            {data.personalInfo.fullName.split(' ')[0]}<br />
                                                            <span className="text-slate-500 font-light">{data.personalInfo.fullName.split(' ').slice(1).join(' ')}</span>
                                                        </h1>
                                                    </header>

                                                    <div className="space-y-8">
                                                        {isSectionVisible("summary") && data.summary && (
                                                            <section>
                                                                <h2 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                                                                    <span className="w-1.5 h-6 bg-slate-800 block"></span>
                                                                    Profile
                                                                </h2>
                                                                <p className="text-sm leading-relaxed text-slate-600">
                                                                    {data.summary}
                                                                </p>
                                                            </section>
                                                        )}

                                                        {isSectionVisible("experience") && data.experience.length > 0 && (
                                                            <section>
                                                                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                                                    <span className="w-1.5 h-6 bg-slate-800 block"></span>
                                                                    Work Experience
                                                                </h2>
                                                                <div className="space-y-6">
                                                                    {data.experience.map((exp, i) => (
                                                                        <div key={i}>
                                                                            <div className="flex justify-between items-baseline mb-1">
                                                                                <h3 className="font-bold text-slate-900 text-sm">{exp.position}</h3>
                                                                                <span className="text-xs text-slate-500 font-mono">{exp.startDate} - {exp.current ? "Present" : exp.endDate}</span>
                                                                            </div>
                                                                            <div className="text-sm font-semibold text-slate-700 mb-2">{exp.company}</div>
                                                                            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                                                                                {exp.description}
                                                                            </p>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </section>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )

                                    case "template_minimal_elegant":
                                        return (
                                            <div className="h-full p-12 font-serif text-center" style={{ fontFamily: 'Georgia, serif' }}>
                                                <header className="mb-12">
                                                    <h1 className="text-4xl italic mb-3 text-gray-900 tracking-wide">
                                                        {data.personalInfo.fullName}
                                                    </h1>
                                                    <div className="text-xs uppercase tracking-[0.25em] text-gray-500 mb-6">
                                                        Professional Portfolio
                                                    </div>
                                                    <div className="flex justify-center gap-4 text-xs font-sans text-gray-400">
                                                        {data.personalInfo.email && <span className="border-b border-transparent hover:border-gray-300 transition-colors">{data.personalInfo.email}</span>}
                                                        {data.personalInfo.phone && <span>{data.personalInfo.phone}</span>}
                                                        {data.personalInfo.location && <span>{data.personalInfo.location}</span>}
                                                    </div>
                                                </header>

                                                <div className="max-w-[85%] mx-auto space-y-10 text-left">
                                                    {isSectionVisible("summary") && data.summary && (
                                                        <section className="text-center">
                                                            <p className="text-sm leading-8 text-gray-700 italic">
                                                                "{data.summary}"
                                                            </p>
                                                            <div className="w-12 h-px bg-gray-200 mx-auto mt-6"></div>
                                                        </section>
                                                    )}

                                                    {isSectionVisible("experience") && data.experience.length > 0 && (
                                                        <section>
                                                            <h2 className="text-center text-xs font-sans uppercase tracking-widest text-gray-400 mb-8">Experience</h2>
                                                            <div className="space-y-8">
                                                                {data.experience.map((exp, i) => (
                                                                    <div key={i} className="group">
                                                                        <div className="flex justify-between items-baseline mb-2">
                                                                            <h3 className="text-lg italic font-medium text-gray-800">{exp.company}</h3>
                                                                            <span className="text-xs font-sans text-gray-400">{exp.startDate} — {exp.current ? "Present" : exp.endDate}</span>
                                                                        </div>
                                                                        <div className="text-xs font-sans uppercase tracking-wide text-gray-500 mb-3">{exp.position}</div>
                                                                        <p className="text-sm font-sans text-gray-600 leading-relaxed text-justify">
                                                                            {exp.description}
                                                                        </p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </section>
                                                    )}

                                                    {isSectionVisible("education") && data.education.length > 0 && (
                                                        <section className="text-center">
                                                            <h2 className="text-xs font-sans uppercase tracking-widest text-gray-400 mb-6 mt-10">Education</h2>
                                                            <div className="space-y-2">
                                                                {data.education.map((edu, i) => (
                                                                    <div key={i}>
                                                                        <div className="text-base italic text-gray-800">{edu.school}</div>
                                                                        <div className="text-xs font-sans text-gray-500">{edu.degree} · {edu.endDate}</div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </section>
                                                    )}

                                                    {isSectionVisible("skills") && data.skills.length > 0 && (
                                                        <section className="text-center pt-4">
                                                            <div className="text-xs font-sans text-gray-500 leading-loose">
                                                                {data.skills.join("  ·  ")}
                                                            </div>
                                                        </section>
                                                    )}
                                                </div>
                                            </div>
                                        )

                                    case "template_creative_blocks":
                                        return (
                                            <div className="h-full p-8 font-sans bg-white relative">
                                                {/* Header Block */}
                                                <header className="mb-8">
                                                    <div className="inline-block bg-black text-white p-6 transform -rotate-1 shadow-lg mb-6">
                                                        <h1 className="text-5xl font-black uppercase tracking-tight leading-none">
                                                            {data.personalInfo.fullName}
                                                        </h1>
                                                    </div>
                                                    <div className="flex flex-wrap gap-3 font-mono text-xs font-bold pl-2">
                                                        {data.personalInfo.email && <span className="bg-yellow-100 px-2 py-1 transform rotate-1 border border-black">{data.personalInfo.email}</span>}
                                                        {data.personalInfo.phone && <span className="bg-cyan-100 px-2 py-1 transform -rotate-2 border border-black">{data.personalInfo.phone}</span>}
                                                        {data.personalInfo.location && <span className="bg-pink-100 px-2 py-1 transform rotate-1 border border-black">{data.personalInfo.location}</span>}
                                                    </div>
                                                </header>

                                                <div className="grid grid-cols-12 gap-8">
                                                    {/* Left Column (Main) */}
                                                    <div className="col-span-8 space-y-8">
                                                        {isSectionVisible("summary") && data.summary && (
                                                            <section className="bg-slate-50 border-l-4 border-black p-4">
                                                                <p className="text-sm font-medium leading-relaxed font-mono">
                                                                    {data.summary}
                                                                </p>
                                                            </section>
                                                        )}

                                                        {isSectionVisible("experience") && data.experience.length > 0 && (
                                                            <section>
                                                                <h2 className="text-2xl font-black uppercase mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
                                                                    Experience
                                                                </h2>
                                                                <div className="space-y-8">
                                                                    {data.experience.map((exp, i) => (
                                                                        <div key={i} className="relative">
                                                                            <div className="absolute -left-3 top-2 w-1.5 h-1.5 bg-black rounded-full"></div>
                                                                            <h3 className="text-xl font-bold leading-none mb-1">{exp.position}</h3>
                                                                            <div className="text-sm font-bold text-gray-400 mb-2 uppercase tracking-wide">{exp.company} // {exp.startDate} - {exp.current ? "Now" : exp.endDate}</div>
                                                                            <p className="text-sm text-gray-700 leading-relaxed border-l-2 border-gray-100 pl-4 py-1">
                                                                                {exp.description}
                                                                            </p>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </section>
                                                        )}
                                                    </div>

                                                    {/* Right Column (Side) */}
                                                    <div className="col-span-4 space-y-8">
                                                        {isSectionVisible("skills") && data.skills.length > 0 && (
                                                            <section className="bg-yellow-50 p-4 rounded-xl border-2 border-yellow-400 border-dashed">
                                                                <h2 className="font-black text-yellow-900 uppercase tracking-widest text-sm mb-4 text-center">Skillset</h2>
                                                                <div className="flex flex-wrap gap-2 justify-center">
                                                                    {data.skills.map((skill, index) => (
                                                                        <span key={index} className="bg-white border border-yellow-400 px-2 py-1 text-xs font-bold rounded shadow-sm">
                                                                            {skill}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </section>
                                                        )}

                                                        {isSectionVisible("education") && data.education.length > 0 && (
                                                            <section className="bg-purple-50 p-4 rounded-xl border-2 border-purple-400 border-dashed">
                                                                <h2 className="font-black text-purple-900 uppercase tracking-widest text-sm mb-4 text-center">Education</h2>
                                                                <div className="space-y-4">
                                                                    {data.education.map((edu, i) => (
                                                                        <div key={i} className="text-center">
                                                                            <div className="font-bold text-sm leading-tight">{edu.school}</div>
                                                                            <div className="text-xs text-purple-700 mt-1">{edu.degree}</div>
                                                                            <div className="text-[10px] text-gray-500 font-mono mt-1">{edu.endDate}</div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </section>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )

                                    // Default / Basic / Legacy Handling
                                    default:
                                        return (
                                            <div className="h-full">
                                                {/* STRICT HEADER */}
                                                <header className="px-12 pt-12 pb-6 text-center">
                                                    <h1 className="text-4xl font-bold tracking-wide">
                                                        {data.personalInfo.fullName}
                                                    </h1>

                                                    <p className="mt-2 text-sm text-gray-700">
                                                        {data.personalInfo.email}
                                                        {data.personalInfo.phone && ` • ${data.personalInfo.phone}`}
                                                        {data.personalInfo.location && ` • ${data.personalInfo.location}`}
                                                    </p>

                                                    <hr className="mt-6 border-black" />
                                                </header>

                                                <div className="px-10 py-6 space-y-8">
                                                    {isSectionVisible("summary") && data.summary && (
                                                        <section>
                                                            <h2 className="text-xs font-bold uppercase tracking-widest border-b border-black pb-1 mb-4">Summary</h2>
                                                            <p className="text-sm leading-relaxed">
                                                                {data.summary}
                                                            </p>
                                                        </section>
                                                    )}

                                                    {isSectionVisible("experience") && data.experience.length > 0 && (
                                                        <section>
                                                            <h2 className="text-xs font-bold uppercase tracking-widest border-b border-black pb-1 mb-4">Experience</h2>
                                                            {data.experience.map((exp, i) => (
                                                                <div key={i} className="mb-4">
                                                                    <div className="flex justify-between font-semibold">
                                                                        <span>{exp.position}</span>
                                                                        <span>{exp.startDate} – {exp.current ? "Present" : exp.endDate}</span>
                                                                    </div>
                                                                    <div className="italic text-sm">{exp.company}</div>
                                                                    <ul className="list-disc ml-5 text-sm mt-1">
                                                                        {exp.description.split("\n").map((d, j) => (
                                                                            <li key={j}>{d}</li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            ))}
                                                        </section>
                                                    )}

                                                    {isSectionVisible("education") && data.education.length > 0 && (
                                                        <section>
                                                            <h2 className="text-xs font-bold uppercase tracking-widest border-b border-black pb-1 mb-4">Education</h2>
                                                            {data.education.map((edu, i) => (
                                                                <div key={i} className="flex justify-between text-sm">
                                                                    <div>
                                                                        <strong>{edu.degree}</strong><br />
                                                                        {edu.school}
                                                                    </div>
                                                                    <div>{edu.endDate}</div>
                                                                </div>
                                                            ))}
                                                        </section>
                                                    )}

                                                    {isSectionVisible("skills") && data.skills.length > 0 && (
                                                        <section>
                                                            <h2 className="text-xs font-bold uppercase tracking-widest border-b border-black pb-1 mb-4">Skills</h2>
                                                            <p className="text-sm">
                                                                {data.skills.join(" • ")}
                                                            </p>
                                                        </section>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                }
                            })()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}