import React from 'react';
import { ResumeData } from '@/types/resume';

export const templateMeta = { id: 'timeline', name: 'Timeline', category: 'creative' };

interface Props { data: ResumeData; scale?: number; }

export function TemplateTimeline({ data }: Props) {
  const d = data;
  const purple = '#6366f1';
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '44px 52px', backgroundColor: '#fff', color: '#1e293b', fontSize: '12.5px', lineHeight: '1.65' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 700, margin: 0 }}>{d.personalInfo?.fullName || 'Your Name'}</h1>
        <p style={{ marginTop: '6px', color: purple, fontSize: '12px', fontWeight: 500 }}>
          {[d.personalInfo?.email, d.personalInfo?.phone, d.personalInfo?.location].filter(Boolean).join('  ·  ')}
        </p>
      </div>

      {d.summary && (
        <div style={{ marginBottom: '28px', paddingLeft: '24px', borderLeft: `2px solid ${purple}` }}>
          <p style={{ color: '#555', fontStyle: 'italic' }}>{d.summary}</p>
        </div>
      )}

      {d.experience?.length > 0 && (
        <div style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', color: purple, marginBottom: '16px' }}>Experience</h2>
          <div style={{ position: 'relative', paddingLeft: '28px', borderLeft: `2px solid rgba(99,102,241,0.25)` }}>
            {d.experience.map((exp, i) => (
              <div key={i} style={{ position: 'relative', marginBottom: '20px' }}>
                {/* Dot */}
                <div style={{ position: 'absolute', left: '-35px', top: '4px', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: purple, border: '2px solid #fff', boxShadow: `0 0 0 2px ${purple}` }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong style={{ color: '#1e293b' }}>{exp.position}</strong>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>{exp.startDate} – {exp.current ? 'Present' : exp.endDate}</span>
                </div>
                <div style={{ color: purple, fontSize: '12px', marginBottom: '4px' }}>{exp.company}</div>
                <p style={{ color: '#64748b', fontSize: '12px' }}>{exp.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {d.education?.length > 0 && (
        <div style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', color: purple, marginBottom: '16px' }}>Education</h2>
          <div style={{ position: 'relative', paddingLeft: '28px', borderLeft: `2px solid rgba(99,102,241,0.25)` }}>
            {d.education.map((edu, i) => (
              <div key={i} style={{ position: 'relative', marginBottom: '14px' }}>
                <div style={{ position: 'absolute', left: '-35px', top: '4px', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'rgba(99,102,241,0.5)', border: '2px solid #fff', boxShadow: `0 0 0 2px rgba(99,102,241,0.4)` }} />
                <strong>{edu.school}</strong>
                <div style={{ color: '#64748b', fontSize: '12px' }}>{edu.degree}{edu.field ? ` — ${edu.field}` : ''}</div>
                <div style={{ color: '#94a3b8', fontSize: '11px' }}>{edu.endDate}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {d.skills?.length > 0 && (
        <div>
          <h2 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', color: purple, marginBottom: '10px' }}>Skills</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {d.skills.map((s, i) => (
              <span key={i} style={{ backgroundColor: 'rgba(99,102,241,0.1)', color: purple, border: `1px solid rgba(99,102,241,0.3)`, padding: '3px 10px', borderRadius: '12px', fontSize: '11px' }}>{s}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
