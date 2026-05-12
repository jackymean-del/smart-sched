import { CalendarDays, Sparkles, Eye } from 'lucide-react'

interface TopbarProps {
  step?: number
  totalSteps?: number
  stepLabel?: string
}

export function Topbar({ step, totalSteps, stepLabel }: TopbarProps) {
  return (
    <header style={{
      height: 52, background: '#fff',
      borderBottom: '1px solid #e8e5de',
      display: 'flex', alignItems: 'center',
      padding: '0 16px', position: 'sticky',
      top: 0, zIndex: 500,
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      gap: 12,
    }}>
      {/* Logo */}
      <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'linear-gradient(135deg, #34d399, #059669)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
        }}>
          <CalendarDays size={16} />
        </div>
        <span style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 17 }}>
          Smart<span style={{ color: '#059669' }}>Sched</span>
        </span>
      </a>

      {/* Step indicator - centered */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        {step && totalSteps && (
          <span style={{
            fontSize: 11, color: '#6a6860',
            padding: '4px 14px',
            background: '#f7f6f2',
            border: '1px solid #e8e5de',
            borderRadius: 20,
            whiteSpace: 'nowrap',
          }}>
            Step {step} of {totalSteps}: <strong style={{ color: '#4f46e5' }}>{stepLabel}</strong>
          </span>
        )}
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <a href="/wizard" style={{ textDecoration: 'none' }}>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '6px 12px', borderRadius: 7, fontSize: 12, fontWeight: 500,
            background: '#059669', color: '#fff', border: 'none', cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}>
            <Sparkles size={13} /> Create Timetable
          </button>
        </a>
        <a href="/demo" style={{ textDecoration: 'none' }}>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '6px 12px', borderRadius: 7, fontSize: 12, fontWeight: 500,
            background: '#fff', color: '#1c1b18',
            border: '1px solid #d4d1c8', cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}>
            <Eye size={13} /> Demo
          </button>
        </a>
      </div>
    </header>
  )
}
