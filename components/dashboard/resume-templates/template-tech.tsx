import React from 'react';
import { ResumeData } from '@/types/resume';

export const templateMeta = { id: 'tech', name: 'Tech', category: 'creative' };

interface Props { data: ResumeData; scale?: number; }

export function TemplateTech({ data }: Props) {
  const d = data;
  const green = '#00ff88';
  const bg = '#0d1117';
  const surface = '#161b22';
  const muted = '#8b949e';
  return (
    <div style={{ fontFamily: "'Courier New', monospace", backgroundColor: bg, color: '#e6edf3', fontSize: '12.5px', lineHeight: '1.6', padding: '36px 44px', minHeight: '100%' }}>
      {/* Header with green accent */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
        <div style={{ width: '5px', backgroundColor: green, borderRadius: '2px', flexShrink: 0 }} />
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 700, margin: 0, color: '#e6edf3' }}>{d.personalInfo?.fullName || 'Your Name'}</h1>
          <p style={{ marginTop: '6px', color: green, fontSize: '12px' }}>
            {[d.personalInfo?.email, d.personalInfo?.phone, d.personalInfo?.location].filter(Boolean).join('  //  ')}
          </p>
        </div>
      </div>

      {d.summary && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ color: green, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '4px' }}>/* Summary */</div>
          <div style={{ height: '1px', backgroundColor: 'rgba(0,255,136,0.2)', marginBottom: '10px' }} />
          <p style={{ color: muted }}>{d.summary}</p>
        </div>
      )}

      {d.skills?.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ color: green, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '4px' }}>/* Skills */</div>
          <div style={{ height: '1px', backgroundColor: 'rgba(0,255,136,0.2)', marginBottom: '10px' }} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {d.skills.map((s, i) => (
              <span key={i} style={{ backgroundColor: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)', color: green, padding: '3px 10px', borderRadius: '4px', fontSize: '11px' }}>{s}</span>
            ))}
          </div>
        </div>
      )}

      {d.experience?.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ color: green, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '4px' }}>/* Experience */</div>
          <div style={{ height: '1px', backgroundColor: 'rgba(0,255,136,0.2)', marginBottom: '10px' }} />
          {d.experience.map((exp, i) => (
            <div key={i} style={{ backgroundColor: surface, borderRadius: '6px', padding: '12px 16px', marginBottom: '10px', borderLeft: `2px solid ${green}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong style={{ color: '#e6edf3' }}>{exp.position}</strong>
                <span style={{ fontSize: '11px', color: muted }}>{exp.startDate} – {exp.current ? 'Now' : exp.endDate}</span>
              </div>
              <div style={{ color: green, fontSize: '12px', marginBottom: '4px' }}>{exp.company}</div>
              <p style={{ color: muted, fontSize: '12px' }}>{exp.description}</p>
            </div>
          ))}
        </div>
      )}

      {d.education?.length > 0 && (
        <div>
          <div style={{ color: green, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '4px' }}>/* Education */</div>
          <div style={{ height: '1px', backgroundColor: 'rgba(0,255,136,0.2)', marginBottom: '10px' }} />
          {d.education.map((edu, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div>
                <span style={{ color: '#e6edf3', fontWeight: 600 }}>{edu.school}</span>
                <span style={{ color: muted, fontSize: '11px', marginLeft: '8px' }}>{edu.degree}{edu.field ? ` · ${edu.field}` : ''}</span>
              </div>
              <span style={{ fontSize: '11px', color: muted }}>{edu.endDate}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
