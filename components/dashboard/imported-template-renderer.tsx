"use client"

import React from "react"
import { ResumeData } from "@/types/resume"
import { TemplateDefinition, SpacingSize } from "@/types/template-definition"

// ── Date helper ──────────────────────────────────────────────────────────────────

function fmtDate(d: string): string {
  if (!d) return ""
  const m = d.match(/^(\d{4})-(\d{2})$/)
  if (m) {
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
    return `${months[+m[2] - 1] ?? m[2]} ${m[1]}`
  }
  return d
}

// ── Spacing helper ───────────────────────────────────────────────────────────────

function sp(spacing: SpacingSize) {
  switch (spacing) {
    case "compact":  return { outer: 28, inner: 20, gap: 8 }
    case "relaxed":  return { outer: 48, inner: 32, gap: 18 }
    default:         return { outer: 36, inner: 24, gap: 12 }
  }
}

// ── Section heading ──────────────────────────────────────────────────────────────

function SectionHeading({ text, def, light = false }: { text: string; def: TemplateDefinition; light?: boolean }) {
  const { headingFont, headingStyle, headingSize } = def.typography
  const sizePx  = headingSize === "sm" ? 11 : headingSize === "lg" ? 15 : 13
  const color   = light ? "rgba(255,255,255,0.9)" : def.colors.primary

  return (
    <div style={{ marginTop: 18, marginBottom: 6 }}>
      <h3 style={{
        fontSize:        sizePx,
        fontFamily:      headingFont,
        fontWeight:      "bold",
        color,
        margin:          0,
        textTransform:   headingStyle === "uppercase" ? "uppercase" : "none",
        fontStyle:       headingStyle === "italic"    ? "italic"    : "normal",
        letterSpacing:   headingStyle === "uppercase" ? "1.5px"     : "normal",
        paddingBottom:   def.decorations.dividers ? 3 : 0,
      }}>
        {text}
      </h3>
      {def.decorations.dividers && (
        <div style={{ height: 1, backgroundColor: light ? "rgba(255,255,255,0.35)" : def.colors.primary, opacity: 0.65, marginTop: 2 }} />
      )}
    </div>
  )
}

// ── Contact list ─────────────────────────────────────────────────────────────────

function ContactList({ data, def, light = false, stacked = false }: {
  data: ResumeData; def: TemplateDefinition; light?: boolean; stacked?: boolean
}) {
  const p     = data.personalInfo
  const items = [p.email, p.phone, p.location, p.linkedin, p.website].filter(Boolean)
  const color = light ? "rgba(255,255,255,0.82)" : "#666"
  if (!items.length) return null

  if (stacked) {
    return (
      <div style={{ fontSize: 11, color, lineHeight: 1.9, marginTop: 6, wordBreak: "break-all" as const }}>
        {items.map((it, i) => <div key={i}>{it}</div>)}
      </div>
    )
  }
  return (
    <div style={{ fontSize: 11, color, marginTop: 4, lineHeight: 1.6 }}>
      {items.join("  ·  ")}
    </div>
  )
}

// ── Section renderers ─────────────────────────────────────────────────────────────

function SummarySection({ data, def, light = false }: { data: ResumeData; def: TemplateDefinition; light?: boolean }) {
  if (!data.summary) return null
  return (
    <div>
      <SectionHeading text="Professional Summary" def={def} light={light} />
      <p style={{ fontSize: 12, lineHeight: 1.65, color: light ? "rgba(255,255,255,0.82)" : "#555", margin: 0, whiteSpace: "pre-wrap" }}>
        {data.summary}
      </p>
    </div>
  )
}

