import { useState, useMemo } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { templateConfigs } from '../pdf-builder/components/templates/registry'
import { sampleResumeData } from '../pdf-builder/config/initialResumeData'
import type { ResumeData, GlobalSettings } from '../pdf-builder/types'

import ClassicTemplate from '../pdf-builder/components/templates/classic'
import ModernTemplate from '../pdf-builder/components/templates/modern'
import LeftRightTemplate from '../pdf-builder/components/templates/left-right'
import TimelineTemplate from '../pdf-builder/components/templates/timeline'
import MinimalistTemplate from '../pdf-builder/components/templates/minimalist'
import ElegantTemplate from '../pdf-builder/components/templates/elegant'
import CreativeTemplate from '../pdf-builder/components/templates/creative'
import EditorialTemplate from '../pdf-builder/components/templates/editorial'

/* -------------------------------------------------------------------------- */
/*  Constants                                                                  */
/* -------------------------------------------------------------------------- */

type TemplateFC = React.FC<{ data: ResumeData; globalSettings: GlobalSettings }>

const templateComponentMap: Record<string, TemplateFC> = {
  classic: ClassicTemplate,
  modern: ModernTemplate,
  'left-right': LeftRightTemplate,
  timeline: TimelineTemplate,
  minimalist: MinimalistTemplate,
  elegant: ElegantTemplate,
  creative: CreativeTemplate,
  editorial: EditorialTemplate,
}

const COLOR_SWATCHES = [
  { color: '#1a1a1a', label: '黑色' },
  { color: '#1e40af', label: '蓝色' },
  { color: '#0d9488', label: '青色' },
  { color: '#7c3aed', label: '紫色' },
  { color: '#ea580c', label: '橙色' },
  { color: '#64748b', label: '灰色' },
]

/* -------------------------------------------------------------------------- */
/*  Confirm Dialog                                                             */
/* -------------------------------------------------------------------------- */

function ConfirmDialog({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          开始转换
        </h3>
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
          即将使用AI将当前最新的在线简历内容转换为PDF简历格式，转换过程会自动优化排版结构。是否开始？
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
          >
            开始转换
          </button>
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Preview Modal                                                              */
/* -------------------------------------------------------------------------- */

function PreviewModal({
  templateId,
  themeColor,
  onClose,
}: {
  templateId: string
  themeColor: string
  onClose: () => void
}) {
  const Component = templateComponentMap[templateId]
  const previewData = useMemo<ResumeData>(
    () => ({
      ...sampleResumeData,
      globalSettings: { ...sampleResumeData.globalSettings, themeColor },
    }),
    [themeColor],
  )

  if (!Component) return null

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-6"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/5 text-gray-500 hover:bg-black/10 hover:text-gray-700 transition-colors text-xl leading-none"
        >
          &times;
        </button>
        <div className="flex-1 overflow-auto p-6 flex justify-center">
          <div style={{ transform: 'scale(0.6)', transformOrigin: 'top center' }}>
            <Component data={previewData} globalSettings={previewData.globalSettings} />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-3 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Template Card                                                              */
/* -------------------------------------------------------------------------- */

function TemplateCard({
  id,
  name,
  description,
  themeColor,
  onPreview,
  onUse,
}: {
  id: string
  name: string
  description: string
  themeColor: string
  onPreview: () => void
  onUse: () => void
}) {
  const Component = templateComponentMap[id]
  const previewData = useMemo<ResumeData>(
    () => ({
      ...sampleResumeData,
      globalSettings: { ...sampleResumeData.globalSettings, themeColor },
    }),
    [themeColor],
  )

  if (!Component) return null

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Scaled-down preview */}
      <div className="relative w-full h-[320px] overflow-hidden bg-gray-50 border-b border-gray-100">
        <div
          className="absolute left-1/2 pointer-events-none"
          style={{
            top: '8px',
            transform: 'translateX(-50%) scale(0.36)',
            transformOrigin: 'top center',
          }}
        >
          <Component data={previewData} globalSettings={previewData.globalSettings} />
        </div>
      </div>

      {/* Info + actions */}
      <div className="p-4">
        <h3 className="text-base font-semibold text-gray-900 mb-1">{name}</h3>
        <p className="text-xs text-gray-500 mb-3 leading-relaxed">{description}</p>
        <div className="flex gap-2">
          <button
            onClick={onPreview}
            className="px-4 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            预览
          </button>
          <button
            onClick={onUse}
            className="px-4 py-1.5 text-xs font-medium text-white bg-gray-900 rounded-md hover:bg-gray-800 transition-colors"
          >
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
  const markdown = (location.state as { markdown?: string } | null)?.markdown ?? ''

  const [themeColor, setThemeColor] = useState('#1a1a1a')
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [confirmTemplateId, setConfirmTemplateId] = useState<string | null>(null)

  /* Navigate to editor after confirm */
  const handleConfirmUse = () => {
    if (!confirmTemplateId) return
    navigate('/editor', {
      state: { markdown, templateId: confirmTemplateId, themeColor },
    })
  }

  /* No markdown guard */
  if (!markdown) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500 text-sm">请先从首页进入</p>
        <Link
          to="/"
          className="text-sm text-blue-600 hover:text-blue-700 underline"
        >
          返回首页
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="sticky top-0 z-50 flex items-center gap-4 px-6 py-3 bg-white border-b border-gray-200">
        <button
          onClick={() => navigate('/')}
          className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          &larr; 返回首页
        </button>
        <h1 className="text-lg font-semibold text-gray-900 flex-1">选择模板</h1>
        <div className="flex items-center gap-2">
          {COLOR_SWATCHES.map((s) => (
            <button
              key={s.color}
              title={s.label}
              onClick={() => setThemeColor(s.color)}
              className="w-6 h-6 rounded-full border-2 transition-all shrink-0"
              style={{
                backgroundColor: s.color,
                borderColor: themeColor === s.color ? s.color : 'transparent',
                boxShadow:
                  themeColor === s.color
                    ? `0 0 0 2px #fff, 0 0 0 4px ${s.color}`
                    : 'none',
              }}
            />
          ))}
        </div>
      </div>

      {/* Template grid */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templateConfigs.map((tpl) => (
            <TemplateCard
              key={tpl.id}
              id={tpl.id}
              name={tpl.name}
              description={tpl.description}
              themeColor={themeColor}
              onPreview={() => setPreviewId(tpl.id)}
              onUse={() => setConfirmTemplateId(tpl.id)}
            />
          ))}
        </div>
      </div>

      {/* Preview modal */}
      {previewId && (
        <PreviewModal
          templateId={previewId}
          themeColor={themeColor}
          onClose={() => setPreviewId(null)}
        />
      )}

      {/* Confirm dialog */}
      {confirmTemplateId && (
        <ConfirmDialog
          onConfirm={handleConfirmUse}
          onCancel={() => setConfirmTemplateId(null)}
        />
      )}
    </div>
  )
}
