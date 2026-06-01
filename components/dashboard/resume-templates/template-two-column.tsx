import React from 'react';
import { ResumeData } from '@/types/resume';

export const templateMeta = { id: 'two-column', name: 'Two Column', category: 'modern' };

interface Props { data: ResumeData; scale?: number; }

export function TemplateTwoColumn({ data }: Props) {
  const d = data;
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', display: 'flex', minHeight: '100%', backgroundColor: '#fff', fontSize: '12px', lineHeight: '1.6' }}>
      {/* Dark sidebar */}
      <div style={{ width: '220px', backgroundColor: '#1a2744', color: '#fff', padding: '36px 24px', flexShrink: 0 }}>
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '18px', fontWeight: 700, margin: 0, lineHeight: '1.3' }}>{d.personalInfo?.fullName || 'Your Name'}</h1>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', color: '#7ea8d8', marginBottom: '8px' }}>Contact</h3>
          <div style={{ fontSize: '11px', color: '#ccc', lineHeight: '1.8' }}>
            {d.personalInfo?.email && <div style={{ wordBreak: 'break-all' }}>{d.personalInfo.email}</div>}
            {d.personalInfo?.phone && <div>{d.personalInfo.phone}</div>}
            {d.personalInfo?.location && <div>{d.personalInfo.location}</div>}
          </div>
        </div>

        {d.skills?.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', color: '#7ea8d8', marginBottom: '8px' }}>Skills</h3>
            {d.skills.map((s, i) => (
              <div key={i} style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '3px', padding: '3px 8px', marginBottom: '4px', fontSize: '11px', color: '#ddd' }}>{s}</div>
            ))}
          </div>
        )}

        {d.education?.length > 0 && (
          <div>
            <h3 style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', color: '#7ea8d8', marginBottom: '8px' }}>Education</h3>
            {d.education.map((edu, i) => (
              <div key={i} style={{ marginBottom: '10px' }}>
                <div style={{ fontWeight: 600, fontSize: '11px' }}>{edu.school}</div>
                <div style={{ color: '#aaa', fontSize: '10px' }}>{edu.degree}{edu.field ? ` · ${edu.field}` : ''}</div>
                <div style={{ color: '#888', fontSize: '10px' }}>{edu.endDate}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main content */}
      <div style={{ flex: 1, padding: '36px 36px' }}>
        {d.summary && (
          <div style={{ marginBottom: '22px' }}>
            <h2 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#1a2744', borderBottom: '1px solid #ddd', paddingBottom: '4px', marginBottom: '8px' }}>Profile</h2>
            <p style={{ color: '#555' }}>{d.summary}</p>
          </div>
        )}

        {d.experience?.length > 0 && (
          <div>
            <h2 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#1a2744', borderBottom: '1px solid #ddd', paddingBottom: '4px', marginBottom: '12px' }}>Experience</h2>
            {d.experience.map((exp, i) => (
              <div key={i} style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong style={{ color: '#1a2744' }}>{exp.position}</strong>
                  <span style={{ fontSize: '11px', color: '#888' }}>{exp.startDate} – {exp.current ? 'Present' : exp.endDate}</span>
                </div>
                <div style={{ color: '#4a6fa5', fontSize: '12px', marginBottom: '4px' }}>{exp.company}</div>
                <p style={{ color: '#555', fontSize: '12px' }}>{exp.description}</p>
              </div>
            ))}
          </div>
        )}

        {d.projects?.length > 0 && (
          <div style={{ marginTop: '22px' }}>
            <h2 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#1a2744', borderBottom: '1px solid #ddd', paddingBottom: '4px', marginBottom: '12px' }}>Projects</h2>
            {d.projects.map((proj, i) => (
              <div key={i} style={{ marginBottom: '12px' }}>
                <strong style={{ color: '#1a2744' }}>{proj.name}</strong>
                <p style={{ color: '#555', fontSize: '12px' }}>{proj.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
