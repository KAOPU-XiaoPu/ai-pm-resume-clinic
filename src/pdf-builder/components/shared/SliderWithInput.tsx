import { useState, useCallback } from 'react'
import { Slider } from '../ui/slider'

interface SliderWithInputProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit?: string
  decimals?: number
  onChange: (value: number) => void
}

export function SliderWithInput({
  label,
  value,
  min,
  max,
  step,
  unit = '',
  decimals = 0,
  onChange,
}: SliderWithInputProps) {
  const [inputValue, setInputValue] = useState(String(decimals > 0 ? value.toFixed(decimals) : value))
  const [editing, setEditing] = useState(false)

  const clamp = useCallback(
    (v: number) => Math.min(max, Math.max(min, v)),
    [min, max],
  )

  const handleSliderChange = ([v]: number[]) => {
    const clamped = clamp(v)
    onChange(clamped)
    setInputValue(String(decimals > 0 ? clamped.toFixed(decimals) : clamped))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }

  const handleInputBlur = () => {
    setEditing(false)
    const parsed = parseFloat(inputValue)
    if (isNaN(parsed)) {
      setInputValue(String(decimals > 0 ? value.toFixed(decimals) : value))
      return
    }
    const clamped = clamp(parsed)
    onChange(clamped)
    setInputValue(String(decimals > 0 ? clamped.toFixed(decimals) : clamped))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleInputBlur()
    }
  }

  // Keep input in sync when slider changes externally
  if (!editing) {
    const display = decimals > 0 ? value.toFixed(decimals) : String(value)
    if (inputValue !== display) {
      setInputValue(display)
    }
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">{label}</span>
        <div className="flex items-center">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => setEditing(true)}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            className="w-12 text-right text-xs font-mono text-gray-600 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-400 focus:outline-none transition-colors px-0.5 py-0"
          />
          {unit && <span className="text-xs text-gray-400 ml-0.5">{unit}</span>}
        </div>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={handleSliderChange}
      />
    </div>
  )
}
