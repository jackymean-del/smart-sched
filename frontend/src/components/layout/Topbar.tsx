import { CalendarDays, Sparkles, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Link } from '@tanstack/react-router'

interface TopbarProps {
  step?: number
  totalSteps?: number
  stepLabel?: string
}

export function Topbar({ step, totalSteps, stepLabel }: TopbarProps) {
  return (
    <header className="h-[52px] bg-white border-b border-gray-200 flex items-center px-4 gap-3 sticky top-0 z-50 shadow-sm">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white">
          <CalendarDays className="w-4 h-4" />
        </div>
        <span className="font-serif text-[17px]">
          Smart<span className="text-emerald-600">Sched</span>
        </span>
      </Link>

      {/* Step indicator */}
      <div className="flex-1 flex justify-center">
        {step && totalSteps && (
          <span className="text-xs text-gray-500 px-3 py-1 bg-gray-50 border border-gray-200 rounded-full">
            Step {step} of {totalSteps}: <strong className="text-indigo-700">{stepLabel}</strong>
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <Link to="/wizard">
          <Button size="sm" className="gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Create Timetable
          </Button>
        </Link>
        <Link to="/demo">
          <Button size="sm" variant="outline" className="gap-1.5">
            <Eye className="w-3.5 h-3.5" />
            Demo
          </Button>
        </Link>
      </div>
    </header>
  )
}
