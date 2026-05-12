import { createRootRoute, Outlet } from '@tanstack/react-router'
import { Topbar } from '@/components/layout/Topbar'
import { useTimetableStore } from '@/store/timetableStore'
import { WIZARD_STEPS } from '@/components/layout/WizardSidebar'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  const step = useTimetableStore(s => s.step)
  const stepInfo = WIZARD_STEPS.find(s => s.n === step)
  const isWizard = window.location.pathname.startsWith('/wizard')

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Topbar
        step={isWizard ? step : undefined}
        totalSteps={isWizard ? WIZARD_STEPS.length : undefined}
        stepLabel={isWizard ? stepInfo?.label : undefined}
      />
      <Outlet />
    </div>
  )
}
