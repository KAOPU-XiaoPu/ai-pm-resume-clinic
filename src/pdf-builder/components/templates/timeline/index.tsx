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

function TimelineItem({ date, children, gs }: { date: string; children: React.ReactNode; gs: GlobalSettings }) {
  return (
    <div className="flex gap-3" style={{ marginBottom: gs.paragraphSpacing }}>
      <div className="flex flex-col items-center w-20 shrink-0">
        <span className="text-[length:7.5pt] text-gray-400 text-right w-full">{date}</span>
      </div>
      <div className="relative flex flex-col items-center">
        <div className="w-2.5 h-2.5 rounded-full bg-[var(--theme)] shrink-0 mt-0.5 z-10" />
        <div className="w-px flex-1 bg-[var(--theme)]/30" />
      </div>
      <div className="flex-1 pb-1">{children}</div>
    </div>
  )
}

function SectionHeader({ title, gs }: { title: string; gs: GlobalSettings }) {
  return (
    <div className="flex items-center gap-2 mb-2 mt-1.5">
      <div className="w-20 shrink-0" />
      <div className="w-2.5 flex justify-center"><div className="w-1 h-1 rounded-full bg-[var(--theme)]/50" /></div>
      <h2 style={{ fontSize: gs.headerSize + 'pt' }} className="font-bold text-[var(--theme)] tracking-wide">{title}</h2>
    </div>
  )
}

export default function TimelineTemplate({ data, globalSettings }: TemplateProps) {
  const enabledSections = data.menuSections
    .filter(s => s.enabled)
    .sort((a, b) => a.order - b.order)

  const info = data.basicInfo
  const gs = globalSettings
  const detailParts = [info.gender, info.age, info.university, info.education].filter(Boolean)
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
      <div className="mb-3 pb-2 border-b border-gray-200">
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
            <div className="flex flex-wrap gap-3 text-[length:8pt] text-gray-400 mt-1.5">
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
                <span className="inline-flex items-center gap-1 text-[var(--theme)]">
                  <Globe className="w-3 h-3" /> {info.website}
                </span>
              )}
            </div>
            {detailParts.length > 0 && (
              <p className="text-[length:8pt] text-gray-400 mt-1">{detailParts.join(' | ')}</p>
            )}
          </div>
        </div>
      </div>

      {/* Timeline sections */}
      {enabledSections.map(section => {
        if (section.id === 'skills') {
          return (
            <div key={section.id}>
              <SectionHeader title="个人优势" gs={gs} />
              {data.skills.map((s, i) => (
                <TimelineItem key={i} date="" gs={gs}>
                  <p>
                    <span className="font-semibold">{s.name}</span>
                    {s.description && <span className="text-gray-600">：{s.description}</span>}
                  </p>
                </TimelineItem>
              ))}
            </div>
          )
        }
        if (section.id === 'experience') {
          return (
            <div key={section.id}>
              <SectionHeader title="工作经历" gs={gs} />
              {data.experience.map((exp, i) => (
                <TimelineItem key={i} date={`${exp.startDate} - ${exp.endDate}`} gs={gs}>
                  <div>
                    <p className="font-bold" style={{ fontSize: gs.subheaderSize + 'pt' }}>{exp.company}<span className="font-normal text-gray-500 ml-2">{exp.position}</span></p>
                    <ul className="list-disc pl-3.5 mt-0.5 space-y-1.5">
                      {exp.highlights.map((h, j) => (
                        <li key={j} className="text-gray-700">{h}</li>
                      ))}
                    </ul>
                  </div>
                </TimelineItem>
              ))}
            </div>
          )
        }
        if (section.id === 'projects') {
          return (
            <div key={section.id}>
              <SectionHeader title="项目经历" gs={gs} />
              {data.projects.map((proj, i) => (
                <TimelineItem key={i} date={`${proj.startDate} - ${proj.endDate}`} gs={gs}>
                  <div>
                    <p className="font-bold" style={{ fontSize: gs.subheaderSize + 'pt' }}>
                      {proj.name}
                      <span className="ml-2 text-[length:7.5pt] text-[var(--theme)] font-normal">{proj.role}</span>
                    </p>
                    {proj.description && <p className="text-[length:8pt] text-gray-500 italic">{proj.description}</p>}
                    <ul className="list-disc pl-3.5 mt-0.5 space-y-1.5">
                      {proj.highlights.map((h, j) => (
                        <li key={j} className="text-gray-700">{h}</li>
                      ))}
                    </ul>
                  </div>
                </TimelineItem>
              ))}
            </div>
          )
        }
        if (section.id === 'education') {
          return (
            <div key={section.id}>
              <SectionHeader title="教育经历" gs={gs} />
              {data.education.map((edu, i) => (
                <TimelineItem key={i} date={`${edu.startDate} - ${edu.endDate}`} gs={gs}>
                  <div>
                    <p className="font-bold" style={{ fontSize: gs.subheaderSize + 'pt' }}>{edu.school}</p>
                    <p className="text-gray-600">{edu.degree} · {edu.major}</p>
                    {edu.description && <p className="text-gray-500 mt-1.5">{edu.description}</p>}
                  </div>
                </TimelineItem>
              ))}
            </div>
          )
        }
        return null
      })}
    </div>
  )
}
