import { Plus, X } from 'lucide-react'
import { useResumeStore } from '../../store/useResumeStore'
import { PhotoUpload } from '../shared/PhotoUpload'
import { useState } from 'react'

interface CustomField {
  id: string
  label: string
  value: string
}

export function BasicInfoPanel() {
  const store = useResumeStore()
  const info = store.resumeData.basicInfo
  const update = store.updateBasicInfo

  // Custom fields are kept in local state since the type doesn't include them
  const [customFields, setCustomFields] = useState<CustomField[]>([])

  const addCustomField = () => {
    setCustomFields((prev) => [
      ...prev,
      { id: crypto.randomUUID(), label: '', value: '' },
    ])
  }

  const removeCustomField = (id: string) => {
    setCustomFields((prev) => prev.filter((f) => f.id !== id))
  }

  const updateCustomField = (id: string, updates: Partial<CustomField>) => {
    setCustomFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    )
  }

  const inputClass =
    'w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-blue-400 transition-colors'

  return (
    <div className="space-y-5">
      {/* Photo */}
      <div>
        <h3 className="mb-2 text-sm font-medium text-gray-700">头像</h3>
        <PhotoUpload
          photo={info.photo}
          photoConfig={info.photoConfig}
          onPhotoChange={(photo) => store.updatePhoto(photo)}
          onConfigChange={(config) => store.updatePhotoConfig(config)}
        />
      </div>

      {/* Name + Title */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500">姓名</label>
          <input
            className={inputClass}
            value={info.name}
            onChange={(e) => update({ name: e.target.value })}
            placeholder="姓名"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500">求职意向</label>
          <input
            className={inputClass}
            value={info.title}
            onChange={(e) => update({ title: e.target.value })}
            placeholder="AI 产品经理"
          />
        </div>
      </div>

      {/* Gender + Age */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500">性别</label>
          <input
            className={inputClass}
            value={info.gender}
            onChange={(e) => update({ gender: e.target.value })}
            placeholder="男/女"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500">年龄</label>
          <input
            className={inputClass}
            value={info.age}
            onChange={(e) => update({ age: e.target.value })}
            placeholder="24岁"
          />
        </div>
      </div>

      {/* Phone + Email */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500">电话</label>
          <input
            className={inputClass}
            value={info.phone}
            onChange={(e) => update({ phone: e.target.value })}
            placeholder="手机号"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500">邮箱</label>
          <input
            className={inputClass}
            value={info.email}
            onChange={(e) => update({ email: e.target.value })}
            placeholder="邮箱地址"
          />
        </div>
      </div>

      {/* University + Education + Major */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500">院校</label>
          <input
            className={inputClass}
            value={info.university}
            onChange={(e) => update({ university: e.target.value })}
            placeholder="学校名称"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500">学历</label>
          <input
            className={inputClass}
            value={info.education}
            onChange={(e) => update({ education: e.target.value })}
            placeholder="本科/硕士"
          />
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-500">专业</label>
        <input
          className={inputClass}
          value={info.major}
          onChange={(e) => update({ major: e.target.value })}
          placeholder="专业名称"
        />
      </div>

      {/* WorkYears + Location + Website */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500">工作年限</label>
          <input
            className={inputClass}
            value={info.workYears}
            onChange={(e) => update({ workYears: e.target.value })}
            placeholder="2年"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500">所在城市</label>
          <input
            className={inputClass}
            value={info.location}
            onChange={(e) => update({ location: e.target.value })}
            placeholder="杭州"
          />
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-500">个人网站</label>
        <input
          className={inputClass}
          value={info.website}
          onChange={(e) => update({ website: e.target.value })}
          placeholder="https://..."
        />
      </div>

      {/* Custom fields */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700">自定义字段</h3>
          <button
            type="button"
            onClick={addCustomField}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-blue-600 hover:bg-blue-50"
          >
            <Plus className="h-3.5 w-3.5" />
            添加
          </button>
        </div>
        {customFields.map((field) => (
          <div key={field.id} className="flex items-start gap-2">
            <input
              className="w-24 shrink-0 rounded-md border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-blue-400"
              value={field.label}
              onChange={(e) =>
                updateCustomField(field.id, { label: e.target.value })
              }
              placeholder="标签"
            />
            <input
              className="flex-1 rounded-md border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-blue-400"
              value={field.value}
              onChange={(e) =>
                updateCustomField(field.id, { value: e.target.value })
              }
              placeholder="值"
            />
            <button
              type="button"
              onClick={() => removeCustomField(field.id)}
              className="mt-1 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
