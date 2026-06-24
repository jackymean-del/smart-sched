/**
 * Calendar — a simple month view for the organization's planning period.
 * Events/holidays are user-added; nothing is pre-populated.
 */
import { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { useOrgProfile } from '@/store/orgProfile'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export function CalendarPage() {
  const { period } = useOrgProfile()
  const today = new Date()
  const [view, setView] = useState({ y: today.getFullYear(), m: today.getMonth() })

  const first = new Date(view.y, view.m, 1).getDay()
  const days = new Date(view.y, view.m + 1, 0).getDate()
  const cells: (number | null)[] = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)]
  while (cells.length % 7 !== 0) cells.push(null)

  const move = (d: number) => setView(v => {
    const m = v.m + d
    return { y: v.y + Math.floor(m / 12), m: ((m % 12) + 12) % 12 }
  })

  return (
    <div style={{ minHeight: '100vh', background: '#F5F2FF' }}>
      <PageHeader icon="🗓️" title="Calendar" description={period ? `Planning period: ${period}` : 'Plan terms, holidays and key dates.'} />
      <div style={{ maxWidth: 920, margin: '0 auto', padding: '24px 28px' }}>
        <div style={{ background: '#fff', border: '1px solid #ECE9FB', borderRadius: 14, padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: '#13111E', margin: 0 }}>{MONTHS[view.m]} {view.y}</h2>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => move(-1)} style={navBtn}><ChevronLeft size={16} /></button>
              <button onClick={() => setView({ y: today.getFullYear(), m: today.getMonth() })} style={{ ...navBtn, width: 'auto', padding: '0 12px', fontSize: 12, fontWeight: 600 }}>Today</button>
              <button onClick={() => move(1)} style={navBtn}><ChevronRight size={16} /></button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {DOW.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#8B87AD', padding: '6px 0' }}>{d}</div>)}
            {cells.map((c, i) => {
              const isToday = c === today.getDate() && view.m === today.getMonth() && view.y === today.getFullYear()
              return (
                <div key={i} style={{ aspectRatio: '1 / 0.7', borderRadius: 8, padding: 6, fontSize: 12.5,
                  background: isToday ? '#EDE9FF' : c ? '#FAF9FF' : 'transparent',
                  border: isToday ? '1.5px solid #7C6FE0' : c ? '1px solid #F3F1FB' : 'none',
                  color: isToday ? '#7C6FE0' : '#13111E', fontWeight: isToday ? 700 : 500 }}>
                  {c ?? ''}
                </div>
              )
            })}
          </div>
        </div>
        <p style={{ fontSize: 12.5, color: '#8B87AD', textAlign: 'center', marginTop: 14 }}>
          Term dates and holidays you add will appear here. (Event editing coming with your first published timetable.)
        </p>
      </div>
    </div>
  )
}
const navBtn: React.CSSProperties = { width: 30, height: 30, borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', color: '#6B7280', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }
