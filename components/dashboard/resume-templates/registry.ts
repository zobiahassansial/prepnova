import React from "react"
import { ResumeData } from "@/types/resume"

import { TemplateBasic } from "./template-basic"
import { TemplateClassic } from "./template-classic"
import { TemplateModern } from "./template-modern"
import { TemplateMinimal } from "./template-minimal"
import { TemplateExecutive } from "./template-executive"
import { TemplateCreative } from "./template-creative"
import { TemplateCompact } from "./template-compact"
import { TemplateTwoColumn } from "./template-two-column"
import { TemplateSidebar } from "./template-sidebar"
import { TemplateElegant } from "./template-elegant"
import { TemplateBold } from "./template-bold"
import { TemplateAcademic } from "./template-academic"
import { TemplateTech } from "./template-tech"
import { TemplateClean } from "./template-clean"
import { TemplateTimeline } from "./template-timeline"
import { TemplateInfographic } from "./template-infographic"
import { TemplateCustom } from "./template-custom"

export interface TemplateRegistryEntry {
  id: string
  name: string
  description: string
  component: React.ComponentType<{ data: ResumeData; scale?: number }>
}

export const TEMPLATE_REGISTRY: TemplateRegistryEntry[] = [
  { id: "classic",     name: "Classic",       description: "Traditional serif, centred header",   component: TemplateClassic },
  { id: "modern",      name: "Modern",         description: "Navy accent bar, sharp layout",       component: TemplateModern },
  { id: "minimal",     name: "Minimal",        description: "Ultra-clean, generous whitespace",    component: TemplateMinimal },
  { id: "executive",   name: "Executive",      description: "Dark header with gold dividers",      component: TemplateExecutive },
  { id: "creative",    name: "Creative",       description: "Teal header, coloured accents",       component: TemplateCreative },
  { id: "compact",     name: "Compact",        description: "Dense one-page layout",               component: TemplateCompact },
  { id: "two-column",  name: "Two Column",     description: "Dark sidebar, main content area",     component: TemplateTwoColumn },
  { id: "sidebar",     name: "Sidebar",        description: "Light sidebar with indigo accents",   component: TemplateSidebar },
  { id: "elegant",     name: "Elegant Serif",  description: "Serif typeface, gold rule lines",     component: TemplateElegant },
  { id: "bold",        name: "Bold Header",    description: "Black header with amber stripe",      component: TemplateBold },
  { id: "academic",    name: "Academic",       description: "Navy, formal academic CV style",      component: TemplateAcademic },
  { id: "tech",        name: "Tech Portfolio", description: "Dark theme with green accents",       component: TemplateTech },
  { id: "clean",       name: "Clean",          description: "Card layout, blue accents",           component: TemplateClean },
  { id: "timeline",    name: "Timeline",       description: "Purple timeline, chronological",      component: TemplateTimeline },
  { id: "infographic", name: "Infographic",    description: "Visual header with skill bars",       component: TemplateInfographic },
  { id: "basic",       name: "Basic",          description: "Simple, ATS-friendly",                component: TemplateBasic },
]

export const TEMPLATE_MAP: Record<string, React.ComponentType<{ data: ResumeData; scale?: number }>> = {
  ...Object.fromEntries(TEMPLATE_REGISTRY.map((t) => [t.id, t.component])),
  // Legacy aliases — map old IDs to nearest equivalent so saved data keeps working
  template_modern_pro: TemplateModern,
  template_sidebar: TemplateSidebar,
  template_minimal_elegant: TemplateMinimal,
  template_creative_blocks: TemplateCreative,
  custom: TemplateCustom,
}
