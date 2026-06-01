import React from 'react';
import { ResumeData } from '@/types/resume';

export const templateMeta = { id: 'executive', name: 'Executive', category: 'professional' };

interface Props { data: ResumeData; scale?: number; }

export function TemplateExecutive({ data }: Props) {
  const d = data;
  return (
    <div style={{ fontFamily: 'Georgia, serif', backgroundColor: '#faf8f3', color: '#222', fontSize: '13px', lineHeight: '1.6' }}>
      {/* Dark header */}
      <div style={{ backgroundColor: '#2c2c2c', color: '#fff', padding: '36px 52px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '1px', margin: 0 }}>{d.personalInfo?.fullName || 'Your Name'}</h1>
        </div>
        <div style={{ textAlign: 'right', fontSize: '11px', color: '#ccc', lineHeight: '1.8' }}>
          {d.personalInfo?.email && <div>{d.personalInfo.email}</div>}
          {d.personalInfo?.phone && <div>{d.personalInfo.phone}</div>}
          {d.personalInfo?.location && <div>{d.personalInfo.location}</div>}
        </div>
      </div>

      <div style={{ padding: '36px 52px' }}>
        {d.summary && (
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', color: '#2c2c2c', marginBottom: '4px' }}>Executive Summary</h2>
            <div style={{ height: '1px', backgroundColor: '#c9a84c', marginBottom: '10px' }} />
            <p style={{ color: '#444', fontStyle: 'italic' }}>{d.summary}</p>
          </div>
        )}

        {d.experience?.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', color: '#2c2c2c', marginBottom: '4px' }}>Professional Experience</h2>
            <div style={{ height: '1px', backgroundColor: '#c9a84c', marginBottom: '12px' }} />
            {d.experience.map((exp, i) => (
              <div key={i} style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <strong style={{ fontSize: '14px', color: '#2c2c2c' }}>{exp.position}</strong>
                  <span style={{ fontSize: '11px', color: '#888' }}>{exp.startDate} – {exp.current ? 'Present' : exp.endDate}</span>
                </div>
                <div style={{ color: '#c9a84c', fontWeight: 600, fontSize: '12px', marginBottom: '5px' }}>{exp.company}</div>
                <p style={{ color: '#555' }}>{exp.description}</p>
              </div>
            ))}
          </div>
        )}

        {d.education?.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', color: '#2c2c2c', marginBottom: '4px' }}>Education</h2>
            <div style={{ height: '1px', backgroundColor: '#c9a84c', marginBottom: '12px' }} />
            {d.education.map((edu, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div>
                  <strong>{edu.school}</strong>
                  <div style={{ color: '#666', fontSize: '12px' }}>{edu.degree}{edu.field ? `, ${edu.field}` : ''}</div>
                </div>
                <span style={{ fontSize: '11px', color: '#888' }}>{edu.endDate}</span>
              </div>
            ))}
          </div>
        )}

        {d.skills?.length > 0 && (
          <div>
            <h2 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', color: '#2c2c2c', marginBottom: '4px' }}>Core Competencies</h2>
            <div style={{ height: '1px', backgroundColor: '#c9a84c', marginBottom: '10px' }} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {d.skills.map((s, i) => (
                <span key={i} style={{ border: '1px solid #c9a84c', color: '#555', padding: '2px 12px', fontSize: '11px' }}>{s}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
