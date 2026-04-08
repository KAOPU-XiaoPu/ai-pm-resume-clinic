import { useState } from 'react'
import { cn } from '../../lib/utils'

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
}

const PRESET_COLORS = [
  '#1a1a1a', '#374151', '#6b7280', '#9ca3af',
  '#1e40af', '#2563eb', '#0d9488', '#059669',
  '#7c3aed', '#a855f7', '#ea580c', '#d97706',
]

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [hexInput, setHexInput] = useState(value)

  const handleHexBlur = () => {
    const trimmed = hexInput.trim()
    if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) {
      onChange(trimmed)
    } else {
      setHexInput(value)
    }
  }

  const handlePresetClick = (color: string) => {
    onChange(color)
    setHexInput(color)
  }

  return (
    <div className="space-y-3">
      {/* Preset grid: 3 rows of 4 */}
      <div className="grid grid-cols-4 gap-2">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => handlePresetClick(color)}
            className={cn(
              'h-6 w-6 rounded-full transition-shadow',
              value === color
                ? 'ring-2 ring-blue-500 ring-offset-2'
                : 'hover:ring-2 hover:ring-gray-300 hover:ring-offset-1',
            )}
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>

      {/* Custom hex input */}
      <div className="flex items-center gap-2">
        <div
          className="h-6 w-6 shrink-0 rounded border border-gray-200"
          style={{ backgroundColor: value }}
        />
        <input
          type="text"
          value={hexInput}
          onChange={(e) => setHexInput(e.target.value)}
          onBlur={handleHexBlur}
          onKeyDown={(e) => e.key === 'Enter' && handleHexBlur()}
          placeholder="#000000"
          className="w-24 rounded-md border border-gray-200 px-2 py-1 text-sm outline-none focus:border-blue-400"
        />
      </div>
    </div>
  )
}
