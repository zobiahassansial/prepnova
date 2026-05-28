"use client"

import React, { memo, useState } from "react"
import { cn } from "@/lib/utils"

interface TemplateOption {
    id: string
    name: string
    description: string
    thumbnailClass: string
}

const templates: TemplateOption[] = [
    { id: "basic", name: "Basic", description: "Simple & clean", thumbnailClass: "bg-white p-2 flex flex-col gap-1 border shadow-sm" },
    { id: "template_modern_pro", name: "Modern Pro", description: "Bold & professional", thumbnailClass: "bg-white p-0 flex flex-col shadow-sm" },
    { id: "template_sidebar", name: "Legacy Sidebar", description: "Structured layout", thumbnailClass: "bg-white flex flex-row shadow-sm h-full" },
    { id: "template_minimal_elegant", name: "Minimal Elegant", description: "Refined serif style", thumbnailClass: "bg-[#fcfbf9] p-2 flex flex-col items-center shadow-sm" },
    { id: "template_creative_blocks", name: "Creative Blocks", description: "Unique section headers", thumbnailClass: "bg-white p-2 flex flex-col gap-2 shadow-sm" },
    { id: "classic", name: "Classic", description: "Professional", thumbnailClass: "bg-white p-2 border" },
    { id: "modern", name: "Modern", description: "Clean", thumbnailClass: "bg-white p-2 border" },
    { id: "minimal", name: "Minimal", description: "Simple", thumbnailClass: "bg-white p-2 border" },
    { id: "executive", name: "Executive", description: "Corporate", thumbnailClass: "bg-white p-2 border" },
    { id: "creative", name: "Creative", description: "Unique", thumbnailClass: "bg-white p-2 border" },
    { id: "compact", name: "Compact", description: "Dense", thumbnailClass: "bg-white p-2 border" },
    { id: "two-column", name: "Two Column", description: "Split layout", thumbnailClass: "bg-white p-2 border" },
    { id: "sidebar", name: "Sidebar", description: "Sidebar layout", thumbnailClass: "bg-white p-2 border" },
    { id: "elegant", name: "Elegant", description: "Refined", thumbnailClass: "bg-white p-2 border" },
    { id: "bold", name: "Bold", description: "Strong", thumbnailClass: "bg-white p-2 border" },
    { id: "academic", name: "Academic", description: "CV style", thumbnailClass: "bg-white p-2 border" },
    { id: "tech", name: "Tech", description: "Developer", thumbnailClass: "bg-white p-2 border" },
    { id: "clean", name: "Clean", description: "Minimalist", thumbnailClass: "bg-white p-2 border" },
    { id: "timeline", name: "Timeline", description: "Chronological", thumbnailClass: "bg-white p-2 border" },
    { id: "infographic", name: "Infographic", description: "Visual", thumbnailClass: "bg-white p-2 border" },
]

const coverTemplates: TemplateOption[] = [
    { id: "basic", name: "Basic", description: "Simple & clean", thumbnailClass: "bg-white p-2 flex flex-col gap-1 border shadow-sm" },
    { id: "template_modern_pro", name: "Modern Pro", description: "Bold & professional", thumbnailClass: "bg-white p-0 flex flex-col shadow-sm" },
    { id: "template_sidebar", name: "Sidebar", description: "Structured layout", thumbnailClass: "bg-white flex flex-row shadow-sm h-full" },
    { id: "template_minimal_elegant", name: "Minimal Elegant", description: "Refined serif style", thumbnailClass: "bg-[#fcfbf9] p-2 flex flex-col items-center shadow-sm" },
    { id: "template_creative_blocks", name: "Creative Blocks", description: "Unique section headers", thumbnailClass: "bg-white p-2 flex flex-col gap-2 shadow-sm" },
]

interface TemplateGalleryProps {
    selected: string
    onSelect: (id: string, customHtml?: string) => void
    activeTemplate: string
    type?: "resume" | "cover"
    customTemplateHtml?: string
}

