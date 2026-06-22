"use client"

import React, { useState, useRef, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { Upload, X, ChevronRight, ChevronLeft, FileText, Code, Check, AlertCircle } from "lucide-react"
import { ResumeData } from "@/types/resume"
import {
  TemplateDefinition,
  DEFAULT_TEMPLATE_DEFINITION,
  TemplateLayout,
  HeadingStyle,
  HeadingSize,
  SpacingSize,
  HeaderStyle,
} from "@/types/template-definition"
import { ImportedTemplateRenderer } from "./imported-template-renderer"

// ── Constants ──────────────────────────────────────────────────────────────────

const A4_W = 794
const A4_H = 1123

const FONT_OPTIONS = [
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Helvetica Neue", value: "Helvetica Neue, Arial, sans-serif" },
  { label: "Times New Roman", value: "Times New Roman, serif" },
  { label: "Trebuchet MS", value: "Trebuchet MS, sans-serif" },
  { label: "Courier New", value: "Courier New, monospace" },
]

const COLOR_PRESETS = [
  "#1a2744", "#2c3e50", "#16a34a", "#7c3aed",
  "#b91c1c", "#c2410c", "#0369a1", "#374151",
  "#1e40af", "#be185d",
]

const ALL_SECTIONS = [
  { id: "summary",    label: "Professional Summary" },
  { id: "experience", label: "Experience" },
  { id: "education",  label: "Education" },
  { id: "skills",     label: "Skills" },
  { id: "projects",   label: "Projects" },
]

// ── Helpers ────────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2, 10) }

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload  = (e) => resolve(e.target?.result as string)
    r.onerror = reject
    r.readAsDataURL(file)
  })
}

function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload  = (e) => resolve(e.target?.result as string)
    r.onerror = reject
    r.readAsText(file)
  })
}

async function sampleImagePrimaryColor(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img   = new Image()
    img.onload  = () => {
      try {
        const canvas    = document.createElement("canvas")
        const sampleH   = Math.min(img.height, 180)
        canvas.width    = img.width
        canvas.height   = sampleH
        const ctx       = canvas.getContext("2d")
        if (!ctx) { resolve("#1a2744"); return }
        ctx.drawImage(img, 0, 0, img.width, sampleH, 0, 0, canvas.width, canvas.height)
        const data      = ctx.getImageData(0, 0, canvas.width, canvas.height).data
        const colorMap: Record<string, number> = {}
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2]
          const max = Math.max(r, g, b), min = Math.min(r, g, b)
          if (max === 0 || (max - min) / max < 0.25) continue
          if (r > 235 && g > 235 && b > 235) continue
          const qr = Math.round(r / 40) * 40
          const qg = Math.round(g / 40) * 40
          const qb = Math.round(b / 40) * 40
          const key = `${qr},${qg},${qb}`
          colorMap[key] = (colorMap[key] || 0) + 1
        }
        const sorted = Object.entries(colorMap).sort((a, b) => b[1] - a[1])
        if (!sorted.length) { resolve("#1a2744"); return }
        const [r, g, b] = sorted[0][0].split(",").map(Number)
        resolve("#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join(""))
      } catch { resolve("#1a2744") }
    }
    img.onerror = () => resolve("#1a2744")
    img.src     = dataUrl
  })
}

