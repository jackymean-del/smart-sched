import { CalendarDays, LogOut, LayoutDashboard, Sparkles } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

interface TopbarProps {
  step?: number
  totalSteps?: number
  stepLabel?: string
}

export function Topbar({ step, totalSteps, stepLabel }: TopbarProps) {
  const { user, isAuthenticated, logout } = useAuthStore()
  const isWizard = window.location.pathname.startsWith('/wizard')

  const handleLogout = () => { logout(); window.location.href = '/login' }

  return (
    <header style={{
      height: 52, background: '#fff',
      borderBottom: '1px solid #e5e7eb',
      display: 'flex', alignItems: 'center',
      padding: '0 20px', position: 'sticky',
      top: 0, zIndex: 500, gap: 12,
    }}>
      {/* Logo */}
      <a href={isAuthenticated ? '/dashboard' : '/'} style={{ display:'flex', alignItems:'center', gap:8, textDecoration:'none', flexShrink:0 }}>
        <div style={{ width:30, height:30, borderRadius:8, background:'linear-gradient(135deg,#34d399,#059669)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <CalendarDays size={15} color="#fff" />
        </div>
        <span style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:16 }}>
          Sche<span style={{ color:'#059669' }}>du</span>
        </span>
      </a>

      {/* Wizard step pill — center */}
      <div style={{ flex:1, display:'flex', justifyContent:'center' }}>
        {isWizard && step && totalSteps && (
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'4px 14px', background:'#f3f4f6', borderRadius:20, border:'1px solid #e5e7eb' }}>
            <div style={{ display:'flex', gap:4 }}>
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div key={i} style={{
                  width: i + 1 === step ? 16 : 6, height:6, borderRadius:3,
                  background: i + 1 < step ? '#059669' : i + 1 === step ? '#4f46e5' : '#d1d5db',
                  transition:'all 0.2s',
                }} />
              ))}
            </div>
            <span style={{ fontSize:11, color:'#6b7280' }}>
              Step {step}/{totalSteps}: <strong style={{ color:'#111827' }}>{stepLabel}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Right — auth-aware */}
      <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
        {isAuthenticated && user ? (
          <>
            {!isWizard && (
              <a href="/dashboard" style={{ textDecoration:'none' }}>
                <button style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 11px', borderRadius:6, border:'1px solid #e5e7eb', background:'#fff', fontSize:12, color:'#374151', cursor:'pointer', fontWeight:500 }}>
                  <LayoutDashboard size={13} /> Dashboard
                </button>
              </a>
            )}
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'4px 10px', background:'#f9fafb', borderRadius:8, border:'1px solid #e5e7eb' }}>
              <div style={{ width:24, height:24, borderRadius:'50%', background:'#4f46e5', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:10, fontWeight:700, flexShrink:0 }}>
                {user.name[0].toUpperCase()}
              </div>
              <div style={{ lineHeight:1.2 }}>
                <div style={{ fontSize:12, fontWeight:600, color:'#111827' }}>{user.name}</div>
                {user.schoolName && <div style={{ fontSize:10, color:'#9ca3af' }}>{user.schoolName}</div>}
              </div>
              <button onClick={handleLogout} title="Logout"
                style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', padding:'2px', display:'flex', alignItems:'center' }}>
                <LogOut size={13} />
              </button>
            </div>
          </>
        ) : (
          <>
            <a href="/login" style={{ textDecoration:'none' }}>
              <button style={{ padding:'6px 12px', borderRadius:6, border:'1px solid #e5e7eb', background:'#fff', fontSize:12, fontWeight:500, color:'#374151', cursor:'pointer' }}>
                Sign in
              </button>
            </a>
            <a href="/wizard" style={{ textDecoration:'none' }}>
              <button style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:6, background:'#059669', color:'#fff', border:'none', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                <Sparkles size={12} /> Get started
              </button>
            </a>
          </>
        )}
      </div>
    </header>
  )
}
