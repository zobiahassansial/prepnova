import React from 'react';
import { ResumeData } from '@/types/resume';

export const templateMeta = { id: 'minimal', name: 'Minimal', category: 'minimal' };

interface Props { data: ResumeData; scale?: number; }

export function TemplateMinimal({ data }: Props) {
  const d = data;
  return (
    <div style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif", padding: '60px 64px', backgroundColor: '#fff', color: '#222', fontSize: '12.5px', lineHeight: '1.7' }}>
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 300, letterSpacing: '3px', textTransform: 'uppercase', margin: 0 }}>{d.personalInfo?.fullName || 'Your Name'}</h1>
        <p style={{ marginTop: '8px', color: '#999', fontSize: '11px', letterSpacing: '0.5px' }}>
          {[d.personalInfo?.email, d.personalInfo?.phone, d.personalInfo?.location].filter(Boolean).join('   ·   ')}
        </p>
      </div>

      {d.summary && (
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '3px', color: '#bbb', marginBottom: '10px' }}>About</h2>
          <p style={{ color: '#555', fontWeight: 300 }}>{d.summary}</p>
        </div>
      )}

      {d.experience?.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '3px', color: '#bbb', marginBottom: '10px' }}>Experience</h2>
          {d.experience.map((exp, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '12px', marginBottom: '18px' }}>
              <div style={{ color: '#999', fontSize: '11px', paddingTop: '1px' }}>
                <div>{exp.startDate}</div>
                <div>{exp.current ? 'Present' : exp.endDate}</div>
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>{exp.position}</div>
                <div style={{ color: '#888', fontSize: '11px', marginBottom: '4px' }}>{exp.company}</div>
                <p style={{ color: '#555', fontWeight: 300, fontSize: '12px' }}>{exp.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {d.education?.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '3px', color: '#bbb', marginBottom: '10px' }}>Education</h2>
          {d.education.map((edu, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '12px', marginBottom: '12px' }}>
              <div style={{ color: '#999', fontSize: '11px' }}>{edu.endDate}</div>
              <div>
                <div style={{ fontWeight: 600 }}>{edu.school}</div>
                <div style={{ color: '#888', fontSize: '11px' }}>{edu.degree}{edu.field ? ` — ${edu.field}` : ''}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {d.skills?.length > 0 && (
        <div>
          <h2 style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '3px', color: '#bbb', marginBottom: '10px' }}>Skills</h2>
          <p style={{ color: '#666', fontWeight: 300, letterSpacing: '0.5px' }}>{d.skills.join('   ·   ')}</p>
        </div>
      )}
    </div>
  );
}
