"use client"

import React from "react"
import { ResumeData } from "@/types/resume"
import { CustomOverlayTemplate, OverlayField, OverlayFieldKey } from "@/types/overlay"

// ─── Derive live field text from resume data ──────────────────────────────────

export function getFieldContent(key: OverlayFieldKey, data: ResumeData): string {
  const p = data.personalInfo
  switch (key) {
    case "fullName":   return p?.fullName   || "Full Name"
    case "email":      return p?.email      || "email@example.com"
    case "phone":      return p?.phone      || "+1 555 000 0000"
    case "location":   return p?.location   || "City, Country"
    case "linkedin":   return p?.linkedin   || "linkedin.com/in/username"
    case "website":    return p?.website    || "yourwebsite.com"
    case "summary":    return data.summary  || "Professional summary will appear here."
    case "skills":
      return data.skills?.length
        ? data.skills.join("  ·  ")
        : "Skill 1  ·  Skill 2  ·  Skill 3"
    case "experience":
      return data.experience?.length
        ? data.experience
            .map(
              (e) =>
                `${e.position}  ·  ${e.company}  (${e.startDate}–${e.current ? "Present" : e.endDate})\n${e.description}`
            )
            .join("\n\n")
        : "Work experience will appear here."
    case "education":
      return data.education?.length
        ? data.education
            .map(
              (e) =>
                `${e.degree}${e.field ? " in " + e.field : ""}  ·  ${e.school}  (${e.endDate})`
            )
            .join("\n")
        : "Education will appear here."
    case "projects":
      return data.projects?.length
        ? data.projects.map((p) => p.name).join("  ·  ")
        : "Projects will appear here."
    default:
      return ""
  }
}

// ─── Background layer ─────────────────────────────────────────────────────────

function BackgroundLayer({ template }: { template: CustomOverlayTemplate }) {
  const common: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    border: "none",
    display: "block",
  }

  if (template.type === "image") {
    return (
      <img
        src={template.backgroundData}
        alt="Resume template background"
        style={{ ...common, objectFit: "contain", objectPosition: "top" }}
      />
    )
  }

  if (template.type === "pdf") {
    return (
      <embed
        src={template.backgroundData}
        type="application/pdf"
        style={common}
      />
    )
  }

  if (template.type === "docx-overlay" || template.type === "html") {
    return (
      <iframe
        srcDoc={template.backgroundData}
        sandbox="allow-scripts"
        style={common}
        title="Template background"
      />
    )
  }

  return null
}

// ─── Single field overlay ─────────────────────────────────────────────────────

interface FieldLayerProps {
  field: OverlayField
  data: ResumeData
  isSelected?: boolean
  onClick?: (id: string) => void
  onMouseDown?: (e: React.MouseEvent, id: string) => void
  /** Scale factor: 1 for full-size print, <1 for editor preview */
  scale?: number
}

export function FieldLayer({
  field,
  data,
  isSelected = false,
  onClick,
  onMouseDown,
  scale = 1,
}: FieldLayerProps) {
  const content = getFieldContent(field.fieldKey, data)
  const displayFontSize = field.fontSize * scale

  return (
    <div
      onClick={() => onClick?.(field.id)}
      onMouseDown={(e) => onMouseDown?.(e, field.id)}
      style={{
        position: "absolute",
        left: `${field.x}%`,
        top: `${field.y}%`,
        width: `${field.width}%`,
        fontSize: `${displayFontSize}px`,
        fontFamily: field.fontFamily,
        color: field.color,
        fontWeight: field.fontWeight,
        fontStyle: field.fontStyle,
        textAlign: field.textAlign,
        lineHeight: field.lineHeight,
        whiteSpace: "pre-wrap",
        cursor: onClick ? "move" : "default",
        padding: "2px 3px",
        boxSizing: "border-box",
        outline: isSelected ? "1.5px dashed #3b82f6" : "1px dashed transparent",
        borderRadius: "2px",
        userSelect: "none",
        zIndex: 10,
      }}
    >
      {content}
    </div>
  )
}

// ─── Full overlay renderer (used in resume-preview for print) ─────────────────

interface OverlayPreviewRendererProps {
  data: ResumeData
  template: CustomOverlayTemplate
}

export function OverlayPreviewRenderer({ data, template }: OverlayPreviewRendererProps) {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        minHeight: "297mm",
        backgroundColor: "#fff",
        overflow: "hidden",
      }}
    >
      <BackgroundLayer template={template} />

      {template.fields.map((field) => (
        <FieldLayer key={field.id} field={field} data={data} scale={1} />
      ))}
    </div>
  )
}
