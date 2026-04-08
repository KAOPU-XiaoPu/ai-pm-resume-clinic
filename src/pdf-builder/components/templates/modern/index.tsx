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

function SidebarSection({ title, children, gs }: { title: string; children: React.ReactNode; gs: GlobalSettings }) {
  return (
    <div className="mb-3 break-inside-avoid">
      <h3 style={{ fontSize: gs.subheaderSize + 'pt' }} className="font-bold uppercase tracking-wider text-white/80 mb-1.5 border-b border-white/30 pb-1">{title}</h3>
      {children}
    </div>
  )
}

function MainSection({ title, children, gap, gs }: { title: string; children: React.ReactNode; gap: number; gs: GlobalSettings }) {
  return (
    <div style={{ marginTop: gap }}>
      <h2 style={{ fontSize: gs.headerSize + 'pt' }} className="font-bold text-[var(--theme)] mb-2 pb-1 border-b border-gray-200">{title}</h2>
      {children}
    </div>
  )
}

export default function ModernTemplate({ data, globalSettings }: TemplateProps) {
  const enabledSections = data.menuSections
    .filter(s => s.enabled)
    .sort((a, b) => a.order - b.order)

  const info = data.basicInfo
  const gs = globalSettings
  const gap = gs.sectionSpacing
  const sidebarSections = enabledSections.filter(s => ['skills', 'education'].includes(s.id))
  const mainSections = enabledSections.filter(s => ['experience', 'projects'].includes(s.id))
  const showPhoto = !!(info.photo && info.photoConfig?.visible)

  return (
    <div
      className="bg-white text-gray-900 flex"
      style={{
        width: '210mm', minHeight: '297mm', paddingBottom: '20mm',
        fontFamily: gs.fontFamily,
        fontSize: `${gs.fontSize}pt`,
        lineHeight: gs.lineHeight,
        '--theme': gs.themeColor,
      } as React.CSSProperties}
    >
      {/* Left Sidebar */}
      <div className="w-[30%] bg-[var(--theme)] text-white p-5 flex flex-col">
        {showPhoto && (
          <div className="mb-4 flex justify-center">
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
          </div>
        )}
        <div className="mb-4 text-center">
          <h1 style={{ fontSize: (gs.headerSize + 2) + 'pt' }} className="font-bold">{info.name}</h1>
          {info.title && <p className="text-white/80 mt-1.5" style={{ fontSize: gs.subheaderSize + 'pt' }}>{info.title}</p>}
        </div>

        <SidebarSection title="联系方式" gs={gs}>
          <div className="space-y-1 text-[length:8pt]">
            {info.phone && (
              <p className="inline-flex items-center gap-1">
                <Phone className="w-3 h-3" /> {info.phone}
              </p>
            )}
            {info.email && (
              <p className="inline-flex items-center gap-1">
                <Mail className="w-3 h-3" /> {info.email}
              </p>
            )}
            {info.website && (
              <p className="inline-flex items-center gap-1">
                <Globe className="w-3 h-3" /> {info.website}
              </p>
            )}
          </div>
        </SidebarSection>

        <SidebarSection title="基本信息" gs={gs}>
          <div className="space-y-1.5 text-[length:8pt]">
            {info.gender && <p>性别：{info.gender}</p>}
            {info.age && <p>年龄：{info.age}</p>}
            {info.workYears && <p>工作年限：{info.workYears}</p>}
            {info.university && <p>院校：{info.university}</p>}
            {info.education && <p>学历：{info.education}</p>}
            {info.major && <p>专业：{info.major}</p>}
          </div>
        </SidebarSection>

        {sidebarSections.map(section => {
          if (section.id === 'skills') {
            return (
              <SidebarSection key={section.id} title="个人优势" gs={gs}>
                <ul className="space-y-1">
                  {data.skills.map((s, i) => (
                    <li key={i} className="text-[length:8pt]">
                      <span className="font-semibold">{s.name}</span>
                      {s.description && <p className="text-white/70 text-[length:7.5pt] mt-1.5">{s.description}</p>}
                    </li>
                  ))}
                </ul>
              </SidebarSection>
            )
          }
          if (section.id === 'education') {
            return (
              <SidebarSection key={section.id} title="教育经历" gs={gs}>
                {data.education.map((edu, i) => (
                  <div key={i} className="text-[length:8pt]" style={{ marginBottom: gs.paragraphSpacing }}>
                    <p className="font-semibold">{edu.school}</p>
                    <p className="text-white/70">{edu.degree} · {edu.major}</p>
                    <p className="text-white/60 text-[length:7.5pt]">{edu.startDate} - {edu.endDate}</p>
                  </div>
                ))}
              </SidebarSection>
            )
          }
          return null
        })}
      </div>

      {/* Right Main */}
      <div className="w-[70%] p-5">
        {mainSections.map(section => {
          if (section.id === 'experience') {
            return (
              <MainSection key={section.id} title="工作经历" gap={gap} gs={gs}>
                {data.experience.map((exp, i) => (
                  <div key={i} className="break-inside-avoid" style={{ marginBottom: gs.paragraphSpacing }}>
                    <div className="flex justify-between items-baseline">
                      <div>
                        <span className="font-bold" style={{ fontSize: gs.subheaderSize + 'pt' }}>{exp.company}</span>
                        <span className="ml-2 text-gray-500">{exp.position}</span>
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
              </MainSection>
            )
          }
          if (section.id === 'projects') {
            return (
              <MainSection key={section.id} title="项目经历" gap={gap} gs={gs}>
                {data.projects.map((proj, i) => (
                  <div key={i} className="break-inside-avoid" style={{ marginBottom: gs.paragraphSpacing }}>
                    <div className="flex justify-between items-baseline">
                      <div className="flex items-center gap-2">
                        <span className="font-bold" style={{ fontSize: gs.subheaderSize + 'pt' }}>{proj.name}</span>
                        <span className="text-[length:7.5pt] px-1.5 py-0.5 rounded-sm border border-[var(--theme)] text-[var(--theme)]">{proj.role}</span>
                      </div>
                      <span className="text-gray-400 text-[length:8pt] shrink-0">{proj.startDate} - {proj.endDate}</span>
                    </div>
                    {proj.description && <p className="text-gray-500 italic mt-1.5">{proj.description}</p>}
                    <ul className="list-disc pl-4 mt-1 space-y-1.5">
                      {proj.highlights.map((h, j) => (
                        <li key={j} className="text-gray-700">{h}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </MainSection>
            )
          }
          return null
        })}
      </div>
    </div>
  )
}
