$DIR = "c:\solar-protostar\components\dashboard\resume-templates"
if (!(Test-Path -Path $DIR)) {
    New-Item -ItemType Directory -Path $DIR
}

$templates = @(
  @{ id="classic"; name="Classic"; category="professional" },
  @{ id="modern"; name="Modern"; category="professional" },
  @{ id="minimal"; name="Minimal"; category="minimal" },
  @{ id="executive"; name="Executive"; category="professional" },
  @{ id="creative"; name="Creative"; category="creative" },
  @{ id="compact"; name="Compact"; category="professional" },
  @{ id="two-column"; name="Two Column"; category="modern" },
  @{ id="sidebar"; name="Sidebar"; category="modern" },
  @{ id="elegant"; name="Elegant"; category="minimal" },
  @{ id="bold"; name="Bold"; category="creative" },
  @{ id="academic"; name="Academic"; category="academic" },
  @{ id="tech"; name="Tech"; category="creative" },
  @{ id="clean"; name="Clean"; category="minimal" },
  @{ id="timeline"; name="Timeline"; category="creative" },
  @{ id="infographic"; name="Infographic"; category="creative" }
)

$indexContent = ""

foreach ($t in $templates) {
    $parts = $t.id -split "-"
    $pascal = ($parts | ForEach-Object { $_.Substring(0,1).ToUpper() + $_.Substring(1) }) -join ""
    $componentName = "Template$pascal"
    
    $content = @"
import React from 'react';
import { ResumeData } from '@/types/resume';

export const templateMeta = {
  id: '$($t.id)',
  name: '$($t.name)',
  category: '$($t.category)',
  thumbnail: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTQwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjE0MCIgZmlsbD0iI2Y1ZjVmNSIvPjwvc3ZnPg=='
};

interface Props {
  data: ResumeData;
  scale?: number;
}

export function $componentName`({ data, scale = 1 }: Props) {
  return (
    <div style={{ transform: \`scale(\`$scale)\`, transformOrigin: 'top left', padding: '40px', fontFamily: 'sans-serif', backgroundColor: '#fff', color: '#333' }}>
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
"@
    
    $filePath = Join-Path $DIR "template-$($t.id).tsx"
    Set-Content -Path $filePath -Value $content
    $indexContent += "export * from './template-$($t.id)';" + [Environment]::NewLine
}

$customContent = @"
import React from 'react';
import { ResumeData } from '@/types/resume';

export const templateMeta = {
  id: 'custom',
  name: 'Custom (HTML)',
  category: 'custom',
  thumbnail: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTQwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjE0MCIgZmlsbD0iIzMzMyIvPjx0ZXh0IHg9IjUwIiB5PSI3MCIgZmlsbD0iI2ZmZiIgZm9udC1zaXplPSIzMCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Y3VzdG9tPC90ZXh0Pjwvc3ZnPg=='
};

interface Props {
  data: ResumeData;
  scale?: number;
}

export function TemplateCustom({ data, scale = 1 }: Props) {
  if (!data.customTemplateHtml) {
    return (
      <div style={{ transform: \`scale(\`$scale)\`, transformOrigin: 'top left', padding: '40px', background: '#f5f5f5', textAlign: 'center' }}>
        <h2 style={{color: '#666'}}>No custom template provided</h2>
      </div>
    );
  }

  let renderedHtml = data.customTemplateHtml;
  renderedHtml = renderedHtml.replace(/{{fullName}}/g, data.personalInfo?.fullName || '');
  renderedHtml = renderedHtml.replace(/{{email}}/g, data.personalInfo?.email || '');
  renderedHtml = renderedHtml.replace(/{{phone}}/g, data.personalInfo?.phone || '');
  renderedHtml = renderedHtml.replace(/{{summary}}/g, data.summary || '');

  return (
    <div style={{ transform: \`scale(\`$scale)\`, transformOrigin: 'top left', width: '100%', height: '100%' }}>
      <iframe 
        srcDoc={renderedHtml} 
        sandbox="allow-scripts" 
        style={{ width: '100%', height: '100%', border: 'none', minHeight: '800px' }} 
      />
    </div>
  );
}
"@
Set-Content -Path (Join-Path $DIR "template-custom.tsx") -Value $customContent
$indexContent += "export * from './template-custom';" + [Environment]::NewLine

Set-Content -Path (Join-Path $DIR "index.ts") -Value $indexContent
Write-Host "Templates generated."
