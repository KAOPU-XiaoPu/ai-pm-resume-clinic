import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ClassicTemplate } from '../pdf-builder/templates/ClassicTemplate'
import { ModernTemplate } from '../pdf-builder/templates/ModernTemplate'
import { TimelineTemplate } from '../pdf-builder/templates/TimelineTemplate'
import { MinimalistTemplate } from '../pdf-builder/templates/MinimalistTemplate'
import { getColorScheme } from '../pdf-builder/lib/templateRegistry'
import { compressResumeForPdf } from '../pdf-builder/lib/compressResume'
import { exportResumePdf } from '../pdf-builder/lib/pdfExport'
import { reviewModelOptions, defaultModelId } from '../data/reviewConfig'
import type {
  TemplateId,
  ColorScheme,
  PdfResumeData,
  PdfBasicInfo,
} from '../pdf-builder/types'
import '../pdf-builder/templates/templateStyles.css'

/* -------------------------------------------------------------------------- */
/*  Template renderer                                                          */
/* -------------------------------------------------------------------------- */

function renderTemplate(id: TemplateId, data: PdfResumeData, scheme: ColorScheme) {
  switch (id) {
    case 'classic':
      return <ClassicTemplate data={data} colorScheme={scheme} />
    case 'modern':
      return <ModernTemplate data={data} colorScheme={scheme} />
    case 'timeline':
      return <TimelineTemplate data={data} colorScheme={scheme} />
    case 'minimalist':
      return <MinimalistTemplate data={data} colorScheme={scheme} />
    default:
      return <ClassicTemplate data={data} colorScheme={scheme} />
  }
}

/* -------------------------------------------------------------------------- */
/*  Empty resume skeleton                                                      */
/* -------------------------------------------------------------------------- */

function emptyResume(): PdfResumeData {
  return {
    basicInfo: {
      name: '',
      gender: '',
      age: '',
      phone: '',
      email: '',
      education: '',
      university: '',
      major: '',
      workYears: '',
      jobTarget: '',
      website: '',
    },
    strengths: [],
    workExperience: [],
    projectExperience: [],
  }
}

/* -------------------------------------------------------------------------- */
/*  Collapsible section                                                        */
/* -------------------------------------------------------------------------- */

function Section({
  title,
  defaultOpen = true,
  children,
}: {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={styles.section}>
      <button style={styles.sectionHeader} onClick={() => setOpen(!open)}>
        <span>{open ? '▾' : '▸'} {title}</span>
      </button>
      {open && <div style={styles.sectionBody}>{children}</div>}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Field components                                                           */
/* -------------------------------------------------------------------------- */

function FieldInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <label style={styles.fieldLabel}>
      <span style={styles.fieldLabelText}>{label}</span>
      <input
        style={styles.fieldInput}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  )
}

function FieldTextarea({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  rows?: number
}) {
  return (
    <label style={styles.fieldLabel}>
      <span style={styles.fieldLabelText}>{label}</span>
      <textarea
        style={styles.fieldTextarea}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
      />
    </label>
  )
}

/* -------------------------------------------------------------------------- */
/*  Main page                                                                  */
/* -------------------------------------------------------------------------- */

interface LocationState {
  markdown?: string
  templateId?: TemplateId
  colorSchemeId?: string
}

