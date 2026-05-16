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
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#F9F8FF' }}>
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
import { LogOut } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { WIZARD_STEPS } from '@/components/layout/WizardSidebar'

function WizardTopbar() {
  const { user, logout } = useAuthStore()
  const step = useTimetableStore(s => s.step)
  const total = WIZARD_STEPS.length
  const stepInfo = WIZARD_STEPS.find(s => s.n === step)

  return (
    <header style={{
      height: 52, background: '#13111E', borderBottom: '1px solid #1E1B2E',
      display: 'flex', alignItems: 'center', padding: '0 20px', gap: 14,
      flexShrink: 0, zIndex: 100,
    }}>
      {/* Bhusku-b mark + SchedU wordmark */}
      <a href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', flexShrink: 0 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: '#7C6FE0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="18" height="18" viewBox="0 0 52 52" fill="none">
            <rect x="12" y="9" width="8" height="33" rx="4" fill="white"/>
            <path d="M 20 22 C 23 14 40 15 40 30 C 40 45 23 46 20 42" stroke="white" strokeWidth="8" fill="none" strokeLinecap="round"/>
            <circle cx="39" cy="10" r="4.5" fill="#D4920E"/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6b7080', lineHeight: 1, marginBottom: 2 }}>by bhusku</div>
          <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 15, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', lineHeight: 1 }}>
            Sched<span style={{ color: '#9B8EF5', fontFamily: "'DM Serif Display',Georgia,serif", fontStyle: 'italic', fontSize: 16 }}>U</span>
          </div>
        </div>
      </a>

      {/* Step progress — center */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 14px', background: 'rgba(124,111,224,0.08)', borderRadius: 20, border: '1px solid #2A2642' }}>
          <div style={{ display: 'flex', gap: 5 }}>
            {Array.from({ length: total }).map((_, i) => (
              <div key={i} style={{
                height: 5, borderRadius: 3,
                width: i + 1 === step ? 18 : 6,
                background: i + 1 < step ? '#7C6FE0' : i + 1 === step ? '#9B8EF5' : '#2A2642',
                transition: 'all 0.25s',
              }} />
            ))}
          </div>
          <span style={{ fontSize: 11, color: '#8B87AD' }}>
            Step {step}/{total}: <strong style={{ color: '#e5e7eb' }}>{stepInfo?.label}</strong>
          </span>
        </div>
      </div>

      {/* User */}
      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#e5e7eb' }}>{user.name}</div>
            {user.schoolName && <div style={{ fontSize: 10, color: '#8B87AD' }}>{user.schoolName}</div>}
          </div>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#7C6FE0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700 }}>
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
