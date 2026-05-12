import { Outlet } from "@tanstack/react-router"
import { Topbar } from "@/components/layout/Topbar"
import { useTimetableStore } from "@/store/timetableStore"

const STEP_LABELS = [
  'Organization type',
  'Country & standards',
  'Schedule settings',
  'How many of each?',
  'Review & edit data',
  'Assign subjects & staff',
  'Generate timetable',
]

export function RootLayout() {
  const step = useTimetableStore(s => s.step)
  const isWizard = window.location.pathname.startsWith('/wizard')
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Topbar
        step={isWizard ? step : undefined}
        totalSteps={isWizard ? 7 : undefined}
        stepLabel={isWizard ? STEP_LABELS[step - 1] : undefined}
      />
      <Outlet />
    </div>
  )
}
