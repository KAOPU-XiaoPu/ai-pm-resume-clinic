import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Eye,
  EyeOff,
  GripVertical,
  Trash2,
  Plus,
  Minus,
  Layout,
  Type,
  Space,
  Palette,
  ChevronDown,
} from 'lucide-react'
import { useResumeStore } from '../pdf-builder/store/useResumeStore'
import { compressResumeForPdf } from '../pdf-builder/lib/compressResume'
import { templateConfigs } from '../pdf-builder/components/templates/registry'
import { reviewModelOptions, defaultModelId } from '../data/reviewConfig'
import { Card, CardHeader, CardTitle, CardContent } from '../pdf-builder/components/ui/card'
import { SliderWithInput } from '../pdf-builder/components/shared/SliderWithInput'
import { Button } from '../pdf-builder/components/ui/button'
import { ColorPicker } from '../pdf-builder/components/shared/ColorPicker'
import {
  BasicInfoPanel,
  ExperiencePanel,
  ProjectPanel,
  SkillPanel,
  EducationPanel,
  CertificatePanel,
  CustomSectionPanel,
} from '../pdf-builder/components/editor'
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
/*  Template map                                                               */
/* -------------------------------------------------------------------------- */

type TemplateFC = React.FC<{ data: ResumeData; globalSettings: GlobalSettings }>

const templateMap: Record<string, TemplateFC> = {
  classic: ClassicTemplate,
  modern: ModernTemplate,
  'left-right': LeftRightTemplate,
  timeline: TimelineTemplate,
  minimalist: MinimalistTemplate,
  elegant: ElegantTemplate,
  creative: CreativeTemplate,
  editorial: EditorialTemplate,
}

/* -------------------------------------------------------------------------- */
/*  Constants                                                                  */
/* -------------------------------------------------------------------------- */

const FONT_OPTIONS = [
  { value: "'Noto Sans SC', sans-serif", label: 'Noto Sans SC' },
  { value: "'SimSun', serif", label: '宋体' },
  { value: "'SimHei', sans-serif", label: '黑体' },
  { value: "'KaiTi', serif", label: '楷体' },
  { value: "'Microsoft YaHei', sans-serif", label: '微软雅黑' },
  { value: "'Source Han Sans', 'Noto Sans SC', sans-serif", label: '思源黑体' },
]

const SECTION_LABEL_MAP: Record<string, string> = {
  basicInfo: '基本信息',
  skills: '个人优势',
  experience: '工作经历',
  projects: '项目经历',
  education: '教育经历',
  certificates: '证书资质',
}

/* -------------------------------------------------------------------------- */
/*  Compression cache                                                          */
/* -------------------------------------------------------------------------- */

const CACHE_KEY = 'resume-compression-cache'

function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return String(Math.abs(hash))
}

function getCache(markdown: string, model: string): ResumeData | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const cache = JSON.parse(raw)
    if (
      cache.markdownHash === simpleHash(markdown) &&
      cache.model === model &&
      Date.now() - cache.timestamp < 30 * 60 * 1000
    ) {
      return cache.result
    }
    return null
  } catch {
    return null
  }
}

function setCache(markdown: string, model: string, result: ResumeData) {
  sessionStorage.setItem(
    CACHE_KEY,
    JSON.stringify({
      markdownHash: simpleHash(markdown),
      model,
      result,
      timestamp: Date.now(),
    }),
  )
}

/* -------------------------------------------------------------------------- */
/*  PDF export                                                                 */
/* -------------------------------------------------------------------------- */

