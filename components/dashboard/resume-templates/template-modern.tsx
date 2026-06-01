import React from 'react';
import { ResumeData } from '@/types/resume';

export const templateMeta = { id: 'modern', name: 'Modern', category: 'professional' };

interface Props { data: ResumeData; scale?: number; }

export function TemplateModern({ data }: Props) {
  const d = data;
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#fff', color: '#333', fontSize: '13px', lineHeight: '1.6', display: 'flex', minHeight: '100%' }}>
      {/* Left accent bar */}
      <div style={{ width: '6px', backgroundColor: '#1a2744', flexShrink: 0 }} />
      <div style={{ flex: 1, padding: '40px 44px' }}>
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1a2744', margin: 0, letterSpacing: '0.5px' }}>{d.personalInfo?.fullName || 'Your Name'}</h1>
          <p style={{ marginTop: '6px', color: '#4a6fa5', fontSize: '12px' }}>
            {[d.personalInfo?.email, d.personalInfo?.phone, d.personalInfo?.location].filter(Boolean).join('  |  ')}
          </p>
        </div>

        {d.summary && (
          <div style={{ marginBottom: '22px' }}>
            <h2 style={{ fontSize: '12px', fontWeight: 700, color: '#1a2744', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>Profile</h2>
            <div style={{ borderLeft: '3px solid #1a2744', paddingLeft: '12px' }}>
              <p style={{ color: '#555' }}>{d.summary}</p>
            </div>
          </div>
        )}

        {d.experience?.length > 0 && (
          <div style={{ marginBottom: '22px' }}>
            <h2 style={{ fontSize: '12px', fontWeight: 700, color: '#1a2744', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '10px' }}>Experience</h2>
            {d.experience.map((exp, i) => (
              <div key={i} style={{ borderLeft: '3px solid #e0e7ef', paddingLeft: '14px', marginBottom: '14px', position: 'relative' }}>
                <div style={{ position: 'absolute', left: '-5px', top: '5px', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#1a2744' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong style={{ color: '#1a2744' }}>{exp.position}</strong>
                  <span style={{ fontSize: '11px', color: '#888' }}>{exp.startDate} – {exp.current ? 'Present' : exp.endDate}</span>
                </div>
                <div style={{ color: '#4a6fa5', fontWeight: 600, fontSize: '12px', marginBottom: '4px' }}>{exp.company}</div>
                <p style={{ color: '#555', fontSize: '12px' }}>{exp.description}</p>
              </div>
            ))}
          </div>
        )}

        {d.education?.length > 0 && (
          <div style={{ marginBottom: '22px' }}>
            <h2 style={{ fontSize: '12px', fontWeight: 700, color: '#1a2744', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '10px' }}>Education</h2>
            {d.education.map((edu, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div>
                  <strong style={{ color: '#1a2744' }}>{edu.school}</strong>
                  <div style={{ color: '#666', fontSize: '12px' }}>{edu.degree}{edu.field ? ` · ${edu.field}` : ''}</div>
                </div>
                <span style={{ fontSize: '11px', color: '#888' }}>{edu.endDate}</span>
              </div>
            ))}
          </div>
        )}

        {d.skills?.length > 0 && (
          <div>
            <h2 style={{ fontSize: '12px', fontWeight: 700, color: '#1a2744', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>Skills</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {d.skills.map((s, i) => (
                <span key={i} style={{ backgroundColor: '#e8eef6', color: '#1a2744', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 500 }}>{s}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
