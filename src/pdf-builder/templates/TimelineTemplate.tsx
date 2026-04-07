import type { ColorScheme, PdfResumeData } from '../types'

interface TemplateProps {
  data: PdfResumeData
  colorScheme: ColorScheme
}

export function TimelineTemplate({ data, colorScheme }: TemplateProps) {
  const { basicInfo, strengths, workExperience, projectExperience } = data

  return (
    <div className="resume-tpl resume-tpl--timeline" style={{ '--tpl-primary': colorScheme.primary, '--tpl-secondary': colorScheme.secondary, '--tpl-accent': colorScheme.accent } as React.CSSProperties}>
      <header className="resume-tpl__header">
        <h1 className="resume-tpl__name">{basicInfo.name}</h1>
        <div className="resume-tpl__meta">
          {[basicInfo.gender, basicInfo.age, basicInfo.phone, basicInfo.email, basicInfo.university, basicInfo.education, basicInfo.major].filter(Boolean).join(' | ')}
        </div>
        <div className="resume-tpl__meta">
          {[basicInfo.workYears && `${basicInfo.workYears}工作经验`, basicInfo.jobTarget && `求职意向：${basicInfo.jobTarget}`].filter(Boolean).join(' | ')}
        </div>
        {basicInfo.website ? <div className="resume-tpl__meta">{basicInfo.website}</div> : null}
      </header>

      {strengths.length > 0 ? (
        <section className="resume-tpl__section">
          <h2 className="resume-tpl__section-title">个人优势</h2>
          <div className="resume-tpl__divider" />
          <ul className="resume-tpl__list">
            {strengths.map((s) => (
              <li key={s.id}>{s.content}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {workExperience.length > 0 ? (
        <section className="resume-tpl__section">
          <h2 className="resume-tpl__section-title">工作经历</h2>
          <div className="resume-tpl__divider" />
          <div className="resume-tpl__timeline">
            {workExperience.map((w) => (
              <div key={w.id} className="resume-tpl__entry">
                <div className="resume-tpl__timeline-dot" />
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
          </div>
        </section>
      ) : null}

      {projectExperience.length > 0 ? (
        <section className="resume-tpl__section">
          <h2 className="resume-tpl__section-title">项目经历</h2>
          <div className="resume-tpl__divider" />
          <div className="resume-tpl__timeline">
            {projectExperience.map((p) => (
              <div key={p.id} className="resume-tpl__entry">
                <div className="resume-tpl__timeline-dot" />
                <div className="resume-tpl__entry-header">
                  <strong>{p.name}</strong>
                  {p.tag ? <span className="resume-tpl__tag">{p.tag}</span> : null}
                  <span className="resume-tpl__date">{p.startDate} - {p.endDate}</span>
                </div>
                {p.background ? (
                  <div className="resume-tpl__entry-body">
                    <p>{p.background}</p>
                  </div>
                ) : null}
                {p.responsibilities ? (
                  <div className="resume-tpl__entry-body">
                    <p className="resume-tpl__label">职责描述</p>
                    {p.responsibilities.split('\n').map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                ) : null}
                {p.results ? (
                  <div className="resume-tpl__entry-body">
                    <p className="resume-tpl__label">项目成果</p>
                    {p.results.split('\n').map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
