import React from 'react';
import { ResumeData } from '@/types/resume';

export const templateMeta = { id: 'clean', name: 'Clean', category: 'minimal' };

interface Props { data: ResumeData; scale?: number; }

export function TemplateClean({ data }: Props) {
  const d = data;
  const blue = '#2563eb';
  const cardStyle: React.CSSProperties = { backgroundColor: '#fff', borderRadius: '8px', padding: '18px 22px', marginBottom: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' };
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f8fafc', color: '#1e293b', fontSize: '12.5px', lineHeight: '1.6', padding: '24px 28px' }}>
      {/* Header card */}
      <div style={{ ...cardStyle, marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: '#1e293b' }}>{d.personalInfo?.fullName || 'Your Name'}</h1>
        <p style={{ marginTop: '6px', color: blue, fontSize: '12px', fontWeight: 500 }}>
          {[d.personalInfo?.email, d.personalInfo?.phone, d.personalInfo?.location].filter(Boolean).join('  ·  ')}
        </p>
      </div>

      {d.summary && (
        <div style={cardStyle}>
          <h2 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: blue, marginBottom: '8px' }}>About</h2>
          <p style={{ color: '#475569' }}>{d.summary}</p>
        </div>
      )}

      {d.experience?.length > 0 && (
        <div style={cardStyle}>
          <h2 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: blue, marginBottom: '12px' }}>Experience</h2>
          {d.experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: '14px', paddingBottom: '14px', borderBottom: i < d.experience.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong style={{ color: '#1e293b' }}>{exp.position}</strong>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>{exp.startDate} – {exp.current ? 'Present' : exp.endDate}</span>
              </div>
              <div style={{ color: blue, fontSize: '12px', marginBottom: '4px' }}>{exp.company}</div>
              <p style={{ color: '#64748b', fontSize: '12px' }}>{exp.description}</p>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {d.education?.length > 0 && (
          <div style={cardStyle}>
            <h2 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: blue, marginBottom: '10px' }}>Education</h2>
            {d.education.map((edu, i) => (
              <div key={i} style={{ marginBottom: '8px' }}>
                <strong style={{ fontSize: '12px' }}>{edu.school}</strong>
                <div style={{ color: '#64748b', fontSize: '11px' }}>{edu.degree}{edu.field ? ` · ${edu.field}` : ''}</div>
                <div style={{ color: '#94a3b8', fontSize: '10px' }}>{edu.endDate}</div>
              </div>
            ))}
          </div>
        )}

        {d.skills?.length > 0 && (
          <div style={cardStyle}>
            <h2 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: blue, marginBottom: '10px' }}>Skills</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {d.skills.map((s, i) => (
                <span key={i} style={{ backgroundColor: 'rgba(37,99,235,0.1)', color: blue, padding: '3px 9px', borderRadius: '12px', fontSize: '11px', fontWeight: 500 }}>{s}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
