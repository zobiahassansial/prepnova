export type TemplateLayout   = "single-column" | "left-sidebar" | "right-sidebar" | "two-column"
export type HeaderStyle      = "full-width" | "left-aligned" | "centered"
export type PhotoShape       = "circle" | "square"
export type SidebarShape     = "straight" | "diagonal"
export type HeadingStyle     = "normal" | "uppercase" | "italic"
export type HeadingSize      = "sm" | "md" | "lg"
export type SpacingSize      = "compact" | "normal" | "relaxed"

export interface TemplateColors {
  primary:    string
  secondary:  string
  text:       string
  background: string
  sidebarBg:  string
}

export interface TemplateTypography {
  headingFont:  string
  bodyFont:     string
  headingStyle: HeadingStyle
  headingSize:  HeadingSize
}

export interface TemplateSections {
  order:           string[]
  sidebarSections: string[]
  visibleSections: string[]
}

export interface TemplateDecorations {
  dividers:      boolean
  sidebarShape:  SidebarShape
  headerStyle:   HeaderStyle
  photoShape:    PhotoShape
  showPhoto:     boolean
  spacing:       SpacingSize
}

export interface TemplateDefinition {
  id:             string
  name:           string
  sourceType:     "built-in" | "imported"
  sourceFile?:    string
  sourceFileType?: "pdf" | "image" | "html" | "docx"
  layout:         TemplateLayout
  colors:         TemplateColors
  typography:     TemplateTypography
  sections:       TemplateSections
  decorations:    TemplateDecorations
}

export const DEFAULT_TEMPLATE_DEFINITION: TemplateDefinition = {
  id:         "",
  name:       "My Template",
  sourceType: "imported",
  layout:     "single-column",
  colors: {
    primary:    "#1a2744",
    secondary:  "#4a6fa5",
    text:       "#333333",
    background: "#ffffff",
    sidebarBg:  "#f0f2f7",
  },
  typography: {
    headingFont:  "Arial, sans-serif",
    bodyFont:     "Arial, sans-serif",
    headingStyle: "uppercase",
    headingSize:  "md",
  },
  sections: {
    order:           ["summary", "experience", "education", "skills", "projects"],
    sidebarSections: ["skills"],
    visibleSections: ["summary", "experience", "education", "skills", "projects"],
  },
  decorations: {
    dividers:     true,
    sidebarShape: "straight",
    headerStyle:  "full-width",
    photoShape:   "circle",
    showPhoto:    false,
    spacing:      "normal",
  },
}
