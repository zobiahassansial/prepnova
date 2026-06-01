"use client"

import React from "react"
import { ResumeData } from "@/types/resume"
import { useRef, useEffect, useCallback, useMemo } from "react"
import { useReactToPrint } from "react-to-print"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import {
    TemplateClassic,
    TemplateModern,
    TemplateMinimal,
    TemplateExecutive,
    TemplateCreative,
    TemplateCompact,
    TemplateTwoColumn,
    TemplateSidebar,
    TemplateElegant,
    TemplateBold,
    TemplateAcademic,
    TemplateTech,
    TemplateClean,
    TemplateTimeline,
    TemplateInfographic,
    TemplateCustom,
} from "./resume-templates"

const TEMPLATE_MAP: Record<string, React.ComponentType<{ data: ResumeData; scale?: number }>> = {
    classic: TemplateClassic,
    modern: TemplateModern,
    minimal: TemplateMinimal,
    executive: TemplateExecutive,
    creative: TemplateCreative,
    compact: TemplateCompact,
    "two-column": TemplateTwoColumn,
    sidebar: TemplateSidebar,
    elegant: TemplateElegant,
    bold: TemplateBold,
    academic: TemplateAcademic,
    tech: TemplateTech,
    clean: TemplateClean,
    timeline: TemplateTimeline,
    infographic: TemplateInfographic,
    custom: TemplateCustom,
}

