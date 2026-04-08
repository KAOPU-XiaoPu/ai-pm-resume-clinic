import { useState } from 'react'
import { ChevronDown, ChevronRight, Plus, Trash2, X } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useResumeStore } from '../../store/useResumeStore'
import { DateRangeInput } from '../shared/DateRangeInput'

export function ExperiencePanel() {
  const store = useResumeStore()
  const items = store.resumeData.experience
  const [expandedId, setExpandedId] = useState<string | null>(
    items[0]?.id ?? null,
  )

  const inputClass =
    'w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-blue-400 transition-colors'

  const toggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  const addHighlight = (id: string) => {
    const item = items.find((e) => e.id === id)
    if (!item) return
    store.updateExperience(id, { highlights: [...item.highlights, ''] })
  }

  const updateHighlight = (id: string, index: number, value: string) => {
    const item = items.find((e) => e.id === id)
    if (!item) return
    const next = [...item.highlights]
    next[index] = value
    store.updateExperience(id, { highlights: next })
  }

  const removeHighlight = (id: string, index: number) => {
    const item = items.find((e) => e.id === id)
    if (!item) return
    store.updateExperience(id, {
      highlights: item.highlights.filter((_, i) => i !== index),
    })
  }

  return (
    <div className="space-y-3">
      {items.map((exp) => {
        const isOpen = expandedId === exp.id
        return (
          <div
            key={exp.id}
            className="rounded-lg border border-gray-200 bg-white"
          >
            {/* Header */}
            <button
              type="button"
              onClick={() => toggle(exp.id)}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
            >
              {isOpen ? (
                <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
              )}
              <div className="min-w-0 flex-1">
                <span className="text-sm font-medium">
                  {exp.company || '未填写公司'}
                </span>
                {exp.position && (
                  <span className="ml-2 text-xs text-gray-500">
                    {exp.position}
                  </span>
                )}
              </div>
              <span className="shrink-0 text-xs text-gray-400">
                {exp.startDate}
                {exp.endDate ? ` - ${exp.endDate}` : ''}
              </span>
            </button>

            {/* Expanded body */}
            {isOpen && (
              <div className="space-y-3 border-t border-gray-100 px-3 pb-3 pt-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500">
                      公司
                    </label>
                    <input
                      className={inputClass}
                      value={exp.company}
                      onChange={(e) =>
                        store.updateExperience(exp.id, {
                          company: e.target.value,
                        })
                      }
                      placeholder="公司名称"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500">
                      职位
                    </label>
                    <input
                      className={inputClass}
                      value={exp.position}
                      onChange={(e) =>
                        store.updateExperience(exp.id, {
                          position: e.target.value,
                        })
                      }
                      placeholder="职位名称"
                    />
                  </div>
                </div>

                <DateRangeInput
                  startDate={exp.startDate}
                  endDate={exp.endDate}
                  onStartDateChange={(d) =>
                    store.updateExperience(exp.id, { startDate: d })
                  }
                  onEndDateChange={(d) =>
                    store.updateExperience(exp.id, { endDate: d })
                  }
                />

                {/* Highlights */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-gray-500">
                      工作亮点
                    </label>
                    <button
                      type="button"
                      onClick={() => addHighlight(exp.id)}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                    >
                      <Plus className="h-3 w-3" />
                      添加
                    </button>
                  </div>
                  {exp.highlights.map((h, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <input
                        className={cn(inputClass, 'flex-1')}
                        value={h}
                        onChange={(e) =>
                          updateHighlight(exp.id, i, e.target.value)
                        }
                        placeholder="描述工作亮点..."
                      />
                      <button
                        type="button"
                        onClick={() => removeHighlight(exp.id, i)}
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
                  onClick={() => store.removeExperience(exp.id)}
                  className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  删除此经历
                </button>
              </div>
            )}
          </div>
        )
      })}

      <button
        type="button"
        onClick={store.addExperience}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 py-2.5 text-sm text-gray-500 transition-colors hover:border-blue-400 hover:text-blue-600"
      >
        <Plus className="h-4 w-4" />
        添加工作经历
      </button>
    </div>
  )
}
