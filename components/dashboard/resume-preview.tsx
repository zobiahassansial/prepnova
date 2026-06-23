"use client"

import React, { useRef, useEffect } from "react"
import { useReactToPrint } from "react-to-print"
import { Button } from "@/components/ui/button"
import { ResumeData } from "@/types/resume"
import { TEMPLATE_MAP } from "./resume-templates/registry"
import { OverlayPreviewRenderer } from "./overlay-preview-renderer"
import { ImportedTemplateRenderer } from "./imported-template-renderer"

// ─── Cover Letter Page ───────────────────────────────────────────────────────

function Signoff({ fullName, color = "#222" }: { fullName: string; color?: string }) {
    return (
        <div style={{ marginTop: '40px' }}>
            <p style={{ fontWeight: 600, color }}>Sincerely,</p>
            <p style={{ marginTop: '8px', fontSize: '15px', color }}>{fullName}</p>
        </div>
    )
}

function CoverLetterPage({ data }: { data: ResumeData }) {
    const p = data.personalInfo
    const contact = [p.email, p.phone, p.location].filter(Boolean).join('  •  ')
    const body = data.coverLetter || ""
    const t = data.coverTemplate || "basic"

    if (t === "classic") return (
        <div style={{ fontFamily: 'Georgia, serif', padding: '52px', color: '#222', fontSize: '13px', lineHeight: '1.7' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <h1 style={{ fontSize: '26px', fontWeight: 700, margin: 0 }}>{p.fullName}</h1>
                <p style={{ color: '#555', fontSize: '12px', marginTop: '6px' }}>{contact}</p>
            </div>
            <hr style={{ border: 'none', borderTop: '2px solid #222', marginBottom: '32px' }} />
            <div style={{ flex: 1, whiteSpace: 'pre-wrap' }}>{body}</div>
            <Signoff fullName={p.fullName} />
        </div>
    )

    if (t === "modern") return (
        <div style={{ fontFamily: 'Arial, sans-serif', display: 'flex', minHeight: '100%' }}>
            <div style={{ width: '6px', backgroundColor: '#1a2744', flexShrink: 0 }} />
            <div style={{ flex: 1, padding: '48px 44px', fontSize: '13px', lineHeight: '1.7', color: '#333' }}>
                <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1a2744', margin: 0 }}>{p.fullName}</h1>
                <p style={{ color: '#4a6fa5', fontSize: '12px', marginTop: '6px', marginBottom: '32px' }}>{contact}</p>
                <div style={{ borderLeft: '3px solid #1a2744', paddingLeft: '16px', whiteSpace: 'pre-wrap', color: '#444' }}>{body}</div>
                <Signoff fullName={p.fullName} color="#1a2744" />
            </div>
        </div>
    )

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
                <p style={{ color: '#00ff88', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px' }}>{'/* Sincerely */'}</p>
                <p style={{ marginTop: '8px', color: '#e6edf3', fontWeight: 600 }}>{p.fullName}</p>
            </div>
        </div>
    )

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

    // Default cover letter (basic / any unrecognised ID)
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

    useEffect(() => {
        if (!componentRef.current || !onPageCountChange) return
        const A4_HEIGHT_PX = 1122
        const calculate = () => {
            const height = componentRef.current!.scrollHeight
            onPageCountChange(Math.max(1, Math.ceil(height / A4_HEIGHT_PX)))
        }
        calculate()
        const observer = new ResizeObserver(calculate)
        observer.observe(componentRef.current)
        return () => observer.disconnect()
    }, [data, onPageCountChange])

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Resume - ${data.personalInfo.fullName || "User"}`,
    })

    // Resolve template ID (support legacy aliases via TEMPLATE_MAP)
    const activeId = data.activeTemplateId || data.template || "basic"
    const isOverlay   = activeId === "custom-overlay"   && !!data.customOverlayTemplate
    const isImported  = activeId === "imported-template" && !!data.importedTemplateDefinition
    const TemplateComponent = (isOverlay || isImported) ? null : (TEMPLATE_MAP[activeId] ?? TEMPLATE_MAP["basic"])

    return (
        <div className="w-full h-full flex flex-col overflow-hidden">
            {/* Hidden print trigger */}
            <Button
                id="print-resume"
                onClick={() => handlePrint && handlePrint()}
                className="hidden"
            />

            <div className="flex-1 overflow-auto bg-white">
                <div className="min-h-full flex justify-center py-6">

                    <style jsx global>{`
                        @media print {
                            @page { size: auto; margin: 0mm; }
                            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                            .page-break { page-break-after: always; }
                        }
                    `}</style>

                    {/* A4 paper */}
                    <div
                        ref={componentRef}
                        className="w-[210mm] bg-white text-black shadow-xl min-h-screen"
                    >
                        {/* Cover letter page */}
                        {data.includeCover && data.coverLetter && (
                            <div className="w-full min-h-[1122px] bg-white relative page-break flex flex-col">
                                <CoverLetterPage data={data} />
                            </div>
                        )}

                        {/* Resume page */}
                        <div className="w-full min-h-[1122px] bg-white relative page-break flex flex-col">
                            {isOverlay ? (
                                <OverlayPreviewRenderer
                                    data={data}
                                    template={data.customOverlayTemplate!}
                                />
                            ) : isImported ? (
                                <ImportedTemplateRenderer
                                    data={data}
                                    definition={data.importedTemplateDefinition!}
                                />
                            ) : TemplateComponent ? (
                                <TemplateComponent data={data} />
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
