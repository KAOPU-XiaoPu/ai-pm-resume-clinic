import { useState } from 'react'
import { ChevronDown, ChevronRight, Plus, Trash2, X } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useResumeStore } from '../../store/useResumeStore'
import { DateRangeInput } from '../shared/DateRangeInput'

export function ProjectPanel() {
  const store = useResumeStore()
  const items = store.resumeData.projects
  const [expandedId, setExpandedId] = useState<string | null>(
    items[0]?.id ?? null,
  )

  const inputClass =
    'w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-blue-400 transition-colors'

  const toggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  const addHighlight = (id: string) => {
    const item = items.find((p) => p.id === id)
    if (!item) return
    store.updateProject(id, { highlights: [...item.highlights, ''] })
  }

  const updateHighlight = (id: string, index: number, value: string) => {
    const item = items.find((p) => p.id === id)
    if (!item) return
    const next = [...item.highlights]
    next[index] = value
    store.updateProject(id, { highlights: next })
  }

  const removeHighlight = (id: string, index: number) => {
    const item = items.find((p) => p.id === id)
    if (!item) return
    store.updateProject(id, {
      highlights: item.highlights.filter((_, i) => i !== index),
    })
  }

  return (
    <div className="space-y-3">
      {items.map((proj) => {
        const isOpen = expandedId === proj.id
        return (
          <div
            key={proj.id}
            className="rounded-lg border border-gray-200 bg-white"
          >
            {/* Header */}
            <button
              type="button"
              onClick={() => toggle(proj.id)}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
            >
              {isOpen ? (
                <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
              )}
              <div className="min-w-0 flex-1">
                <span className="text-sm font-medium">
                  {proj.name || '未填写项目'}
                </span>
                {proj.role && (
                  <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
                    {proj.role}
                  </span>
                )}
              </div>
              <span className="shrink-0 text-xs text-gray-400">
                {proj.startDate}
                {proj.endDate ? ` - ${proj.endDate}` : ''}
              </span>
            </button>

            {/* Expanded body */}
            {isOpen && (
              <div className="space-y-3 border-t border-gray-100 px-3 pb-3 pt-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500">
                      项目名称
                    </label>
                    <input
                      className={inputClass}
                      value={proj.name}
                      onChange={(e) =>
                        store.updateProject(proj.id, { name: e.target.value })
                      }
                      placeholder="项目名称"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500">
                      项目标签
                    </label>
                    <input
                      className={inputClass}
                      value={proj.role}
                      onChange={(e) =>
                        store.updateProject(proj.id, { role: e.target.value })
                      }
                      placeholder="公司AIGC项目"
                    />
                  </div>
                </div>

                <DateRangeInput
                  startDate={proj.startDate}
                  endDate={proj.endDate}
                  onStartDateChange={(d) =>
                    store.updateProject(proj.id, { startDate: d })
                  }
                  onEndDateChange={(d) =>
                    store.updateProject(proj.id, { endDate: d })
                  }
                />

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500">
                    项目描述
                  </label>
                  <textarea
                    className={cn(inputClass, 'min-h-16 resize-y')}
                    value={proj.description}
                    onChange={(e) =>
                      store.updateProject(proj.id, {
                        description: e.target.value,
                      })
                    }
                    placeholder="项目背景和概述..."
                    rows={2}
                  />
                </div>

                {/* Highlights */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-gray-500">
                      项目亮点
                    </label>
                    <button
                      type="button"
                      onClick={() => addHighlight(proj.id)}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                    >
                      <Plus className="h-3 w-3" />
                      添加
                    </button>
                  </div>
                  {proj.highlights.map((h, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <input
                        className={cn(inputClass, 'flex-1')}
                        value={h}
                        onChange={(e) =>
                          updateHighlight(proj.id, i, e.target.value)
                        }
                        placeholder="描述项目亮点..."
                      />
                      <button
                        type="button"
                        onClick={() => removeHighlight(proj.id, i)}
                        className="mt-1 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Delete entry */}
                <button
                  type="button"
                  onClick={() => store.removeProject(proj.id)}
                  className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  删除此项目
                </button>
              </div>
            )}
          </div>
        )
      })}

      <button
        type="button"
        onClick={store.addProject}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 py-2.5 text-sm text-gray-500 transition-colors hover:border-blue-400 hover:text-blue-600"
      >
        <Plus className="h-4 w-4" />
        添加项目经历
      </button>
    </div>
  )
}