export const TemplateGallery = memo(function TemplateGallery({ selected, onSelect, type = "resume", customTemplateHtml }: TemplateGalleryProps) {
    const list = type === "cover" ? coverTemplates : templates
    const [showCustomTemplateModal, setShowCustomTemplateModal] = useState(false)
    const [customHtml, setCustomHtml] = useState(customTemplateHtml || "")

    const handleFileRead = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = (ev) => {
            setCustomHtml(ev.target?.result as string)
        }
        reader.readAsText(file)
    }

    const handleUseCustomTemplate = () => {
        onSelect("custom", customHtml)
        setShowCustomTemplateModal(false)
    }

    return (
        <div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {list.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => onSelect(t.id)}
                        className={cn(
                            "rounded-xl border transition flex flex-col items-center relative group text-left hover:shadow-md overflow-hidden bg-white",
                            selected === t.id
                                ? "border-blue-600 ring-2 ring-blue-600"
                                : "border-slate-200 hover:border-slate-400"
                        )}
                        style={{ maxWidth: "160px" }}
                    >
                        {/* SVG Thumbnail */}
                        <div className="w-full overflow-hidden bg-gray-50" style={{ height: "120px" }}>
                            <TemplateSVG id={t.id} type={type} />
                        </div>

                        {/* Template Name Label */}
                        <div className="w-full p-2 text-center bg-white border-t border-slate-100">
                            <span className="text-xs font-medium text-slate-700 block truncate">{t.name}</span>
                        </div>

                        {selected === t.id && (
                            <div className="absolute top-1 right-1">
                                <span className="bg-blue-600 text-white text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                                    ✓
                                </span>
                            </div>
                        )}
                    </button>
                ))}

                {/* "Use Your Own Template" card — only for resume type */}
                {type === "resume" && (
                    <div
                        onClick={() => setShowCustomTemplateModal(true)}
                        className="cursor-pointer border-2 border-dashed border-gray-400 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-indigo-500 transition-colors"
                        style={{ height: "120px", maxWidth: "160px" }}
                    >
                        <span className="text-2xl">+</span>
                        <span className="text-xs text-gray-500 text-center px-2">Use Your Own Template</span>
                    </div>
                )}
            </div>

            {/* Custom Template Modal */}
            {showCustomTemplateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 w-full max-w-lg mx-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Use Your Own Template</h2>
                            <button
                                onClick={() => setShowCustomTemplateModal(false)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors text-xl leading-none"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Upload HTML File
                            </label>
                            <input
                                type="file"
                                accept=".html"
                                onChange={handleFileRead}
                                className="block w-full text-sm text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Or Paste HTML/CSS Template Here
                            </label>
                            <textarea
                                value={customHtml}
                                onChange={(e) => setCustomHtml(e.target.value)}
                                placeholder="<!DOCTYPE html><html>...</html>"
                                rows={8}
                                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-mono text-slate-800 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setShowCustomTemplateModal(false)}
                                className="flex-1 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUseCustomTemplate}
                                disabled={!customHtml.trim()}
                                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg text-sm text-white font-medium transition-colors"
                            >
                                Use This Template
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
})

