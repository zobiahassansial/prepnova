import React from 'react';
import { ResumeData } from '@/types/resume';

export const templateMeta = { id: 'sidebar', name: 'Sidebar', category: 'modern' };

interface Props { data: ResumeData; scale?: number; }

export function TemplateSidebar({ data }: Props) {
  const d = data;
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', display: 'flex', minHeight: '100%', backgroundColor: '#fff', fontSize: '12px', lineHeight: '1.6' }}>
      {/* Purple left accent + sidebar */}
      <div style={{ width: '4px', backgroundColor: '#6366f1', flexShrink: 0 }} />
      <div style={{ width: '200px', backgroundColor: '#f5f5f5', padding: '32px 20px', flexShrink: 0 }}>
        <div style={{ width: '72px', height: '72px', borderRadius: '50%', backgroundColor: '#d1d5db', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', color: '#9ca3af' }}>
          {(d.personalInfo?.fullName || 'U').charAt(0).toUpperCase()}
        </div>
        <h1 style={{ fontSize: '15px', fontWeight: 700, textAlign: 'center', margin: '0 0 4px', color: '#222' }}>{d.personalInfo?.fullName || 'Your Name'}</h1>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '10px', color: '#888', lineHeight: '1.6', wordBreak: 'break-all' }}>
            {d.personalInfo?.email && <div>{d.personalInfo.email}</div>}
            {d.personalInfo?.phone && <div>{d.personalInfo.phone}</div>}
            {d.personalInfo?.location && <div>{d.personalInfo.location}</div>}
          </div>
        </div>

        {d.skills?.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', color: '#6366f1', marginBottom: '8px' }}>Skills</h3>
            {d.skills.map((s, i) => (
              <div key={i} style={{ backgroundColor: 'rgba(99,102,241,0.12)', color: '#4f46e5', borderRadius: '12px', padding: '3px 10px', marginBottom: '4px', fontSize: '11px', textAlign: 'center' }}>{s}</div>
            ))}
          </div>
        )}

        {d.education?.length > 0 && (
          <div>
            <h3 style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', color: '#6366f1', marginBottom: '8px' }}>Education</h3>
            {d.education.map((edu, i) => (
              <div key={i} style={{ marginBottom: '10px' }}>
                <div style={{ fontWeight: 600, fontSize: '11px' }}>{edu.school}</div>
                <div style={{ color: '#888', fontSize: '10px' }}>{edu.degree}</div>
                <div style={{ color: '#aaa', fontSize: '10px' }}>{edu.endDate}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main content */}
      <div style={{ flex: 1, padding: '32px 32px' }}>
        {d.summary && (
          <div style={{ marginBottom: '22px' }}>
            <h2 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#6366f1', marginBottom: '8px' }}>Profile</h2>
            <p style={{ color: '#555' }}>{d.summary}</p>
          </div>
        )}

        {d.experience?.length > 0 && (
          <div>
            <h2 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#6366f1', marginBottom: '12px' }}>Work Experience</h2>
            {d.experience.map((exp, i) => (
              <div key={i} style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #f0f0f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong style={{ color: '#222' }}>{exp.position}</strong>
                  <span style={{ fontSize: '11px', color: '#888' }}>{exp.startDate} – {exp.current ? 'Present' : exp.endDate}</span>
                </div>
                <div style={{ color: '#6366f1', fontSize: '12px', marginBottom: '4px' }}>{exp.company}</div>
                <p style={{ color: '#555', fontSize: '12px' }}>{exp.description}</p>
              </div>
            ))}
          </div>
        )}

        {d.projects?.length > 0 && (
          <div style={{ marginTop: '8px' }}>
            <h2 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#6366f1', marginBottom: '12px' }}>Projects</h2>
            {d.projects.map((proj, i) => (
              <div key={i} style={{ marginBottom: '10px' }}>
                <strong style={{ color: '#222' }}>{proj.name}</strong>
                <p style={{ color: '#555', fontSize: '12px' }}>{proj.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
