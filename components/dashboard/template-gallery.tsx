"use client"

import React, { memo } from "react"
import { cn } from "@/lib/utils"
import { Check, Upload } from "lucide-react"
import { TEMPLATE_REGISTRY, TEMPLATE_MAP } from "./resume-templates/registry"
import { sampleResumeData } from "./resume-templates/sample-data"
import { ResumeData } from "@/types/resume"
import { TemplateDefinition } from "@/types/template-definition"
import { ImportedTemplateRenderer } from "./imported-template-renderer"

// ─── Scale constants ──────────────────────────────────────────────────────────
// Templates render at 794px (210mm @ 96 dpi). We scale them down to fit cards.
const TEMPLATE_NATURAL_WIDTH = 794
const PREVIEW_SCALE = 0.195          // 794 × 0.195 ≈ 155px visual width
const PREVIEW_CONTAINER_HEIGHT = 190 // px — shows the top ~975px of the template

// ─── Mini preview ─────────────────────────────────────────────────────────────
const MiniPreview = memo(function MiniPreview({ templateId }: { templateId: string }) {
  const Component = TEMPLATE_MAP[templateId]

  if (!Component) {
    return (
      <div
        style={{ height: PREVIEW_CONTAINER_HEIGHT }}
        className="bg-muted/30 flex items-center justify-center text-[10px] text-muted-foreground"
      >
        Preview unavailable
      </div>
    )
  }

  return (
    <div
      className="relative overflow-hidden bg-white"
      style={{ height: PREVIEW_CONTAINER_HEIGHT }}
    >
      {/* The actual template component rendered at full size, then scaled down visually */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: TEMPLATE_NATURAL_WIDTH,
          transformOrigin: "top left",
          transform: `scale(${PREVIEW_SCALE})`,
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        <Component data={sampleResumeData as ResumeData} />
      </div>
    </div>
  )
})

// ─── Imported template mini thumbnail ────────────────────────────────────────
function ImportedTemplateMiniThumb({ definition }: { definition: TemplateDefinition }) {
  return (
    <div
      className="relative overflow-hidden bg-white"
      style={{ height: PREVIEW_CONTAINER_HEIGHT }}
    >
      <div
        style={{
          position:        "absolute",
          top:             0,
          left:            0,
          width:           TEMPLATE_NATURAL_WIDTH,
          transformOrigin: "top left",
          transform:       `scale(${PREVIEW_SCALE})`,
          pointerEvents:   "none",
          userSelect:      "none",
        }}
      >
        <ImportedTemplateRenderer data={sampleResumeData as ResumeData} definition={definition} />
      </div>
    </div>
  )
}

// ─── Resume template gallery (grid of real mini-previews) ────────────────────
const ResumeTemplateGrid = memo(function ResumeTemplateGrid({
  selected,
  onSelect,
  importedTemplateDefinition,
  onUpload,
}: {
  selected: string
  onSelect: (id: string) => void
  importedTemplateDefinition?: TemplateDefinition
  onUpload?: () => void
}) {
  return (
    <div className="space-y-3 overflow-y-auto max-h-[520px] pr-1 pb-1">
      {/* My Templates — shown only if user has a saved imported template */}
      {importedTemplateDefinition && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2 px-0.5">
            My Templates
          </p>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => onSelect("imported-template")}
              className={cn(
                "rounded-lg border-2 overflow-hidden text-left transition-all duration-150 bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                selected === "imported-template"
                  ? "border-primary shadow-md ring-1 ring-primary/20"
                  : "border-border hover:border-primary/50 hover:shadow-sm"
              )}
            >
              <ImportedTemplateMiniThumb definition={importedTemplateDefinition} />
              <div className="px-2 py-1.5 border-t border-border bg-background">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[11px] font-semibold text-foreground truncate">
                    {importedTemplateDefinition.name || "My Template"}
                  </span>
                  {selected === "imported-template" && <Check className="h-3 w-3 text-primary shrink-0" />}
                </div>
                <p className="text-[9px] text-muted-foreground truncate mt-0.5 leading-tight">
                  Editable imported layout
                </p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Built-in templates */}
      <div>
        {importedTemplateDefinition && (
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2 px-0.5">
            Built-in Templates
          </p>
        )}
        <div className="grid grid-cols-3 gap-3">
          {TEMPLATE_REGISTRY.map((template) => {
            const isSelected = selected === template.id
            return (
              <button
                key={template.id}
                onClick={() => onSelect(template.id)}
                className={cn(
                  "rounded-lg border-2 overflow-hidden text-left transition-all duration-150 bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  isSelected
                    ? "border-primary shadow-md ring-1 ring-primary/20"
                    : "border-border hover:border-primary/50 hover:shadow-sm"
                )}
              >
                <MiniPreview templateId={template.id} />
                <div className="px-2 py-1.5 border-t border-border bg-background">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[11px] font-semibold text-foreground truncate">
                      {template.name}
                    </span>
                    {isSelected && <Check className="h-3 w-3 text-primary shrink-0" />}
                  </div>
                  <p className="text-[9px] text-muted-foreground truncate mt-0.5 leading-tight">
                    {template.description}
                  </p>
                </div>
              </button>
            )
          })}

          {/* Upload Your Template card */}
          {onUpload && (
            <button
              onClick={onUpload}
              className="rounded-lg border-2 border-dashed border-border overflow-hidden text-left transition-all duration-150 bg-background hover:border-primary/50 hover:bg-muted/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <div
                className="flex items-center justify-center bg-muted/20"
                style={{ height: PREVIEW_CONTAINER_HEIGHT }}
              >
                <div className="text-center">
                  <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-1.5" />
                  <p className="text-[10px] text-muted-foreground font-medium">Upload Template</p>
                </div>
              </div>
              <div className="px-2 py-1.5 border-t border-border bg-background">
                <span className="text-[11px] font-semibold text-foreground">Upload a Design</span>
                <p className="text-[9px] text-muted-foreground truncate mt-0.5 leading-tight">
                  Turn it into an editable layout
                </p>
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  )
})

// ─── Cover letter template list (text-only, faster) ──────────────────────────
const COVER_TEMPLATES = [
  { id: "classic",    name: "Classic",    description: "Centred serif header" },
  { id: "modern",     name: "Modern",     description: "Navy accent side bar" },
  { id: "minimal",    name: "Minimal",    description: "Light and ultra-clean" },
  { id: "executive",  name: "Executive",  description: "Dark header, gold line" },
  { id: "creative",   name: "Creative",   description: "Teal header" },
  { id: "compact",    name: "Compact",    description: "Dense one-page" },
  { id: "two-column", name: "Two Column", description: "Dark sidebar" },
  { id: "sidebar",    name: "Sidebar",    description: "Indigo accent" },
  { id: "elegant",    name: "Elegant",    description: "Gold dividers" },
  { id: "bold",       name: "Bold",       description: "Black + amber" },
  { id: "academic",   name: "Academic",   description: "Navy formal" },
  { id: "tech",       name: "Tech",       description: "Dark + green" },
  { id: "clean",      name: "Clean",      description: "Card-based layout" },
  { id: "timeline",   name: "Timeline",   description: "Purple timeline" },
]

const CoverTemplateGrid = memo(function CoverTemplateGrid({
  selected,
  onSelect,
}: {
  selected: string
  onSelect: (id: string) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-2 max-h-[420px] overflow-y-auto pr-1">
      {COVER_TEMPLATES.map((t) => (
        <button
          key={t.id}
          onClick={() => onSelect(t.id)}
          className={cn(
            "text-left px-3 py-2.5 rounded-lg border-2 transition-all text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            selected === t.id
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/40 hover:bg-muted/30"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="font-semibold text-foreground">{t.name}</span>
            {selected === t.id && <Check className="h-3 w-3 text-primary shrink-0" />}
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">{t.description}</p>
        </button>
      ))}
    </div>
  )
})

// ─── Public component ─────────────────────────────────────────────────────────
interface TemplateGalleryProps {
  selected: string
  onSelect: (id: string, customHtml?: string) => void
  activeTemplate?: string
  type?: "resume" | "cover"
  customTemplateHtml?: string
  importedTemplateDefinition?: TemplateDefinition
  onUpload?: () => void
}

export const TemplateGallery = memo(function TemplateGallery({
  selected,
  onSelect,
  type = "resume",
  importedTemplateDefinition,
  onUpload,
}: TemplateGalleryProps) {
  if (type === "cover") {
    return <CoverTemplateGrid selected={selected} onSelect={onSelect} />
  }
  return (
    <ResumeTemplateGrid
      selected={selected}
      onSelect={onSelect}
      importedTemplateDefinition={importedTemplateDefinition}
      onUpload={onUpload}
    />
  )
})
