import { useState, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ClassicTemplate } from '../pdf-builder/templates/ClassicTemplate'
import { ModernTemplate } from '../pdf-builder/templates/ModernTemplate'
import { TimelineTemplate } from '../pdf-builder/templates/TimelineTemplate'
import { MinimalistTemplate } from '../pdf-builder/templates/MinimalistTemplate'
import { sampleResumeData } from '../pdf-builder/sampleData'
import { templates, colorSchemes, getColorScheme } from '../pdf-builder/lib/templateRegistry'
import type { TemplateId, ColorScheme, PdfResumeData } from '../pdf-builder/types'
import '../pdf-builder/templates/templateStyles.css'

/* -------------------------------------------------------------------------- */
/*  Template renderer helper                                                   */
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
/*  Preview Modal                                                              */
/* -------------------------------------------------------------------------- */

function PreviewModal({
  templateId,
  colorScheme,
  onClose,
  onUse,
}: {
  templateId: TemplateId
  colorScheme: ColorScheme
  onClose: () => void
  onUse: () => void
}) {
  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button style={styles.modalClose} onClick={onClose}>
          &times;
        </button>
        <div style={styles.modalBody}>
          <div style={styles.modalPreviewWrap}>
            {renderTemplate(templateId, sampleResumeData, colorScheme)}
          </div>
        </div>
        <div style={styles.modalFooter}>
          <button style={styles.btnSecondary} onClick={onClose}>
            关闭
          </button>
          <button style={styles.btnPrimary} onClick={onUse}>
            使用此模板
          </button>
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  TemplateLibraryPage                                                        */
/* -------------------------------------------------------------------------- */

export default function TemplateLibraryPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const markdown = (location.state as { markdown?: string })?.markdown ?? ''

  const [colorSchemeId, setColorSchemeId] = useState('dark')
  const [previewId, setPreviewId] = useState<TemplateId | null>(null)

  const activeScheme = getColorScheme(colorSchemeId)

  const handleUseTemplate = useCallback(
    (templateId: TemplateId) => {
      navigate('/editor', {
        state: { markdown, templateId, colorSchemeId },
      })
    },
    [navigate, markdown, colorSchemeId],
  )

  return (
    <div style={styles.page}>
      {/* Top bar */}
      <div style={styles.topBar}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>
          &larr; 返回
        </button>
        <h1 style={styles.pageTitle}>选择模板</h1>
        <div style={styles.colorPicker}>
          {colorSchemes.map((scheme) => (
            <button
              key={scheme.id}
              title={scheme.name}
              style={{
                ...styles.colorDot,
                background: scheme.primary,
                boxShadow:
                  scheme.id === colorSchemeId
                    ? `0 0 0 2px #fff, 0 0 0 4px ${scheme.primary}`
                    : 'none',
              }}
              onClick={() => setColorSchemeId(scheme.id)}
            />
          ))}
        </div>
      </div>

      {/* Template grid */}
      <div style={styles.grid}>
        {templates.map((tpl) => (
          <div key={tpl.id} style={styles.card}>
            <div style={styles.cardPreview}>
              <div style={styles.cardPreviewInner}>
                {renderTemplate(tpl.id, sampleResumeData, activeScheme)}
              </div>
            </div>
            <div style={styles.cardInfo}>
              <h3 style={styles.cardName}>{tpl.name}</h3>
              <p style={styles.cardDesc}>{tpl.description}</p>
              <div style={styles.cardActions}>
                <button
                  style={styles.btnOutline}
                  onClick={() => setPreviewId(tpl.id)}
                >
                  预览
                </button>
                <button
                  style={styles.btnPrimary}
                  onClick={() => handleUseTemplate(tpl.id)}
                >
                  使用此模板
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Preview modal */}
      {previewId ? (
        <PreviewModal
          templateId={previewId}
          colorScheme={activeScheme}
          onClose={() => setPreviewId(null)}
          onUse={() => {
            setPreviewId(null)
            handleUseTemplate(previewId)
          }}
        />
      ) : null}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Styles                                                                     */
/* -------------------------------------------------------------------------- */

const styles: Record<string, React.CSSProperties> = {
  /* Page */
  page: {
    minHeight: '100vh',
    background: '#f0f2f5',
    padding: '0 0 40px 0',
    fontFamily: "'Noto Sans SC', 'PingFang SC', sans-serif",
  },

  /* Top bar */
  topBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px 24px',
    background: '#fff',
    borderBottom: '1px solid #e5e7eb',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  backBtn: {
    background: 'none',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    padding: '6px 14px',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#374151',
    fontFamily: "'Noto Sans SC', sans-serif",
  },
  pageTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#111827',
    margin: 0,
    flex: 1,
  },
  colorPicker: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  colorDot: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    border: 'none',
    cursor: 'pointer',
    transition: 'box-shadow 0.15s',
    padding: 0,
  },

  /* Grid */
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
    gap: '24px',
    padding: '24px',
    maxWidth: '1200px',
    margin: '0 auto',
  },

  /* Card */
  card: {
    background: '#fff',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
    transition: 'box-shadow 0.2s',
  },
  cardPreview: {
    position: 'relative',
    width: '100%',
    height: '320px',
    overflow: 'hidden',
    background: '#fafafa',
    borderBottom: '1px solid #f3f4f6',
  },
  cardPreviewInner: {
    position: 'absolute',
    top: '8px',
    left: '50%',
    transform: 'translateX(-50%) scale(0.38)',
    transformOrigin: 'top center',
    pointerEvents: 'none',
  },
  cardInfo: {
    padding: '16px 20px 20px',
  },
  cardName: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#111827',
    margin: '0 0 4px 0',
  },
  cardDesc: {
    fontSize: '13px',
    color: '#6b7280',
    margin: '0 0 12px 0',
    lineHeight: 1.4,
  },
  cardActions: {
    display: 'flex',
    gap: '8px',
  },

  /* Buttons */
  btnPrimary: {
    padding: '7px 18px',
    fontSize: '13px',
    fontWeight: 500,
    color: '#fff',
    background: '#111827',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontFamily: "'Noto Sans SC', sans-serif",
  },
  btnSecondary: {
    padding: '7px 18px',
    fontSize: '13px',
    fontWeight: 500,
    color: '#374151',
    background: '#f3f4f6',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontFamily: "'Noto Sans SC', sans-serif",
  },
  btnOutline: {
    padding: '7px 18px',
    fontSize: '13px',
    fontWeight: 500,
    color: '#374151',
    background: '#fff',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    cursor: 'pointer',
    fontFamily: "'Noto Sans SC', sans-serif",
  },

  /* Modal */
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '24px',
  },
  modal: {
    position: 'relative',
    background: '#fff',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '680px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  modalClose: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    width: '32px',
    height: '32px',
    background: 'rgba(0,0,0,0.06)',
    border: 'none',
    borderRadius: '50%',
    fontSize: '20px',
    lineHeight: '32px',
    textAlign: 'center',
    cursor: 'pointer',
    color: '#6b7280',
    zIndex: 10,
    padding: 0,
  },
  modalBody: {
    flex: 1,
    overflow: 'auto',
    padding: '24px',
    display: 'flex',
    justifyContent: 'center',
  },
  modalPreviewWrap: {
    transform: 'scale(0.6)',
    transformOrigin: 'top center',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
    padding: '12px 24px',
    borderTop: '1px solid #e5e7eb',
  },
}