function handleExportPdf(measureRef: React.RefObject<HTMLDivElement | null>) {
  const el = measureRef.current
  if (!el) return
  const printWin = window.open('', '_blank')
  if (!printWin) {
    alert('请允许弹出窗口')
    return
  }
  const styles = Array.from(
    document.querySelectorAll('style, link[rel="stylesheet"]'),
  )
    .map((s) => s.outerHTML)
    .join('')
  printWin.document.write(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><title>简历</title>${styles}<style>@page{size:A4;margin:0}body{margin:0;width:210mm}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}</style></head><body>${el.innerHTML}</body></html>`,
  )
  printWin.document.close()
  printWin.onload = () => setTimeout(() => printWin.print(), 500)
}

/* -------------------------------------------------------------------------- */
/*  Main page                                                                  */
/* -------------------------------------------------------------------------- */

interface LocationState {
  markdown?: string
  templateId?: string
  themeColor?: string
}

export default function ResumeEditorPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = (location.state ?? {}) as LocationState

  const markdown = state.markdown ?? ''
  const initialTemplateId = state.templateId ?? 'classic'
  const initialThemeColor = state.themeColor ?? '#1a1a1a'

  const store = useResumeStore()
  const previewRef = useRef<HTMLDivElement>(null)
  const previewContainerRef = useRef<HTMLDivElement>(null)
  const measureRef = useRef<HTMLDivElement>(null)

  const [model, setModel] = useState(defaultModelId)
  const [templateId] = useState(initialTemplateId)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewScale, setPreviewScale] = useState(0.55)
  const [pageCount, setPageCount] = useState(1)
  const [showExportDropdown, setShowExportDropdown] = useState(false)

  const templateName = useMemo(
    () => templateConfigs.find((t) => t.id === templateId)?.name ?? templateId,
    [templateId],
  )

  /* ---- Redirect if no markdown ---- */
  useEffect(() => {
    if (!markdown) {
      navigate('/templates', { replace: true })
    }
  }, [markdown, navigate])

  /* ---- Set theme color on mount ---- */
  useEffect(() => {
    if (initialThemeColor) {
      store.setThemeColor(initialThemeColor)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ---- Compression ---- */
  const runCompression = useCallback(
    async (selectedModel: string, bypassCache = false) => {
      if (!markdown) return
      setLoading(true)
      setError(null)
      try {
        if (!bypassCache) {
          const cached = getCache(markdown, selectedModel)
          if (cached) {
            store.setResumeData(cached)
            setLoading(false)
            return
          }
        }
        const result = await compressResumeForPdf(markdown, selectedModel)
        setCache(markdown, selectedModel, result)
        store.setResumeData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : '压缩失败')
      } finally {
        setLoading(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [markdown],
  )

  /* ---- Compress on mount ---- */
  useEffect(() => {
    runCompression(model)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ---- Initial preview scale from container width ---- */
  useEffect(() => {
    const container = previewContainerRef.current
    if (!container) return
    const w = container.clientWidth - 48
    const scale = Math.min(w / 794, 1)
    setPreviewScale(Math.round(scale * 20) / 20)
  }, [])

  /* ---- Measure content height for pagination ---- */
  useEffect(() => {
    const el = measureRef.current
    if (!el) return
    const observer = new ResizeObserver(() => {
      const h = el.scrollHeight
      const pageH = 297 * 3.7795275591
      setPageCount(Math.max(1, Math.ceil(h / pageH)))
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [store.resumeData, templateId])

  /* ---- Recompress ---- */
  const handleRecompress = () => {
    sessionStorage.removeItem(CACHE_KEY)
    runCompression(model, true)
  }

  /* ---- Add custom section ---- */
  const handleAddSection = () => {
    const name = prompt('请输入模块名称')
    if (name?.trim()) {
      store.addCustomSection(name.trim())
    }
  }

  /* ---- Template component ---- */
  const TemplateComponent = templateMap[templateId]

  /* ---- Derived data ---- */
  const gs = store.resumeData.globalSettings
  const activeSection = store.activeSection
  const sortedSections = useMemo(
    () => [...store.resumeData.menuSections].sort((a, b) => a.order - b.order),
    [store.resumeData.menuSections],
  )

  const activeSectionTitle =
    store.resumeData.menuSections.find((s) => s.id === activeSection)?.title ||
    SECTION_LABEL_MAP[activeSection] ||
    activeSection

  if (!markdown) return null

  /* -------------------------------------------------------------------------- */
  /*  Render                                                                     */
  /* -------------------------------------------------------------------------- */

  return (
    <div className="flex flex-col h-screen bg-gray-100 overflow-hidden">
      {/* ================================================================== */}
      {/*  TOP BAR                                                           */}
      {/* ================================================================== */}
      <div className="flex items-center gap-3 px-4 py-2 bg-white border-b border-gray-200 shrink-0">
        {/* Back */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/templates', { state: { markdown } })}
        >
          &larr; 返回模板
        </Button>

        <div className="h-4 w-px bg-gray-200" />

        {/* Resume name */}
        <span className="text-sm font-medium text-gray-700 truncate max-w-[160px]">
          {store.resumeData.basicInfo.name || '未命名简历'}
        </span>
        <span className="text-xs text-gray-400">{templateName}</span>

        <div className="flex-1" />

        {/* Zoom display */}
        <div className="flex items-center gap-1 bg-gray-50 rounded-md border border-gray-200 px-1">
          <button
            onClick={() => setPreviewScale((s) => Math.max(0.3, +(s - 0.05).toFixed(2)))}
            className="p-1 rounded hover:bg-gray-200 transition-colors text-gray-500"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="min-w-[3rem] text-center text-xs font-mono text-gray-600 select-none">
            {Math.round(previewScale * 100)}%
          </span>
          <button
            onClick={() => setPreviewScale((s) => Math.min(1.0, +(s + 0.05).toFixed(2)))}
            className="p-1 rounded hover:bg-gray-200 transition-colors text-gray-500"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="h-4 w-px bg-gray-200" />

        {/* Model selector */}
        <select
          className="px-2 py-1.5 text-xs border border-gray-200 rounded-md bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          value={model}
          onChange={(e) => setModel(e.target.value)}
        >
          {reviewModelOptions.map((m) => (
            <option key={m.id} value={m.id}>{m.shortLabel}</option>
          ))}
        </select>

        {/* Recompress */}
        <Button
          variant="outline"
          size="sm"
          disabled={loading}
          onClick={handleRecompress}
        >
          {loading ? '压缩中...' : '重新压缩'}
        </Button>

        {/* Export dropdown */}
        <div className="relative">
          <Button
            size="sm"
            disabled={loading}
            onClick={() => setShowExportDropdown((v) => !v)}
            className="gap-1"
          >
            导出
            <ChevronDown className="w-3 h-3" />
          </Button>
          {showExportDropdown && (
            <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
              <button
                onClick={() => {
                  handleExportPdf(measureRef)
                  setShowExportDropdown(false)
                }}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                导出 PDF
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ---- Error banner ---- */}
      {error && (
        <div className="flex items-center justify-between px-5 py-2 bg-red-50 text-red-800 text-sm border-b border-red-200 shrink-0">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-800 text-lg leading-none px-1"
          >
            &times;
          </button>
        </div>
      )}

      {/* ================================================================== */}
      {/*  MAIN 3-PANEL LAYOUT                                               */}
      {/* ================================================================== */}
      <div className="flex flex-1 overflow-hidden">

        {/* ============================================================== */}
        {/*  LEFT SIDEBAR                                                   */}
        {/* ============================================================== */}
        <div className="w-64 shrink-0 bg-white border-r border-gray-200 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
              <div className="w-6 h-6 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
              <span className="text-xs">加载中...</span>
            </div>
          ) : (
            <div className="p-3 space-y-3">

              {/* ---- Section 1: Layout ---- */}
              <Card>
                <CardHeader className="p-3 pb-2">
                  <CardTitle className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <Layout className="w-3.5 h-3.5" />
                    布局
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="space-y-0.5">
                    {sortedSections.map((sec) => {
                      const isActive = activeSection === sec.id
                      return (
                        <div
                          key={sec.id}
                          onClick={() => store.setActiveSection(sec.id)}
                          className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer transition-colors group ${
                            isActive ? 'bg-gray-50' : 'hover:bg-gray-50'
                          } ${!sec.enabled ? 'opacity-50' : ''}`}
                          style={isActive ? { borderLeft: `3px solid ${gs.themeColor}` } : { borderLeft: '3px solid transparent' }}
                        >
                          <GripVertical className="w-3.5 h-3.5 text-gray-300 shrink-0 cursor-grab" />
                          <span
                            className={`flex-1 text-sm truncate ${
                              isActive
                                ? 'font-medium text-gray-900'
                                : sec.enabled
                                  ? 'text-gray-700'
                                  : 'text-gray-400 line-through'
                            }`}
                          >
                            {sec.title || SECTION_LABEL_MAP[sec.id] || sec.id}
                          </span>
                          <button
                            onClick={(e) => { e.stopPropagation(); store.toggleSection(sec.id) }}
                            className="p-0.5 rounded hover:bg-gray-200 transition-colors"
                            title={sec.enabled ? '隐藏模块' : '显示模块'}
                          >
                            {sec.enabled ? (
                              <Eye className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600" />
                            ) : (
                              <EyeOff className="w-3.5 h-3.5 text-gray-300" />
                            )}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); store.toggleSection(sec.id) }}
                            className="p-0.5 rounded hover:bg-red-100 transition-colors"
                            title="移除模块"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-gray-300 group-hover:text-red-400" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                  <button
                    onClick={handleAddSection}
                    className="mt-2 w-full flex items-center justify-center gap-1 py-1.5 text-xs text-gray-500 border border-dashed border-gray-200 rounded-md hover:bg-gray-50 hover:text-gray-700 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    添加模块
                  </button>
                </CardContent>
              </Card>

              {/* ---- Section 2: Theme Color ---- */}
              <Card>
                <CardHeader className="p-3 pb-2">
                  <CardTitle className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <Palette className="w-3.5 h-3.5" />
                    主题色
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <ColorPicker
                    value={gs.themeColor}
                    onChange={(color) => store.setThemeColor(color)}
                  />
                </CardContent>
              </Card>

              {/* ---- Section 3: Typography ---- */}
              <Card>
                <CardHeader className="p-3 pb-2">
                  <CardTitle className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <Type className="w-3.5 h-3.5" />
                    排版
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 space-y-4">
                  {/* Font family */}
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs text-gray-500">字体</span>
                    <select
                      className="px-2 py-1.5 text-xs border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      value={gs.fontFamily}
                      onChange={(e) => store.updateGlobalSettings({ fontFamily: e.target.value })}
                    >
                      {FONT_OPTIONS.map((f) => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                      ))}
                    </select>
                  </label>

                  {/* Line height */}
                  <SliderWithInput label="行高" value={gs.lineHeight} min={1.0} max={3.0} step={0.1} decimals={1} onChange={(v) => store.updateGlobalSettings({ lineHeight: v })} />
                  <SliderWithInput label="基础字号" value={gs.fontSize} min={6} max={24} step={0.1} unit="pt" decimals={1} onChange={(v) => store.updateGlobalSettings({ fontSize: v })} />
                  <SliderWithInput label="标题字号" value={gs.headerSize} min={8} max={40} step={0.1} unit="pt" decimals={1} onChange={(v) => store.updateGlobalSettings({ headerSize: v })} />
                  <SliderWithInput label="副标题字号" value={gs.subheaderSize} min={6} max={32} step={0.1} unit="pt" decimals={1} onChange={(v) => store.updateGlobalSettings({ subheaderSize: v })} />
                </CardContent>
              </Card>

              {/* ---- Section 4: Spacing ---- */}
              <Card>
                <CardHeader className="p-3 pb-2">
                  <CardTitle className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <Space className="w-3.5 h-3.5" />
                    间距
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 space-y-4">
                  <SliderWithInput label="页边距" value={gs.pagePadding} min={8} max={96} step={0.1} unit="px" decimals={1} onChange={(v) => store.updateGlobalSettings({ pagePadding: v })} />
                  <SliderWithInput label="模块间距" value={gs.sectionSpacing} min={0} max={48} step={0.1} unit="px" decimals={1} onChange={(v) => store.updateGlobalSettings({ sectionSpacing: v })} />
                  <SliderWithInput label="段落间距" value={gs.paragraphSpacing} min={0} max={32} step={0.1} unit="px" decimals={1} onChange={(v) => store.updateGlobalSettings({ paragraphSpacing: v })} />
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/*  CENTER EDIT PANEL                                              */}
        {/* ============================================================== */}
        <div className="flex-1 overflow-y-auto bg-white border-r border-gray-200">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-500">
              <div className="w-8 h-8 border-3 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
              <p className="text-sm">AI 正在压缩简历内容...</p>
            </div>
          ) : (
            <div className="p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">
                {activeSectionTitle}
              </h2>
              <EditorPanel sectionId={activeSection} />
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/*  RIGHT PREVIEW PANEL                                            */}
        {/* ============================================================== */}
        <div
          ref={previewContainerRef}
          className="w-[50%] shrink-0 bg-gray-100 overflow-auto flex flex-col"
        >
          {/* Hidden measuring container */}
          <div
            ref={measureRef}
            aria-hidden
            className="fixed left-[-9999px] top-0"
            style={{ width: '210mm', visibility: 'hidden' }}
          >
            {TemplateComponent && (
              <TemplateComponent
                data={store.resumeData}
                globalSettings={gs}
              />
            )}
          </div>

          {/* Visible paginated preview */}
          <div
            ref={previewRef}
            className="flex flex-col items-center gap-6 p-6 flex-1"
          >
            {Array.from({ length: pageCount }).map((_, i) => (
              <div
                key={i}
                style={{
                  transform: `scale(${previewScale})`,
                  transformOrigin: 'top center',
                  marginBottom: `${-(1 - previewScale) * 297 * 3.7795}px`,
                }}
              >
                <div
                  {...(i === 0 ? { 'data-resume-page': '' } : {})}
                  className="bg-white shadow-lg relative"
                  style={{
                    width: '210mm',
                    height: '297mm',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ marginTop: `${-i * 297}mm` }}>
                    {TemplateComponent && (
                      <TemplateComponent
                        data={store.resumeData}
                        globalSettings={gs}
                      />
                    )}
                  </div>
                  <div className="absolute bottom-2 right-3 text-[8pt] text-gray-300 select-none">
                    {i + 1} / {pageCount}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Close export dropdown on outside click */}
      {showExportDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowExportDropdown(false)}
        />
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Editor panel router                                                        */
/* -------------------------------------------------------------------------- */

function EditorPanel({ sectionId }: { sectionId: string }) {
  switch (sectionId) {
    case 'basicInfo':
      return <BasicInfoPanel />
    case 'skills':
      return <SkillPanel />
    case 'experience':
      return <ExperiencePanel />
    case 'projects':
      return <ProjectPanel />
    case 'education':
      return <EducationPanel />
    case 'certificates':
      return <CertificatePanel />
    default:
      return <CustomSectionPanel sectionId={sectionId} />
  }
}