export default function ResumeEditorPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = (location.state ?? {}) as LocationState

  const markdown = state.markdown ?? ''
  const templateId = state.templateId ?? 'classic'
  const colorSchemeId = state.colorSchemeId ?? 'dark'

  const [resumeData, setResumeData] = useState<PdfResumeData>(emptyResume)
  const [model, setModel] = useState(defaultModelId)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const previewRef = useRef<HTMLDivElement>(null)
  const colorScheme = getColorScheme(colorSchemeId)

  /* ---- redirect if no markdown ---- */
  useEffect(() => {
    if (!markdown) {
      navigate('/templates', { replace: true })
    }
  }, [markdown, navigate])

  /* ---- compress on mount ---- */
  const runCompression = useCallback(
    async (selectedModel: string) => {
      if (!markdown) return
      setLoading(true)
      setError(null)
      try {
        const data = await compressResumeForPdf(markdown, selectedModel)
        setResumeData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : '压缩失败')
      } finally {
        setLoading(false)
      }
    },
    [markdown],
  )

  useEffect(() => {
    runCompression(model)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ---- field updaters ---- */
  const updateBasicInfo = (field: keyof PdfBasicInfo, value: string) => {
    setResumeData((prev) => ({
      ...prev,
      basicInfo: { ...prev.basicInfo, [field]: value },
    }))
  }

  const updateStrength = (index: number, value: string) => {
    setResumeData((prev) => ({
      ...prev,
      strengths: prev.strengths.map((s, i) =>
        i === index ? { ...s, content: value } : s,
      ),
    }))
  }

  const updateWork = (index: number, field: string, value: string) => {
    setResumeData((prev) => ({
      ...prev,
      workExperience: prev.workExperience.map((w, i) =>
        i === index ? { ...w, [field]: value } : w,
      ),
    }))
  }

  const updateProject = (index: number, field: string, value: string) => {
    setResumeData((prev) => ({
      ...prev,
      projectExperience: prev.projectExperience.map((p, i) =>
        i === index ? { ...p, [field]: value } : p,
      ),
    }))
  }

  /* ---- export ---- */
  const handleExport = () => {
    if (!previewRef.current) return
    exportResumePdf(previewRef.current, resumeData.basicInfo.name || '简历')
  }

  /* ---- basic info fields ---- */
  const basicInfoFields: { key: keyof PdfBasicInfo; label: string }[] = [
    { key: 'name', label: '姓名' },
    { key: 'gender', label: '性别' },
    { key: 'age', label: '年龄' },
    { key: 'phone', label: '电话' },
    { key: 'email', label: '邮箱' },
    { key: 'education', label: '学历' },
    { key: 'university', label: '学校' },
    { key: 'major', label: '专业' },
    { key: 'workYears', label: '工作年限' },
    { key: 'jobTarget', label: '求职意向' },
    { key: 'website', label: '个人网站' },
  ]

  if (!markdown) return null

  return (
    <div style={styles.page}>
      {/* ---- top bar ---- */}
      <div style={styles.topBar}>
        <button style={styles.backBtn} onClick={() => navigate('/templates', { state: { markdown } })}>
          &larr; 返回模板
        </button>
        <h1 style={styles.title}>简历编辑器</h1>

        <div style={styles.topBarRight}>
          <select
            style={styles.modelSelect}
            value={model}
            onChange={(e) => setModel(e.target.value)}
          >
            {reviewModelOptions.map((m) => (
              <option key={m.id} value={m.id}>
                {m.shortLabel}
              </option>
            ))}
          </select>

          <button
            style={styles.actionBtn}
            disabled={loading}
            onClick={() => runCompression(model)}
          >
            {loading ? '压缩中...' : '重新压缩'}
          </button>

          <button
            style={{ ...styles.actionBtn, ...styles.exportBtn }}
            disabled={loading}
            onClick={handleExport}
          >
            导出PDF
          </button>
        </div>
      </div>

      {/* ---- error banner ---- */}
      {error && (
        <div style={styles.errorBanner}>
          {error}
          <button style={styles.errorClose} onClick={() => setError(null)}>
            &times;
          </button>
        </div>
      )}

      {/* ---- main layout ---- */}
      <div style={styles.main}>
        {/* ---- left: editor ---- */}
        <div style={styles.editorPanel}>
          {loading ? (
            <div style={styles.loadingWrap}>
              <div style={styles.spinner} />
              <p>AI 正在压缩简历...</p>
            </div>
          ) : (
            <div style={styles.editorScroll}>
              {/* basic info */}
              <Section title="个人信息">
                <div style={styles.fieldGrid}>
                  {basicInfoFields.map((f) => (
                    <FieldInput
                      key={f.key}
                      label={f.label}
                      value={resumeData.basicInfo[f.key]}
                      onChange={(v) => updateBasicInfo(f.key, v)}
                    />
                  ))}
                </div>
              </Section>

              {/* strengths */}
              <Section title={`个人优势 (${resumeData.strengths.length})`}>
                {resumeData.strengths.map((s, i) => (
                  <FieldTextarea
                    key={s.id}
                    label={`优势 ${i + 1}`}
                    value={s.content}
                    onChange={(v) => updateStrength(i, v)}
                    rows={2}
                  />
                ))}
              </Section>

              {/* work experience */}
              <Section title={`工作经历 (${resumeData.workExperience.length})`}>
                {resumeData.workExperience.map((w, i) => (
                  <div key={w.id} style={styles.entryCard}>
                    <div style={styles.fieldGrid}>
                      <FieldInput
                        label="公司"
                        value={w.company}
                        onChange={(v) => updateWork(i, 'company', v)}
                      />
                      <FieldInput
                        label="职位"
                        value={w.title}
                        onChange={(v) => updateWork(i, 'title', v)}
                      />
                      <FieldInput
                        label="开始时间"
                        value={w.startDate}
                        onChange={(v) => updateWork(i, 'startDate', v)}
                      />
                      <FieldInput
                        label="结束时间"
                        value={w.endDate}
                        onChange={(v) => updateWork(i, 'endDate', v)}
                      />
                    </div>
                    <FieldTextarea
                      label="工作内容"
                      value={w.content}
                      onChange={(v) => updateWork(i, 'content', v)}
                      rows={5}
                    />
                  </div>
                ))}
              </Section>

              {/* project experience */}
              <Section title={`项目经历 (${resumeData.projectExperience.length})`}>
                {resumeData.projectExperience.map((p, i) => (
                  <div key={p.id} style={styles.entryCard}>
                    <div style={styles.fieldGrid}>
                      <FieldInput
                        label="项目名称"
                        value={p.name}
                        onChange={(v) => updateProject(i, 'name', v)}
                      />
                      <FieldInput
                        label="标签"
                        value={p.tag}
                        onChange={(v) => updateProject(i, 'tag', v)}
                      />
                      <FieldInput
                        label="开始时间"
                        value={p.startDate}
                        onChange={(v) => updateProject(i, 'startDate', v)}
                      />
                      <FieldInput
                        label="结束时间"
                        value={p.endDate}
                        onChange={(v) => updateProject(i, 'endDate', v)}
                      />
                    </div>
                    <FieldTextarea
                      label="项目背景"
                      value={p.background}
                      onChange={(v) => updateProject(i, 'background', v)}
                      rows={3}
                    />
                    <FieldTextarea
                      label="职责描述"
                      value={p.responsibilities}
                      onChange={(v) => updateProject(i, 'responsibilities', v)}
                      rows={4}
                    />
                    <FieldTextarea
                      label="项目成果"
                      value={p.results}
                      onChange={(v) => updateProject(i, 'results', v)}
                      rows={3}
                    />
                  </div>
                ))}
              </Section>
            </div>
          )}
        </div>

        {/* ---- right: preview ---- */}
        <div style={styles.previewPanel}>
          <div style={styles.previewScroll}>
            <div style={styles.a4Wrapper}>
              <div ref={previewRef} style={styles.a4Page}>
                {renderTemplate(templateId, resumeData, colorScheme)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Styles                                                                     */
/* -------------------------------------------------------------------------- */

const styles: Record<string, React.CSSProperties> = {
  page: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    background: '#f5f5f5',
    overflow: 'hidden',
  },

  /* top bar */
  topBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 20px',
    background: '#fff',
    borderBottom: '1px solid #e5e7eb',
    flexShrink: 0,
  },
  backBtn: {
    background: 'none',
    border: '1px solid #d1d5db',
    borderRadius: 6,
    padding: '6px 14px',
    cursor: 'pointer',
    fontSize: 14,
    color: '#374151',
  },
  title: {
    fontSize: 18,
    fontWeight: 600,
    margin: 0,
    color: '#111827',
    flex: 1,
  },
  topBarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  modelSelect: {
    padding: '6px 10px',
    borderRadius: 6,
    border: '1px solid #d1d5db',
    fontSize: 13,
    background: '#fff',
    color: '#374151',
  },
  actionBtn: {
    padding: '6px 16px',
    borderRadius: 6,
    border: '1px solid #d1d5db',
    background: '#fff',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
    color: '#374151',
  },
  exportBtn: {
    background: '#2563eb',
    color: '#fff',
    border: 'none',
  },

  /* error */
  errorBanner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 20px',
    background: '#fef2f2',
    color: '#991b1b',
    fontSize: 14,
    borderBottom: '1px solid #fecaca',
    flexShrink: 0,
  },
  errorClose: {
    background: 'none',
    border: 'none',
    fontSize: 18,
    cursor: 'pointer',
    color: '#991b1b',
    padding: '0 4px',
  },

  /* main */
  main: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },

  /* editor panel */
  editorPanel: {
    width: '40%',
    minWidth: 360,
    borderRight: '1px solid #e5e7eb',
    background: '#fff',
    display: 'flex',
    flexDirection: 'column',
  },
  editorScroll: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px 20px',
  },
  loadingWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: 12,
    color: '#6b7280',
  },
  spinner: {
    width: 32,
    height: 32,
    border: '3px solid #e5e7eb',
    borderTopColor: '#2563eb',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },

  /* sections */
  section: {
    marginBottom: 16,
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    overflow: 'hidden',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    padding: '10px 14px',
    background: '#f9fafb',
    border: 'none',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
    color: '#374151',
    textAlign: 'left',
  },
  sectionBody: {
    padding: '12px 14px',
  },

  /* fields */
  fieldGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
  },
  fieldLabel: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    marginBottom: 8,
  },
  fieldLabelText: {
    fontSize: 12,
    fontWeight: 500,
    color: '#6b7280',
  },
  fieldInput: {
    padding: '6px 10px',
    border: '1px solid #d1d5db',
    borderRadius: 6,
    fontSize: 13,
    color: '#111827',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box' as const,
  },
  fieldTextarea: {
    padding: '6px 10px',
    border: '1px solid #d1d5db',
    borderRadius: 6,
    fontSize: 13,
    color: '#111827',
    outline: 'none',
    resize: 'vertical' as const,
    fontFamily: 'inherit',
    width: '100%',
    boxSizing: 'border-box' as const,
  },
  entryCard: {
    padding: '12px 0',
    borderBottom: '1px solid #f3f4f6',
  },

  /* preview panel */
  previewPanel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    background: '#e5e7eb',
  },
  previewScroll: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    justifyContent: 'center',
    padding: '24px 16px',
  },
  a4Wrapper: {
    width: 595,
    flexShrink: 0,
  },
  a4Page: {
    width: 595,
    minHeight: 842,
    background: '#fff',
    boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
    transformOrigin: 'top center',
  },
}
