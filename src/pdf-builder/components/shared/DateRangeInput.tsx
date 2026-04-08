import { cn } from '../../lib/utils'

interface DateRangeInputProps {
  startDate: string
  endDate: string
  onStartDateChange: (date: string) => void
  onEndDateChange: (date: string) => void
  showPresent?: boolean
}

export function DateRangeInput({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  showPresent = true,
}: DateRangeInputProps) {
  const isPresent = endDate === '至今'

  const handleTogglePresent = () => {
    if (isPresent) {
      onEndDateChange('')
    } else {
      onEndDateChange('至今')
    }
  }

  return (
    <div className="flex items-center gap-2">
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-500">开始时间</label>
        <input
          type="text"
          placeholder="YYYY.MM"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          className="w-28 rounded-md border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-blue-400"
        />
      </div>
      <span className="mt-5 text-gray-400">-</span>
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-500">结束时间</label>
        <input
          type="text"
          placeholder="YYYY.MM"
          value={endDate}
          disabled={isPresent}
          onChange={(e) => onEndDateChange(e.target.value)}
          className={cn(
            'w-28 rounded-md border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-blue-400',
            isPresent && 'bg-gray-100 text-gray-400',
          )}
        />
      </div>
      {showPresent && (
        <label className="mt-5 flex cursor-pointer items-center gap-1.5">
          <input
            type="checkbox"
            checked={isPresent}
            onChange={handleTogglePresent}
            className="h-4 w-4 rounded border-gray-300 accent-blue-600"
          />
          <span className="text-xs text-gray-600">至今</span>
        </label>
      )}
    </div>
  )
}
