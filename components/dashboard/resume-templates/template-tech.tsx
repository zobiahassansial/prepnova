import React from 'react';
import { ResumeData } from '@/types/resume';

export const templateMeta = {
  id: 'tech',
  name: 'Tech',
  category: 'creative',
  thumbnail: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTQwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjE0MCIgZmlsbD0iI2Y1ZjVmNSIvPjwvc3ZnPg=='
};

interface Props {
  data: ResumeData;
  scale?: number;
}

export function TemplateTech({ data, scale = 1 }: Props) {
  return (
    <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', padding: '40px', fontFamily: 'sans-serif', backgroundColor: '#fff', color: '#333' }}>
      <h1 style={{ textAlign: 'center', fontSize: '2em', marginBottom: '10px' }}>{data.personalInfo?.fullName || 'Your Name'}</h1>
      <p style={{ textAlign: 'center', fontSize: '1em', color: '#666' }}>
        {data.personalInfo?.email} | {data.personalInfo?.phone} | {data.personalInfo?.location}
      </p>
      
      <div style={{ marginTop: '20px' }}>
        <h2 style={{ borderBottom: '1px solid #ccc', paddingBottom: '5px' }}>Summary</h2>
        <p style={{ marginTop: '10px' }}>{data.summary}</p>
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <h2 style={{ borderBottom: '1px solid #ccc', paddingBottom: '5px' }}>Experience</h2>
        {data.experience?.map((exp, i) => (
          <div key={i} style={{ marginTop: '10px' }}>
            <strong>{exp.position}</strong> at {exp.company}
            <div style={{ fontSize: '0.9em', color: '#555' }}>{exp.startDate} - {exp.endDate}</div>
            <p>{exp.description}</p>
          </div>
        ))}
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <h2 style={{ borderBottom: '1px solid #ccc', paddingBottom: '5px' }}>Education</h2>
        {data.education?.map((edu, i) => (
          <div key={i} style={{ marginTop: '10px' }}>
            <strong>{edu.degree} in {edu.field}</strong>
            <div>{edu.school}</div>
          </div>
        ))}
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <h2 style={{ borderBottom: '1px solid #ccc', paddingBottom: '5px' }}>Skills</h2>
        <p>{data.skills?.join(', ')}</p>
      </div>
    </div>
  );
}
