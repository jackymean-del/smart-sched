import { useState } from 'react'
import {
  CalendarDays, LayoutDashboard, BookOpen, BarChart2,
  Users, Settings, HelpCircle, FileText, ChevronLeft,
  ChevronRight, LogOut, Sparkles, Calendar, CheckCircle2,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

// ── Sidebar palette ───────────────────────────────────────────
const BG       = '#111827'   // sidebar background
const BG_HOVER = 'rgba(255,255,255,0.05)'
const BG_ACTIVE= 'rgba(255,255,255,0.08)'
const TEXT_DIM  = '#6b7280'
const TEXT_MID  = '#9ca3af'
const TEXT_ON   = '#e5e7eb'
const TEXT_ACT  = '#fff'
const BORDER    = '#1f2937'
const ACCENT    = '#059669'  // green — matches logo

interface NavItem {
  icon: React.ReactNode
  label: string
  href: string
  count?: number
}

const NAV_MAIN: NavItem[] = [
  { icon: <LayoutDashboard size={15} />, label: 'Dashboard',          href: '/dashboard' },
  { icon: <FileText        size={15} />, label: 'My Timetables',      href: '/timetable' },
  { icon: <Calendar        size={15} />, label: 'Calendar',           href: '/timetable?view=calendar' },
  { icon: <BarChart2       size={15} />, label: 'Reports',            href: '/timetable?view=reports' },
]

const NAV_MGMT: NavItem[] = [
  { icon: <Users    size={15} />, label: 'Resources',  href: '/wizard' },
  { icon: <Settings size={15} />, label: 'Settings',   href: '#' },
]

const NAV_HELP: NavItem[] = [
  { icon: <HelpCircle size={15} />, label: 'Support',   href: '#' },
  { icon: <BookOpen   size={15} />, label: 'Help Docs', href: '#' },
]

interface AppSidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const { user, logout } = useAuthStore()
  const path = window.location.pathname + window.location.search
  const handleLogout = () => { logout(); window.location.href = '/login' }
  const W = collapsed ? 56 : 240

  const NavGroup = ({ label, items }: { label: string; items: NavItem[] }) => (
    <div style={{ marginBottom: 4 }}>
      {!collapsed && (
        <div style={{
          fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
          color: TEXT_DIM, textTransform: 'uppercase',
          padding: '10px 16px 4px',
        }}>
          {label}
        </div>
      )}
      {collapsed && <div style={{ height: 10 }} />}

      {items.map(item => {
        const isActive = path === item.href ||
          (item.href !== '/dashboard' && !item.href.includes('?') && path.startsWith(item.href))
        return (
          <a
            key={item.label}
            href={item.href}
            title={collapsed ? item.label : undefined}
            style={{
              display: 'flex', alignItems: 'center',
              gap: collapsed ? 0 : 10,
              padding: collapsed ? '9px 0' : '8px 14px',
              margin: '1px 6px',
              borderRadius: 7,
              textDecoration: 'none',
              background: isActive ? BG_ACTIVE : 'transparent',
              borderLeft: isActive ? `3px solid ${ACCENT}` : '3px solid transparent',
              color: isActive ? TEXT_ACT : TEXT_MID,
              fontWeight: isActive ? 600 : 400,
              fontSize: 12,
              justifyContent: collapsed ? 'center' : 'flex-start',
              transition: 'background 0.12s',
            }}
            onMouseEnter={e => {
              if (!isActive) (e.currentTarget as HTMLAnchorElement).style.background = BG_HOVER
            }}
            onMouseLeave={e => {
              if (!isActive) (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'
            }}
          >
            <span style={{ flexShrink: 0, color: isActive ? ACCENT : TEXT_DIM }}>{item.icon}</span>
            {!collapsed && (
              <>
                <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.label}
                </span>
                {item.count != null && (
                  <span style={{
                    fontSize: 9, fontWeight: 700, padding: '1px 6px',
                    borderRadius: 8, background: ACCENT, color: '#fff',
                  }}>
                    {item.count}
                  </span>
                )}
              </>
            )}
          </a>
        )
      })}
    </div>
  )

  return (
    <aside style={{
      width: W, flexShrink: 0,
      height: '100vh', position: 'sticky', top: 0,
      background: BG, borderRight: `1px solid ${BORDER}`,
      display: 'flex', flexDirection: 'column',
      transition: 'width 0.2s ease', overflow: 'hidden',
      zIndex: 50,
    }}>

      {/* ── Logo ── */}
      <div style={{
        height: 56, display: 'flex', alignItems: 'center',
        padding: collapsed ? '0' : '0 16px',
        borderBottom: `1px solid ${BORDER}`, flexShrink: 0,
        justifyContent: collapsed ? 'center' : 'space-between',
      }}>
        {!collapsed ? (
          <>
            <a href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
              <div style={{
                width: 30, height: 30, borderRadius: 8,
                background: 'linear-gradient(135deg,#34d399,#059669)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <CalendarDays size={14} color="#fff" />
              </div>
              <span style={{ fontFamily: "'DM Serif Display',Georgia,serif", fontSize: 17, color: '#fff' }}>
                Sche<span style={{ color: '#34d399' }}>du</span>
              </span>
            </a>
            <button
              onClick={onToggle}
              title="Collapse sidebar"
              style={{
                width: 24, height: 24, borderRadius: 5,
                border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.04)',
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: TEXT_DIM,
              }}
            >
              <ChevronLeft size={12} />
            </button>
          </>
        ) : (
          <a href="/dashboard" style={{ textDecoration: 'none' }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: 'linear-gradient(135deg,#34d399,#059669)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <CalendarDays size={14} color="#fff" />
            </div>
          </a>
        )}
      </div>

      {/* ── Expand button when collapsed ── */}
      {collapsed && (
        <button onClick={onToggle} title="Expand"
          style={{
            margin: '8px auto 4px', width: 34, height: 26, borderRadius: 6,
            border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.04)',
            cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: TEXT_DIM,
          }}>
          <ChevronRight size={12} />
        </button>
      )}

      {/* ── User / school info ── */}
      {!collapsed && user && (
        <div style={{
          padding: '12px 16px', borderBottom: `1px solid ${BORDER}`,
          flexShrink: 0,
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: TEXT_DIM, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
            My Workspace
          </div>
          <div style={{ fontSize: 12, color: TEXT_ACT, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.schoolName || user.name}
          </div>
          {user.schoolName && (
            <div style={{ fontSize: 10, color: TEXT_DIM, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.name}
            </div>
          )}
        </div>
      )}

      {/* ── New Timetable CTA ── */}
      <div style={{ padding: collapsed ? '10px 6px' : '12px 10px', flexShrink: 0 }}>
        <a href="/wizard" title={collapsed ? 'New Timetable' : undefined} style={{ textDecoration: 'none' }}>
          <button style={{
            width: '100%', padding: collapsed ? '8px 0' : '8px 12px',
            borderRadius: 8, border: 'none',
            background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
            color: '#fff', fontWeight: 600, fontSize: 12, cursor: 'pointer',
            display: 'flex', alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'center',
            gap: 6,
          }}>
            <Sparkles size={13} />
            {!collapsed && 'New Timetable'}
          </button>
        </a>
      </div>

      {/* ── Nav ── */}
      <nav style={{ flex: 1, overflowY: 'auto', paddingTop: 4 }}>
        <NavGroup label="Main" items={NAV_MAIN} />
        <div style={{ height: 1, background: BORDER, margin: '6px 14px' }} />
        <NavGroup label="Management" items={NAV_MGMT} />
        <div style={{ height: 1, background: BORDER, margin: '6px 14px' }} />
        <NavGroup label="Help & Support" items={NAV_HELP} />
      </nav>

      {/* ── User card ── */}
      {user && (
        <div style={{
          borderTop: `1px solid ${BORDER}`,
          padding: collapsed ? '10px 0' : '10px 12px',
          display: 'flex', alignItems: 'center',
          gap: collapsed ? 0 : 9,
          justifyContent: collapsed ? 'center' : 'flex-start',
          flexShrink: 0,
        }}>
          <div
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: '#4f46e5', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: '#fff', fontSize: 12,
              fontWeight: 700, flexShrink: 0, cursor: collapsed ? 'pointer' : 'default',
            }}
            title={collapsed ? `${user.name} — Logout` : undefined}
            onClick={collapsed ? handleLogout : undefined}
          >
            {user.name[0].toUpperCase()}
          </div>

          {!collapsed && (
            <>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: TEXT_ON, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.name}
                </div>
                <div style={{ fontSize: 10, color: TEXT_DIM, marginTop: 1 }}>Owner</div>
              </div>
              <button
                onClick={handleLogout}
                title="Logout"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: TEXT_DIM, padding: 4, display: 'flex', alignItems: 'center',
                  borderRadius: 5,
                }}
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = TEXT_DIM}
              >
                <LogOut size={14} />
              </button>
            </>
          )}
        </div>
      )}
    </aside>
  )
}