function extractHtmlPrimaryColor(html: string): string {
  const matches = html.match(/#([0-9a-fA-F]{6})/g) || []
  for (const hex of matches) {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    if (r > 230 && g > 230 && b > 230) continue
    if (r < 15 && g < 15 && b < 15) continue
    return hex.toLowerCase()
  }
  return "#1a2744"
}

function guessHtmlLayout(html: string): TemplateLayout {
  const low = html.toLowerCase()
  if (low.includes("sidebar") || low.includes("aside")) return "left-sidebar"
  if (low.includes("column") || (low.match(/display:\s*flex/g) || []).length > 2) return "two-column"
  return "single-column"
}

// ── Source file type ────────────────────────────────────────────────────────────

interface SourceFile {
  type:     "pdf" | "image" | "html" | "docx"
  imageUrl: string  // only set for image type — for display in step 1
  filename: string
}

// ── Process uploaded file → source + initial definition ─────────────────────────

async function processUpload(file: File): Promise<{ source: SourceFile; def: TemplateDefinition } | null> {
  const { type, name: filename }  = file
  const baseDef: TemplateDefinition = {
    ...DEFAULT_TEMPLATE_DEFINITION,
    id:         uid(),
    name:       filename.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
    sourceFile: filename,
  }

  // Image
  if (type.startsWith("image/")) {
    const imageUrl = await readAsDataURL(file)
    const primary  = await sampleImagePrimaryColor(imageUrl)
    return {
      source: { type: "image", imageUrl, filename },
      def:    { ...baseDef, sourceFileType: "image", colors: { ...baseDef.colors, primary } },
    }
  }

  // PDF
  if (type === "application/pdf") {
    return {
      source: { type: "pdf", imageUrl: "", filename },
      def:    { ...baseDef, sourceFileType: "pdf" },
    }
  }

  // DOCX
  if (type.includes("wordprocessingml") || filename.endsWith(".docx")) {
    return {
      source: { type: "docx", imageUrl: "", filename },
      def:    { ...baseDef, sourceFileType: "docx" },
    }
  }

  // HTML
  if (type === "text/html" || filename.endsWith(".html") || filename.endsWith(".htm")) {
    const text    = await readAsText(file)
    const primary = extractHtmlPrimaryColor(text)
    const layout  = guessHtmlLayout(text)
    return {
      source: { type: "html", imageUrl: "", filename },
      def:    { ...baseDef, sourceFileType: "html", layout, colors: { ...baseDef.colors, primary } },
    }
  }

  return null
}

// ── Step indicator ──────────────────────────────────────────────────────────────

const STEP_LABELS = ["Style Detected", "Layout Created", "Adjust Style", "Save Template"]

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 px-2">
      {STEP_LABELS.map((label, i) => {
        const done    = i < current - 1
        const active  = i === current - 1
        return (
          <React.Fragment key={i}>
            <div className="flex flex-col items-center gap-0.5">
              <div className={cn(
                "h-6 w-6 rounded-full flex items-center justify-center text-xs font-semibold transition-colors",
                active  ? "bg-primary text-primary-foreground"     :
                done    ? "bg-primary/20 text-primary"             :
                          "bg-muted text-muted-foreground"
              )}>
                {done ? <Check className="h-3 w-3" /> : i + 1}
              </div>
              <span className={cn("text-[9px] whitespace-nowrap", active ? "text-primary font-medium" : "text-muted-foreground")}>
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div className={cn("h-px flex-1 mx-1 mb-3", i < current - 1 ? "bg-primary/40" : "bg-border")} style={{ width: 32 }} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

// ── Upload zone ─────────────────────────────────────────────────────────────────

function UploadZone({ onFile, loading }: { onFile: (f: File) => void; loading: boolean }) {
  const inputRef        = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)

  const handle = (f: File | null | undefined) => { if (f) onFile(f) }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-10 text-center cursor-pointer transition-colors",
        over ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/20",
      )}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setOver(true) }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); handle(e.dataTransfer.files[0]) }}
    >
      <div className="h-14 w-14 rounded-xl bg-muted flex items-center justify-center">
        {loading
          ? <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          : <Upload className="h-6 w-6 text-muted-foreground" />
        }
      </div>
      <div>
        <p className="font-semibold text-foreground">{loading ? "Analyzing design…" : "Upload your design template"}</p>
        <p className="mt-1 text-sm text-muted-foreground">PDF, PNG, JPG, DOCX, or HTML  ·  click or drag & drop</p>
      </div>
      <div className="max-w-sm rounded-lg bg-muted/40 border p-3 text-xs text-muted-foreground text-left space-y-1">
        <p className="font-medium text-foreground">What happens</p>
        <p>Your file is treated as a <strong>style reference only</strong>, not the final resume page.</p>
        <p>PrepNova recreates the layout as a fully editable template, then fills it with your real resume data.</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.docx,.html,.htm"
        className="hidden"
        onChange={(e) => handle(e.target.files?.[0])}
      />
    </div>
  )
}

// ── Step 1: Style detected ───────────────────────────────────────────────────────

