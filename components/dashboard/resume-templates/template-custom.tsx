import React from 'react'
import { ResumeData } from '@/types/resume'

interface Props { data: ResumeData; scale?: number }

export function TemplateCustom({ data }: Props) {
  const content = data.customTemplateHtml

  if (!content || !content.trim()) {
    return (
      <div
        style={{
          padding: '60px 48px',
          background: '#fafafa',
          textAlign: 'center',
          fontFamily: 'Arial, sans-serif',
          color: '#888',
        }}
      >
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>{'</>'}</div>
        <p style={{ fontSize: '14px', fontWeight: 600 }}>No custom HTML template provided</p>
        <p style={{ fontSize: '12px', marginTop: '6px' }}>
          Click &ldquo;Edit HTML&rdquo; in the toolbar to paste your HTML/CSS template.
        </p>
        <p style={{ fontSize: '11px', marginTop: '12px', color: '#aaa' }}>
          Supported variables: {'{{fullName}}'}, {'{{email}}'}, {'{{phone}}'}, {'{{summary}}'}
        </p>
      </div>
    )
  }

  // Substitute template variables before rendering
  const rendered = content
    .replace(/\{\{fullName\}\}/g, data.personalInfo?.fullName || '')
    .replace(/\{\{email\}\}/g, data.personalInfo?.email || '')
    .replace(/\{\{phone\}\}/g, data.personalInfo?.phone || '')
    .replace(/\{\{location\}\}/g, data.personalInfo?.location || '')
    .replace(/\{\{summary\}\}/g, data.summary || '')
    .replace(/\{\{linkedin\}\}/g, data.personalInfo?.linkedin || '')
    .replace(/\{\{website\}\}/g, data.personalInfo?.website || '')

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <iframe
        srcDoc={rendered}
        sandbox="allow-scripts"
        style={{ width: '100%', height: '100%', border: 'none', minHeight: '800px' }}
        title="Custom HTML Resume"
      />
    </div>
  )
}