// ─── Cover Letter Page Component ────────────────────────────────────────────
function CoverLetterPage({ data }: { data: ResumeData }) {
    const p = data.personalInfo
    const contact = [p.email, p.phone, p.location].filter(Boolean).join('  •  ')
    const body = data.coverLetter || ""
    const t = data.coverTemplate || "basic"

    const Signoff = ({ color = "#222" }: { color?: string }) => (
        <div style={{ marginTop: '40px' }}>
            <p style={{ fontWeight: 600, color }}>Sincerely,</p>
            <p style={{ marginTop: '8px', fontSize: '15px', color }}>{p.fullName}</p>
        </div>
    )

    // ── classic ──────────────────────────────────────────────────────────────
    if (t === "classic") return (
        <div style={{ fontFamily: 'Georgia, serif', padding: '52px', color: '#222', fontSize: '13px', lineHeight: '1.7' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <h1 style={{ fontSize: '26px', fontWeight: 700, margin: 0 }}>{p.fullName}</h1>
                <p style={{ color: '#555', fontSize: '12px', marginTop: '6px' }}>{contact}</p>
            </div>
            <hr style={{ border: 'none', borderTop: '2px solid #222', marginBottom: '32px' }} />
            <div style={{ flex: 1, whiteSpace: 'pre-wrap' }}>{body}</div>
            <Signoff />
        </div>
    )

    // ── modern ───────────────────────────────────────────────────────────────
    if (t === "modern") return (
        <div style={{ fontFamily: 'Arial, sans-serif', display: 'flex', minHeight: '100%' }}>
            <div style={{ width: '6px', backgroundColor: '#1a2744', flexShrink: 0 }} />
            <div style={{ flex: 1, padding: '48px 44px', fontSize: '13px', lineHeight: '1.7', color: '#333' }}>
                <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1a2744', margin: 0 }}>{p.fullName}</h1>
                <p style={{ color: '#4a6fa5', fontSize: '12px', marginTop: '6px', marginBottom: '32px' }}>{contact}</p>
                <div style={{ borderLeft: '3px solid #1a2744', paddingLeft: '16px', whiteSpace: 'pre-wrap', color: '#444' }}>{body}</div>
                <Signoff color="#1a2744" />
            </div>
        </div>
    )

    // ── minimal ──────────────────────────────────────────────────────────────
    if (t === "minimal") return (
        <div style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif", padding: '64px', color: '#222', fontSize: '13px', lineHeight: '1.8' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 300, letterSpacing: '3px', textTransform: 'uppercase', margin: 0 }}>{p.fullName}</h1>
            <p style={{ color: '#999', fontSize: '11px', letterSpacing: '0.5px', marginTop: '8px', marginBottom: '48px' }}>{contact}</p>
            <div style={{ fontWeight: 300, color: '#555', whiteSpace: 'pre-wrap' }}>{body}</div>
            <div style={{ marginTop: '40px' }}>
                <p style={{ fontWeight: 300, letterSpacing: '1px', color: '#999' }}>Sincerely,</p>
                <p style={{ marginTop: '8px', fontWeight: 600, color: '#222' }}>{p.fullName}</p>
            </div>
        </div>
    )

    // ── executive ────────────────────────────────────────────────────────────
    if (t === "executive") return (
        <div style={{ fontFamily: 'Georgia, serif', backgroundColor: '#faf8f3', color: '#222', fontSize: '13px', lineHeight: '1.7', minHeight: '100%' }}>
            <div style={{ backgroundColor: '#2c2c2c', color: '#fff', padding: '36px 52px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <h1 style={{ fontSize: '28px', fontWeight: 700, margin: 0 }}>{p.fullName}</h1>
                <div style={{ textAlign: 'right', fontSize: '11px', color: '#ccc', lineHeight: '1.8' }}>
                    {p.email && <div>{p.email}</div>}
                    {p.phone && <div>{p.phone}</div>}
                    {p.location && <div>{p.location}</div>}
                </div>
            </div>
            <div style={{ padding: '40px 52px' }}>
                <div style={{ height: '1px', backgroundColor: '#c9a84c', marginBottom: '28px' }} />
                <div style={{ color: '#444', whiteSpace: 'pre-wrap' }}>{body}</div>
                <div style={{ marginTop: '36px' }}>
                    <div style={{ height: '1px', backgroundColor: '#c9a84c', marginBottom: '16px' }} />
                    <p style={{ fontWeight: 600 }}>Sincerely,</p>
                    <p style={{ marginTop: '8px' }}>{p.fullName}</p>
                </div>
            </div>
        </div>
    )

    // ── creative ─────────────────────────────────────────────────────────────
    if (t === "creative") return (
        <div style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f0fafa', color: '#222', fontSize: '13px', lineHeight: '1.7', minHeight: '100%' }}>
            <div style={{ backgroundColor: '#008080', color: '#fff', padding: '36px 48px' }}>
                <h1 style={{ fontSize: '30px', fontWeight: 700, margin: 0 }}>{p.fullName}</h1>
                <p style={{ color: '#b2dfdf', fontSize: '12px', marginTop: '6px' }}>{contact}</p>
            </div>
            <div style={{ padding: '36px 48px' }}>
                <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '24px', borderLeft: '4px solid #008080', color: '#555', whiteSpace: 'pre-wrap', lineHeight: '1.8' }}>{body}</div>
                <div style={{ marginTop: '24px', padding: '0 4px' }}>
                    <p style={{ color: '#008080', fontWeight: 600 }}>Sincerely,</p>
                    <p style={{ marginTop: '6px', color: '#333' }}>{p.fullName}</p>
                </div>
            </div>
        </div>
    )

    // ── compact ──────────────────────────────────────────────────────────────
    if (t === "compact") return (
        <div style={{ fontFamily: 'Arial, sans-serif', padding: '36px', color: '#222', fontSize: '12.5px', lineHeight: '1.6' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>{p.fullName}</h1>
            <p style={{ color: '#666', fontSize: '11px', marginTop: '4px' }}>{contact}</p>
            <hr style={{ border: 'none', borderTop: '1px solid #999', margin: '14px 0' }} />
            <div style={{ color: '#444', whiteSpace: 'pre-wrap' }}>{body}</div>
            <hr style={{ border: 'none', borderTop: '1px solid #ddd', margin: '18px 0 12px' }} />
            <p style={{ fontWeight: 600, fontSize: '12px' }}>Sincerely,</p>
            <p style={{ marginTop: '4px' }}>{p.fullName}</p>
        </div>
    )

    // ── two-column ───────────────────────────────────────────────────────────
    if (t === "two-column") return (
        <div style={{ fontFamily: 'Arial, sans-serif', display: 'flex', minHeight: '100%', fontSize: '13px' }}>
            <div style={{ width: '200px', backgroundColor: '#1a2744', color: '#fff', padding: '40px 24px', flexShrink: 0 }}>
                <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>{p.fullName}</h2>
                <div style={{ fontSize: '11px', color: '#ccc', lineHeight: '2' }}>
                    {p.email && <div style={{ wordBreak: 'break-all' }}>{p.email}</div>}
                    {p.phone && <div>{p.phone}</div>}
                    {p.location && <div>{p.location}</div>}
                </div>
            </div>
            <div style={{ flex: 1, padding: '40px 36px', lineHeight: '1.75', color: '#333' }}>
                <div style={{ whiteSpace: 'pre-wrap' }}>{body}</div>
                <div style={{ marginTop: '36px' }}>
                    <p style={{ fontWeight: 600, color: '#1a2744' }}>Sincerely,</p>
                    <p style={{ marginTop: '6px' }}>{p.fullName}</p>
                </div>
            </div>
        </div>
    )

    // ── sidebar ──────────────────────────────────────────────────────────────
    if (t === "sidebar") return (
        <div style={{ fontFamily: 'Arial, sans-serif', display: 'flex', minHeight: '100%', fontSize: '13px' }}>
            <div style={{ width: '4px', backgroundColor: '#6366f1', flexShrink: 0 }} />
            <div style={{ width: '180px', backgroundColor: '#f5f5f5', padding: '40px 20px', flexShrink: 0 }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#d1d5db', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 700, color: '#6b7280' }}>
                    {(p.fullName || 'U').charAt(0).toUpperCase()}
                </div>
                <div style={{ fontSize: '10px', color: '#888', textAlign: 'center', lineHeight: '1.8', wordBreak: 'break-all' }}>
                    {p.email && <div>{p.email}</div>}
                    {p.phone && <div>{p.phone}</div>}
                    {p.location && <div>{p.location}</div>}
                </div>
            </div>
            <div style={{ flex: 1, padding: '40px 32px', lineHeight: '1.75', color: '#333' }}>
                <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#222', marginBottom: '4px' }}>{p.fullName}</h1>
                <div style={{ height: '2px', backgroundColor: '#6366f1', width: '40px', marginBottom: '24px' }} />
                <div style={{ whiteSpace: 'pre-wrap' }}>{body}</div>
                <div style={{ marginTop: '36px' }}>
                    <p style={{ fontWeight: 600, color: '#6366f1' }}>Sincerely,</p>
                    <p style={{ marginTop: '6px' }}>{p.fullName}</p>
                </div>
            </div>
        </div>
    )

    // ── elegant ──────────────────────────────────────────────────────────────
    if (t === "elegant") return (
        <div style={{ fontFamily: 'Georgia, serif', padding: '56px', color: '#333', fontSize: '13px', lineHeight: '1.8' }}>
            <div style={{ height: '1px', backgroundColor: '#c9a84c', marginBottom: '24px' }} />
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <h1 style={{ fontSize: '26px', fontWeight: 700, letterSpacing: '2px', margin: 0, color: '#222' }}>{p.fullName}</h1>
                <p style={{ color: '#888', fontSize: '11px', letterSpacing: '1px', marginTop: '8px' }}>{contact}</p>
            </div>
            <div style={{ height: '1px', backgroundColor: '#c9a84c', marginBottom: '36px' }} />
            <div style={{ color: '#555', whiteSpace: 'pre-wrap' }}>{body}</div>
            <div style={{ marginTop: '40px' }}>
                <div style={{ height: '0.5px', backgroundColor: '#c9a84c', width: '60px', marginBottom: '12px' }} />
                <p style={{ fontStyle: 'italic', color: '#888' }}>Sincerely,</p>
                <p style={{ marginTop: '6px', fontSize: '15px', color: '#222' }}>{p.fullName}</p>
            </div>
        </div>
    )

    // ── bold ─────────────────────────────────────────────────────────────────
    if (t === "bold") return (
        <div style={{ fontFamily: 'Arial, sans-serif', color: '#111', fontSize: '13px', lineHeight: '1.7', minHeight: '100%' }}>
            <div style={{ backgroundColor: '#111', padding: '36px 48px' }}>
                <h1 style={{ fontSize: '30px', fontWeight: 900, color: '#f59e0b', margin: 0 }}>{p.fullName}</h1>
                <p style={{ color: '#aaa', fontSize: '12px', marginTop: '6px' }}>{contact}</p>
            </div>
            <div style={{ height: '5px', backgroundColor: '#f59e0b' }} />
            <div style={{ padding: '36px 48px' }}>
                <div style={{ color: '#444', whiteSpace: 'pre-wrap' }}>{body}</div>
                <div style={{ marginTop: '36px', paddingLeft: '14px', borderLeft: '4px solid #f59e0b' }}>
                    <p style={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '12px' }}>Sincerely,</p>
                    <p style={{ marginTop: '6px', fontWeight: 700 }}>{p.fullName}</p>
                </div>
            </div>
        </div>
    )

    // ── academic ─────────────────────────────────────────────────────────────
    if (t === "academic") return (
        <div style={{ fontFamily: 'Georgia, serif', color: '#222', fontSize: '13px', lineHeight: '1.75', minHeight: '100%' }}>
            <div style={{ backgroundColor: '#003087', color: '#fff', padding: '32px 52px' }}>
                <h1 style={{ fontSize: '26px', fontWeight: 700, margin: 0 }}>{p.fullName}</h1>
                <p style={{ color: '#7fa8d4', fontSize: '12px', marginTop: '6px' }}>{contact}</p>
            </div>
            <div style={{ padding: '36px 52px' }}>
                <div style={{ height: '1px', backgroundColor: '#003087', marginBottom: '28px' }} />
                <div style={{ color: '#444', whiteSpace: 'pre-wrap' }}>{body}</div>
                <div style={{ marginTop: '36px' }}>
                    <div style={{ height: '1px', backgroundColor: '#003087', marginBottom: '16px' }} />
                    <p style={{ fontWeight: 600 }}>Sincerely,</p>
                    <p style={{ marginTop: '8px' }}>{p.fullName}</p>
                </div>
            </div>
        </div>
    )

    // ── tech ─────────────────────────────────────────────────────────────────
    if (t === "tech") return (
        <div style={{ fontFamily: "'Courier New', monospace", backgroundColor: '#0d1117', color: '#e6edf3', fontSize: '13px', lineHeight: '1.75', minHeight: '100%', padding: '40px 44px' }}>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
                <div style={{ width: '5px', backgroundColor: '#00ff88', borderRadius: '2px', flexShrink: 0 }} />
                <div>
                    <h1 style={{ fontSize: '26px', fontWeight: 700, margin: 0 }}>{p.fullName}</h1>
                    <p style={{ color: '#00ff88', fontSize: '12px', marginTop: '6px' }}>{contact}</p>
                </div>
            </div>
            <div style={{ height: '1px', backgroundColor: 'rgba(0,255,136,0.2)', marginBottom: '24px' }} />
            <div style={{ color: '#8b949e', whiteSpace: 'pre-wrap' }}>{body}</div>
            <div style={{ marginTop: '36px', borderLeft: '2px solid #00ff88', paddingLeft: '12px' }}>
                <p style={{ color: '#00ff88', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px' }}>/* Sincerely */</p>
                <p style={{ marginTop: '8px', color: '#e6edf3', fontWeight: 600 }}>{p.fullName}</p>
            </div>
        </div>
    )

    // ── clean ────────────────────────────────────────────────────────────────
    if (t === "clean") return (
        <div style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f8fafc', fontSize: '13px', lineHeight: '1.75', minHeight: '100%', padding: '28px' }}>
            <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '22px 26px', marginBottom: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b', margin: 0 }}>{p.fullName}</h1>
                <p style={{ color: '#2563eb', fontSize: '12px', fontWeight: 500, marginTop: '6px' }}>{contact}</p>
            </div>
            <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '24px 26px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ color: '#475569', whiteSpace: 'pre-wrap' }}>{body}</div>
                <div style={{ marginTop: '28px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                    <p style={{ fontWeight: 600, color: '#2563eb' }}>Sincerely,</p>
                    <p style={{ marginTop: '6px', color: '#1e293b' }}>{p.fullName}</p>
                </div>
            </div>
        </div>
    )

    // ── timeline ─────────────────────────────────────────────────────────────
    if (t === "timeline") return (
        <div style={{ fontFamily: 'Arial, sans-serif', padding: '48px 52px', color: '#1e293b', fontSize: '13px', lineHeight: '1.75' }}>
            <h1 style={{ fontSize: '26px', fontWeight: 700, margin: 0 }}>{p.fullName}</h1>
            <p style={{ color: '#6366f1', fontSize: '12px', fontWeight: 500, marginTop: '6px', marginBottom: '32px' }}>{contact}</p>
            <div style={{ paddingLeft: '24px', borderLeft: '2px solid rgba(99,102,241,0.3)' }}>
                <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '-31px', top: '4px', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#6366f1' }} />
                    <div style={{ color: '#555', whiteSpace: 'pre-wrap' }}>{body}</div>
                </div>
            </div>
            <div style={{ marginTop: '36px', paddingLeft: '24px' }}>
                <p style={{ fontWeight: 600, color: '#6366f1' }}>Sincerely,</p>
                <p style={{ marginTop: '6px' }}>{p.fullName}</p>
            </div>
        </div>
    )

    // ── infographic ──────────────────────────────────────────────────────────
    if (t === "infographic") return (
        <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '13px', lineHeight: '1.75', minHeight: '100%' }}>
            <div style={{ backgroundColor: '#1e293b', color: '#fff', padding: '28px 40px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 700, flexShrink: 0 }}>
                    {(p.fullName || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                    <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>{p.fullName}</h1>
                    <p style={{ color: '#94a3b8', fontSize: '11px', marginTop: '4px' }}>{contact}</p>
                </div>
            </div>
            <div style={{ padding: '32px 40px' }}>
                <div style={{ height: '4px', backgroundColor: '#f59e0b', width: '40px', borderRadius: '2px', marginBottom: '24px' }} />
                <div style={{ color: '#475569', whiteSpace: 'pre-wrap' }}>{body}</div>
                <div style={{ marginTop: '36px', display: 'flex', gap: '14px' }}>
                    <div style={{ width: '6px', backgroundColor: '#6366f1', borderRadius: '3px', flexShrink: 0 }} />
                    <div>
                        <p style={{ fontWeight: 600, color: '#1e293b' }}>Sincerely,</p>
                        <p style={{ marginTop: '6px', color: '#475569' }}>{p.fullName}</p>
                    </div>
                </div>
            </div>
        </div>
    )

    // ── legacy template_modern_pro ───────────────────────────────────────────
    if (t === "template_modern_pro") return (
        <div style={{ fontFamily: 'Arial, sans-serif', color: '#1e293b', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ backgroundColor: '#0f172a', color: '#fff', padding: '48px', textAlign: 'center' }}>
                <h1 style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '4px', textTransform: 'uppercase', margin: 0 }}>{p.fullName}</h1>
                <p style={{ color: '#94a3b8', fontSize: '12px', marginTop: '8px' }}>{contact}</p>
            </div>
            <div style={{ flex: 1, padding: '48px', fontSize: '14px', lineHeight: '1.9', color: '#334155', whiteSpace: 'pre-wrap' }}>{body}</div>
            <div style={{ padding: '48px', paddingTop: 0 }}>
                <p style={{ fontWeight: 600, fontSize: '15px' }}>Sincerely,</p>
                <p style={{ marginTop: '8px', fontSize: '17px' }}>{p.fullName}</p>
            </div>
        </div>
    )

    // ── default / basic ──────────────────────────────────────────────────────
    return (
        <div style={{ fontFamily: 'Georgia, serif', padding: '48px 52px', color: '#333', fontSize: '13px', lineHeight: '1.8' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px', paddingBottom: '20px', borderBottom: '2px solid #222' }}>
                <h1 style={{ fontSize: '28px', fontWeight: 700, margin: 0 }}>{p.fullName}</h1>
                <p style={{ color: '#777', fontSize: '12px', marginTop: '6px' }}>{contact}</p>
            </div>
            <div style={{ whiteSpace: 'pre-wrap', color: '#444' }}>{body}</div>
            <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #ddd' }}>
                <p style={{ fontWeight: 600 }}>Sincerely,</p>
                <p style={{ marginTop: '8px' }}>{p.fullName}</p>
            </div>
        </div>
    )
}

// ─── Resume Preview ──────────────────────────────────────────────────────────

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
                                <CoverLetterPage data={data} />
                            </div>
                        )}

                        <div className="w-full min-h-[1122px] bg-white relative page-break flex flex-col">
                            {/* RESUME PAGE */}
                            {(() => {
                                const activeId = data.activeTemplateId || data.template;
                                const TemplateComponent = TEMPLATE_MAP[activeId];

                                if (TemplateComponent) {
                                    return <TemplateComponent data={data} scale={1} />
                                }

                                switch (activeId) {
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

                                                    {/* Custom Sections */}
                                                    {(data as any).customSections?.filter((s: any) => s.title && s.content).map((section: any) => (
                                                        <section key={section.id}>
                                                            <h2 className="text-xs font-bold uppercase tracking-widest border-b border-black pb-1 mb-4">{section.title}</h2>
                                                            <p className="text-sm whitespace-pre-wrap">{section.content}</p>
                                                        </section>
                                                    ))}
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