import { useState } from 'react'
import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { useResumeStore } from '../../store/useResumeStore'
import { DateRangeInput } from '../shared/DateRangeInput'

export function EducationPanel() {
  const store = useResumeStore()
  const items = store.resumeData.education
  const [expandedId, setExpandedId] = useState<string | null>(
    items[0]?.id ?? null,
  )

  const inputClass =
    'w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-blue-400 transition-colors'

  const toggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  return (
    <div className="space-y-3">
      {items.map((edu) => {
        const isOpen = expandedId === edu.id
        return (
          <div
            key={edu.id}
            className="rounded-lg border border-gray-200 bg-white"
          >
            {/* Header */}
            <button
              type="button"
              onClick={() => toggle(edu.id)}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
            >
              {isOpen ? (
                <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
              )}
              <div className="min-w-0 flex-1">
                <span className="text-sm font-medium">
                  {edu.school || '未填写学校'}
                </span>
                {edu.degree && (
                  <span className="ml-2 text-xs text-gray-500">
                    {edu.degree}
                  </span>
                )}
              </div>
              <span className="shrink-0 text-xs text-gray-400">
                {edu.startDate}
                {edu.endDate ? ` - ${edu.endDate}` : ''}
              </span>
            </button>

            {/* Expanded body */}
            {isOpen && (
              <div className="space-y-3 border-t border-gray-100 px-3 pb-3 pt-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500">
                      学校
                    </label>
                    <input
                      className={inputClass}
                      value={edu.school}
                      onChange={(e) =>
                        store.updateEducation(edu.id, {
                          school: e.target.value,
                        })
                      }
                      placeholder="学校名称"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500">
                      学位
                    </label>
                    <input
                      className={inputClass}
                      value={edu.degree}
                      onChange={(e) =>
                        store.updateEducation(edu.id, {
                          degree: e.target.value,
                        })
                      }
                      placeholder="本科 / 硕士"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500">
                    专业
                  </label>
                  <input
                    className={inputClass}
                    value={edu.major}
                    onChange={(e) =>
                      store.updateEducation(edu.id, { major: e.target.value })
                    }
                    placeholder="专业名称"
                  />
                </div>

                <DateRangeInput
                  startDate={edu.startDate}
                  endDate={edu.endDate}
                  onStartDateChange={(d) =>
                    store.updateEducation(edu.id, { startDate: d })
                  }
                  onEndDateChange={(d) =>
                    store.updateEducation(edu.id, { endDate: d })
                  }
                />

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500">
                    描述
                  </label>
                  <textarea
                    className={`${inputClass} min-h-16 resize-y`}
                    value={edu.description}
                    onChange={(e) =>
                      store.updateEducation(edu.id, {
                        description: e.target.value,
                      })
                    }
                    placeholder="在校经历、荣誉等..."
                    rows={2}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => store.removeEducation(edu.id)}
                  className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  删除此教育经历
                </button>
              </div>
            )}
          </div>
        )
      })}

      <button
        type="button"
        onClick={store.addEducation}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 py-2.5 text-sm text-gray-500 transition-colors hover:border-blue-400 hover:text-blue-600"
      >
        <Plus className="h-4 w-4" />
        添加教育经历
      </button>
    </div>
  )
}
