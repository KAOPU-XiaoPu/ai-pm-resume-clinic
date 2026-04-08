import { Phone, Mail, Globe } from 'lucide-react'
import type { ResumeData, GlobalSettings } from '../../../types'

interface TemplateProps {
  data: ResumeData
  globalSettings: GlobalSettings
}

function renderSection(id: string, data: ResumeData, gs: GlobalSettings) {
  const gap = gs.sectionSpacing
  switch (id) {
    case 'skills':
      return (
        <div key={id} style={{ marginTop: gap }}>
          <h2 style={{ fontSize: gs.headerSize + 'pt' }} className="font-bold pb-1 mb-2 border-b-2 border-[var(--theme)] text-[var(--theme)]">个人优势</h2>
          <ul className="list-disc pl-4 space-y-1.5">
            {data.skills.map((s, i) => (
              <li key={i}>
                <span className="font-semibold">{s.name}</span>
                {s.description && <span className="text-gray-600">：{s.description}</span>}
              </li>
            ))}
          </ul>
        </div>
      )
    case 'experience':
      return (
        <div key={id} style={{ marginTop: gap }}>
          <h2 style={{ fontSize: gs.headerSize + 'pt' }} className="font-bold pb-1 mb-2 border-b-2 border-[var(--theme)] text-[var(--theme)]">工作经历</h2>
          {data.experience.map((exp, i) => (
            <div key={i} className="break-inside-avoid" style={{ marginBottom: gs.paragraphSpacing }}>
              <div className="flex justify-between items-baseline">
                <div>
                  <span className="font-bold" style={{ fontSize: gs.subheaderSize + 'pt' }}>{exp.company}</span>
                  <span className="ml-2 text-gray-600">{exp.position}</span>
                </div>
                <span className="text-gray-500 text-[length:8pt] shrink-0">{exp.startDate} - {exp.endDate}</span>
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
          <h2 style={{ fontSize: gs.headerSize + 'pt' }} className="font-bold pb-1 mb-2 border-b-2 border-[var(--theme)] text-[var(--theme)]">项目经历</h2>
          {data.projects.map((proj, i) => (
            <div key={i} className="break-inside-avoid" style={{ marginBottom: gs.paragraphSpacing }}>
              <div className="flex justify-between items-baseline">
                <div className="flex items-center gap-2">
                  <span className="font-bold" style={{ fontSize: gs.subheaderSize + 'pt' }}>{proj.name}</span>
                  <span className="text-[length:8pt] px-1.5 py-0.5 rounded bg-[var(--theme)] text-white">{proj.role}</span>
                </div>
                <span className="text-gray-500 text-[length:8pt] shrink-0">{proj.startDate} - {proj.endDate}</span>
              </div>
              {proj.description && <p className="text-gray-600 italic mt-1.5">{proj.description}</p>}
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
          <h2 style={{ fontSize: gs.headerSize + 'pt' }} className="font-bold pb-1 mb-2 border-b-2 border-[var(--theme)] text-[var(--theme)]">教育经历</h2>
          {data.education.map((edu, i) => (
            <div key={i} className="break-inside-avoid" style={{ marginBottom: gs.paragraphSpacing }}>
              <div className="flex justify-between items-baseline">
                <div>
                  <span className="font-bold" style={{ fontSize: gs.subheaderSize + 'pt' }}>{edu.school}</span>
                  <span className="ml-2 text-gray-600">{edu.degree} · {edu.major}</span>
                </div>
                <span className="text-gray-500 text-[length:8pt] shrink-0">{edu.startDate} - {edu.endDate}</span>
              </div>
              {edu.description && <p className="text-gray-600 mt-1.5">{edu.description}</p>}
            </div>
          ))}
        </div>
      )
    default:
      return null
  }
}

export default function ClassicTemplate({ data, globalSettings }: TemplateProps) {
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
        padding: `${gs.pagePadding}px`,
        '--theme': gs.themeColor,
      } as React.CSSProperties}
    >
      {/* Header */}
      {showPhoto ? (
        <div className="flex items-center gap-4 mb-4">
          <img
            src={info.photo}
            alt={info.name}
            className="shrink-0 object-cover rounded-full"
            style={{ width: 108, height: 108 }}
          />
          <div className="flex-1">
            <h1 style={{ fontSize: (gs.headerSize + 8) + 'pt' }} className="font-bold">{info.name}</h1>
            <div className="mt-1.5 text-gray-600" style={{ fontSize: (gs.fontSize + 0.5) + 'pt', lineHeight: 2 }}>
              <p className="flex items-center flex-wrap gap-3">
                {info.gender && <span>{info.gender}</span>}
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
              </p>
              <p>
                {[info.university, info.education, info.major].filter(Boolean).join(' | ')}
                {info.workYears ? ` | ${info.workYears}工作经验` : ''}
                {info.title ? ` | 求职意向：${info.title}` : ''}
              </p>
              {info.website && (
                <p className="inline-flex items-center gap-1">
                  <Globe className="w-3 h-3" /> {info.website}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center mb-4">
          <h1 style={{ fontSize: (gs.headerSize + 8) + 'pt' }} className="font-bold">{info.name}</h1>
          <div className="mt-2 text-gray-600" style={{ fontSize: (gs.fontSize + 1) + 'pt', lineHeight: 2 }}>
            <p className="flex items-center justify-center flex-wrap gap-3">
              {info.gender && <span>{info.gender}</span>}
              {info.age && <span>{info.age}</span>}
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
              {info.university && <span>{info.university}</span>}
              {info.education && <span>{info.education}</span>}
            </p>
            {info.workYears && <p>{info.workYears}工作经验{info.title ? ` | 求职意向：${info.title}` : ''}</p>}
            {info.website && (
              <p className="flex items-center justify-center gap-1">
                <Globe className="w-3 h-3" /> {info.website}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Sections */}
      {enabledSections.map(section => renderSection(section.id, data, gs))}
    </div>
  )
}
