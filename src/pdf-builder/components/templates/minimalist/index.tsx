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
    <h2 style={{ fontSize: gs.headerSize + 'pt' }} className="uppercase tracking-[0.2em] text-gray-400 font-light mb-3">
      {children}
    </h2>
  )
}

function renderSection(id: string, data: ResumeData, gs: GlobalSettings) {
  const gap = gs.sectionSpacing + 4
  switch (id) {
    case 'skills':
      return (
        <div key={id} style={{ marginTop: gap }}>
          <SectionTitle gs={gs}>个人优势</SectionTitle>
          <div className="space-y-1.5">
            {data.skills.map((s, i) => (
              <p key={i} className="text-gray-600 font-light">
                {s.name}{s.description && ` — ${s.description}`}
              </p>
            ))}
          </div>
        </div>
      )
    case 'experience':
      return (
        <div key={id} style={{ marginTop: gap }}>
          <SectionTitle gs={gs}>工作经历</SectionTitle>
          {data.experience.map((exp, i) => (
            <div key={i} className="break-inside-avoid" style={{ marginBottom: gs.paragraphSpacing }}>
              <div className="flex justify-between items-baseline">
                <span className="text-gray-800" style={{ fontSize: gs.subheaderSize + 'pt' }}>{exp.company}</span>
                <span className="text-[length:7.5pt] text-gray-300">{exp.startDate} - {exp.endDate}</span>
              </div>
              <p className="text-gray-400 font-light">{exp.position}</p>
              <div className="mt-1 space-y-1.5">
                {exp.highlights.map((h, j) => (
                  <p key={j} className="text-gray-600 font-light pl-3">{h}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      )
    case 'projects':
      return (
        <div key={id} style={{ marginTop: gap }}>
          <SectionTitle gs={gs}>项目经历</SectionTitle>
          {data.projects.map((proj, i) => (
            <div key={i} className="break-inside-avoid" style={{ marginBottom: gs.paragraphSpacing }}>
              <div className="flex justify-between items-baseline">
                <span className="text-gray-800" style={{ fontSize: gs.subheaderSize + 'pt' }}>{proj.name}</span>
                <span className="text-[length:7.5pt] text-gray-300">{proj.startDate} - {proj.endDate}</span>
              </div>
              <p className="text-gray-400 font-light">{proj.role}</p>
              {proj.description && <p className="text-gray-500 font-light italic mt-1.5">{proj.description}</p>}
              <div className="mt-1 space-y-1.5">
                {proj.highlights.map((h, j) => (
                  <p key={j} className="text-gray-600 font-light pl-3">{h}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      )
    case 'education':
      return (
        <div key={id} style={{ marginTop: gap }}>
          <SectionTitle gs={gs}>教育经历</SectionTitle>
          {data.education.map((edu, i) => (
            <div key={i} className="break-inside-avoid" style={{ marginBottom: gs.paragraphSpacing }}>
              <div className="flex justify-between items-baseline">
                <span className="text-gray-800" style={{ fontSize: gs.subheaderSize + 'pt' }}>{edu.school}</span>
                <span className="text-[length:7.5pt] text-gray-300">{edu.startDate} - {edu.endDate}</span>
              </div>
              <p className="text-gray-400 font-light">{edu.degree} · {edu.major}</p>
              {edu.description && <p className="text-gray-500 font-light mt-1.5">{edu.description}</p>}
            </div>
          ))}
        </div>
      )
    default:
      return null
  }
}

export default function MinimalistTemplate({ data, globalSettings }: TemplateProps) {
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
        padding: `${gs.pagePadding + 16}px`,
        '--theme': gs.themeColor,
      } as React.CSSProperties}
    >
      {/* Header — very minimal */}
      <div className="mb-6">
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
            <h1 style={{ fontSize: (gs.headerSize + 6) + 'pt' }} className="font-light text-gray-800 tracking-wide">{info.name}</h1>
            {info.title && <p className="text-gray-400 font-light mt-1 tracking-wider" style={{ fontSize: gs.subheaderSize + 'pt' }}>{info.title}</p>}
            <div className="flex gap-4 mt-2">
              {info.phone && (
                <span className="inline-flex items-center gap-1 text-[length:8pt] text-gray-400 font-light">
                  <Phone className="w-3 h-3" /> {info.phone}
                </span>
              )}
              {info.email && (
                <span className="inline-flex items-center gap-1 text-[length:8pt] text-gray-400 font-light">
                  <Mail className="w-3 h-3" /> {info.email}
                </span>
              )}
              {info.website && (
                <span className="inline-flex items-center gap-1 text-[length:8pt] text-gray-400 font-light">
                  <Globe className="w-3 h-3" /> {info.website}
                </span>
              )}
            </div>
            <div className="flex gap-4 mt-1 text-[length:8pt] text-gray-300 font-light">
              {info.gender && <span>{info.gender}</span>}
              {info.age && <span>{info.age}</span>}
              {info.university && <span>{info.university}</span>}
              {info.education && <span>{info.education}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Sections */}
      {enabledSections.map(section => renderSection(section.id, data, gs))}
    </div>
  )
}
