import { Phone, Mail, Globe } from 'lucide-react'
import type { ResumeData, GlobalSettings } from '../../../types'

interface TemplateProps {
  data: ResumeData
  globalSettings: GlobalSettings
}

function photoBorderRadius(config: ResumeData['basicInfo']['photoConfig']): string {
  if (config.borderRadius === 'full') return '50%'
  if (config.borderRadius === 'medium') return '8px'
  if (config.borderRadius === 'custom') return `${config.customBorderRadius}px`
  return '0'
}

function SectionTitle({ children, gs }: { children: React.ReactNode; gs: GlobalSettings }) {
  return (
    <div className="flex items-center justify-end gap-2 mb-3">
      <span style={{ fontSize: gs.headerSize + 'pt' }} className="font-semibold text-gray-700 tracking-wide">{children}</span>
      <span className="w-px h-4 bg-[var(--theme)]" />
    </div>
  )
}

function renderSection(id: string, data: ResumeData, gs: GlobalSettings) {
  const gap = gs.sectionSpacing
  switch (id) {
    case 'skills':
      return (
        <div key={id} style={{ marginTop: gap }}>
          <SectionTitle gs={gs}>个人优势</SectionTitle>
          <div className="space-y-1.5 mr-6">
            {data.skills.map((s, i) => (
              <p key={i} className="text-gray-600 italic pl-4 border-l-2 border-[var(--theme)]/20">
                <span className="not-italic font-medium text-gray-800">{s.name}</span>
                {s.description && ` — ${s.description}`}
              </p>
            ))}
          </div>
        </div>
      )
    case 'experience':
      return (
        <div key={id} style={{ marginTop: gap }}>
          <SectionTitle gs={gs}>工作经历</SectionTitle>
          <div className="mr-6">
            {data.experience.map((exp, i) => (
              <div key={i} className="break-inside-avoid" style={{ marginBottom: gs.paragraphSpacing }}>
                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="font-bold text-gray-800" style={{ fontSize: gs.subheaderSize + 'pt' }}>{exp.company}</span>
                    <span className="ml-2 text-[var(--theme)]">{exp.position}</span>
                  </div>
                  <span className="text-gray-400 text-[length:8pt] shrink-0">{exp.startDate} - {exp.endDate}</span>
                </div>
                <ul className="list-disc pl-4 mt-1 space-y-1.5">
                  {exp.highlights.map((h, j) => (
                    <li key={j} className="text-gray-600">{h}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )
    case 'projects':
      return (
        <div key={id} style={{ marginTop: gap }}>
          <SectionTitle gs={gs}>项目经历</SectionTitle>
          <div className="mr-6">
            {data.projects.map((proj, i) => (
              <div key={i} className="break-inside-avoid" style={{ marginBottom: gs.paragraphSpacing }}>
                <div className="flex justify-between items-baseline">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-800" style={{ fontSize: gs.subheaderSize + 'pt' }}>{proj.name}</span>
                    <span className="text-[length:7.5pt] text-[var(--theme)] font-medium">{proj.role}</span>
                  </div>
                  <span className="text-gray-400 text-[length:8pt] shrink-0">{proj.startDate} - {proj.endDate}</span>
                </div>
                {proj.description && <p className="text-gray-500 italic mt-1.5">{proj.description}</p>}
                <ul className="list-disc pl-4 mt-1 space-y-1.5">
                  {proj.highlights.map((h, j) => (
                    <li key={j} className="text-gray-600">{h}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )
    case 'education':
      return (
        <div key={id} style={{ marginTop: gap }}>
          <SectionTitle gs={gs}>教育经历</SectionTitle>
          <div className="mr-6">
            {data.education.map((edu, i) => (
              <div key={i} className="break-inside-avoid" style={{ marginBottom: gs.paragraphSpacing }}>
                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="font-semibold text-gray-800" style={{ fontSize: gs.subheaderSize + 'pt' }}>{edu.school}</span>
                    <span className="ml-2 text-gray-500">{edu.degree} · {edu.major}</span>
                  </div>
                  <span className="text-gray-400 text-[length:8pt] shrink-0">{edu.startDate} - {edu.endDate}</span>
                </div>
                {edu.description && <p className="text-gray-500 mt-1.5">{edu.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )
    default:
      return null
  }
}

export default function EditorialTemplate({ data, globalSettings }: TemplateProps) {
  const enabledSections = data.menuSections
    .filter(s => s.enabled)
    .sort((a, b) => a.order - b.order)

  const info = data.basicInfo
  const gs = globalSettings
  const showPhoto = !!(info.photo && info.photoConfig?.visible)

  return (
    <div
      className="bg-white text-gray-900"
      style={{
        width: '210mm', minHeight: '297mm', paddingBottom: '20mm',
        fontFamily: gs.fontFamily,
        fontSize: `${gs.fontSize}pt`,
        lineHeight: gs.lineHeight,
        padding: `${gs.pagePadding + 8}px ${gs.pagePadding + 24}px`,
        '--theme': gs.themeColor,
      } as React.CSSProperties}
    >
      {/* Magazine-style header */}
      <div className="mb-4 pb-3 border-b border-gray-200">
        <div className="flex items-start gap-4">
          {showPhoto && (
            <img
              src={info.photo}
              alt={info.name}
              className="shrink-0 object-cover"
              style={{
                width: info.photoConfig?.width ?? 80,
                height: info.photoConfig?.height ?? 80,
                borderRadius: photoBorderRadius(info.photoConfig ?? { borderRadius: "none", customBorderRadius: 0, width: 80, height: 80, visible: false }),
              }}
            />
          )}
          <div>
            <h1 style={{ fontSize: (gs.headerSize + 12) + 'pt' }} className="font-bold text-gray-800 leading-tight">{info.name}</h1>
            {info.title && <p className="text-[var(--theme)] mt-1.5" style={{ fontSize: gs.subheaderSize + 'pt' }}>{info.title}</p>}
            <div className="flex gap-4 mt-2 text-[length:8pt] text-gray-400">
              {info.phone && (
                <span className="inline-flex items-center gap-1">
                  <Phone className="w-3 h-3" /> {info.phone}
                </span>
              )}
              {info.email && (
                <span className="inline-flex items-center gap-1">
                  <Mail className="w-3 h-3" /> {info.email}
                </span>
              )}
              {info.website && (
                <span className="inline-flex items-center gap-1">
                  <Globe className="w-3 h-3" /> {info.website}
                </span>
              )}
            </div>
            <div className="flex gap-3 mt-0.5 text-[length:8pt] text-gray-300">
              {info.gender && <span>{info.gender}</span>}
              {info.age && <span>{info.age}</span>}
              {info.workYears && <span>{info.workYears}经验</span>}
              {info.university && <span>{info.university}</span>}
              {info.education && <span>{info.education}</span>}
              {info.major && <span>{info.major}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Sections with editorial layout */}
      {enabledSections.map(section => renderSection(section.id, data, gs))}
    </div>
  )
}
