import React from 'react';
import { ResumeData } from '@/types/resume';

export const templateMeta = { id: 'compact', name: 'Compact', category: 'professional' };

interface Props { data: ResumeData; scale?: number; }

export function TemplateCompact({ data }: Props) {
  const d = data;
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '28px 36px', backgroundColor: '#fff', color: '#222', fontSize: '11.5px', lineHeight: '1.45' }}>
      <div style={{ marginBottom: '10px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>{d.personalInfo?.fullName || 'Your Name'}</h1>
        <p style={{ marginTop: '3px', color: '#666', fontSize: '11px' }}>
          {[d.personalInfo?.email, d.personalInfo?.phone, d.personalInfo?.location].filter(Boolean).join('  |  ')}
        </p>
      </div>
      <hr style={{ border: 'none', borderTop: '1px solid #999', marginBottom: '8px' }} />

      {d.summary && (
        <div style={{ marginBottom: '8px' }}>
          <h2 style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '3px' }}>Summary</h2>
          <p style={{ color: '#444', fontSize: '11px' }}>{d.summary}</p>
          <hr style={{ border: 'none', borderTop: '1px solid #ddd', marginTop: '8px' }} />
        </div>
      )}

      {d.experience?.length > 0 && (
        <div style={{ marginBottom: '8px' }}>
          <h2 style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Experience</h2>
          {d.experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: '7px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong style={{ fontSize: '11.5px' }}>{exp.position} — {exp.company}</strong>
                <span style={{ fontSize: '10px', color: '#777' }}>{exp.startDate} – {exp.current ? 'Present' : exp.endDate}</span>
              </div>
              <p style={{ color: '#555', fontSize: '11px', margin: '2px 0 0' }}>{exp.description}</p>
            </div>
          ))}
          <hr style={{ border: 'none', borderTop: '1px solid #ddd', marginTop: '8px' }} />
        </div>
      )}

      {d.education?.length > 0 && (
        <div style={{ marginBottom: '8px' }}>
          <h2 style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Education</h2>
          {d.education.map((edu, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span><strong>{edu.school}</strong> — {edu.degree}{edu.field ? ` in ${edu.field}` : ''}</span>
              <span style={{ fontSize: '10px', color: '#777' }}>{edu.endDate}</span>
            </div>
          ))}
          <hr style={{ border: 'none', borderTop: '1px solid #ddd', marginTop: '8px' }} />
        </div>
      )}

      {d.skills?.length > 0 && (
        <div>
          <h2 style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Skills</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {d.skills.map((s, i) => (
              <span key={i} style={{ backgroundColor: '#eee', padding: '2px 8px', borderRadius: '3px', fontSize: '10.5px' }}>{s}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
