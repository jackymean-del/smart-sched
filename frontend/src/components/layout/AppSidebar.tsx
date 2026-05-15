import { useState } from 'react'
import {
  CalendarDays, LayoutDashboard, BookOpen, BarChart2,
  Users, Settings, HelpCircle, FileText, ChevronLeft,
  ChevronRight, LogOut, Sparkles, Calendar,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

interface NavItem {
  icon: React.ReactNode
  label: string
  href: string
  badge?: string
}

const NAV_MAIN: NavItem[] = [
  { icon: <LayoutDashboard size={16} />, label: 'Dashboard',          href: '/dashboard' },
  { icon: <FileText       size={16} />, label: 'My Timetables',       href: '/timetable' },
  { icon: <Calendar       size={16} />, label: 'Calendar',            href: '/timetable?view=calendar' },
  { icon: <BarChart2      size={16} />, label: 'Reports & Analytics', href: '/timetable?view=reports' },
]

const NAV_MGMT: NavItem[] = [
  { icon: <Users    size={16} />, label: 'Resources', href: '/wizard' },
  { icon: <Settings size={16} />, label: 'Settings',  href: '#' },
]

const NAV_HELP: NavItem[] = [
  { icon: <HelpCircle size={16} />, label: 'Support',   href: '#' },
  { icon: <BookOpen   size={16} />, label: 'Help Docs', href: '#' },
]

interface AppSidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const { user, logout } = useAuthStore()
  const path = window.location.pathname + window.location.search

  const handleLogout = () => { logout(); window.location.href = '/login' }

  const W = collapsed ? 58 : 240

  const NavGroup = ({ label, items }: { label: string; items: NavItem[] }) => (
    <div style={{ marginBottom: 8 }}>
      {!collapsed && (
        <div style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
          color: '#9ca3af', textTransform: 'uppercase',
          padding: '8px 16px 4px',
        }}>
          {label}
        </div>
      )}
      {collapsed && <div style={{ height: 12 }} />}
      {items.map(item => {
        const active = path === item.href || (item.href !== '/dashboard' && path.startsWith(item.href.split('?')[0]))
        return (
          <a
            key={item.label}
            href={item.href}
            title={collapsed ? item.label : undefined}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: collapsed ? '9px 0' : '9px 14px',
              margin: '1px 8px', borderRadius: 8,
              textDecoration: 'none', cursor: 'pointer',
              background: active ? '#eef2ff' : 'transparent',
              color: active ? '#4f46e5' : '#4b5563',
              fontWeight: active ? 600 : 400,
              fontSize: 13,
              justifyContent: collapsed ? 'center' : 'flex-start',
              transition: 'background 0.12s',
              position: 'relative',
            }}
            onMouseEnter={e => {
              if (!active) (e.currentTarget as HTMLAnchorElement).style.background = '#f9fafb'
            }}
            onMouseLeave={e => {
              if (!active) (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'
            }}
          >
            <span style={{ flexShrink: 0, color: active ? '#4f46e5' : '#6b7280' }}>{item.icon}</span>
            {!collapsed && <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>}
            {!collapsed && item.badge && (
              <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 8, background: '#4f46e5', color: '#fff' }}>
                {item.badge}
              </span>
            )}
            {/* Active indicator */}
            {active && (
              <span style={{
                position: 'absolute', left: -8, top: '50%', transform: 'translateY(-50%)',
                width: 3, height: 18, borderRadius: 2, background: '#4f46e5',
              }} />
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
      background: '#fff', borderRight: '1px solid #e5e7eb',
      display: 'flex', flexDirection: 'column',
      transition: 'width 0.2s ease', overflow: 'hidden',
      zIndex: 50,
    }}>

      {/* ── Logo + collapse toggle ── */}
      <div style={{
        height: 56, display: 'flex', alignItems: 'center',
        padding: collapsed ? '0 0' : '0 16px',
        borderBottom: '1px solid #e5e7eb', flexShrink: 0,
        justifyContent: collapsed ? 'center' : 'space-between',
      }}>
        {!collapsed && (
          <a href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: 'linear-gradient(135deg,#34d399,#059669)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <CalendarDays size={15} color="#fff" />
            </div>
            <span style={{ fontFamily: "'DM Serif Display',Georgia,serif", fontSize: 17 }}>
              Sche<span style={{ color: '#059669' }}>du</span>
            </span>
          </a>
        )}
        {collapsed && (
          <a href="/dashboard" style={{ textDecoration: 'none' }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: 'linear-gradient(135deg,#34d399,#059669)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <CalendarDays size={15} color="#fff" />
            </div>
          </a>
        )}
        {!collapsed && (
          <button
            onClick={onToggle}
            title="Collapse sidebar"
            style={{
              width: 24, height: 24, borderRadius: 6,
              border: '1px solid #e5e7eb', background: '#f9fafb',
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: '#6b7280',
            }}
          >
            <ChevronLeft size={13} />
          </button>
        )}
      </div>

      {/* ── Expand button when collapsed ── */}
      {collapsed && (
        <button
          onClick={onToggle}
          title="Expand sidebar"
          style={{
            margin: '8px auto', width: 36, height: 28, borderRadius: 6,
            border: '1px solid #e5e7eb', background: '#f9fafb',
            cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: '#6b7280',
          }}
        >
          <ChevronRight size={13} />
        </button>
      )}

      {/* ── New Timetable CTA ── */}
      {!collapsed && (
        <div style={{ padding: '12px 16px 8px' }}>
          <a href="/wizard" style={{ textDecoration: 'none' }}>
            <button style={{
              width: '100%', padding: '8px 12px', borderRadius: 8,
              border: 'none', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
              color: '#fff', fontWeight: 600, fontSize: 12,
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 6,
            }}>
              <Sparkles size={12} /> New Timetable
            </button>
          </a>
        </div>
      )}
      {collapsed && (
        <div style={{ padding: '4px 0', display: 'flex', justifyContent: 'center' }}>
          <a href="/wizard" title="New Timetable" style={{ textDecoration: 'none' }}>
            <button style={{
              width: 36, height: 30, borderRadius: 8, border: 'none',
              background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
              color: '#fff', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Sparkles size={13} />
            </button>
          </a>
        </div>
      )}

      {/* ── Nav sections ── */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
        <NavGroup label="Main" items={NAV_MAIN} />
        <div style={{ height: 1, background: '#f3f4f6', margin: '4px 16px 4px' }} />
        <NavGroup label="Management" items={NAV_MGMT} />
        <div style={{ height: 1, background: '#f3f4f6', margin: '4px 16px 4px' }} />
        <NavGroup label="Help & Support" items={NAV_HELP} />
      </nav>

      {/* ── User card at bottom ── */}
      {user && (
        <div style={{
          borderTop: '1px solid #e5e7eb', padding: collapsed ? '10px 0' : '10px 12px',
          display: 'flex', alignItems: 'center',
          gap: collapsed ? 0 : 10,
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: '#4f46e5', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: '#fff', fontSize: 12,
            fontWeight: 700, flexShrink: 0, cursor: 'pointer',
          }}
            title={collapsed ? `${user.name}\n${user.schoolName ?? ''}\nClick to logout` : undefined}
            onClick={collapsed ? handleLogout : undefined}
          >
            {user.name[0].toUpperCase()}
          </div>

          {!collapsed && (
            <>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.name}
                </div>
                {user.schoolName && (
                  <div style={{ fontSize: 10, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.schoolName}
                  </div>
                )}
              </div>
              <button
                onClick={handleLogout}
                title="Logout"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#9ca3af', padding: 4, display: 'flex', alignItems: 'center',
                }}
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
