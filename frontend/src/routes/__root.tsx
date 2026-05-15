import { useState } from 'react'
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { Topbar } from '@/components/layout/Topbar'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { useTimetableStore } from '@/store/timetableStore'
import { WIZARD_STEPS } from '@/components/layout/WizardSidebar'

export const Route = createRootRoute({
  component: RootLayout,
})

// Pages that get the sidebar layout (no topbar)
const APP_PATHS = ['/dashboard', '/timetable', '/demo']

function RootLayout() {
  const step = useTimetableStore(s => s.step)
  const stepInfo = WIZARD_STEPS.find(s => s.n === step)
  const path = window.location.pathname
  const isWizard = path.startsWith('/wizard')
  const isAppPage = APP_PATHS.some(p => path === p || path.startsWith(p + '/'))

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // ── App pages: sidebar layout ──────────────────────────────
  if (isAppPage) {
    return (
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f9fafb' }}>
        <AppSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(c => !c)}
        />
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', minWidth: 0 }}>
          <Outlet />
        </div>
      </div>
    )
  }

  // ── Wizard pages: topbar + wizard sidebar ─────────────────
  if (isWizard) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Topbar
          step={step}
          totalSteps={WIZARD_STEPS.length}
          stepLabel={stepInfo?.label}
        />
        <Outlet />
      </div>
    )
  }

  // ── Public pages (home, login, etc.): topbar only ─────────
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Topbar />
      <Outlet />
    </div>
  )
}
