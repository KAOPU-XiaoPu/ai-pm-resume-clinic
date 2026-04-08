import { Plus, Trash2 } from 'lucide-react'
import { useResumeStore } from '../../store/useResumeStore'

export function SkillPanel() {
  const store = useResumeStore()
  const items = store.resumeData.skills

  const inputClass =
    'w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-blue-400 transition-colors'

  return (
    <div className="space-y-3">
      {items.map((skill) => (
        <div
          key={skill.id}
          className="space-y-2 rounded-lg border border-gray-200 bg-white p-3"
        >
          <div className="flex items-start gap-2">
            <div className="flex-1 space-y-2">
              <input
                className={inputClass}
                value={skill.name}
                onChange={(e) =>
                  store.updateSkill(skill.id, { name: e.target.value })
                }
                placeholder="能力标签"
              />
              <textarea
                className={`${inputClass} min-h-12 resize-y`}
                value={skill.description}
                onChange={(e) =>
                  store.updateSkill(skill.id, { description: e.target.value })
                }
                placeholder="详细描述..."
                rows={2}
              />
            </div>
            <button
              type="button"
              onClick={() => store.removeSkill(skill.id)}
              className="mt-1 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={store.addSkill}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 py-2.5 text-sm text-gray-500 transition-colors hover:border-blue-400 hover:text-blue-600"
      >
        <Plus className="h-4 w-4" />
        添加技能
      </button>
    </div>
  )
}
