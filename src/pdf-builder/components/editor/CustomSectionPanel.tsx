import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { DateRangeInput } from '../shared/DateRangeInput'

interface CustomItem {
  id: string
  title: string
  subtitle: string
  startDate: string
  endDate: string
  description: string
}

interface CustomSectionPanelProps {
  sectionId: string
}

export function CustomSectionPanel({ sectionId: _sectionId }: CustomSectionPanelProps) {
  const [title, setTitle] = useState('')
  const [items, setItems] = useState<CustomItem[]>([])

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        title: '',
        subtitle: '',
        startDate: '',
        endDate: '',
        description: '',
      },
    ])
  }

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const updateItem = (id: string, updates: Partial<CustomItem>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    )
  }

  const inputClass =
    'w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-blue-400 transition-colors'

  return (
    <div className="space-y-4">
      {/* Section title */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-500">板块标题</label>
        <input
          className={inputClass}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="自定义板块名称"
        />
      </div>

      {/* Items */}
      {items.map((item) => (
        <div
          key={item.id}
          className="space-y-2 rounded-lg border border-gray-200 bg-white p-3"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500">
                    标题
                  </label>
                  <input
                    className={inputClass}
                    value={item.title}
                    onChange={(e) =>
                      updateItem(item.id, { title: e.target.value })
                    }
                    placeholder="标题"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500">
                    副标题
                  </label>
                  <input
                    className={inputClass}
                    value={item.subtitle}
                    onChange={(e) =>
                      updateItem(item.id, { subtitle: e.target.value })
                    }
                    placeholder="副标题"
                  />
                </div>
              </div>

              <DateRangeInput
                startDate={item.startDate}
                endDate={item.endDate}
                onStartDateChange={(d) =>
                  updateItem(item.id, { startDate: d })
                }
                onEndDateChange={(d) => updateItem(item.id, { endDate: d })}
              />

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500">
                  描述
                </label>
                <textarea
                  className={`${inputClass} min-h-12 resize-y`}
                  value={item.description}
                  onChange={(e) =>
                    updateItem(item.id, { description: e.target.value })
                  }
                  placeholder="详细描述..."
                  rows={2}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => removeItem(item.id)}
              className="ml-2 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addItem}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 py-2.5 text-sm text-gray-500 transition-colors hover:border-blue-400 hover:text-blue-600"
      >
        <Plus className="h-4 w-4" />
        添加条目
      </button>
    </div>
  )
}
