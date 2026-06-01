import React from 'react';
import { ResumeData } from '@/types/resume';

export const templateMeta = { id: 'academic', name: 'Academic', category: 'academic' };

interface Props { data: ResumeData; scale?: number; }

export function TemplateAcademic({ data }: Props) {
  const d = data;
  const navy = '#003087';
  return (
    <div style={{ fontFamily: 'Georgia, serif', backgroundColor: '#fff', color: '#222', fontSize: '13px', lineHeight: '1.6' }}>
      {/* Navy header */}
      <div style={{ backgroundColor: navy, color: '#fff', padding: '32px 52px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 700, margin: 0, letterSpacing: '0.5px' }}>{d.personalInfo?.fullName || 'Your Name'}</h1>
        <p style={{ marginTop: '6px', color: '#7fa8d4', fontSize: '12px' }}>
          {[d.personalInfo?.email, d.personalInfo?.phone, d.personalInfo?.location].filter(Boolean).join('  |  ')}
        </p>
      </div>

      <div style={{ padding: '32px 52px' }}>
        {d.summary && (
          <div style={{ marginBottom: '22px' }}>
            <h2 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: navy, marginBottom: '5px' }}>Research Interests / Summary</h2>
            <div style={{ height: '1px', backgroundColor: navy, marginBottom: '10px' }} />
            <p style={{ color: '#444' }}>{d.summary}</p>
          </div>
        )}

        {d.experience?.length > 0 && (
          <div style={{ marginBottom: '22px' }}>
            <h2 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: navy, marginBottom: '5px' }}>Professional Experience</h2>
            <div style={{ height: '1px', backgroundColor: navy, marginBottom: '12px' }} />
            {d.experience.map((exp, i) => (
              <div key={i} style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>{exp.position}</strong>
                  <span style={{ fontSize: '11px', color: '#888' }}>{exp.startDate} – {exp.current ? 'Present' : exp.endDate}</span>
                </div>
                <div style={{ color: navy, fontSize: '12px', fontStyle: 'italic', marginBottom: '4px' }}>{exp.company}</div>
                <p style={{ color: '#555' }}>{exp.description}</p>
              </div>
            ))}
          </div>
        )}

        {d.education?.length > 0 && (
          <div style={{ marginBottom: '22px' }}>
            <h2 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: navy, marginBottom: '5px' }}>Education</h2>
            <div style={{ height: '1px', backgroundColor: navy, marginBottom: '12px' }} />
            {d.education.map((edu, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div>
                  <strong>{edu.school}</strong>
                  <div style={{ color: '#666', fontSize: '12px' }}>{edu.degree}{edu.field ? `, ${edu.field}` : ''}</div>
                </div>
                <span style={{ fontSize: '11px', color: '#888' }}>{edu.endDate}</span>
              </div>
            ))}
          </div>
        )}

        {d.skills?.length > 0 && (
          <div>
            <h2 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: navy, marginBottom: '5px' }}>Skills & Competencies</h2>
            <div style={{ height: '1px', backgroundColor: navy, marginBottom: '10px' }} />
            <p style={{ color: '#555' }}>{d.skills.join(' · ')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
