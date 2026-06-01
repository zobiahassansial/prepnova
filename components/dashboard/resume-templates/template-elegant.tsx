import React from 'react';
import { ResumeData } from '@/types/resume';

export const templateMeta = { id: 'elegant', name: 'Elegant', category: 'minimal' };

interface Props { data: ResumeData; scale?: number; }

export function TemplateElegant({ data }: Props) {
  const d = data;
  const gold = '#c9a84c';
  return (
    <div style={{ fontFamily: 'Georgia, "Times New Roman", serif', padding: '52px 56px', backgroundColor: '#fefefe', color: '#333', fontSize: '13px', lineHeight: '1.65' }}>
      {/* Gold top rule */}
      <div style={{ height: '1px', backgroundColor: gold, marginBottom: '24px' }} />

      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 700, letterSpacing: '2px', margin: 0, color: '#222' }}>{d.personalInfo?.fullName || 'Your Name'}</h1>
        <p style={{ marginTop: '8px', color: '#888', fontSize: '11px', letterSpacing: '1px' }}>
          {[d.personalInfo?.email, d.personalInfo?.phone, d.personalInfo?.location].filter(Boolean).join('   ·   ')}
        </p>
      </div>

      <div style={{ height: '1px', backgroundColor: gold, marginBottom: '28px' }} />

      {d.summary && (
        <div style={{ marginBottom: '26px' }}>
          <h2 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', color: '#555', marginBottom: '6px' }}>Summary</h2>
          <div style={{ height: '0.5px', backgroundColor: gold, width: '60px', marginBottom: '10px' }} />
          <p style={{ color: '#555', fontStyle: 'italic' }}>{d.summary}</p>
        </div>
      )}

      {d.experience?.length > 0 && (
        <div style={{ marginBottom: '26px' }}>
          <h2 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', color: '#555', marginBottom: '6px' }}>Experience</h2>
          <div style={{ height: '0.5px', backgroundColor: gold, width: '72px', marginBottom: '14px' }} />
          {d.experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <strong style={{ color: '#222', fontSize: '13px' }}>{exp.company}</strong>
                <span style={{ fontSize: '11px', color: '#999', fontStyle: 'italic' }}>{exp.startDate} — {exp.current ? 'Present' : exp.endDate}</span>
              </div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#888', marginBottom: '5px' }}>{exp.position}</div>
              <p style={{ color: '#666' }}>{exp.description}</p>
            </div>
          ))}
        </div>
      )}

      {d.education?.length > 0 && (
        <div style={{ marginBottom: '26px' }}>
          <h2 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', color: '#555', marginBottom: '6px' }}>Education</h2>
          <div style={{ height: '0.5px', backgroundColor: gold, width: '56px', marginBottom: '12px' }} />
          {d.education.map((edu, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div>
                <em style={{ color: '#444' }}>{edu.school}</em>
                <div style={{ fontSize: '11px', color: '#888' }}>{edu.degree}{edu.field ? ` · ${edu.field}` : ''}</div>
              </div>
              <span style={{ fontSize: '11px', color: '#999' }}>{edu.endDate}</span>
            </div>
          ))}
        </div>
      )}

      {d.skills?.length > 0 && (
        <div>
          <h2 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', color: '#555', marginBottom: '6px' }}>Expertise</h2>
          <div style={{ height: '0.5px', backgroundColor: gold, width: '48px', marginBottom: '12px' }} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {d.skills.map((s, i) => (
              <span key={i} style={{ border: `1px solid ${gold}`, color: '#666', padding: '3px 12px', borderRadius: '2px', fontSize: '11px', backgroundColor: 'rgba(201,168,76,0.05)' }}>{s}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
