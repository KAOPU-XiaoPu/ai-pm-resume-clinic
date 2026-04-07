import type { ColorScheme, PdfResumeData } from '../types'

interface TemplateProps {
  data: PdfResumeData
  colorScheme: ColorScheme
}

export function ModernTemplate({ data, colorScheme }: TemplateProps) {
  const { basicInfo, strengths, workExperience, projectExperience } = data

  return (
    <div className="resume-tpl resume-tpl--modern" style={{ '--tpl-primary': colorScheme.primary, '--tpl-secondary': colorScheme.secondary, '--tpl-accent': colorScheme.accent } as React.CSSProperties}>
      <aside className="resume-tpl__sidebar">
        <h1 className="resume-tpl__name">{basicInfo.name}</h1>
        <div className="resume-tpl__sidebar-info">
          {basicInfo.jobTarget ? <p><strong>{basicInfo.jobTarget}</strong></p> : null}
          {basicInfo.phone ? <p>{basicInfo.phone}</p> : null}
          {basicInfo.email ? <p>{basicInfo.email}</p> : null}
          <p>{[basicInfo.gender, basicInfo.age].filter(Boolean).join(' | ')}</p>
          <p>{[basicInfo.university, basicInfo.education].filter(Boolean).join(' | ')}</p>
          {basicInfo.workYears ? <p>{basicInfo.workYears}工作经验</p> : null}
        </div>
        {strengths.length > 0 ? (
          <div className="resume-tpl__sidebar-section">
            <h2>个人优势</h2>
            <ul>
              {strengths.map((s) => (
                <li key={s.id}>{s.content}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </aside>

      <main className="resume-tpl__main">
        {workExperience.length > 0 ? (
          <section className="resume-tpl__section">
            <h2 className="resume-tpl__section-title">工作经历</h2>
            <div className="resume-tpl__divider" />
            {workExperience.map((w) => (
              <div key={w.id} className="resume-tpl__entry">
                <div className="resume-tpl__entry-header">
                  <strong>{w.company}</strong>
                  <span>{w.title}</span>
                  <span className="resume-tpl__date">{w.startDate} - {w.endDate}</span>
                </div>
                <div className="resume-tpl__entry-body">
                  {w.content.split('\n').map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              </div>
            ))}
          </section>
        ) : null}

        {projectExperience.length > 0 ? (
          <section className="resume-tpl__section">
            <h2 className="resume-tpl__section-title">项目经历</h2>
            <div className="resume-tpl__divider" />
            {projectExperience.map((p) => (
              <div key={p.id} className="resume-tpl__entry">
                <div className="resume-tpl__entry-header">
                  <strong>{p.name}</strong>
                  {p.tag ? <span className="resume-tpl__tag">{p.tag}</span> : null}
                  <span className="resume-tpl__date">{p.startDate} - {p.endDate}</span>
                </div>
                {p.background ? <div className="resume-tpl__entry-body"><p>{p.background}</p></div> : null}
                {p.responsibilities ? (
                  <div className="resume-tpl__entry-body">
                    <p className="resume-tpl__label">职责描述</p>
                    {p.responsibilities.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                  </div>
                ) : null}
                {p.results ? (
                  <div className="resume-tpl__entry-body">
                    <p className="resume-tpl__label">项目成果</p>
                    {p.results.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                  </div>
                ) : null}
              </div>
            ))}
          </section>
        ) : null}
      </main>
    </div>
  )
}
