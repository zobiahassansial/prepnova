import React from 'react';
import { ResumeData } from '@/types/resume';

export const templateMeta = {
  id: 'custom',
  name: 'Custom (HTML)',
  category: 'custom',
  thumbnail: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTQwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjE0MCIgZmlsbD0iIzMzMyIvPjx0ZXh0IHg9IjUwIiB5PSI3MCIgZmlsbD0iI2ZmZiIgZm9udC1zaXplPSIzMCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Y3VzdG9tPC90ZXh0Pjwvc3ZnPg=='
};

interface Props {
  data: ResumeData;
  scale?: number;
}

export function TemplateCustom({ data, scale = 1 }: Props) {
  const content = data.customTemplateHtml

  if (!content) {
    return (
      <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', padding: '40px', background: '#f5f5f5', textAlign: 'center' }}>
        <h2 style={{ color: '#666' }}>No custom template provided</h2>
      </div>
    )
  }

  if (content.startsWith('data:image/')) {
    return (
      <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
        <img src={content} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} alt="Resume template" />
      </div>
    )
  }

  if (content.startsWith('data:application/pdf')) {
    return (
      <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: '100%', height: '100%' }}>
        <iframe src={content} style={{ width: '100%', height: '100%', minHeight: '800px', border: 'none' }} title="PDF Resume" />
      </div>
    )
  }

  let renderedHtml = content
  renderedHtml = renderedHtml.replace(/{{fullName}}/g, data.personalInfo?.fullName || '')
  renderedHtml = renderedHtml.replace(/{{email}}/g, data.personalInfo?.email || '')
  renderedHtml = renderedHtml.replace(/{{phone}}/g, data.personalInfo?.phone || '')
  renderedHtml = renderedHtml.replace(/{{summary}}/g, data.summary || '')

  return (
    <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: '100%', height: '100%' }}>
      <iframe
        srcDoc={renderedHtml}
        sandbox="allow-scripts"
        style={{ width: '100%', height: '100%', border: 'none', minHeight: '800px' }}
      />
    </div>
  )
}
