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
    <h2 className="flex items-center gap-2 font-semibold text-gray-800 mb-3" style={{ fontSize: gs.headerSize + 'pt' }}>
      <span className="w-4 h-px bg-[var(--theme)]" />
      {children}
    </h2>
  )
}

function renderSection(id: string, data: ResumeData, gs: GlobalSettings) {
  const gap = gs.sectionSpacing
  switch (id) {
    case 'skills':
      return (
        <div key={id} style={{ marginTop: gap }}>
          <SectionTitle gs={gs}>个人优势</SectionTitle>
          <div className="space-y-1 pl-6">
            {data.skills.map((s, i) => (
              <p key={i} className="text-gray-700">
                <span className="font-medium">{s.name}</span>
                {s.description && <span className="text-gray-500">：{s.description}</span>}
              </p>
            ))}
          </div>
        </div>
      )
    case 'experience':
      return (
        <div key={id} style={{ marginTop: gap }}>
          <SectionTitle gs={gs}>工作经历</SectionTitle>
          <div className="pl-6">
            {data.experience.map((exp, i) => (
              <div key={i} className="break-inside-avoid" style={{ marginBottom: gs.paragraphSpacing }}>
                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="font-semibold text-gray-800" style={{ fontSize: gs.subheaderSize + 'pt' }}>{exp.company}</span>
                    <span className="ml-2 text-[var(--theme)]">{exp.position}</span>
                  </div>
                  <span className="text-[length:8pt] text-gray-400 shrink-0 font-light">{exp.startDate} - {exp.endDate}</span>
                </div>
                <ul className="mt-1 space-y-1.5">
                  {exp.highlights.map((h, j) => (
                    <li key={j} className="text-gray-600 pl-2 relative before:content-[''] before:absolute before:left-0 before:top-[5pt] before:w-1 before:h-1 before:bg-[var(--theme)]/40 before:rounded-full">
                      {h}
                    </li>
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
          <div className="pl-6">
            {data.projects.map((proj, i) => (
              <div key={i} className="break-inside-avoid" style={{ marginBottom: gs.paragraphSpacing }}>
                <div className="flex justify-between items-baseline">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-800" style={{ fontSize: gs.subheaderSize + 'pt' }}>{proj.name}</span>
                    <span className="text-[length:7.5pt] text-[var(--theme)] border border-[var(--theme)]/30 px-1.5 py-0.5 rounded">{proj.role}</span>
                  </div>
                  <span className="text-[length:8pt] text-gray-400 shrink-0 font-light">{proj.startDate} - {proj.endDate}</span>
                </div>
                {proj.description && <p className="text-gray-500 italic mt-1.5">{proj.description}</p>}
                <ul className="mt-1 space-y-1.5">
                  {proj.highlights.map((h, j) => (
                    <li key={j} className="text-gray-600 pl-2 relative before:content-[''] before:absolute before:left-0 before:top-[5pt] before:w-1 before:h-1 before:bg-[var(--theme)]/40 before:rounded-full">
                      {h}
                    </li>
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
          <div className="pl-6">
            {data.education.map((edu, i) => (
              <div key={i} className="break-inside-avoid" style={{ marginBottom: gs.paragraphSpacing }}>
                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="font-semibold text-gray-800" style={{ fontSize: gs.subheaderSize + 'pt' }}>{edu.school}</span>
                    <span className="ml-2 text-gray-500">{edu.degree} · {edu.major}</span>
                  </div>
                  <span className="text-[length:8pt] text-gray-400 shrink-0 font-light">{edu.startDate} - {edu.endDate}</span>
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

export default function ElegantTemplate({ data, globalSettings }: TemplateProps) {
  const enabledSections = data.menuSections
    .filter(s => s.enabled)
    .sort((a, b) => a.order - b.order)

  const info = data.basicInfo
  const gs = globalSettings
  const detailParts = [info.gender, info.age, info.workYears, info.university, info.education, info.major].filter(Boolean)
  const showPhoto = !!(info.photo && info.photoConfig?.visible)

  return (
    <div
      className="bg-white text-gray-900 font-serif"
      style={{
        width: '210mm', minHeight: '297mm', paddingBottom: '20mm',
        fontFamily: gs.fontFamily,
        fontSize: `${gs.fontSize}pt`,
        lineHeight: gs.lineHeight,
        padding: `${gs.pagePadding}px`,
        '--theme': gs.themeColor,
      } as React.CSSProperties}
    >
      {/* Top accent bar */}
      <div className="h-1 bg-[var(--theme)] mb-4 rounded-full" />

      {/* Header */}
      <div className="mb-3 break-inside-avoid">
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
            <h1 style={{ fontSize: (gs.headerSize + 6) + 'pt' }} className="font-bold text-gray-800 tracking-wide">{info.name}</h1>
            {info.title && <p className="text-[var(--theme)] mt-0.5 italic" style={{ fontSize: gs.subheaderSize + 'pt' }}>{info.title}</p>}
            <div className="flex gap-3 mt-1.5 text-[length:8pt] text-gray-500">
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
            <div className="flex gap-3 mt-0.5 text-[length:8pt] text-gray-400">
              {detailParts.map((p, i) => (
                <span key={i}>{p}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="h-px bg-gray-200 mb-3" />

      {/* Sections */}
      {enabledSections.map(section => renderSection(section.id, data, gs))}
    </div>
  )
}