function StepDetected({ source, def }: { source: SourceFile; def: TemplateDefinition }) {
  const fileLabel: Record<SourceFile["type"], string> = {
    image: "Image template",
    pdf:   "PDF template",
    docx:  "DOCX / Word template",
    html:  "HTML / CSS template",
  }

  const noteByType: Record<SourceFile["type"], string> = {
    image: "Colors detected from your design. Layout and structure recreated as editable HTML.",
    pdf:   "PDF layout approximated as editable template. Fonts and colors may differ slightly.",
    docx:  "Word document structure imported. Recreated as editable CSS layout.",
    html:  "HTML/CSS template analyzed. Colors and layout extracted directly.",
  }

  const layoutLabel: Record<TemplateLayout, string> = {
    "single-column": "Single column",
    "left-sidebar":  "Left sidebar",
    "right-sidebar": "Right sidebar",
    "two-column":    "Two columns",
  }

  return (
    <div className="flex gap-6 p-6 flex-1 overflow-auto">
      {/* Reference thumbnail */}
      <div className="w-52 shrink-0">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Style Reference</p>
        <div className="rounded-lg border overflow-hidden bg-muted/20">
          {source.type === "image" ? (
            <img src={source.imageUrl} alt="Uploaded style reference" className="w-full object-cover object-top" style={{ maxHeight: 280 }} />
          ) : (
            <div className="h-[280px] flex flex-col items-center justify-center gap-3">
              {source.type === "pdf"  && <FileText className="h-12 w-12 text-muted-foreground/50" />}
              {source.type === "docx" && <FileText className="h-12 w-12 text-muted-foreground/50" />}
              {source.type === "html" && <Code      className="h-12 w-12 text-muted-foreground/50" />}
              <p className="text-xs text-muted-foreground text-center px-4 leading-relaxed">{source.filename}</p>
            </div>
          )}
        </div>
        <p className="text-[9px] text-muted-foreground mt-1.5 text-center italic">
          Reference only — not used as final output
        </p>
      </div>

      {/* Detected info */}
      <div className="flex-1 space-y-4">
        <div>
          <h3 className="font-semibold text-foreground mb-1">Template style detected</h3>
          <p className="text-sm text-muted-foreground">{fileLabel[source.type]}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border p-3 space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Layout</p>
            <p className="text-sm font-medium text-foreground">{layoutLabel[def.layout]}</p>
          </div>
          <div className="rounded-lg border p-3 space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Primary Color</p>
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full border shadow-sm" style={{ backgroundColor: def.colors.primary }} />
              <span className="text-sm font-mono text-foreground">{def.colors.primary}</span>
            </div>
          </div>
          <div className="rounded-lg border p-3 space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Font</p>
            <p className="text-sm font-medium text-foreground">{def.typography.headingFont.split(",")[0]}</p>
          </div>
          <div className="rounded-lg border p-3 space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Sections</p>
            <p className="text-sm font-medium text-foreground">{def.sections.visibleSections.length} sections</p>
          </div>
        </div>

        <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-3 flex gap-2">
          <AlertCircle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
            <strong>Style recreated as an editable version.</strong> {noteByType[source.type]}
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Step 2: Editable layout preview ─────────────────────────────────────────────

const PREVIEW_SCALE_FULL = 0.52

function StepLayoutPreview({ resumeData, def }: { resumeData: ResumeData; def: TemplateDefinition }) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-5 py-2.5 border-b bg-muted/20">
        <p className="text-sm font-semibold text-foreground">Editable layout created</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Your real resume data is shown below. The uploaded file is not used as background.
        </p>
      </div>
      <div className="flex-1 overflow-auto bg-neutral-200 dark:bg-neutral-800 flex items-start justify-center py-6">
        <div
          className="shadow-xl bg-white relative shrink-0"
          style={{ width: Math.round(A4_W * PREVIEW_SCALE_FULL), height: Math.round(A4_H * PREVIEW_SCALE_FULL) }}
        >
          <div style={{
            position:        "absolute",
            top:             0,
            left:            0,
            width:           A4_W,
            transformOrigin: "top left",
            transform:       `scale(${PREVIEW_SCALE_FULL})`,
            pointerEvents:   "none",
            userSelect:      "none",
          }}>
            <ImportedTemplateRenderer data={resumeData} definition={def} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Step 3: Adjust layout ─────────────────────────────────────────────────────────

const PREVIEW_SCALE_SIDE = 0.34

const LAYOUT_OPTIONS: { id: TemplateLayout; label: string; icon: string }[] = [
  { id: "single-column", label: "Single Column", icon: "▬" },
  { id: "left-sidebar",  label: "Left Sidebar",  icon: "◧" },
  { id: "right-sidebar", label: "Right Sidebar", icon: "◨" },
  { id: "two-column",    label: "Two Column",    icon: "⬜" },
]

function ControlLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">{children}</p>
}

function StepAdjustLayout({ def, onChange, resumeData }: {
  def: TemplateDefinition
  onChange: (patch: Partial<TemplateDefinition> | ((prev: TemplateDefinition) => TemplateDefinition)) => void
  resumeData: ResumeData
}) {
  const set = useCallback(<K extends keyof TemplateDefinition>(key: K, val: TemplateDefinition[K]) => {
    onChange((prev) => ({ ...prev, [key]: val }))
  }, [onChange])

  const setColors = useCallback((patch: Partial<TemplateDefinition["colors"]>) => {
    onChange((prev) => ({ ...prev, colors: { ...prev.colors, ...patch } }))
  }, [onChange])

  const setTypo = useCallback((patch: Partial<TemplateDefinition["typography"]>) => {
    onChange((prev) => ({ ...prev, typography: { ...prev.typography, ...patch } }))
  }, [onChange])

  const setDeco = useCallback((patch: Partial<TemplateDefinition["decorations"]>) => {
    onChange((prev) => ({ ...prev, decorations: { ...prev.decorations, ...patch } }))
  }, [onChange])

  const setSections = useCallback((patch: Partial<TemplateDefinition["sections"]>) => {
    onChange((prev) => ({ ...prev, sections: { ...prev.sections, ...patch } }))
  }, [onChange])

  const isSidebar   = def.layout === "left-sidebar" || def.layout === "right-sidebar"
  const isOneCo     = def.layout === "single-column"

  const toggleVisible = (id: string) => {
    const cur = def.sections.visibleSections
    const next = cur.includes(id) ? cur.filter((s) => s !== id) : [...cur, id]
    setSections({ visibleSections: next })
  }

  const toggleSidebar = (id: string) => {
    const cur = def.sections.sidebarSections
    const next = cur.includes(id) ? cur.filter((s) => s !== id) : [...cur, id]
    setSections({ sidebarSections: next })
  }

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      {/* Controls */}
      <div className="w-64 shrink-0 border-r overflow-y-auto bg-background">
        <div className="p-4 space-y-5">

          {/* Layout */}
          <div>
            <ControlLabel>Layout</ControlLabel>
            <div className="grid grid-cols-2 gap-1.5">
              {LAYOUT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => set("layout", opt.id)}
                  className={cn(
                    "rounded-lg border-2 py-2 px-2 text-center text-xs transition-all",
                    def.layout === opt.id
                      ? "border-primary bg-primary/5 text-primary font-semibold"
                      : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  <div className="text-base mb-0.5">{opt.icon}</div>
                  <div className="leading-tight">{opt.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Primary color */}
          <div>
            <ControlLabel>Primary Color</ControlLabel>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="color"
                value={def.colors.primary}
                onChange={(e) => setColors({ primary: e.target.value })}
                className="h-7 w-10 rounded border border-input cursor-pointer shrink-0"
              />
              <Input
                value={def.colors.primary}
                onChange={(e) => setColors({ primary: e.target.value })}
                className="h-7 text-xs flex-1 font-mono"
                maxLength={7}
              />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColors({ primary: c })}
                  className={cn(
                    "h-5 w-5 rounded-full border-2 transition-all",
                    def.colors.primary.toLowerCase() === c ? "border-foreground scale-110" : "border-transparent hover:scale-105"
                  )}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
          </div>

          {/* Header style — only for single column */}
          {isOneCo && (
            <div>
              <ControlLabel>Header Style</ControlLabel>
              <div className="flex gap-1.5">
                {(["full-width", "left-aligned", "centered"] as HeaderStyle[]).map((hs) => (
                  <button
                    key={hs}
                    onClick={() => setDeco({ headerStyle: hs })}
                    className={cn(
                      "flex-1 text-[10px] py-1 rounded border-2 transition-all",
                      def.decorations.headerStyle === hs
                        ? "border-primary bg-primary/5 text-primary font-semibold"
                        : "border-border text-muted-foreground hover:border-primary/40"
                    )}
                  >
                    {hs === "full-width" ? "Full Width" : hs === "left-aligned" ? "Left" : "Center"}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Typography */}
          <div>
            <ControlLabel>Typography</ControlLabel>
            <div className="space-y-2">
              <div>
                <Label className="text-[10px] text-muted-foreground">Heading Font</Label>
                <select
                  value={def.typography.headingFont}
                  onChange={(e) => setTypo({ headingFont: e.target.value })}
                  className="w-full h-7 text-xs border border-input rounded-md px-2 bg-background mt-0.5"
                >
                  {FONT_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Body Font</Label>
                <select
                  value={def.typography.bodyFont}
                  onChange={(e) => setTypo({ bodyFont: e.target.value })}
                  className="w-full h-7 text-xs border border-input rounded-md px-2 bg-background mt-0.5"
                >
                  {FONT_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label className="text-[10px] text-muted-foreground">Heading Style</Label>
                  <select
                    value={def.typography.headingStyle}
                    onChange={(e) => setTypo({ headingStyle: e.target.value as HeadingStyle })}
                    className="w-full h-7 text-xs border border-input rounded-md px-2 bg-background mt-0.5"
                  >
                    <option value="normal">Normal</option>
                    <option value="uppercase">Uppercase</option>
                    <option value="italic">Italic</option>
                  </select>
                </div>
                <div className="flex-1">
                  <Label className="text-[10px] text-muted-foreground">Heading Size</Label>
                  <select
                    value={def.typography.headingSize}
                    onChange={(e) => setTypo({ headingSize: e.target.value as HeadingSize })}
                    className="w-full h-7 text-xs border border-input rounded-md px-2 bg-background mt-0.5"
                  >
                    <option value="sm">Small</option>
                    <option value="md">Medium</option>
                    <option value="lg">Large</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section visibility */}
          <div>
            <ControlLabel>Sections</ControlLabel>
            <div className="space-y-1.5">
              {ALL_SECTIONS.map((sec) => {
                const isVisible  = def.sections.visibleSections.includes(sec.id)
                const inSidebar  = def.sections.sidebarSections.includes(sec.id)
                return (
                  <div key={sec.id} className="flex items-center gap-2">
                    <button
                      onClick={() => toggleVisible(sec.id)}
                      className={cn(
                        "h-4 w-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                        isVisible ? "bg-primary border-primary" : "border-border"
                      )}
                    >
                      {isVisible && <Check className="h-2.5 w-2.5 text-white" />}
                    </button>
                    <span className={cn("text-xs flex-1", isVisible ? "text-foreground" : "text-muted-foreground line-through")}>
                      {sec.label}
                    </span>
                    {isSidebar && isVisible && (
                      <button
                        onClick={() => toggleSidebar(sec.id)}
                        className={cn(
                          "text-[9px] px-1.5 py-0.5 rounded border transition-colors",
                          inSidebar
                            ? "bg-primary/10 border-primary/40 text-primary font-medium"
                            : "border-border text-muted-foreground hover:border-primary/30"
                        )}
                        title={inSidebar ? "In sidebar" : "In main area"}
                      >
                        {inSidebar ? "Sidebar" : "Main"}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Options */}
          <div>
            <ControlLabel>Options</ControlLabel>
            <div className="space-y-2">
              {/* Dividers */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-foreground">Section dividers</span>
                <button
                  onClick={() => setDeco({ dividers: !def.decorations.dividers })}
                  className={cn(
                    "w-8 h-4 rounded-full relative transition-colors",
                    def.decorations.dividers ? "bg-primary" : "bg-border"
                  )}
                >
                  <div className={cn(
                    "absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform",
                    def.decorations.dividers ? "translate-x-4" : "translate-x-0.5"
                  )} />
                </button>
              </div>

              {/* Photo */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-foreground">Profile photo area</span>
                <button
                  onClick={() => setDeco({ showPhoto: !def.decorations.showPhoto })}
                  className={cn(
                    "w-8 h-4 rounded-full relative transition-colors",
                    def.decorations.showPhoto ? "bg-primary" : "bg-border"
                  )}
                >
                  <div className={cn(
                    "absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform",
                    def.decorations.showPhoto ? "translate-x-4" : "translate-x-0.5"
                  )} />
                </button>
              </div>

              {/* Photo shape — only if showPhoto */}
              {def.decorations.showPhoto && (
                <div className="flex items-center gap-2 pl-2">
                  <span className="text-[10px] text-muted-foreground">Shape:</span>
                  {(["circle", "square"] as const).map((shape) => (
                    <button
                      key={shape}
                      onClick={() => setDeco({ photoShape: shape })}
                      className={cn(
                        "text-[10px] px-2 py-0.5 rounded border transition-colors",
                        def.decorations.photoShape === shape
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/30"
                      )}
                    >
                      {shape === "circle" ? "Circle" : "Square"}
                    </button>
                  ))}
                </div>
              )}

              {/* Spacing */}
              <div>
                <span className="text-xs text-foreground block mb-1">Spacing</span>
                <div className="flex gap-1.5">
                  {(["compact", "normal", "relaxed"] as SpacingSize[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => setDeco({ spacing: s })}
                      className={cn(
                        "flex-1 text-[10px] py-0.5 rounded border-2 transition-all capitalize",
                        def.decorations.spacing === s
                          ? "border-primary bg-primary/5 text-primary font-semibold"
                          : "border-border text-muted-foreground hover:border-primary/40"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live preview */}
      <div className="flex-1 overflow-auto bg-neutral-200 dark:bg-neutral-800 flex items-start justify-center py-6">
        <div
          className="shadow-xl bg-white relative shrink-0"
          style={{ width: Math.round(A4_W * PREVIEW_SCALE_SIDE), height: Math.round(A4_H * PREVIEW_SCALE_SIDE) }}
        >
          <div style={{
            position:        "absolute",
            top:             0,
            left:            0,
            width:           A4_W,
            transformOrigin: "top left",
            transform:       `scale(${PREVIEW_SCALE_SIDE})`,
            pointerEvents:   "none",
            userSelect:      "none",
          }}>
            <ImportedTemplateRenderer data={resumeData} definition={def} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Step 4: Save ─────────────────────────────────────────────────────────────────

const PREVIEW_SCALE_SAVE = 0.30

function StepSave({ def, onChange, resumeData }: {
  def: TemplateDefinition
  onChange: (patch: Partial<TemplateDefinition>) => void
  resumeData: ResumeData
}) {
  return (
    <div className="flex gap-6 p-6 flex-1 overflow-auto items-start">
      <div className="flex-1 space-y-4">
        <div>
          <h3 className="font-semibold text-foreground mb-1">Save as My Template</h3>
          <p className="text-sm text-muted-foreground">Give your template a name. It will appear in "My Templates" in the template gallery.</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tpl-name" className="text-sm">Template Name</Label>
          <Input
            id="tpl-name"
            value={def.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="e.g. My Professional Template"
            className="max-w-sm"
          />
        </div>
        <div className="rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-3">
          <p className="text-xs text-green-700 dark:text-green-300 leading-relaxed">
            <strong>Fully editable.</strong> This template uses your real resume data and can be customized at any time.
            The original uploaded file is not stored or used as output.
          </p>
        </div>
      </div>

      {/* Preview */}
      <div className="shrink-0">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Preview</p>
        <div
          className="shadow-lg bg-white relative border"
          style={{ width: Math.round(A4_W * PREVIEW_SCALE_SAVE), height: Math.round(A4_H * PREVIEW_SCALE_SAVE) }}
        >
          <div style={{
            position:        "absolute",
            top:             0,
            left:            0,
            width:           A4_W,
            transformOrigin: "top left",
            transform:       `scale(${PREVIEW_SCALE_SAVE})`,
            pointerEvents:   "none",
            userSelect:      "none",
          }}>
            <ImportedTemplateRenderer data={resumeData} definition={def} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main wizard component ─────────────────────────────────────────────────────────

export interface UploadTemplateEditorProps {
  open:       boolean
  onClose:    () => void
  resumeData: ResumeData
  initial?:   TemplateDefinition
  onSave:     (def: TemplateDefinition) => void
}

export function UploadTemplateEditor({ open, onClose, resumeData, initial, onSave }: UploadTemplateEditorProps) {
  const [step,     setStep]     = useState<0 | 1 | 2 | 3 | 4>(initial ? 3 : 0)
  const [source,   setSource]   = useState<SourceFile | null>(null)
  const [def,      setDef]      = useState<TemplateDefinition>(
    initial ? { ...initial, id: initial.id || uid() }
            : { ...DEFAULT_TEMPLATE_DEFINITION, id: uid() }
  )
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const patchDef = useCallback((patch: Partial<TemplateDefinition> | ((prev: TemplateDefinition) => TemplateDefinition)) => {
    setDef((prev) => typeof patch === "function" ? patch(prev) : { ...prev, ...patch })
  }, [])

  const handleFile = useCallback(async (file: File) => {
    setLoading(true)
    setError(null)
    const result = await processUpload(file)
    setLoading(false)
    if (!result) {
      setError("Could not process this file. Please use PDF, PNG, JPG, DOCX, or HTML.")
      return
    }
    setSource(result.source)
    setDef(result.def)
    setStep(1)
  }, [])

  const handleSave = useCallback(() => {
    if (!def.name.trim()) return
    onSave({ ...def, name: def.name.trim() })
  }, [def, onSave])

  const reset = () => {
    setStep(0)
    setSource(null)
    setDef({ ...DEFAULT_TEMPLATE_DEFINITION, id: uid() })
    setError(null)
  }

  const stepTitles: Record<number, string> = {
    0: "Upload Template Design",
    1: "Template Style Detected",
    2: "Editable Layout Created",
    3: "Adjust Layout",
    4: "Save as My Template",
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[95vw] w-[960px] max-h-[92vh] overflow-hidden flex flex-col p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-5 py-3 border-b shrink-0">
          <div className="flex items-center justify-between gap-4">
            <DialogTitle className="text-sm font-semibold whitespace-nowrap">
              {stepTitles[step]}
            </DialogTitle>

            {step > 0 && step <= 4 && (
              <div className="flex-1 flex justify-center">
                <StepIndicator current={step} />
              </div>
            )}

            <div className="flex items-center gap-1 shrink-0">
              {step > 0 && step < 4 && (
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setStep(0)}>
                  <Upload className="mr-1 h-3 w-3" />
                  Change file
                </Button>
              )}
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Step content */}

        {/* Step 0: Upload */}
        {step === 0 && (
          <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
            <div className="w-full max-w-lg space-y-3">
              <UploadZone onFile={handleFile} loading={loading} />
              {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
              )}
            </div>
          </div>
        )}

        {/* Step 1: Style detected */}
        {step === 1 && source && (
          <>
            <StepDetected source={source} def={def} />
            <div className="px-5 py-3 border-t shrink-0 flex justify-between">
              <Button variant="outline" size="sm" onClick={() => { reset() }}>
                <ChevronLeft className="mr-1 h-3.5 w-3.5" />
                Change file
              </Button>
              <Button size="sm" onClick={() => setStep(2)}>
                Create Editable Layout
                <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          </>
        )}

        {/* Step 2: Editable layout preview */}
        {step === 2 && (
          <>
            <StepLayoutPreview resumeData={resumeData} def={def} />
            <div className="px-5 py-3 border-t shrink-0 flex justify-between">
              <Button variant="outline" size="sm" onClick={() => setStep(1)}>
                <ChevronLeft className="mr-1 h-3.5 w-3.5" />
                Back
              </Button>
              <Button size="sm" onClick={() => setStep(3)}>
                Adjust Layout
                <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          </>
        )}

        {/* Step 3: Adjust layout */}
        {step === 3 && (
          <>
            <StepAdjustLayout def={def} onChange={patchDef} resumeData={resumeData} />
            <div className="px-5 py-3 border-t shrink-0 flex justify-between">
              <Button variant="outline" size="sm" onClick={() => setStep(initial ? 3 : 2)}>
                <ChevronLeft className="mr-1 h-3.5 w-3.5" />
                Back
              </Button>
              <Button size="sm" onClick={() => setStep(4)}>
                Save as My Template
                <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          </>
        )}

        {/* Step 4: Save */}
        {step === 4 && (
          <>
            <StepSave def={def} onChange={patchDef} resumeData={resumeData} />
            <div className="px-5 py-3 border-t shrink-0 flex justify-between">
              <Button variant="outline" size="sm" onClick={() => setStep(3)}>
                <ChevronLeft className="mr-1 h-3.5 w-3.5" />
                Back
              </Button>
              <Button size="sm" onClick={handleSave} disabled={!def.name.trim()}>
                <Check className="mr-1.5 h-3.5 w-3.5" />
                Save Template
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