// Pure SVG previews — no hooks, no dynamic rendering
const TemplateSVG = memo(function TemplateSVG({ id, type = "resume" }: { id: string; type?: "resume" | "cover" }) {
    if (type === "cover") {
        switch (id) {
            case "basic":
                return (
                    <div className="p-4 space-y-2 font-sans text-xs text-left h-full">
                        <div className="font-bold text-lg border-b pb-1">Name</div>
                        <div className="space-y-1 pt-2">
                            <div className="h-1 bg-gray-200 w-full mb-2"></div>
                            <div className="h-1 bg-gray-200 w-full"></div>
                            <div className="h-1 bg-gray-200 w-full"></div>
                        </div>
                    </div>
                )
            case "template_modern_pro":
                return (
                    <div className="font-sans text-xs h-full text-left">
                        <div className="bg-slate-900 text-white p-2 text-center">
                            <div className="font-bold text-lg tracking-wider">NAME</div>
                        </div>
                        <div className="p-4 space-y-2">
                            <div className="h-1 bg-gray-200 w-full mb-1"></div>
                            <div className="h-1 bg-gray-200 w-full"></div>
                        </div>
                    </div>
                )
            case "template_sidebar":
                return (
                    <div className="flex w-full h-full text-left font-sans">
                        <div className="w-1/3 bg-slate-100 p-2 border-r">
                            <div className="h-8 w-8 bg-slate-300 rounded-full mx-auto mb-2"></div>
                        </div>
                        <div className="flex-1 p-2 space-y-2">
                            <div className="font-bold text-lg border-b-2 border-slate-800">NAME</div>
                            <div className="h-1 bg-gray-100 w-full"></div>
                            <div className="h-1 bg-gray-100 w-full"></div>
                        </div>
                    </div>
                )
            case "template_minimal_elegant":
                return (
                    <div className="p-4 h-full text-center font-serif text-xs">
                        <div className="mb-4">
                            <div className="text-xl italic">Your Name</div>
                        </div>
                        <div className="text-left space-y-1">
                            <div className="h-1 bg-gray-100 w-full"></div>
                            <div className="h-1 bg-gray-100 w-full"></div>
                        </div>
                    </div>
                )
            case "template_creative_blocks":
                return (
                    <div className="p-4 h-full font-sans text-xs text-left">
                        <div className="mb-2">
                            <div className="bg-black text-white inline-block px-2 py-1 text-lg font-bold -rotate-1">NAME</div>
                        </div>
                        <div className="space-y-1">
                            <div className="h-1 bg-gray-100 w-full"></div>
                            <div className="h-1 bg-gray-100 w-full"></div>
                        </div>
                    </div>
                )
            default:
                return <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">Preview</div>
        }
    }

    // Resume SVG Previews
    switch (id) {
        case "classic":
            return (
                <svg viewBox="0 0 210 297" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%", background: "#fff" }}>
                    <rect x="20" y="18" width="170" height="8" rx="1" fill="#111" opacity="0.85" />
                    <rect x="60" y="30" width="90" height="4" rx="1" fill="#555" opacity="0.5" />
                    <line x1="20" y1="42" x2="190" y2="42" stroke="#333" strokeWidth="0.8" />
                    <rect x="20" y="50" width="60" height="3.5" rx="1" fill="#222" opacity="0.7" />
                    <rect x="20" y="58" width="150" height="2.5" rx="1" fill="#888" opacity="0.5" />
                    <rect x="20" y="63" width="130" height="2.5" rx="1" fill="#888" opacity="0.4" />
                    <rect x="20" y="68" width="140" height="2.5" rx="1" fill="#888" opacity="0.4" />
                    <line x1="20" y1="77" x2="190" y2="77" stroke="#ccc" strokeWidth="0.5" />
                    <rect x="20" y="83" width="50" height="3.5" rx="1" fill="#222" opacity="0.7" />
                    <rect x="20" y="91" width="160" height="2.5" rx="1" fill="#888" opacity="0.4" />
                    <rect x="20" y="96" width="145" height="2.5" rx="1" fill="#888" opacity="0.4" />
                    <rect x="20" y="101" width="155" height="2.5" rx="1" fill="#888" opacity="0.4" />
                    <line x1="20" y1="110" x2="190" y2="110" stroke="#ccc" strokeWidth="0.5" />
                    <rect x="20" y="116" width="45" height="3.5" rx="1" fill="#222" opacity="0.7" />
                    <rect x="20" y="124" width="55" height="2.5" rx="1" fill="#888" opacity="0.5" />
                    <rect x="20" y="129" width="48" height="2.5" rx="1" fill="#888" opacity="0.4" />
                    <rect x="20" y="134" width="60" height="2.5" rx="1" fill="#888" opacity="0.4" />
                </svg>
            )
        case "modern":
            return (
                <svg viewBox="0 0 210 297" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%", background: "#fff" }}>
                    <rect x="0" y="0" width="5" height="297" fill="#1a2744" />
                    <rect x="15" y="18" width="120" height="8" rx="1" fill="#1a2744" opacity="0.9" />
                    <rect x="15" y="30" width="80" height="3.5" rx="1" fill="#4a6fa5" opacity="0.7" />
                    <rect x="15" y="37" width="100" height="2.5" rx="1" fill="#999" opacity="0.5" />
                    <rect x="15" y="50" width="55" height="4" rx="1" fill="#1a2744" opacity="0.8" />
                    <rect x="15" y="58" width="3" height="25" rx="1" fill="#1a2744" opacity="0.3" />
                    <rect x="22" y="58" width="140" height="2.5" rx="1" fill="#666" opacity="0.5" />
                    <rect x="22" y="64" width="125" height="2.5" rx="1" fill="#666" opacity="0.4" />
                    <rect x="22" y="70" width="135" height="2.5" rx="1" fill="#666" opacity="0.4" />
                    <rect x="15" y="90" width="55" height="4" rx="1" fill="#1a2744" opacity="0.8" />
                    <rect x="22" y="98" width="145" height="2.5" rx="1" fill="#666" opacity="0.5" />
                    <rect x="22" y="104" width="130" height="2.5" rx="1" fill="#666" opacity="0.4" />
                    <rect x="22" y="110" width="140" height="2.5" rx="1" fill="#666" opacity="0.4" />
                    <rect x="15" y="125" width="45" height="4" rx="1" fill="#1a2744" opacity="0.8" />
                    <rect x="22" y="133" width="60" height="2.5" rx="1" fill="#666" opacity="0.5" />
                    <rect x="22" y="139" width="50" height="2.5" rx="1" fill="#666" opacity="0.4" />
                </svg>
            )
        case "minimal":
            return (
                <svg viewBox="0 0 210 297" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%", background: "#fff" }}>
                    <rect x="30" y="25" width="90" height="6" rx="1" fill="#222" opacity="0.75" />
                    <rect x="30" y="35" width="60" height="2.5" rx="1" fill="#aaa" opacity="0.6" />
                    <rect x="30" y="60" width="30" height="2" rx="1" fill="#bbb" opacity="0.7" />
                    <rect x="30" y="68" width="145" height="2" rx="1" fill="#ccc" opacity="0.5" />
                    <rect x="30" y="73" width="130" height="2" rx="1" fill="#ccc" opacity="0.4" />
                    <rect x="30" y="78" width="140" height="2" rx="1" fill="#ccc" opacity="0.4" />
                    <rect x="30" y="95" width="35" height="2" rx="1" fill="#bbb" opacity="0.7" />
                    <rect x="30" y="103" width="150" height="2" rx="1" fill="#ccc" opacity="0.5" />
                    <rect x="30" y="108" width="135" height="2" rx="1" fill="#ccc" opacity="0.4" />
                    <rect x="30" y="125" width="28" height="2" rx="1" fill="#bbb" opacity="0.7" />
                    <rect x="30" y="133" width="55" height="2" rx="1" fill="#ccc" opacity="0.5" />
                    <rect x="30" y="138" width="48" height="2" rx="1" fill="#ccc" opacity="0.4" />
                </svg>
            )
        case "executive":
            return (
                <svg viewBox="0 0 210 297" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%", background: "#faf8f3" }}>
                    <rect x="0" y="0" width="210" height="55" fill="#2c2c2c" />
                    <rect x="20" y="12" width="110" height="8" rx="1" fill="#fff" opacity="0.95" />
                    <rect x="20" y="25" width="75" height="3.5" rx="1" fill="#ccc" opacity="0.7" />
                    <rect x="130" y="15" width="60" height="2.5" rx="1" fill="#aaa" opacity="0.6" />
                    <rect x="130" y="21" width="55" height="2.5" rx="1" fill="#aaa" opacity="0.5" />
                    <rect x="130" y="27" width="50" height="2.5" rx="1" fill="#aaa" opacity="0.5" />
                    <rect x="20" y="65" width="55" height="4" rx="1" fill="#2c2c2c" opacity="0.8" />
                    <line x1="20" y1="72" x2="190" y2="72" stroke="#c9a84c" strokeWidth="0.8" />
                    <rect x="20" y="78" width="150" height="2.5" rx="1" fill="#555" opacity="0.5" />
                    <rect x="20" y="84" width="135" height="2.5" rx="1" fill="#555" opacity="0.4" />
                    <rect x="20" y="96" width="50" height="4" rx="1" fill="#2c2c2c" opacity="0.8" />
                    <line x1="20" y1="103" x2="190" y2="103" stroke="#c9a84c" strokeWidth="0.8" />
                    <rect x="20" y="109" width="145" height="2.5" rx="1" fill="#555" opacity="0.5" />
                    <rect x="20" y="115" width="130" height="2.5" rx="1" fill="#555" opacity="0.4" />
                </svg>
            )
        case "creative":
            return (
                <svg viewBox="0 0 210 297" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%", background: "#f0fafa" }}>
                    <rect x="0" y="0" width="210" height="50" fill="#008080" />
                    <rect x="15" y="12" width="100" height="8" rx="2" fill="#fff" opacity="0.95" />
                    <rect x="15" y="24" width="70" height="3.5" rx="2" fill="#b2dfdf" opacity="0.9" />
                    <rect x="155" y="10" width="40" height="14" rx="7" fill="#ff6b6b" opacity="0.8" />
                    <rect x="15" y="60" width="80" height="5" rx="2" fill="#008080" opacity="0.8" />
                    <rect x="15" y="70" width="175" height="14" rx="3" fill="#fff" opacity="0.8" />
                    <rect x="20" y="74" width="140" height="2.5" rx="1" fill="#555" opacity="0.5" />
                    <rect x="15" y="92" width="75" height="5" rx="2" fill="#008080" opacity="0.8" />
                    <rect x="15" y="102" width="175" height="20" rx="3" fill="#fff" opacity="0.8" />
                    <rect x="20" y="106" width="145" height="2.5" rx="1" fill="#555" opacity="0.5" />
                    <rect x="20" y="112" width="130" height="2.5" rx="1" fill="#555" opacity="0.4" />
                    <rect x="15" y="130" width="60" height="5" rx="2" fill="#ff6b6b" opacity="0.7" />
                    <rect x="15" y="140" width="40" height="8" rx="4" fill="#008080" opacity="0.3" />
                    <rect x="60" y="140" width="45" height="8" rx="4" fill="#008080" opacity="0.3" />
                    <rect x="110" y="140" width="38" height="8" rx="4" fill="#008080" opacity="0.3" />
                </svg>
            )
        case "two-column":
            return (
                <svg viewBox="0 0 210 297" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%", background: "#fff" }}>
                    <rect x="0" y="0" width="65" height="297" fill="#1a2744" />
                    <rect x="8" y="15" width="49" height="49" rx="24.5" fill="#2d3f6b" />
                    <rect x="12" y="70" width="41" height="3.5" rx="1" fill="#fff" opacity="0.9" />
                    <rect x="12" y="77" width="35" height="2.5" rx="1" fill="#aaa" opacity="0.7" />
                    <rect x="12" y="95" width="30" height="3" rx="1" fill="#7ea8d8" opacity="0.9" />
                    <rect x="12" y="102" width="41" height="2" rx="1" fill="#aaa" opacity="0.5" />
                    <rect x="12" y="107" width="38" height="2" rx="1" fill="#aaa" opacity="0.4" />
                    <rect x="12" y="112" width="40" height="2" rx="1" fill="#aaa" opacity="0.4" />
                    <rect x="12" y="128" width="30" height="3" rx="1" fill="#7ea8d8" opacity="0.9" />
                    <rect x="12" y="135" width="38" height="6" rx="3" fill="#2d3f6b" />
                    <rect x="12" y="145" width="42" height="6" rx="3" fill="#2d3f6b" />
                    <rect x="80" y="20" width="110" height="7" rx="1" fill="#1a2744" opacity="0.85" />
                    <rect x="80" y="31" width="75" height="3" rx="1" fill="#666" opacity="0.6" />
                    <rect x="80" y="50" width="50" height="3.5" rx="1" fill="#1a2744" opacity="0.8" />
                    <line x1="80" y1="57" x2="190" y2="57" stroke="#ddd" strokeWidth="0.5" />
                    <rect x="80" y="62" width="125" height="2.5" rx="1" fill="#777" opacity="0.5" />
                    <rect x="80" y="68" width="110" height="2.5" rx="1" fill="#777" opacity="0.4" />
                    <rect x="80" y="86" width="50" height="3.5" rx="1" fill="#1a2744" opacity="0.8" />
                    <line x1="80" y1="93" x2="190" y2="93" stroke="#ddd" strokeWidth="0.5" />
                    <rect x="80" y="98" width="120" height="2.5" rx="1" fill="#777" opacity="0.5" />
                    <rect x="80" y="104" width="105" height="2.5" rx="1" fill="#777" opacity="0.4" />
                </svg>
            )
        case "tech":
            return (
                <svg viewBox="0 0 210 297" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%", background: "#0d1117" }}>
                    <rect x="15" y="18" width="5" height="30" rx="1" fill="#00ff88" opacity="0.8" />
                    <rect x="25" y="20" width="100" height="8" rx="1" fill="#e6edf3" opacity="0.9" />
                    <rect x="25" y="32" width="70" height="3" rx="1" fill="#00ff88" opacity="0.7" />
                    <rect x="25" y="39" width="90" height="2.5" rx="1" fill="#8b949e" opacity="0.6" />
                    <rect x="15" y="56" width="45" height="3" rx="1" fill="#00ff88" opacity="0.8" />
                    <line x1="15" y1="62" x2="195" y2="62" stroke="#00ff88" strokeWidth="0.4" opacity="0.4" />
                    <rect x="15" y="67" width="170" height="2.5" rx="1" fill="#8b949e" opacity="0.5" />
                    <rect x="15" y="73" width="155" height="2.5" rx="1" fill="#8b949e" opacity="0.4" />
                    <rect x="15" y="79" width="160" height="2.5" rx="1" fill="#8b949e" opacity="0.4" />
                    <rect x="15" y="94" width="50" height="3" rx="1" fill="#00ff88" opacity="0.8" />
                    <line x1="15" y1="100" x2="195" y2="100" stroke="#00ff88" strokeWidth="0.4" opacity="0.4" />
                    <rect x="15" y="105" width="40" height="8" rx="2" fill="#00ff88" opacity="0.15" />
                    <rect x="60" y="105" width="45" height="8" rx="2" fill="#00ff88" opacity="0.15" />
                    <rect x="110" y="105" width="38" height="8" rx="2" fill="#00ff88" opacity="0.15" />
                    <rect x="15" y="125" width="38" height="3" rx="1" fill="#00ff88" opacity="0.8" />
                    <line x1="15" y1="131" x2="195" y2="131" stroke="#00ff88" strokeWidth="0.4" opacity="0.4" />
                    <rect x="15" y="136" width="160" height="2.5" rx="1" fill="#8b949e" opacity="0.5" />
                    <rect x="15" y="142" width="145" height="2.5" rx="1" fill="#8b949e" opacity="0.4" />
                </svg>
            )
        case "bold":
            return (
                <svg viewBox="0 0 210 297" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%", background: "#fff" }}>
                    <rect x="0" y="0" width="210" height="60" fill="#111" />
                    <rect x="15" y="14" width="130" height="10" rx="1" fill="#f59e0b" opacity="0.95" />
                    <rect x="15" y="28" width="80" height="4" rx="1" fill="#fff" opacity="0.7" />
                    <rect x="15" y="36" width="100" height="3" rx="1" fill="#fff" opacity="0.4" />
                    <rect x="0" y="60" width="210" height="4" fill="#f59e0b" />
                    <rect x="15" y="74" width="60" height="5" rx="1" fill="#111" opacity="0.85" />
                    <rect x="15" y="83" width="170" height="2.5" rx="1" fill="#555" opacity="0.5" />
                    <rect x="15" y="89" width="155" height="2.5" rx="1" fill="#555" opacity="0.4" />
                    <rect x="15" y="95" width="160" height="2.5" rx="1" fill="#555" opacity="0.4" />
                    <rect x="0" y="108" width="210" height="2" fill="#f59e0b" opacity="0.3" />
                    <rect x="15" y="115" width="55" height="5" rx="1" fill="#111" opacity="0.85" />
                    <rect x="15" y="124" width="165" height="2.5" rx="1" fill="#555" opacity="0.5" />
                    <rect x="15" y="130" width="150" height="2.5" rx="1" fill="#555" opacity="0.4" />
                    <rect x="0" y="142" width="210" height="2" fill="#f59e0b" opacity="0.3" />
                    <rect x="15" y="148" width="45" height="5" rx="1" fill="#111" opacity="0.85" />
                    <rect x="15" y="157" width="48" height="7" rx="3" fill="#f59e0b" opacity="0.3" />
                    <rect x="68" y="157" width="52" height="7" rx="3" fill="#f59e0b" opacity="0.3" />
                </svg>
            )
        case "elegant":
            return (
                <svg viewBox="0 0 210 297" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%", background: "#fefefe" }}>
                    <line x1="20" y1="15" x2="190" y2="15" stroke="#c9a84c" strokeWidth="0.8" />
                    <rect x="40" y="20" width="130" height="8" rx="1" fill="#222" opacity="0.85" />
                    <rect x="65" y="32" width="80" height="3" rx="1" fill="#888" opacity="0.6" />
                    <line x1="20" y1="42" x2="190" y2="42" stroke="#c9a84c" strokeWidth="0.8" />
                    <rect x="20" y="52" width="55" height="3.5" rx="1" fill="#333" opacity="0.75" />
                    <line x1="20" y1="58" x2="75" y2="58" stroke="#c9a84c" strokeWidth="0.5" />
                    <rect x="20" y="64" width="160" height="2.5" rx="1" fill="#777" opacity="0.5" />
                    <rect x="20" y="70" width="145" height="2.5" rx="1" fill="#777" opacity="0.4" />
                    <rect x="20" y="88" width="50" height="3.5" rx="1" fill="#333" opacity="0.75" />
                    <line x1="20" y1="94" x2="70" y2="94" stroke="#c9a84c" strokeWidth="0.5" />
                    <rect x="20" y="100" width="155" height="2.5" rx="1" fill="#777" opacity="0.5" />
                    <rect x="20" y="106" width="140" height="2.5" rx="1" fill="#777" opacity="0.4" />
                    <rect x="20" y="112" width="150" height="2.5" rx="1" fill="#777" opacity="0.4" />
                    <rect x="20" y="128" width="40" height="3.5" rx="1" fill="#333" opacity="0.75" />
                    <line x1="20" y1="134" x2="60" y2="134" stroke="#c9a84c" strokeWidth="0.5" />
                    <rect x="20" y="140" width="45" height="7" rx="3" fill="#c9a84c" opacity="0.2" />
                    <rect x="70" y="140" width="50" height="7" rx="3" fill="#c9a84c" opacity="0.2" />
                </svg>
            )
        case "sidebar":
            return (
                <svg viewBox="0 0 210 297" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%", background: "#fff" }}>
                    <rect x="0" y="0" width="4" height="297" fill="#6366f1" />
                    <rect x="4" y="0" width="65" height="297" fill="#f5f5f5" />
                    <rect x="10" y="20" width="45" height="45" rx="22.5" fill="#ddd" />
                    <rect x="10" y="72" width="42" height="3.5" rx="1" fill="#333" opacity="0.8" />
                    <rect x="10" y="80" width="35" height="2.5" rx="1" fill="#777" opacity="0.6" />
                    <rect x="10" y="98" width="28" height="3" rx="1" fill="#6366f1" opacity="0.8" />
                    <rect x="10" y="105" width="44" height="7" rx="3" fill="#6366f1" opacity="0.2" />
                    <rect x="10" y="116" width="38" height="7" rx="3" fill="#6366f1" opacity="0.2" />
                    <rect x="10" y="127" width="44" height="7" rx="3" fill="#6366f1" opacity="0.2" />
                    <rect x="80" y="20" width="110" height="7" rx="1" fill="#333" opacity="0.85" />
                    <rect x="80" y="31" width="75" height="3" rx="1" fill="#777" opacity="0.6" />
                    <rect x="80" y="50" width="50" height="3.5" rx="1" fill="#6366f1" opacity="0.8" />
                    <rect x="80" y="58" width="120" height="2.5" rx="1" fill="#666" opacity="0.5" />
                    <rect x="80" y="64" width="105" height="2.5" rx="1" fill="#666" opacity="0.4" />
                    <rect x="80" y="80" width="50" height="3.5" rx="1" fill="#6366f1" opacity="0.8" />
                    <rect x="80" y="88" width="115" height="2.5" rx="1" fill="#666" opacity="0.5" />
                    <rect x="80" y="94" width="100" height="2.5" rx="1" fill="#666" opacity="0.4" />
                    <rect x="80" y="100" width="110" height="2.5" rx="1" fill="#666" opacity="0.4" />
                </svg>
            )
        case "compact":
            return (
                <svg viewBox="0 0 210 297" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%", background: "#fff" }}>
                    <rect x="15" y="12" width="100" height="6" rx="1" fill="#222" opacity="0.85" />
                    <rect x="15" y="21" width="160" height="2" rx="1" fill="#888" opacity="0.5" />
                    <line x1="15" y1="27" x2="195" y2="27" stroke="#999" strokeWidth="0.5" />
                    <rect x="15" y="32" width="40" height="2.5" rx="1" fill="#333" opacity="0.75" />
                    <rect x="15" y="37" width="170" height="2" rx="1" fill="#999" opacity="0.45" />
                    <rect x="15" y="41" width="160" height="2" rx="1" fill="#999" opacity="0.4" />
                    <rect x="15" y="45" width="165" height="2" rx="1" fill="#999" opacity="0.4" />
                    <line x1="15" y1="51" x2="195" y2="51" stroke="#ddd" strokeWidth="0.5" />
                    <rect x="15" y="56" width="40" height="2.5" rx="1" fill="#333" opacity="0.75" />
                    <rect x="15" y="61" width="165" height="2" rx="1" fill="#999" opacity="0.45" />
                    <rect x="15" y="65" width="150" height="2" rx="1" fill="#999" opacity="0.4" />
                    <rect x="15" y="69" width="158" height="2" rx="1" fill="#999" opacity="0.4" />
                    <rect x="15" y="73" width="155" height="2" rx="1" fill="#999" opacity="0.4" />
                    <line x1="15" y1="79" x2="195" y2="79" stroke="#ddd" strokeWidth="0.5" />
                    <rect x="15" y="84" width="38" height="2.5" rx="1" fill="#333" opacity="0.75" />
                    <rect x="15" y="89" width="45" height="5" rx="2" fill="#eee" />
                    <rect x="64" y="89" width="48" height="5" rx="2" fill="#eee" />
                    <rect x="116" y="89" width="40" height="5" rx="2" fill="#eee" />
                    <rect x="15" y="98" width="42" height="2.5" rx="1" fill="#333" opacity="0.75" />
                    <rect x="15" y="103" width="160" height="2" rx="1" fill="#999" opacity="0.45" />
                    <rect x="15" y="107" width="145" height="2" rx="1" fill="#999" opacity="0.4" />
                </svg>
            )
        case "academic":
            return (
                <svg viewBox="0 0 210 297" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%", background: "#fff" }}>
                    <rect x="0" y="0" width="210" height="45" fill="#003087" />
                    <rect x="15" y="10" width="115" height="8" rx="1" fill="#fff" opacity="0.95" />
                    <rect x="15" y="22" width="80" height="3.5" rx="1" fill="#7fa8d4" opacity="0.9" />
                    <rect x="15" y="29" width="100" height="2.5" rx="1" fill="#aac4e0" opacity="0.7" />
                    <rect x="15" y="55" width="50" height="3.5" rx="1" fill="#003087" opacity="0.85" />
                    <line x1="15" y1="62" x2="195" y2="62" stroke="#003087" strokeWidth="0.7" />
                    <rect x="15" y="67" width="160" height="2.5" rx="1" fill="#555" opacity="0.5" />
                    <rect x="15" y="73" width="145" height="2.5" rx="1" fill="#555" opacity="0.4" />
                    <rect x="15" y="85" width="55" height="3.5" rx="1" fill="#003087" opacity="0.85" />
                    <line x1="15" y1="92" x2="195" y2="92" stroke="#003087" strokeWidth="0.7" />
                    <rect x="15" y="97" width="155" height="2.5" rx="1" fill="#555" opacity="0.5" />
                    <rect x="15" y="103" width="140" height="2.5" rx="1" fill="#555" opacity="0.4" />
                    <rect x="15" y="109" width="150" height="2.5" rx="1" fill="#555" opacity="0.4" />
                    <rect x="15" y="121" width="60" height="3.5" rx="1" fill="#003087" opacity="0.85" />
                    <line x1="15" y1="128" x2="195" y2="128" stroke="#003087" strokeWidth="0.7" />
                    <rect x="15" y="133" width="145" height="2.5" rx="1" fill="#555" opacity="0.5" />
                    <rect x="15" y="139" width="130" height="2.5" rx="1" fill="#555" opacity="0.4" />
                </svg>
            )
        case "clean":
            return (
                <svg viewBox="0 0 210 297" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%", background: "#f8fafc" }}>
                    <defs><filter id="s"><feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.08" /></filter></defs>
                    <rect x="10" y="10" width="190" height="50" rx="4" fill="#fff" filter="url(#s)" />
                    <rect x="20" y="20" width="100" height="7" rx="1" fill="#1e293b" opacity="0.9" />
                    <rect x="20" y="31" width="70" height="3" rx="1" fill="#2563eb" opacity="0.7" />
                    <rect x="20" y="38" width="90" height="2.5" rx="1" fill="#94a3b8" opacity="0.6" />
                    <rect x="10" y="68" width="190" height="40" rx="4" fill="#fff" />
                    <rect x="20" y="75" width="50" height="3.5" rx="1" fill="#2563eb" opacity="0.8" />
                    <rect x="20" y="83" width="160" height="2.5" rx="1" fill="#64748b" opacity="0.5" />
                    <rect x="20" y="89" width="145" height="2.5" rx="1" fill="#64748b" opacity="0.4" />
                    <rect x="10" y="115" width="190" height="40" rx="4" fill="#fff" />
                    <rect x="20" y="122" width="55" height="3.5" rx="1" fill="#2563eb" opacity="0.8" />
                    <rect x="20" y="130" width="155" height="2.5" rx="1" fill="#64748b" opacity="0.5" />
                    <rect x="20" y="136" width="140" height="2.5" rx="1" fill="#64748b" opacity="0.4" />
                    <rect x="10" y="162" width="190" height="35" rx="4" fill="#fff" />
                    <rect x="20" y="169" width="42" height="3.5" rx="1" fill="#2563eb" opacity="0.8" />
                    <rect x="20" y="177" width="40" height="7" rx="3" fill="#2563eb" opacity="0.15" />
                    <rect x="65" y="177" width="45" height="7" rx="3" fill="#2563eb" opacity="0.15" />
                    <rect x="115" y="177" width="38" height="7" rx="3" fill="#2563eb" opacity="0.15" />
                </svg>
            )
        case "timeline":
            return (
                <svg viewBox="0 0 210 297" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%", background: "#fff" }}>
                    <rect x="20" y="15" width="110" height="7" rx="1" fill="#1e293b" opacity="0.9" />
                    <rect x="20" y="26" width="75" height="3" rx="1" fill="#6366f1" opacity="0.7" />
                    <rect x="20" y="33" width="90" height="2.5" rx="1" fill="#94a3b8" opacity="0.6" />
                    <line x1="35" y1="50" x2="35" y2="260" stroke="#6366f1" strokeWidth="1.5" opacity="0.4" />
                    <circle cx="35" cy="60" r="4" fill="#6366f1" opacity="0.8" />
                    <rect x="48" y="57" width="60" height="3" rx="1" fill="#333" opacity="0.8" />
                    <rect x="48" y="63" width="130" height="2.5" rx="1" fill="#777" opacity="0.5" />
                    <rect x="48" y="69" width="120" height="2.5" rx="1" fill="#777" opacity="0.4" />
                    <circle cx="35" cy="90" r="4" fill="#6366f1" opacity="0.8" />
                    <rect x="48" y="87" width="55" height="3" rx="1" fill="#333" opacity="0.8" />
                    <rect x="48" y="93" width="125" height="2.5" rx="1" fill="#777" opacity="0.5" />
                    <rect x="48" y="99" width="115" height="2.5" rx="1" fill="#777" opacity="0.4" />
                    <circle cx="35" cy="120" r="4" fill="#6366f1" opacity="0.6" />
                    <rect x="48" y="117" width="50" height="3" rx="1" fill="#333" opacity="0.8" />
                    <rect x="48" y="123" width="120" height="2.5" rx="1" fill="#777" opacity="0.5" />
                    <circle cx="35" cy="148" r="4" fill="#6366f1" opacity="0.5" />
                    <rect x="48" y="145" width="38" height="3" rx="1" fill="#333" opacity="0.75" />
                    <rect x="48" y="151" width="40" height="6" rx="3" fill="#6366f1" opacity="0.2" />
                    <rect x="93" y="151" width="44" height="6" rx="3" fill="#6366f1" opacity="0.2" />
                </svg>
            )
        case "infographic":
            return (
                <svg viewBox="0 0 210 297" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%", background: "#fff" }}>
                    <rect x="0" y="0" width="210" height="55" fill="#1e293b" />
                    <circle cx="35" cy="27" r="18" fill="#334155" />
                    <rect x="60" y="13" width="105" height="7" rx="1" fill="#fff" opacity="0.95" />
                    <rect x="60" y="24" width="70" height="3" rx="1" fill="#94a3b8" opacity="0.8" />
                    <rect x="60" y="31" width="90" height="2.5" rx="1" fill="#64748b" opacity="0.6" />
                    <rect x="15" y="65" width="40" height="3" rx="1" fill="#f59e0b" opacity="0.9" />
                    <rect x="15" y="73" width="165" height="5" rx="2" fill="#f1f5f9" />
                    <rect x="15" y="73" width="140" height="5" rx="2" fill="#f59e0b" opacity="0.6" />
                    <rect x="15" y="82" width="165" height="5" rx="2" fill="#f1f5f9" />
                    <rect x="15" y="82" width="120" height="5" rx="2" fill="#6366f1" opacity="0.6" />
                    <rect x="15" y="91" width="165" height="5" rx="2" fill="#f1f5f9" />
                    <rect x="15" y="91" width="155" height="5" rx="2" fill="#10b981" opacity="0.6" />
                    <rect x="15" y="100" width="165" height="5" rx="2" fill="#f1f5f9" />
                    <rect x="15" y="100" width="100" height="5" rx="2" fill="#ef4444" opacity="0.6" />
                    <line x1="15" y1="115" x2="195" y2="115" stroke="#e2e8f0" strokeWidth="0.8" />
                    <rect x="15" y="120" width="50" height="3" rx="1" fill="#1e293b" opacity="0.8" />
                    <rect x="15" y="128" width="165" height="2.5" rx="1" fill="#94a3b8" opacity="0.5" />
                    <rect x="15" y="134" width="150" height="2.5" rx="1" fill="#94a3b8" opacity="0.4" />
                </svg>
            )
        case "basic":
            return (
                <div className="p-4 space-y-4 font-sans text-xs text-left h-full">
                    <div className="text-center border-b pb-2">
                        <div className="font-bold text-lg">Your Name</div>
                        <div className="text-gray-500 text-[10px]">Contact Info</div>
                    </div>
                    <div>
                        <div className="font-bold border-b mb-1 uppercase text-[10px]">Experience</div>
                        <div className="space-y-1">
                            <div className="h-2 w-3/4 bg-gray-200 rounded"></div>
                            <div className="h-2 w-1/2 bg-gray-200 rounded"></div>
                        </div>
                    </div>
                </div>
            )
        case "template_modern_pro":
            return (
                <div className="font-sans text-xs h-full text-left">
                    <div className="bg-slate-900 text-white p-4 text-center">
                        <div className="font-bold text-xl tracking-wider">NAME</div>
                        <div className="text-blue-200 text-[10px] mt-1">PROFESSIONAL TITLE</div>
                    </div>
                    <div className="p-4 space-y-4">
                        <div>
                            <div className="font-bold text-blue-800 border-b border-blue-200 mb-2 uppercase text-[11px]">Experience</div>
                            <div className="h-8 bg-gray-100 border-l-2 border-blue-800 p-2"></div>
                        </div>
                    </div>
                </div>
            )
        case "template_sidebar":
            return (
                <div className="flex w-full h-full text-left font-sans">
                    <div className="w-1/3 bg-slate-100 p-3 space-y-4 border-r">
                        <div className="h-16 w-16 bg-slate-300 rounded-full mx-auto mb-2"></div>
                        <div className="space-y-2">
                            <div className="h-1.5 w-full bg-slate-300 rounded"></div>
                            <div className="h-1.5 w-3/4 bg-slate-300 rounded"></div>
                        </div>
                    </div>
                    <div className="flex-1 p-4 space-y-4">
                        <div className="border-b-2 border-slate-800 pb-2">
                            <div className="font-bold text-2xl">NAME</div>
                            <div className="text-slate-500">Title</div>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded"></div>
                        <div className="h-2 w-full bg-slate-100 rounded"></div>
                    </div>
                </div>
            )
        case "template_minimal_elegant":
            return (
                <div className="p-6 h-full text-center font-serif text-xs">
                    <div className="mb-6">
                        <div className="text-2xl italic mb-1">Your Name</div>
                        <div className="text-[9px] tracking-[0.2em] text-gray-500 uppercase">Role Title</div>
                    </div>
                    <div className="max-w-[80%] mx-auto space-y-4 text-left">
                        <div className="flex gap-4">
                            <div className="font-bold w-16 text-right text-[10px] italic text-gray-400">2024</div>
                            <div className="flex-1">
                                <div className="font-bold">Company</div>
                                <div className="text-[10px] text-gray-500">Role Description</div>
                            </div>
                        </div>
                    </div>
                </div>
            )
        case "template_creative_blocks":
            return (
                <div className="p-4 h-full font-sans text-xs text-left">
                    <div className="mb-4">
                        <div className="bg-black text-white inline-block px-3 py-1 text-xl font-bold -rotate-1">NAME</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-yellow-50 p-2 border border-yellow-200 rounded-lg">
                            <div className="font-bold text-yellow-800 mb-1">SKILLS</div>
                        </div>
                        <div className="bg-purple-50 p-2 border border-purple-200 rounded-lg">
                            <div className="font-bold text-purple-800 mb-1">EXP</div>
                        </div>
                    </div>
                </div>
            )
        default:
            return <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">Preview</div>
    }
})
