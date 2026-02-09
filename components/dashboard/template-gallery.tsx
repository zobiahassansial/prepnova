import React, { memo } from "react"
import { cn } from "@/lib/utils"
// import { TemplateId } from "@/types/resume"
// Using loose string type to avoid strict enum issues if not fully propagated yet, 
// but ideally should import. Let's assume passed in props match.

interface TemplateOption {
    id: string
    name: string
    description: string
    thumbnailClass: string // CSS class to mimic the style
}

const templates: TemplateOption[] = [
    {
        id: "basic",
        name: "Basic",
        description: "Simple & clean",
        thumbnailClass: "bg-white p-2 flex flex-col gap-1 border shadow-sm"
    },
    {
        id: "template_modern_pro",
        name: "Modern Pro",
        description: "Bold & professional",
        thumbnailClass: "bg-white p-0 flex flex-col shadow-sm"
    },
    {
        id: "template_sidebar",
        name: "Sidebar",
        description: "Structured layout",
        thumbnailClass: "bg-white flex flex-row shadow-sm h-full"
    },
    {
        id: "template_minimal_elegant",
        name: "Minimal Elegant",
        description: "Refined serif style",
        thumbnailClass: "bg-[#fcfbf9] p-2 flex flex-col items-center shadow-sm"
    },
    {
        id: "template_creative_blocks",
        name: "Creative Blocks",
        description: "Unique section headers",
        thumbnailClass: "bg-white p-2 flex flex-col gap-2 shadow-sm"
    }
]

const coverTemplates: TemplateOption[] = [
    {
        id: "basic",
        name: "Basic",
        description: "Simple & clean",
        thumbnailClass: "bg-white p-2 flex flex-col gap-1 border shadow-sm"
    },
    {
        id: "template_modern_pro",
        name: "Modern Pro",
        description: "Bold & professional",
        thumbnailClass: "bg-white p-0 flex flex-col shadow-sm"
    },
    {
        id: "template_sidebar",
        name: "Sidebar",
        description: "Structured layout",
        thumbnailClass: "bg-white flex flex-row shadow-sm h-full"
    },
    {
        id: "template_minimal_elegant",
        name: "Minimal Elegant",
        description: "Refined serif style",
        thumbnailClass: "bg-[#fcfbf9] p-2 flex flex-col items-center shadow-sm"
    },
    {
        id: "template_creative_blocks",
        name: "Creative Blocks",
        description: "Unique section headers",
        thumbnailClass: "bg-white p-2 flex flex-col gap-2 shadow-sm"
    }
]

interface TemplateGalleryProps {
    selected: string
    onSelect: (id: string) => void
    activeTemplate: string
    type?: "resume" | "cover" // Added prop
}

export const TemplateGallery = memo(function TemplateGallery({ selected, onSelect, type = "resume" }: TemplateGalleryProps) {
    const list = type === "cover" ? coverTemplates : templates

    return (
        <div className="grid grid-cols-2 gap-4">
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
                >
                    {/* Visual Thumbnail - Full Bleed */}
                    <div className="relative w-full aspect-[210/297] overflow-hidden bg-gray-50">
                        <div
                            className={cn(
                                "absolute inset-0 origin-top-left pointer-events-none select-none",
                                t.thumbnailClass
                            )}
                            style={{
                                transform: "scale(0.75)",
                                width: "133%",
                                height: "133%",
                            }}
                        >
                            <MiniPreview id={t.id} type={type} />
                        </div>
                    </div>


                    {/* Template Name Label */}
                    <div className="w-full p-2 text-center bg-white border-t border-slate-100">
                        <span className="font-semibold text-xs text-slate-700 block truncate">{t.name}</span>
                    </div>

                    {selected === t.id && (
                        <div className="absolute top-2 right-2 flex gap-1">
                            <span className="bg-blue-600 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full shadow-sm">
                                Selected
                            </span>
                        </div>
                    )}
                </button>
            ))}
        </div>
    )
})


const MiniPreview = memo(function MiniPreview({ id, type = "resume" }: { id: string; type?: "resume" | "cover" }) {
    // If cover type, return simplified text body versions matching the aesthetic
    if (type === "cover") {
        switch (id) {
            case "basic":
                return (
                    <div className="p-4 space-y-2 font-sans text-xs text-left">
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
                return <div className="bg-gray-100 w-full h-full flex items-center justify-center text-gray-400">?</div>
        }
    }

    // RESUME PREVIEWS (Existing)
    switch (id) {
        case "basic":
            return (
                <div className="p-4 space-y-4 font-sans text-xs text-left">
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
            return <div className="bg-gray-100 w-full h-full flex items-center justify-center text-gray-400">?</div>
    }
})
