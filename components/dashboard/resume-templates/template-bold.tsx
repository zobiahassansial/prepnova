import React from 'react';
import { ResumeData } from '@/types/resume';

export const templateMeta = { id: 'bold', name: 'Bold', category: 'creative' };

interface Props { data: ResumeData; scale?: number; }

export function TemplateBold({ data }: Props) {
  const d = data;
  const amber = '#f59e0b';
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#fff', color: '#111', fontSize: '13px', lineHeight: '1.6' }}>
      {/* Black header with amber accent */}
      <div style={{ backgroundColor: '#111', color: '#fff', padding: '36px 48px' }}>
        <h1 style={{ fontSize: '30px', fontWeight: 900, margin: 0, color: amber, letterSpacing: '0.5px' }}>{d.personalInfo?.fullName || 'Your Name'}</h1>
        <p style={{ marginTop: '8px', color: '#aaa', fontSize: '12px' }}>
          {[d.personalInfo?.email, d.personalInfo?.phone, d.personalInfo?.location].filter(Boolean).join('  ·  ')}
        </p>
      </div>
      {/* Amber stripe */}
      <div style={{ height: '5px', backgroundColor: amber }} />

      <div style={{ padding: '32px 48px' }}>
        {d.summary && (
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '8px' }}>Summary</h2>
            <p style={{ color: '#444' }}>{d.summary}</p>
            <div style={{ height: '2px', backgroundColor: amber, opacity: 0.3, marginTop: '16px' }} />
          </div>
        )}

        {d.experience?.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '12px' }}>Experience</h2>
            {d.experience.map((exp, i) => (
              <div key={i} style={{ marginBottom: '14px', paddingLeft: '14px', borderLeft: `4px solid ${amber}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong style={{ fontSize: '14px' }}>{exp.position}</strong>
                  <span style={{ fontSize: '11px', color: '#888' }}>{exp.startDate} – {exp.current ? 'Present' : exp.endDate}</span>
                </div>
                <div style={{ color: '#888', fontWeight: 600, fontSize: '12px', marginBottom: '4px' }}>{exp.company}</div>
                <p style={{ color: '#555' }}>{exp.description}</p>
              </div>
            ))}
            <div style={{ height: '2px', backgroundColor: amber, opacity: 0.3 }} />
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
          {d.education?.length > 0 && (
            <div>
              <h2 style={{ fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '10px' }}>Education</h2>
              {d.education.map((edu, i) => (
                <div key={i} style={{ marginBottom: '10px' }}>
                  <strong>{edu.school}</strong>
                  <div style={{ color: '#666', fontSize: '12px' }}>{edu.degree}{edu.field ? ` · ${edu.field}` : ''}</div>
                  <div style={{ color: '#999', fontSize: '11px' }}>{edu.endDate}</div>
                </div>
              ))}
            </div>
          )}

          {d.skills?.length > 0 && (
            <div>
              <h2 style={{ fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '10px' }}>Skills</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {d.skills.map((s, i) => (
                  <span key={i} style={{ backgroundColor: 'rgba(245,158,11,0.15)', border: `1px solid ${amber}`, color: '#333', padding: '3px 10px', borderRadius: '3px', fontSize: '11px', fontWeight: 600 }}>{s}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
