import React from 'react';
import { ResumeData } from '@/types/resume';

export const templateMeta = { id: 'classic', name: 'Classic', category: 'professional' };

interface Props { data: ResumeData; scale?: number; }

export function TemplateClassic({ data }: Props) {
  const d = data;
  return (
    <div style={{ fontFamily: 'Georgia, serif', padding: '48px 52px', backgroundColor: '#fff', color: '#222', fontSize: '13px', lineHeight: '1.5' }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 700, letterSpacing: '1px', margin: 0 }}>{d.personalInfo?.fullName || 'Your Name'}</h1>
        <p style={{ marginTop: '6px', color: '#555', fontSize: '12px' }}>
          {[d.personalInfo?.email, d.personalInfo?.phone, d.personalInfo?.location].filter(Boolean).join('  •  ')}
        </p>
      </div>
      <hr style={{ border: 'none', borderTop: '2px solid #222', marginBottom: '16px' }} />

      {d.summary && (
        <div style={{ marginBottom: '18px' }}>
          <h2 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', borderBottom: '1px solid #aaa', paddingBottom: '3px', marginBottom: '8px' }}>Summary</h2>
          <p style={{ color: '#333' }}>{d.summary}</p>
        </div>
      )}

      {d.experience?.length > 0 && (
        <div style={{ marginBottom: '18px' }}>
          <h2 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', borderBottom: '1px solid #aaa', paddingBottom: '3px', marginBottom: '10px' }}>Experience</h2>
          {d.experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <strong style={{ fontSize: '13px' }}>{exp.position}</strong>
                <span style={{ fontSize: '11px', color: '#666' }}>{exp.startDate} – {exp.current ? 'Present' : exp.endDate}</span>
              </div>
              <div style={{ fontStyle: 'italic', color: '#555', marginBottom: '4px' }}>{exp.company}</div>
              <p style={{ color: '#444', marginTop: '2px' }}>{exp.description}</p>
            </div>
          ))}
        </div>
      )}

      {d.education?.length > 0 && (
        <div style={{ marginBottom: '18px' }}>
          <h2 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', borderBottom: '1px solid #aaa', paddingBottom: '3px', marginBottom: '10px' }}>Education</h2>
          {d.education.map((edu, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div>
                <strong>{edu.school}</strong>
                <div style={{ color: '#555', fontSize: '12px' }}>{edu.degree}{edu.field ? ` in ${edu.field}` : ''}</div>
              </div>
              <span style={{ fontSize: '11px', color: '#666' }}>{edu.endDate}</span>
            </div>
          ))}
        </div>
      )}

      {d.skills?.length > 0 && (
        <div>
          <h2 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', borderBottom: '1px solid #aaa', paddingBottom: '3px', marginBottom: '8px' }}>Skills</h2>
          <p style={{ color: '#444' }}>{d.skills.join(' • ')}</p>
        </div>
      )}
    </div>
  );
}
