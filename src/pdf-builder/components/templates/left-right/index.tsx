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
    <h2 style={{ fontSize: gs.headerSize + 'pt' }} className="font-bold text-[var(--theme)] uppercase tracking-wide mb-1.5 pb-1 border-b border-[var(--theme)]/30">
      {children}
    </h2>
  )
}

export default function LeftRightTemplate({ data, globalSettings }: TemplateProps) {
  const enabledSections = data.menuSections
    .filter(s => s.enabled)
    .sort((a, b) => a.order - b.order)

  const info = data.basicInfo
  const gs = globalSettings
  const gap = gs.sectionSpacing
  const leftIds = new Set(['basicInfo', 'skills', 'education'])
  const leftSections = enabledSections.filter(s => leftIds.has(s.id))
  const rightSections = enabledSections.filter(s => !leftIds.has(s.id))
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
      {/* Name header */}
      <div className="mb-3 pb-2 border-b-2 border-[var(--theme)]">
        <div className="flex justify-between items-end">
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
              <h1 style={{ fontSize: (gs.headerSize + 6) + 'pt' }} className="font-bold text-[var(--theme)]">{info.name}</h1>
              {info.title && <p className="text-gray-500 mt-1.5" style={{ fontSize: gs.subheaderSize + 'pt' }}>{info.title}</p>}
            </div>
          </div>
          <div className="text-right text-[length:8pt] text-gray-500 space-y-1.5">
            {info.phone && (
              <p className="inline-flex items-center gap-1 justify-end w-full">
                <Phone className="w-3 h-3" /> {info.phone}
              </p>
            )}
            {info.email && (
              <p className="inline-flex items-center gap-1 justify-end w-full">
                <Mail className="w-3 h-3" /> {info.email}
              </p>
            )}
            {info.website && (
              <p className="inline-flex items-center gap-1 justify-end w-full text-[var(--theme)]">
                <Globe className="w-3 h-3" /> {info.website}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Two columns */}
      <div className="flex gap-4" style={{ height: 'calc(100% - 60px)' }}>
        {/* Left column */}
        <div className="w-1/2 pr-4 border-r border-[var(--theme)]/20">
          {leftSections.map(section => {
            if (section.id === 'basicInfo') {
              return (
                <div key={section.id} style={{ marginBottom: gap }}>
                  <SectionTitle gs={gs}>基本信息</SectionTitle>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[length:8.5pt]">
                    {info.gender && <p><span className="text-gray-400">性别：</span>{info.gender}</p>}
                    {info.age && <p><span className="text-gray-400">年龄：</span>{info.age}</p>}
                    {info.workYears && <p><span className="text-gray-400">经验：</span>{info.workYears}</p>}
                    {info.education && <p><span className="text-gray-400">学历：</span>{info.education}</p>}
                    {info.university && <p><span className="text-gray-400">院校：</span>{info.university}</p>}
                    {info.major && <p><span className="text-gray-400">专业：</span>{info.major}</p>}
                  </div>
                </div>
              )
            }
            if (section.id === 'skills') {
              return (
                <div key={section.id} style={{ marginBottom: gap }}>
                  <SectionTitle gs={gs}>个人优势</SectionTitle>
                  <ul className="space-y-1">
                    {data.skills.map((s, i) => (
                      <li key={i} className="text-[length:8.5pt]">
                        <span className="font-semibold text-[var(--theme)]">{s.name}</span>
                        {s.description && <span className="text-gray-600">：{s.description}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            }
            if (section.id === 'education') {
              return (
                <div key={section.id} style={{ marginBottom: gap }}>
                  <SectionTitle gs={gs}>教育经历</SectionTitle>
                  {data.education.map((edu, i) => (
                    <div key={i} className="break-inside-avoid" style={{ marginBottom: gs.paragraphSpacing }}>
                      <p className="font-bold" style={{ fontSize: gs.subheaderSize + 'pt' }}>{edu.school}</p>
                      <p className="text-[length:8.5pt] text-gray-600">{edu.degree} · {edu.major}</p>
                      <p className="text-[length:8pt] text-gray-400">{edu.startDate} - {edu.endDate}</p>
                      {edu.description && <p className="text-[length:8pt] text-gray-500 mt-1.5">{edu.description}</p>}
                    </div>
                  ))}
                </div>
              )
            }
            return null
          })}
        </div>

        {/* Right column */}
        <div className="w-1/2 pl-1">
          {rightSections.map(section => {
            if (section.id === 'experience') {
              return (
                <div key={section.id} style={{ marginBottom: gap }}>
                  <SectionTitle gs={gs}>工作经历</SectionTitle>
                  {data.experience.map((exp, i) => (
                    <div key={i} className="break-inside-avoid" style={{ marginBottom: gs.paragraphSpacing }}>
                      <div className="flex justify-between items-baseline">
                        <span className="font-bold" style={{ fontSize: gs.subheaderSize + 'pt' }}>{exp.company}</span>
                        <span className="text-gray-400 text-[length:7.5pt] shrink-0">{exp.startDate} - {exp.endDate}</span>
                      </div>
                      <p className="text-[length:8.5pt] text-[var(--theme)]">{exp.position}</p>
                      <ul className="list-disc pl-3.5 mt-0.5 space-y-1.5">
                        {exp.highlights.map((h, j) => (
                          <li key={j} className="text-[length:8.5pt] text-gray-700">{h}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )
            }
            if (section.id === 'projects') {
              return (
                <div key={section.id} style={{ marginBottom: gap }}>
                  <SectionTitle gs={gs}>项目经历</SectionTitle>
                  {data.projects.map((proj, i) => (
                    <div key={i} className="break-inside-avoid" style={{ marginBottom: gs.paragraphSpacing }}>
                      <div className="flex justify-between items-baseline">
                        <span className="font-bold" style={{ fontSize: gs.subheaderSize + 'pt' }}>{proj.name}</span>
                        <span className="text-gray-400 text-[length:7.5pt] shrink-0">{proj.startDate} - {proj.endDate}</span>
                      </div>
                      <p className="text-[length:8pt] text-[var(--theme)]">{proj.role}</p>
                      {proj.description && <p className="text-[length:8pt] text-gray-500 italic mt-1.5">{proj.description}</p>}
                      <ul className="list-disc pl-3.5 mt-0.5 space-y-1.5">
                        {proj.highlights.map((h, j) => (
                          <li key={j} className="text-[length:8.5pt] text-gray-700">{h}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )
            }
            return null
          })}
        </div>
      </div>
    </div>
  )
}
