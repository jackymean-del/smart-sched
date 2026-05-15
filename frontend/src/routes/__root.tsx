import { useState } from 'react'
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { Topbar } from '@/components/layout/Topbar'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { useTimetableStore } from '@/store/timetableStore'

export const Route = createRootRoute({
  component: RootLayout,
})

// Pages that get the dark sidebar app-shell (no topbar)
const APP_PATHS = ['/dashboard', '/timetable', '/demo']

// Wizard pages render their own dark sidebar; we only show the slim topbar
const WIZARD_PATH = '/wizard'

function RootLayout() {
  const path = window.location.pathname
  const isWizard  = path.startsWith(WIZARD_PATH)
  const isAppPage = APP_PATHS.some(p => path === p || path.startsWith(p + '/'))

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // ── App pages: dark sidebar + outlet ──────────────────────
  if (isAppPage) {
    return (
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f4f6fb' }}>
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

  // ── Wizard pages: slim topbar (just logo + user) + outlet
  //    The wizard itself renders its own dark sidebar
  if (isWizard) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <WizardTopbar />
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <Outlet />
        </div>
      </div>
    )
  }

  // ── Public pages (home, login): standard topbar ────────────
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Topbar />
      <Outlet />
    </div>
  )
}

// ── Minimal topbar for wizard pages ───────────────────────────
import { CalendarDays, LogOut } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { WIZARD_STEPS } from '@/components/layout/WizardSidebar'

function WizardTopbar() {
  const { user, logout } = useAuthStore()
  const step = useTimetableStore(s => s.step)
  const total = WIZARD_STEPS.length
  const stepInfo = WIZARD_STEPS.find(s => s.n === step)

  return (
    <header style={{
      height: 52, background: '#111827', borderBottom: '1px solid #1f2937',
      display: 'flex', alignItems: 'center', padding: '0 20px', gap: 14,
      flexShrink: 0, zIndex: 100,
    }}>
      {/* Logo */}
      <a href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg,#34d399,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CalendarDays size={14} color="#fff" />
        </div>
        <span style={{ fontFamily: "'DM Serif Display',Georgia,serif", fontSize: 16, color: '#fff' }}>
          Sche<span style={{ color: '#34d399' }}>du</span>
        </span>
      </a>

      {/* Step progress — center */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 14px', background: 'rgba(255,255,255,0.06)', borderRadius: 20, border: '1px solid #374151' }}>
          <div style={{ display: 'flex', gap: 5 }}>
            {Array.from({ length: total }).map((_, i) => (
              <div key={i} style={{
                height: 5, borderRadius: 3,
                width: i + 1 === step ? 18 : 6,
                background: i + 1 < step ? '#059669' : i + 1 === step ? '#4f46e5' : '#374151',
                transition: 'all 0.25s',
              }} />
            ))}
          </div>
          <span style={{ fontSize: 11, color: '#9ca3af' }}>
            Step {step}/{total}: <strong style={{ color: '#e5e7eb' }}>{stepInfo?.label}</strong>
          </span>
        </div>
      </div>

      {/* User */}
      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#e5e7eb' }}>{user.name}</div>
            {user.schoolName && <div style={{ fontSize: 10, color: '#6b7280' }}>{user.schoolName}</div>}
          </div>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700 }}>
            {user.name[0].toUpperCase()}
          </div>
          <button onClick={() => { logout(); window.location.href = '/login' }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex', alignItems: 'center', padding: 4 }}
            title="Logout">
            <LogOut size={14} />
          </button>
        </div>
      )}
    </header>
  )
}
