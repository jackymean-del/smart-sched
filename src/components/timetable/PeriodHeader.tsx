import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Period } from '@/types'

interface PeriodHeaderProps {
  period: Period
  index: number
  totalPeriods: number
  transposed: boolean
  allowShift: boolean    // false for teacher TT
  onShift: (idx: number, dir: -1 | 1) => void
  allPeriods: Period[]
}

export function PeriodHeader({ period, index, transposed, allowShift, onShift, allPeriods }: PeriodHeaderProps) {
  const bgClass = getPeriodBg(period)
  const canLeft  = period.shiftable && index > 0 && allPeriods[index - 1]?.shiftable
  const canRight = period.shiftable && index < allPeriods.length - 1 && allPeriods[index + 1]?.shiftable
  const LeftIcon  = transposed ? ChevronUp   : ChevronLeft
  const RightIcon = transposed ? ChevronDown : ChevronRight

  return (
    <th className={cn('min-w-[64px] text-center select-none border border-gray-200 group', bgClass)}>
      <div className="flex flex-col items-center px-1 py-1.5 gap-0.5">
        <span className="text-[9px] font-bold uppercase text-gray-700 leading-tight">{period.name}</span>
        <span className="text-[8px] font-mono text-gray-400">{period.duration}min</span>
        {allowShift && period.shiftable && (
          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
            <button
              onClick={() => onShift(index, -1)}
              disabled={!canLeft}
              className="w-4 h-4 flex items-center justify-center rounded hover:bg-indigo-100 hover:text-indigo-600 disabled:opacity-20 disabled:cursor-default text-gray-400 transition-all"
            >
              <LeftIcon className="w-2.5 h-2.5" />
            </button>
            <button
              onClick={() => onShift(index, 1)}
              disabled={!canRight}
              className="w-4 h-4 flex items-center justify-center rounded hover:bg-indigo-100 hover:text-indigo-600 disabled:opacity-20 disabled:cursor-default text-gray-400 transition-all"
            >
              <RightIcon className="w-2.5 h-2.5" />
            </button>
          </div>
        )}
        {allowShift && !period.shiftable && (
          <span className="text-[7px] text-gray-300 mt-0.5">locked</span>
        )}
      </div>
    </th>
  )
}

function getPeriodBg(p: Period): string {
  const n = p.name.toUpperCase()
  if (p.type === 'fixed-start') return 'bg-blue-100'
  if (p.type === 'lunch') return 'bg-amber-100'
  if (p.type === 'break') return 'bg-yellow-100'
  if (p.type === 'fixed-end') {
    if (n.includes('DIARY')) return 'bg-slate-100'
    if (n.includes('SNACK')) return 'bg-yellow-50'
    return 'bg-emerald-100'
  }
  return 'bg-gray-50'
}
