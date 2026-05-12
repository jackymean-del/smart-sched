import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export const WIZARD_STEPS = [
  { n: 1, label: 'Organization type' },
  { n: 2, label: 'Country & standards' },
  { n: 3, label: 'Schedule settings' },
  { n: 4, label: 'How many of each?' },
  { n: 5, label: 'Review & edit data' },
  { n: 6, label: 'Assign subjects & staff' },
  { n: 7, label: 'Generate timetable' },
]

interface WizardSidebarProps {
  currentStep: number
  onStepClick: (n: number) => void
}

export function WizardSidebar({ currentStep, onStepClick }: WizardSidebarProps) {
  return (
    <aside className="w-[252px] bg-white border-r border-gray-200 p-5 shrink-0 sticky top-[52px] h-[calc(100vh-52px)] overflow-y-auto hidden md:flex flex-col">
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">Setup steps</p>
      {WIZARD_STEPS.map((step, i) => {
        const done = step.n < currentStep
        const active = step.n === currentStep
        return (
          <div key={step.n}>
            <button
              onClick={() => step.n <= currentStep && onStepClick(step.n)}
              className={cn(
                'flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg transition-all text-left',
                active && 'bg-indigo-50',
                !active && step.n <= currentStep && 'hover:bg-gray-50 cursor-pointer',
                step.n > currentStep && 'cursor-default opacity-50'
              )}
            >
              <div className={cn(
                'w-6 h-6 rounded-full border-[1.5px] flex items-center justify-center text-[10px] font-bold shrink-0 transition-all',
                done  && 'bg-emerald-600 border-emerald-600 text-white',
                active && 'bg-indigo-600 border-indigo-600 text-white',
                !done && !active && 'border-gray-300 text-gray-400'
              )}>
                {done ? <Check className="w-3 h-3" /> : step.n}
              </div>
              <span className={cn(
                'text-[12px] font-medium',
                active && 'text-indigo-700 font-semibold',
                done && 'text-emerald-700',
                !done && !active && 'text-gray-400'
              )}>
                {step.label}
              </span>
            </button>
            {i < WIZARD_STEPS.length - 1 && (
              <div className={cn('w-[1.5px] h-3 ml-[21px] my-0.5', done ? 'bg-emerald-400' : 'bg-gray-200')} />
            )}
          </div>
        )
      })}
    </aside>
  )
}
