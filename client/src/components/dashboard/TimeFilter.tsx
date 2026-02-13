import React from 'react'
import { Calendar } from 'lucide-react'

export type TimePeriod = '7d' | '30d' | '90d'

interface TimeFilterProps {
  selected: TimePeriod
  onChange: (period: TimePeriod) => void
}

const periods: Array<{ value: TimePeriod; label: string }> = [
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
  { value: '90d', label: '90 dias' }
]

export const TimeFilter: React.FC<TimeFilterProps> = ({ selected, onChange }) => {
  return (
    <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1">
      <div className="flex items-center gap-2 px-2 text-gray-600">
        <Calendar className="w-4 h-4" />
        <span className="text-sm font-medium">Período:</span>
      </div>
      <div className="flex gap-1">
        {periods.map((period) => (
          <button
            key={period.value}
            onClick={() => onChange(period.value)}
            className={`
              px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200
              ${selected === period.value
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
              }
            `}
          >
            {period.label}
          </button>
        ))}
      </div>
    </div>
  )
}
