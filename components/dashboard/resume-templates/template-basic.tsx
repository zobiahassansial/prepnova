import React from 'react'
import { ResumeData } from '@/types/resume'

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontSize: '10px',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '2px',
        borderBottom: '1px solid #bbb',
        paddingBottom: '3px',
        marginBottom: '8px',
        marginTop: 0,
      }}
    >
      {children}
    </h2>
  )
}

interface Props { data: ResumeData; scale?: number }

export function TemplateBasic({ data }: Props) {
  const d = data
  const contact = [
    d.personalInfo?.email,
    d.personalInfo?.phone,
    d.personalInfo?.location,
    d.personalInfo?.linkedin,
  ]
    .filter(Boolean)
    .join('  ·  ')

  return (
    <div
      style={{
        fontFamily: 'Arial, Helvetica, sans-serif',
        padding: '40px 48px',
        backgroundColor: '#fff',
        color: '#222',
        fontSize: '13px',
        lineHeight: '1.5',
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '14px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>
          {d.personalInfo?.fullName || 'Your Name'}
        </h1>
        <p style={{ marginTop: '5px', color: '#555', fontSize: '12px' }}>{contact}</p>
      </div>
      <hr style={{ border: 'none', borderTop: '1.5px solid #222', marginBottom: '14px' }} />

      {/* Summary */}
      {d.summary && (
        <div style={{ marginBottom: '14px' }}>
          <SectionHeading>Summary</SectionHeading>
          <p style={{ color: '#444', margin: 0 }}>{d.summary}</p>
        </div>
      )}

      {/* Experience */}
      {d.experience?.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          <SectionHeading>Experience</SectionHeading>
          {d.experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <strong style={{ fontSize: '13px' }}>{exp.position}</strong>
                <span style={{ fontSize: '11px', color: '#666' }}>
                  {exp.startDate} – {exp.current ? 'Present' : exp.endDate}
                </span>
              </div>
              <div style={{ fontStyle: 'italic', color: '#555', fontSize: '12px', marginBottom: '3px' }}>
                {exp.company}
              </div>
              <p style={{ color: '#444', whiteSpace: 'pre-line', margin: 0 }}>{exp.description}</p>
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {d.education?.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          <SectionHeading>Education</SectionHeading>
          {d.education.map((edu, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <div>
                <strong>{edu.school}</strong>
                <div style={{ color: '#555', fontSize: '12px' }}>
                  {edu.degree}
                  {edu.field ? ` in ${edu.field}` : ''}
                </div>
              </div>
              <span style={{ fontSize: '11px', color: '#666' }}>{edu.endDate}</span>
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {d.skills?.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          <SectionHeading>Skills</SectionHeading>
          <p style={{ color: '#444', margin: 0 }}>{d.skills.join('  ·  ')}</p>
        </div>
      )}

      {/* Projects */}
      {d.projects?.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          <SectionHeading>Projects</SectionHeading>
          {d.projects.map((proj, i) => (
            <div key={i} style={{ marginBottom: '8px' }}>
              <strong>{proj.name}</strong>
              {proj.link && (
                <span style={{ fontSize: '11px', color: '#666', marginLeft: '8px' }}>{proj.link}</span>
              )}
              <p style={{ color: '#444', margin: '2px 0 0' }}>{proj.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
