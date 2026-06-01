import React from 'react';
import { ResumeData } from '@/types/resume';

export const templateMeta = { id: 'creative', name: 'Creative', category: 'creative' };

interface Props { data: ResumeData; scale?: number; }

export function TemplateCreative({ data }: Props) {
  const d = data;
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f0fafa', color: '#222', fontSize: '13px', lineHeight: '1.6' }}>
      {/* Teal header */}
      <div style={{ backgroundColor: '#008080', color: '#fff', padding: '36px 48px', position: 'relative' }}>
        <h1 style={{ fontSize: '30px', fontWeight: 700, margin: 0, letterSpacing: '0.5px' }}>{d.personalInfo?.fullName || 'Your Name'}</h1>
        <p style={{ marginTop: '8px', color: '#b2dfdf', fontSize: '12px' }}>
          {[d.personalInfo?.email, d.personalInfo?.phone, d.personalInfo?.location].filter(Boolean).join('  •  ')}
        </p>
        <div style={{ position: 'absolute', top: '28px', right: '48px', backgroundColor: '#ff6b6b', borderRadius: '20px', padding: '4px 16px', fontSize: '11px', fontWeight: 600 }}>
          Creative
        </div>
      </div>

      <div style={{ padding: '32px 48px' }}>
        {d.summary && (
          <div style={{ marginBottom: '24px', backgroundColor: '#fff', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <h2 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: '#008080', letterSpacing: '1.5px', marginBottom: '8px' }}>About Me</h2>
            <p style={{ color: '#555' }}>{d.summary}</p>
          </div>
        )}

        {d.experience?.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: '#008080', letterSpacing: '1.5px', marginBottom: '12px' }}>Experience</h2>
            {d.experience.map((exp, i) => (
              <div key={i} style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '14px 16px', marginBottom: '10px', borderLeft: '4px solid #008080', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <strong style={{ color: '#008080' }}>{exp.position}</strong>
                  <span style={{ fontSize: '11px', color: '#999' }}>{exp.startDate} – {exp.current ? 'Present' : exp.endDate}</span>
                </div>
                <div style={{ color: '#ff6b6b', fontWeight: 600, fontSize: '12px', marginBottom: '6px' }}>{exp.company}</div>
                <p style={{ color: '#555', fontSize: '12px' }}>{exp.description}</p>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {d.education?.length > 0 && (
            <div>
              <h2 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: '#008080', letterSpacing: '1.5px', marginBottom: '10px' }}>Education</h2>
              {d.education.map((edu, i) => (
                <div key={i} style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '12px', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px' }}>{edu.school}</div>
                  <div style={{ color: '#888', fontSize: '11px' }}>{edu.degree}{edu.field ? ` · ${edu.field}` : ''}</div>
                  <div style={{ color: '#999', fontSize: '10px' }}>{edu.endDate}</div>
                </div>
              ))}
            </div>
          )}

          {d.skills?.length > 0 && (
            <div>
              <h2 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: '#ff6b6b', letterSpacing: '1.5px', marginBottom: '10px' }}>Skills</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {d.skills.map((s, i) => (
                  <span key={i} style={{ backgroundColor: 'rgba(0,128,128,0.12)', color: '#008080', border: '1px solid rgba(0,128,128,0.3)', padding: '3px 10px', borderRadius: '16px', fontSize: '11px' }}>{s}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
