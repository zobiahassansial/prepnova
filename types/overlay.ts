export type OverlayFieldKey =
  | 'fullName'
  | 'email'
  | 'phone'
  | 'location'
  | 'linkedin'
  | 'website'
  | 'summary'
  | 'skills'
  | 'experience'
  | 'education'
  | 'projects'

export const OVERLAY_FIELD_META: Record<OverlayFieldKey, { label: string; multiline: boolean }> = {
  fullName:   { label: 'Full Name',             multiline: false },
  email:      { label: 'Email',                  multiline: false },
  phone:      { label: 'Phone',                  multiline: false },
  location:   { label: 'Location',               multiline: false },
  linkedin:   { label: 'LinkedIn',               multiline: false },
  website:    { label: 'Website / Portfolio',    multiline: false },
  summary:    { label: 'Professional Summary',   multiline: true  },
  skills:     { label: 'Skills',                 multiline: false },
  experience: { label: 'Experience',             multiline: true  },
  education:  { label: 'Education',              multiline: true  },
  projects:   { label: 'Projects',               multiline: true  },
}

export interface OverlayField {
  id: string
  fieldKey: OverlayFieldKey
  // Position & size as percentage of the A4 container (0–100)
  x: number
  y: number
  width: number
  // Typography — stored as px at full A4 width (794 px)
  fontSize: number
  fontFamily: string
  color: string
  fontWeight: 'normal' | 'bold'
  fontStyle:  'normal' | 'italic'
  textAlign:  'left'   | 'center' | 'right'
  lineHeight: number
}

export type OverlayBgType = 'image' | 'pdf' | 'docx-overlay' | 'html'

export interface CustomOverlayTemplate {
  type: OverlayBgType
  /** base64 data-URL or HTML string (for docx/html backgrounds) */
  backgroundData: string
  fields: OverlayField[]
  originalFileName: string
}