function ExperienceSection({ data, def, light = false }: { data: ResumeData; def: TemplateDefinition; light?: boolean }) {
  const items = data.experience ?? []
  if (!items.length) return null
  const { gap } = sp(def.decorations.spacing)
  return (
    <div>
      <SectionHeading text="Experience" def={def} light={light} />
      {items.map((item) => (
        <div key={item.id} style={{ marginBottom: gap }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontWeight: "bold", fontSize: 13, color: light ? "#fff" : def.colors.text }}>{item.position}</span>
            <span style={{ fontSize: 11, color: light ? "rgba(255,255,255,0.65)" : "#888", flexShrink: 0 }}>
              {fmtDate(item.startDate)}{item.startDate ? " – " : ""}{item.current ? "Present" : fmtDate(item.endDate)}
            </span>
          </div>
          <div style={{ fontSize: 12, color: light ? "rgba(255,255,255,0.78)" : def.colors.secondary, marginTop: 1 }}>
            {[item.company, item.location].filter(Boolean).join("  ·  ")}
          </div>
          {item.description && (
            <div style={{ fontSize: 12, color: light ? "rgba(255,255,255,0.72)" : "#555", marginTop: 4, whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
              {item.description}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function EducationSection({ data, def, light = false }: { data: ResumeData; def: TemplateDefinition; light?: boolean }) {
  const items = data.education ?? []
  if (!items.length) return null
  const { gap } = sp(def.decorations.spacing)
  return (
    <div>
      <SectionHeading text="Education" def={def} light={light} />
      {items.map((item) => (
        <div key={item.id} style={{ marginBottom: gap }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontWeight: "bold", fontSize: 13, color: light ? "#fff" : def.colors.text }}>
              {[item.degree, item.field].filter(Boolean).join(" in ")}
            </span>
            <span style={{ fontSize: 11, color: light ? "rgba(255,255,255,0.65)" : "#888", flexShrink: 0 }}>
              {fmtDate(item.endDate)}
            </span>
          </div>
          <div style={{ fontSize: 12, color: light ? "rgba(255,255,255,0.78)" : def.colors.secondary, marginTop: 1 }}>
            {[item.school, item.location].filter(Boolean).join("  ·  ")}
          </div>
          {item.description && (
            <div style={{ fontSize: 12, color: light ? "rgba(255,255,255,0.65)" : "#666", marginTop: 3 }}>
              {item.description}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function SkillsSection({ data, def, light = false }: { data: ResumeData; def: TemplateDefinition; light?: boolean }) {
  const skills = data.skills ?? []
  if (!skills.length) return null
  return (
    <div>
      <SectionHeading text="Skills" def={def} light={light} />
      <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 5 }}>
        {skills.map((skill, i) => (
          <span key={i} style={{
            fontSize:         11,
            padding:          "2px 9px",
            borderRadius:     10,
            backgroundColor:  light ? "rgba(255,255,255,0.18)" : `${def.colors.primary}14`,
            color:            light ? "#fff" : def.colors.primary,
            border:           `1px solid ${light ? "rgba(255,255,255,0.28)" : def.colors.primary + "38"}`,
          }}>
            {skill}
          </span>
        ))}
      </div>
    </div>
  )
}

function ProjectsSection({ data, def, light = false }: { data: ResumeData; def: TemplateDefinition; light?: boolean }) {
  const items = data.projects ?? []
  if (!items.length) return null
  const { gap } = sp(def.decorations.spacing)
  return (
    <div>
      <SectionHeading text="Projects" def={def} light={light} />
      {items.map((item) => (
        <div key={item.id} style={{ marginBottom: gap }}>
          <div style={{ fontWeight: "bold", fontSize: 13, color: light ? "#fff" : def.colors.text }}>
            {item.name}
            {item.link && (
              <span style={{ fontSize: 11, fontWeight: "normal", color: light ? "rgba(255,255,255,0.65)" : def.colors.secondary, marginLeft: 6 }}>
                {item.link}
              </span>
            )}
          </div>
          {item.description && (
            <div style={{ fontSize: 12, color: light ? "rgba(255,255,255,0.72)" : "#555", marginTop: 3, lineHeight: 1.5 }}>
              {item.description}
            </div>
          )}
          {(item.technologies?.length ?? 0) > 0 && (
            <div style={{ fontSize: 11, color: light ? "rgba(255,255,255,0.65)" : def.colors.secondary, marginTop: 3 }}>
              {item.technologies.join("  ·  ")}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function RenderSection({ id, data, def, light = false }: { id: string; data: ResumeData; def: TemplateDefinition; light?: boolean }) {
  switch (id) {
    case "summary":    return <SummarySection    data={data} def={def} light={light} />
    case "experience": return <ExperienceSection data={data} def={def} light={light} />
    case "education":  return <EducationSection  data={data} def={def} light={light} />
    case "skills":     return <SkillsSection     data={data} def={def} light={light} />
    case "projects":   return <ProjectsSection   data={data} def={def} light={light} />
    default: return null
  }
}

// ── Photo placeholder ─────────────────────────────────────────────────────────────

function PhotoPlaceholder({ def, size = 72, light = false }: { def: TemplateDefinition; size?: number; light?: boolean }) {
  const isCircle = def.decorations.photoShape === "circle"
  return (
    <div style={{
      width:           size,
      height:          size,
      borderRadius:    isCircle ? "50%" : 6,
      backgroundColor: light ? "rgba(255,255,255,0.2)" : `${def.colors.primary}18`,
      border:          `2px solid ${light ? "rgba(255,255,255,0.45)" : def.colors.primary + "55"}`,
      display:         "flex",
      alignItems:      "center",
      justifyContent:  "center",
      color:           light ? "rgba(255,255,255,0.55)" : def.colors.primary,
      fontSize:        size * 0.38,
      flexShrink:      0,
      userSelect:      "none" as const,
    }}>
      ◉
    </div>
  )
}

// ── Main exported component ───────────────────────────────────────────────────────

interface Props {
  data:       ResumeData
  definition: TemplateDefinition
}

export function ImportedTemplateRenderer({ data, definition: def }: Props) {
  const p                 = data.personalInfo
  const { outer, inner }  = sp(def.decorations.spacing)
  const bodyFont          = def.typography.bodyFont

  const allSections     = def.sections.order.filter((s) => def.sections.visibleSections.includes(s))
  const sidebarSections = def.sections.sidebarSections.filter((s) => allSections.includes(s))
  const mainSections    = allSections.filter((s) => !sidebarSections.includes(s))

  // ── single-column ─────────────────────────────────────────────────────────────

  if (def.layout === "single-column") {
    const fullWidth   = def.decorations.headerStyle === "full-width"
    const centered    = def.decorations.headerStyle === "centered"

    return (
      <div style={{ fontFamily: bodyFont, backgroundColor: def.colors.background, color: def.colors.text, minHeight: "297mm" }}>
        <div style={{
          backgroundColor: fullWidth ? def.colors.primary : "transparent",
          borderBottom:    !fullWidth && def.decorations.dividers ? `2px solid ${def.colors.primary}` : "none",
          padding:         `${outer}px ${outer}px ${Math.round(outer * 0.7)}px`,
          textAlign:       centered ? "center" : "left",
        }}>
          {def.decorations.showPhoto && (
            <div style={{ marginBottom: 12, display: "flex", justifyContent: centered ? "center" : "flex-start" }}>
              <PhotoPlaceholder def={def} size={72} light={fullWidth} />
            </div>
          )}
          <h1 style={{ fontSize: 26, fontFamily: def.typography.headingFont, fontWeight: "bold", margin: 0, color: fullWidth ? "#fff" : def.colors.text, letterSpacing: "0.3px" }}>
            {p.fullName}
          </h1>
          <ContactList data={data} def={def} light={fullWidth} />
        </div>
        <div style={{ padding: `${Math.round(outer * 0.7)}px ${outer}px ${outer}px` }}>
          {allSections.map((id) => <RenderSection key={id} id={id} data={data} def={def} />)}
        </div>
      </div>
    )
  }

  // ── left-sidebar ──────────────────────────────────────────────────────────────

  if (def.layout === "left-sidebar") {
    return (
      <div style={{ fontFamily: bodyFont, display: "flex", minHeight: "297mm", backgroundColor: def.colors.background }}>
        <div style={{ width: "34%", backgroundColor: def.colors.primary, color: "#fff", padding: `${inner}px ${Math.round(inner * 0.8)}px`, flexShrink: 0 }}>
          {def.decorations.showPhoto && (
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
              <PhotoPlaceholder def={def} size={80} light />
            </div>
          )}
          <h1 style={{ fontSize: 20, fontFamily: def.typography.headingFont, fontWeight: "bold", color: "#fff", margin: 0, lineHeight: 1.3 }}>
            {p.fullName}
          </h1>
          <ContactList data={data} def={def} light stacked />
          <div style={{ height: 1, backgroundColor: "rgba(255,255,255,0.28)", margin: `${Math.round(inner * 0.6)}px 0` }} />
          {sidebarSections.map((id) => <RenderSection key={id} id={id} data={data} def={def} light />)}
        </div>
        <div style={{ flex: 1, padding: `${outer}px ${Math.round(outer * 0.8)}px`, color: def.colors.text }}>
          {mainSections.map((id) => <RenderSection key={id} id={id} data={data} def={def} />)}
        </div>
      </div>
    )
  }

  // ── right-sidebar ─────────────────────────────────────────────────────────────

  if (def.layout === "right-sidebar") {
    return (
      <div style={{ fontFamily: bodyFont, minHeight: "297mm", backgroundColor: def.colors.background }}>
        <div style={{ backgroundColor: def.colors.primary, color: "#fff", padding: `${Math.round(outer * 0.8)}px ${outer}px`, display: "flex", alignItems: "center", gap: 16 }}>
          {def.decorations.showPhoto && <PhotoPlaceholder def={def} size={64} light />}
          <h1 style={{ fontSize: 26, fontFamily: def.typography.headingFont, fontWeight: "bold", color: "#fff", margin: 0 }}>
            {p.fullName}
          </h1>
        </div>
        <div style={{ display: "flex" }}>
          <div style={{ flex: 1, padding: `${Math.round(outer * 0.8)}px`, color: def.colors.text }}>
            {mainSections.map((id) => <RenderSection key={id} id={id} data={data} def={def} />)}
          </div>
          <div style={{ width: "30%", backgroundColor: def.colors.sidebarBg, padding: `${inner}px ${Math.round(inner * 0.75)}px`, flexShrink: 0 }}>
            <ContactList data={data} def={def} stacked />
            {sidebarSections.length > 0 && <div style={{ height: 1, backgroundColor: "#ddd", margin: `${Math.round(inner * 0.5)}px 0` }} />}
            {sidebarSections.map((id) => <RenderSection key={id} id={id} data={data} def={def} />)}
          </div>
        </div>
      </div>
    )
  }

  // ── two-column ────────────────────────────────────────────────────────────────

  const half       = Math.ceil(mainSections.length / 2)
  const leftSecs   = mainSections.slice(0, half)
  const rightSecs  = [...sidebarSections, ...mainSections.slice(half)]

  return (
    <div style={{ fontFamily: bodyFont, minHeight: "297mm", backgroundColor: def.colors.background, color: def.colors.text }}>
      <div style={{ backgroundColor: def.colors.primary, color: "#fff", padding: `${outer}px ${outer}px ${Math.round(outer * 0.7)}px`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {def.decorations.showPhoto && <PhotoPlaceholder def={def} size={56} light />}
          <h1 style={{ fontSize: 26, fontFamily: def.typography.headingFont, fontWeight: "bold", color: "#fff", margin: 0 }}>
            {p.fullName}
          </h1>
        </div>
        <div style={{ textAlign: "right", fontSize: 11, color: "rgba(255,255,255,0.85)", lineHeight: 1.9 }}>
          {[p.email, p.phone, p.location, p.linkedin, p.website].filter(Boolean).map((it, i) => <div key={i}>{it}</div>)}
        </div>
      </div>
      <div style={{ display: "flex", gap: 28, padding: `${Math.round(outer * 0.7)}px ${outer}px` }}>
        <div style={{ flex: 3 }}>
          {leftSecs.map((id) => <RenderSection key={id} id={id} data={data} def={def} />)}
        </div>
        <div style={{ flex: 2 }}>
          {rightSecs.map((id) => <RenderSection key={id} id={id} data={data} def={def} />)}
        </div>
      </div>
    </div>
  )
}
