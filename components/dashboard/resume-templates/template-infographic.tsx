import React from 'react';
import { ResumeData } from '@/types/resume';

export const templateMeta = { id: 'infographic', name: 'Infographic', category: 'creative' };

interface Props { data: ResumeData; scale?: number; }

export function TemplateInfographic({ data }: Props) {
  const d = data;
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#fff', color: '#1e293b', fontSize: '12.5px', lineHeight: '1.6' }}>
      {/* Dark header */}
      <div style={{ backgroundColor: '#1e293b', color: '#fff', padding: '28px 40px', display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 700, flexShrink: 0 }}>
          {(d.personalInfo?.fullName || 'U').charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>{d.personalInfo?.fullName || 'Your Name'}</h1>
          <p style={{ marginTop: '4px', color: '#94a3b8', fontSize: '11px' }}>
            {[d.personalInfo?.email, d.personalInfo?.phone, d.personalInfo?.location].filter(Boolean).join('  ·  ')}
          </p>
        </div>
      </div>

      <div style={{ padding: '28px 40px' }}>
        {d.summary && (
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#f59e0b', marginBottom: '8px' }}>About</h2>
            <p style={{ color: '#475569' }}>{d.summary}</p>
          </div>
        )}

        {/* Skills as progress bars */}
        {d.skills?.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#f59e0b', marginBottom: '12px' }}>Skills</h2>
            {d.skills.slice(0, 6).map((s, i) => {
              const colors = ['#f59e0b', '#6366f1', '#10b981', '#ef4444', '#3b82f6', '#ec4899'];
              const widths = [92, 85, 78, 70, 88, 75];
              return (
                <div key={i} style={{ marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 500 }}>{s}</span>
                  </div>
                  <div style={{ height: '6px', backgroundColor: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${widths[i % widths.length]}%`, backgroundColor: colors[i % colors.length], borderRadius: '3px' }} />
                  </div>
                </div>
              );
            })}
            {d.skills.length > 6 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '8px' }}>
                {d.skills.slice(6).map((s, i) => (
                  <span key={i} style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '10px', fontSize: '11px' }}>{s}</span>
                ))}
              </div>
            )}
          </div>
        )}

        <div style={{ height: '1px', backgroundColor: '#e2e8f0', marginBottom: '20px' }} />

        {d.experience?.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#1e293b', marginBottom: '12px' }}>Experience</h2>
            {d.experience.map((exp, i) => (
              <div key={i} style={{ display: 'flex', gap: '14px', marginBottom: '14px' }}>
                <div style={{ width: '6px', backgroundColor: '#6366f1', borderRadius: '3px', flexShrink: 0, alignSelf: 'stretch', minHeight: '40px' }} />
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong>{exp.position}</strong>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>{exp.startDate} – {exp.current ? 'Present' : exp.endDate}</span>
                  </div>
                  <div style={{ color: '#6366f1', fontSize: '12px', marginBottom: '3px' }}>{exp.company}</div>
                  <p style={{ color: '#64748b', fontSize: '12px' }}>{exp.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {d.education?.length > 0 && (
          <div>
            <h2 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#1e293b', marginBottom: '10px' }}>Education</h2>
            {d.education.map((edu, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div>
                  <strong>{edu.school}</strong>
                  <div style={{ color: '#64748b', fontSize: '12px' }}>{edu.degree}{edu.field ? ` · ${edu.field}` : ''}</div>
                </div>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>{edu.endDate}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
