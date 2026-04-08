import { useRef } from 'react'
import { Camera, Trash2 } from 'lucide-react'
import { cn } from '../../lib/utils'
import type { PhotoConfig } from '../../types'

interface PhotoUploadProps {
  photo: string
  photoConfig: PhotoConfig
  onPhotoChange: (photo: string) => void
  onConfigChange: (config: Partial<PhotoConfig>) => void
}

function getBorderRadius(config: PhotoConfig): string | number {
  switch (config.borderRadius) {
    case 'full': return '50%'
    case 'medium': return 8
    case 'custom': return config.customBorderRadius
    default: return 0
  }
}

const defaultConfig: PhotoConfig = {
  width: 80,
  height: 80,
  borderRadius: 'none',
  customBorderRadius: 0,
  visible: false,
}

export function PhotoUpload({
  photo,
  photoConfig: rawConfig,
  onPhotoChange,
  onConfigChange,
}: PhotoUploadProps) {
  const photoConfig = rawConfig ?? defaultConfig
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Compress image via Canvas before storing as base64
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const MAX = 300 // max dimension in px
      let w = img.width
      let h = img.height
      if (w > MAX || h > MAX) {
        if (w > h) { h = Math.round(h * MAX / w); w = MAX }
        else { w = Math.round(w * MAX / h); h = MAX }
      }
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      ctx?.drawImage(img, 0, 0, w, h)
      const compressed = canvas.toDataURL('image/jpeg', 0.85)
      onPhotoChange(compressed)
      onConfigChange({ visible: true })
    }
    img.src = objectUrl
    e.target.value = ''
  }

  const handleDelete = () => {
    onPhotoChange('')
    onConfigChange({ visible: false })
  }

  const radiusOptions = [
    { label: '无', value: 'none' as const },
    { label: '圆角', value: 'medium' as const },
    { label: '圆形', value: 'full' as const },
  ]

  const radius = getBorderRadius(photoConfig)

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-4">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={cn(
            'flex shrink-0 items-center justify-center overflow-hidden border-2 border-dashed border-gray-300 bg-gray-50 transition-colors hover:border-gray-400',
          )}
          style={{
            width: photoConfig.width,
            height: photoConfig.height,
            borderRadius: radius,
          }}
        >
          {photo ? (
            <img src={photo} alt="头像" className="h-full w-full object-cover" />
          ) : (
            <Camera className="h-6 w-6 text-gray-400" />
          )}
        </button>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        <div className="space-y-2 text-sm">
          <p className="text-gray-500">点击上传头像</p>
          {photo && (
            <button type="button" onClick={handleDelete} className="flex items-center gap-1 text-red-500 hover:text-red-600">
              <Trash2 className="h-3.5 w-3.5" /> 删除
            </button>
          )}
        </div>
      </div>

      {/* Visibility toggle */}
      {photo && (
        <label className="flex items-center gap-2 text-xs text-gray-600">
          <input
            type="checkbox"
            checked={photoConfig.visible}
            onChange={(e) => onConfigChange({ visible: e.target.checked })}
            className="rounded"
          />
          在简历中显示头像
        </label>
      )}

      {/* Border radius */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-500">圆角</label>
        <div className="flex gap-2">
          {radiusOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onConfigChange({ borderRadius: opt.value })}
              className={cn(
                'rounded-md border px-3 py-1 text-xs transition-colors',
                photoConfig.borderRadius === opt.value
                  ? 'border-blue-500 bg-blue-50 text-blue-600'
                  : 'border-gray-200 hover:bg-gray-50',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Size controls */}
      <div className="flex gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500">宽度</label>
          <input
            type="number" min={40} max={200}
            value={photoConfig.width}
            onChange={(e) => onConfigChange({ width: Number(e.target.value) })}
            className="w-20 rounded-md border border-gray-200 px-2 py-1 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500">高度</label>
          <input
            type="number" min={40} max={200}
            value={photoConfig.height}
            onChange={(e) => onConfigChange({ height: Number(e.target.value) })}
            className="w-20 rounded-md border border-gray-200 px-2 py-1 text-sm"
          />
        </div>
      </div>
    </div>
  )
}
