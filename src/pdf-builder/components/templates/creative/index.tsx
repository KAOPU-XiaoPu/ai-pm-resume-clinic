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
    <h2 style={{ fontSize: gs.headerSize + 'pt' }} className="font-bold text-[var(--theme)] mb-2 flex items-center gap-2">
      <span className="w-3 h-3 rounded-sm bg-[var(--theme)] inline-block" />
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
          <div className="flex flex-wrap gap-1.5 pl-1">
            {data.skills.map((s, i) => (
              <span
                key={i}
                className="inline-block text-[length:8pt] px-2 py-1 rounded-full border border-[var(--theme)] text-[var(--theme)] bg-[var(--theme)]/5"
                title={s.description}
              >
                {s.name}
              </span>
            ))}
          </div>
          {data.skills.some(s => s.description) && (
            <div className="mt-1.5 space-y-1.5 pl-1">
              {data.skills.filter(s => s.description).map((s, i) => (
                <p key={i} className="text-[length:8pt] text-gray-500">
                  <span className="text-[var(--theme)] font-medium">{s.name}</span>：{s.description}
                </p>
              ))}
            </div>
          )}
        </div>
      )
    case 'experience':
      return (
        <div key={id} style={{ marginTop: gap }}>
          <SectionTitle gs={gs}>工作经历</SectionTitle>
          {data.experience.map((exp, i) => (
            <div key={i} className="pl-1" style={{ marginBottom: gs.paragraphSpacing }}>
              <div className="flex justify-between items-baseline">
                <div>
                  <span className="font-bold" style={{ fontSize: gs.subheaderSize + 'pt' }}>{exp.company}</span>
                  <span className="ml-2 bg-[var(--theme)]/10 text-[var(--theme)] px-1.5 py-0.5 rounded">{exp.position}</span>
                </div>
                <span className="text-gray-400 text-[length:8pt] shrink-0">{exp.startDate} - {exp.endDate}</span>
              </div>
              <ul className="list-disc pl-4 mt-1 space-y-1.5">
                {exp.highlights.map((h, j) => (
                  <li key={j} className="text-gray-700">{h}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )
    case 'projects':
      return (
        <div key={id} style={{ marginTop: gap }}>
          <SectionTitle gs={gs}>项目经历</SectionTitle>
          {data.projects.map((proj, i) => (
            <div key={i} className="pl-1" style={{ marginBottom: gs.paragraphSpacing }}>
              <div className="flex justify-between items-baseline">
                <div className="flex items-center gap-2">
                  <span className="font-bold" style={{ fontSize: gs.subheaderSize + 'pt' }}>{proj.name}</span>
                  <span className="text-[length:7.5pt] bg-[var(--theme)] text-white px-1.5 py-0.5 rounded-full">{proj.role}</span>
                </div>
                <span className="text-gray-400 text-[length:8pt] shrink-0">{proj.startDate} - {proj.endDate}</span>
              </div>
              {proj.description && <p className="text-gray-500 italic mt-0.5 pl-0.5">{proj.description}</p>}
              <ul className="list-disc pl-4 mt-1 space-y-1.5">
                {proj.highlights.map((h, j) => (
                  <li key={j} className="text-gray-700">{h}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )
    case 'education':
      return (
        <div key={id} style={{ marginTop: gap }}>
          <SectionTitle gs={gs}>教育经历</SectionTitle>
          <div className="pl-1">
            {data.education.map((edu, i) => (
              <div key={i} className="flex justify-between items-baseline" style={{ marginBottom: gs.paragraphSpacing }}>
                <div>
                  <span className="font-semibold" style={{ fontSize: gs.subheaderSize + 'pt' }}>{edu.school}</span>
                  <span className="ml-2 text-gray-500">{edu.degree} · {edu.major}</span>
                </div>
                <span className="text-gray-400 text-[length:8pt] shrink-0">{edu.startDate} - {edu.endDate}</span>
              </div>
            ))}
          </div>
        </div>
      )
    default:
      return null
  }
}

export default function CreativeTemplate({ data, globalSettings }: TemplateProps) {
  const enabledSections = data.menuSections
    .filter(s => s.enabled)
    .sort((a, b) => a.order - b.order)

  const info = data.basicInfo
  const gs = globalSettings
  const detailParts = [info.gender, info.age, info.workYears, info.education].filter(Boolean)
  const showPhoto = !!(info.photo && info.photoConfig?.visible)

  return (
    <div
      className="bg-white text-gray-900"
      style={{
        width: '210mm', minHeight: '297mm', paddingBottom: '20mm',
        fontFamily: gs.fontFamily,
        fontSize: `${gs.fontSize}pt`,
        lineHeight: gs.lineHeight,
        '--theme': gs.themeColor,
      } as React.CSSProperties}
    >
      {/* Bold header strip */}
      <div className="bg-[var(--theme)] text-white px-6 py-4">
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
            <h1 style={{ fontSize: (gs.headerSize + 6) + 'pt' }} className="font-bold">{info.name}</h1>
            {info.title && <p className="text-white/80 mt-1.5" style={{ fontSize: gs.subheaderSize + 'pt' }}>{info.title}</p>}
            <div className="flex gap-4 mt-2 text-[length:8pt] text-white/70">
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
            <div className="flex gap-3 mt-0.5 text-[length:8pt] text-white/50">
              {detailParts.map((p, i) => (
                <span key={i}>{p}</span>
              ))}
              {info.university && <span>{info.university} · {info.major}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: `${gs.pagePadding}px` }}>
        {enabledSections.map(section => renderSection(section.id, data, gs))}
      </div>
    </div>
  )
}
