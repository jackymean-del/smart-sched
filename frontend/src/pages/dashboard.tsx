import { useState } from 'react'
import { CalendarDays, Plus, Clock, Users, BookOpen, ChevronRight, LogOut, Sparkles } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useTimetableStore } from '@/store/timetableStore'
import { CalendarView } from '@/components/CalendarView'
import type { Staff } from '@/types'

const GREETING = () => {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

// ── Gender helpers ──────────────────────────────────────────
const genderIcon = (st: Staff) =>
  st.gender === 'female' ? '♀' : st.gender === 'male' ? '♂' : '○'

const genderColor = (st: Staff) =>
  st.gender === 'female' ? '#ec4899' : st.gender === 'male' ? '#3b82f6' : '#94a3b8'

// ── Scoring function ────────────────────────────────────────
function scoreCandidate(
  st: Staff,
  slot: { sectionName: string; subject: string; periodId: string },
  absentDay: string,
  classTT: Record<string, any>,
  teacherTT: Record<string, any>,
  substitutions: Record<string, string>,
) {
  const subs: string[] = (st as any).subjects ?? []
  const subjectMatch = subs.some(
    s => s === `${slot.sectionName}::${slot.subject}` ||
         s.endsWith(`::${slot.subject}`) ||
         (!s.includes('::') && s === slot.subject)
  )
  const isBusy = Object.entries(classTT).some(
    ([sec, sd]: [string, any]) =>
      sec !== slot.sectionName && sd[absentDay]?.[slot.periodId]?.teacher === st.name
  )
  const workloadToday = Object.values(
    teacherTT[st.name]?.schedule?.[absentDay] ?? {}
  ).filter((x: any) => x?.subject).length
  const workloadWeek = Object.values(
    teacherTT[st.name]?.schedule ?? {}
  ).reduce((a: number, d: any) => a + Object.values(d).filter((x: any) => x?.subject).length, 0)
  const maxW = st.maxPeriodsPerWeek ?? 30
  const subFreq = Object.values(substitutions).filter(v => v === st.name).length
  const score =
    (subjectMatch ? 50 : 0) +
    (isBusy ? 0 : 30) +
    (workloadToday < 4 ? 20 : workloadToday < 6 ? 10 : 0) +
    (workloadWeek < maxW * 0.8 ? 10 : 0) +
    (subFreq < 3 ? 5 : 0)
  return { subjectMatch, isBusy, workloadToday, workloadWeek, maxW, subFreq, score }
}

export function DashboardPage() {
  const { user, logout } = useAuthStore()
  const store = useTimetableStore()

  const {
    classTT, teacherTT, staff, sections, subjects, periods,
    substitutions, config,
  } = store

  // ── Drawer state ───────────────────────────────────────────
  const [subDrawerOpen, setSubDrawerOpen] = useState(false)
  const [subTab, setSubTab] = useState<'mark' | 'cover' | 'report'>('mark')
  const [absentDay, setAbsentDay] = useState<string>(
    (config.workDays ?? [])[0] ?? 'MONDAY'
  )
  const [absentTeachers, setAbsentTeachers] = useState<string[]>([])
  const [subReasons, setSubReasons] = useState<Record<string, string>>({})
  const [subAssignments, setSubAssignments] = useState<Record<string, string>>(
    () => ({ ...substitutions })
  )
  const [subReportOpen, setSubReportOpen] = useState(false)

  if (!user) { window.location.href = '/login'; return null }

  const hasTimetable = Object.keys(classTT ?? {}).length > 0
  const staffCount   = staff.length
  const sectionCount = sections.length
  const subjectCount = subjects.length

  const workDays = config.workDays ?? []
  const timetableName = (config as any).timetableName ?? 'Current Timetable'
  const timetableStatus: string = (store as any).timetableStatus ?? 'draft'

  const handleLogout = () => { logout(); window.location.href = '/login' }

  // ── Absent teacher toggle ──────────────────────────────────
  const toggleAbsentTeacher = (name: string) => {
    setAbsentTeachers(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    )
  }

  // ── Compute slots for absent teacher on absentDay ──────────
  const getAbsentSlots = (teacherName: string) => {
    const slots: { sectionName: string; subject: string; periodId: string; periodName: string }[] = []
    const classPeriods = periods.filter(p => p.type === 'class')
    classPeriods.forEach(p => {
      sections.forEach(sec => {
        const cell = classTT[sec.name]?.[absentDay]?.[p.id]
        if (cell?.teacher === teacherName && cell?.subject) {
          slots.push({
            sectionName: sec.name,
            subject: cell.subject,
            periodId: p.id,
            periodName: p.name,
          })
        }
      })
    })
    return slots
  }

  // ── Auto-fill for one absent teacher ──────────────────────
  const autoFill = (teacherName: string) => {
    const slots = getAbsentSlots(teacherName)
    const newAssignments = { ...subAssignments }
    // track which teachers already got assigned in this batch (periodId → teacherName)
    const usedThisRound: Record<string, string> = {}
    slots.forEach(slot => {
      const key = `${slot.sectionName}|${absentDay}|${slot.periodId}`
      if (newAssignments[key]) return
      const candidates = staff.filter(s => s.name !== teacherName)
      const scored = candidates
        .map(s => ({ s, ...scoreCandidate(s, slot, absentDay, classTT, teacherTT, newAssignments) }))
        .filter(c => !c.isBusy && (!usedThisRound[slot.periodId] || usedThisRound[slot.periodId] === c.s.name))
        .sort((a, b) => b.score - a.score)
      if (scored.length > 0) {
        newAssignments[key] = scored[0].s.name
        usedThisRound[slot.periodId] = scored[0].s.name
      }
    })
    setSubAssignments(newAssignments)
  }

  // ── Apply substitutions ────────────────────────────────────
  const applySubstitutions = () => {
    store.setSubstitutions?.(subAssignments)
    setSubDrawerOpen(false)
  }

  // ── Active substitutions count ────────────────────────────
  const activeSubKeys = Object.keys(substitutions)

  // ── absentHighlights for CalendarView ─────────────────────
  const calendarAbsentHighlights = absentTeachers.map(t => ({ teacher: t, day: absentDay }))

  // ── Export substitutions CSV ───────────────────────────────
  const exportCSV = () => {
    const header = 'Day,Period,Class,Subject,Absent Teacher,Substitute'
    const rows = Object.entries(substitutions).map(([key, sub]) => {
      const [sectionName, day, periodId] = key.split('|')
      const cell = classTT[sectionName]?.[day]?.[periodId]
      const period = periods.find(p => p.id === periodId)
      return `${day},${period?.name ?? periodId},${sectionName},${cell?.subject ?? ''},${cell?.teacher ?? ''},${sub}`
    })
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'substitutions.csv'
    a.click()
  }

  const DAY_DISPLAY: Record<string, string> = {
    MONDAY: 'Mon', TUESDAY: 'Tue', WEDNESDAY: 'Wed', THURSDAY: 'Thu',
    FRIDAY: 'Fri', SATURDAY: 'Sat', SUNDAY: 'Sun',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>

      {/* ── Top nav ─────────────────────────────────────────── */}
      <header style={{
        height: 56, background: '#fff', borderBottom: '1px solid #e5e7eb',
        display: 'flex', alignItems: 'center', padding: '0 28px', gap: 16,
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#34d399,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CalendarDays size={15} color="#fff" />
          </div>
          <span style={{ fontFamily: "'DM Serif Display',Georgia,serif", fontSize: 17 }}>
            Sche<span style={{ color: '#059669' }}>du</span>
          </span>
        </div>

        <nav style={{ flex: 1, display: 'flex', gap: 2, marginLeft: 16 }}>
          {[
            { label: 'Dashboard', href: '/dashboard', active: true },
            { label: 'Timetable', href: '/timetable', active: false },
          ].map(n => (
            <a key={n.label} href={n.href} style={{
              padding: '6px 14px', borderRadius: 6, fontSize: 13, fontWeight: n.active ? 600 : 400,
              color: n.active ? '#111827' : '#6b7280', textDecoration: 'none',
              background: n.active ? '#f3f4f6' : 'transparent',
            }}>{n.label}</a>
          ))}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{user.name}</div>
            {user.schoolName && <div style={{ fontSize: 11, color: '#6b7280' }}>{user.schoolName}</div>}
          </div>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 700 }}>
            {user.name[0].toUpperCase()}
          </div>
          <button onClick={handleLogout}
            style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#6b7280' }}>
            <LogOut size={13} /> Logout
          </button>
        </div>
      </header>

      {/* ── Main content ─────────────────────────────────────── */}
      <main style={{ padding: '32px 32px', maxWidth: 1200, margin: '0 auto' }}>

        {/* Welcome */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 4 }}>
            {GREETING()}, {user.name.split(' ')[0]} 👋
          </h1>
          <p style={{ color: '#6b7280', fontSize: 14 }}>
            {user.schoolName ? `Managing timetables for ${user.schoolName}` : 'Set up your school to get started'}
          </p>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 32 }}>
          {[
            { icon: <CalendarDays size={20} color="#4f46e5" />, label: 'Timetables', value: hasTimetable ? 1 : 0, bg: '#eff6ff', border: '#dbeafe' },
            { icon: <Users size={20} color="#059669" />,        label: 'Teachers',   value: staffCount,            bg: '#f0fdf4', border: '#bbf7d0' },
            { icon: <BookOpen size={20} color="#7c3aed" />,     label: 'Classes',    value: sectionCount,          bg: '#faf5ff', border: '#e9d5ff' },
            { icon: <Clock size={20} color="#d97706" />,        label: 'Subjects',   value: subjectCount,          bg: '#fffbeb', border: '#fde68a' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', borderRadius: 12, padding: '20px 20px', border: `1px solid ${s.border}`, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {s.icon}
              </div>
              <div>
                <div style={{ fontSize: 26, fontWeight: 700, fontFamily: "'DM Mono',monospace", color: '#111827', lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Action cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 32 }}>

          {/* Create new timetable */}
          <div style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', borderRadius: 14, padding: '28px 28px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -30, right: -30, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
            <div style={{ position: 'relative' }}>
              <div style={{ fontSize: 30, marginBottom: 12 }}>✨</div>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
                {hasTimetable ? 'Create New Timetable' : 'Start Your First Timetable'}
              </h2>
              <p style={{ fontSize: 13, opacity: 0.85, marginBottom: 20, lineHeight: 1.6 }}>
                Set up school details, bell schedule, and resources. Schedu generates a conflict-free timetable in seconds.
              </p>
              <button onClick={() => window.location.href = '/wizard'}
                style={{ padding: '10px 20px', borderRadius: 8, background: '#fff', border: 'none', color: '#4f46e5', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Plus size={15} /> Start Setup Wizard <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* View existing */}
          <div style={{ background: '#fff', borderRadius: 14, padding: '28px 28px', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: 30, marginBottom: 12 }}>📋</div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 8 }}>View Timetable</h2>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20, lineHeight: 1.6 }}>
              {hasTimetable
                ? `Current timetable has ${sectionCount} classes, ${staffCount} teachers.`
                : 'No timetable generated yet. Complete the wizard to generate one.'}
            </p>
            <button onClick={() => window.location.href = hasTimetable ? '/timetable' : '/wizard'}
              style={{
                padding: '10px 20px', borderRadius: 8, border: '1.5px solid #e5e7eb',
                background: hasTimetable ? '#f9fafb' : '#f3f4f6',
                color: hasTimetable ? '#374151' : '#9ca3af',
                fontWeight: 600, fontSize: 13, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
              {hasTimetable ? <><Sparkles size={14} /> View Timetable</> : 'Complete wizard first'}
            </button>
          </div>
        </div>

        {/* ── Calendar section (only when hasTimetable) ─────── */}
        {hasTimetable && (
          <div style={{ marginBottom: 32, background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', overflow: 'hidden' }}>

            {/* Section header */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>
                📅 {timetableName}
              </span>
              <span style={{
                padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                background: timetableStatus === 'published' ? '#d1fae5' : '#fef3c7',
                color: timetableStatus === 'published' ? '#065f46' : '#92400e',
              }}>
                {timetableStatus === 'published' ? 'Published' : 'Draft'}
              </span>
              <div style={{ flex: 1 }} />
              <button
                onClick={() => { setSubDrawerOpen(true); setSubTab('mark') }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 16px', borderRadius: 8,
                  border: '1.5px solid #f59e0b', background: '#fffbeb',
                  color: '#92400e', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                }}>
                🔄 Mark Absent
              </button>
            </div>

            {/* CalendarView constrained height */}
            <div style={{ height: 420, display: 'flex', flexDirection: 'column' as const, overflow: 'hidden' }}>
              <CalendarView
                classTT={classTT}
                teacherTT={teacherTT}
                periods={periods}
                workDays={workDays}
                startTime={config.startTime ?? '09:00'}
                timeFormat={config.timeFormat as '12h' | '24h' | undefined}
                staff={staff}
                sections={sections}
                subjects={subjects}
                substitutions={substitutions}
                viewMode="class"
                selectedEntity="ALL"
                showTeacher={true}
                showRoom={false}
                absentHighlights={calendarAbsentHighlights}
              />
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden', marginBottom: 32 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>Quick Actions</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)' }}>
            {[
              { icon: '🏫', label: 'School Setup',  href: '/wizard' },
              { icon: '📊', label: 'Load Demo',     href: '/demo' },
              { icon: '📤', label: 'Export Excel',  href: '/timetable' },
              { icon: '⚙️', label: 'Settings',      href: '#' },
            ].map((a, i) => (
              <a key={a.label} href={a.href} style={{
                display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center',
                padding: '20px 16px', textDecoration: 'none', gap: 8,
                borderRight: i < 3 ? '1px solid #f3f4f6' : 'none',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.background = '#f9fafb'}
              onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'}>
                <span style={{ fontSize: 24 }}>{a.icon}</span>
                <span style={{ fontSize: 12, fontWeight: 500, color: '#374151' }}>{a.label}</span>
              </a>
            ))}
          </div>
        </div>

        {/* ── Substitution Report section ──────────────────── */}
        {activeSubKeys.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #fde68a', overflow: 'hidden' }}>
            <button
              onClick={() => setSubReportOpen(o => !o)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 20px', border: 'none', background: '#fffbeb',
                cursor: 'pointer', textAlign: 'left' as const,
              }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#92400e' }}>📊 Substitution Report</span>
              <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#fef3c7', color: '#d97706' }}>
                {activeSubKeys.length} active substitutions
              </span>
              <div style={{ flex: 1 }} />
              <a href="/timetable" style={{ padding: '5px 14px', borderRadius: 7, background: '#4f46e5', color: '#fff', fontSize: 12, fontWeight: 600, textDecoration: 'none', marginRight: 8 }}>
                View in Timetable
              </a>
              <span style={{ fontSize: 12, color: '#92400e' }}>{subReportOpen ? '▲' : '▼'}</span>
            </button>

            {subReportOpen && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#fef9c3' }}>
                      {['Day', 'Period', 'Class', 'Subject', 'Absent Teacher', 'Substitute'].map(h => (
                        <th key={h} style={{ padding: '8px 14px', fontSize: 11, fontWeight: 700, textAlign: 'left' as const, borderBottom: '1.5px solid #fde68a', color: '#92400e', whiteSpace: 'nowrap' as const }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {activeSubKeys.map(key => {
                      const [sectionName, day, periodId] = key.split('|')
                      const cell = classTT[sectionName]?.[day]?.[periodId]
                      const period = periods.find(p => p.id === periodId)
                      const sub = substitutions[key]
                      return (
                        <tr key={key} style={{ background: '#fffbeb', borderBottom: '1px solid #fef3c7' }}>
                          <td style={{ padding: '8px 14px', fontSize: 12, color: '#92400e', fontWeight: 600 }}>{DAY_DISPLAY[day] ?? day}</td>
                          <td style={{ padding: '8px 14px', fontSize: 12, color: '#374151' }}>{period?.name ?? periodId}</td>
                          <td style={{ padding: '8px 14px', fontSize: 12, color: '#374151' }}>{sectionName}</td>
                          <td style={{ padding: '8px 14px', fontSize: 12, color: '#374151' }}>{cell?.subject ?? '—'}</td>
                          <td style={{ padding: '8px 14px', fontSize: 12, color: '#dc2626' }}>{cell?.teacher ?? '—'}</td>
                          <td style={{ padding: '8px 14px', fontSize: 12, color: '#059669', fontWeight: 600 }}>{sub}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ════════════════════════════════════════════════════════
          SUBSTITUTION DRAWER (right slide-in)
      ════════════════════════════════════════════════════════ */}
      {subDrawerOpen && (
        <>
          {/* Overlay */}
          <div
            onClick={() => setSubDrawerOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 200 }}
          />

          {/* Drawer panel */}
          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, width: 420,
            background: '#fff', zIndex: 201, display: 'flex', flexDirection: 'column' as const,
            boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
          }}>

            {/* Drawer header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>🔄 Manage Substitutions</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Mark absent teachers and assign cover</div>
              </div>
              <button onClick={() => setSubDrawerOpen(false)}
                style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 16, color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                ✕
              </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', flexShrink: 0 }}>
              {([
                { key: 'mark',   label: '📋 Mark Absent' },
                { key: 'cover',  label: '🔄 Assign Cover' },
                { key: 'report', label: '📊 Report' },
              ] as const).map(t => (
                <button key={t.key} onClick={() => setSubTab(t.key)}
                  disabled={t.key === 'cover' && absentTeachers.length === 0}
                  style={{
                    flex: 1, padding: '10px 4px', border: 'none',
                    borderBottom: subTab === t.key ? '2px solid #4f46e5' : '2px solid transparent',
                    background: 'transparent', cursor: t.key === 'cover' && absentTeachers.length === 0 ? 'not-allowed' : 'pointer',
                    fontSize: 11, fontWeight: subTab === t.key ? 700 : 400,
                    color: subTab === t.key ? '#4f46e5' : t.key === 'cover' && absentTeachers.length === 0 ? '#d1d5db' : '#6b7280',
                  }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>

              {/* ── TAB: Mark Absent ── */}
              {subTab === 'mark' && (
                <div>
                  {/* Day chips */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', marginBottom: 8, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>
                      Select Day
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
                      {workDays.map(d => (
                        <button key={d} onClick={() => setAbsentDay(d)}
                          style={{
                            padding: '5px 14px', borderRadius: 20, border: '1.5px solid',
                            borderColor: absentDay === d ? '#4f46e5' : '#e5e7eb',
                            background: absentDay === d ? '#eef2ff' : '#fff',
                            color: absentDay === d ? '#4f46e5' : '#374151',
                            fontSize: 12, fontWeight: 600, cursor: 'pointer',
                          }}>
                          {DAY_DISPLAY[d] ?? d}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Teacher grid */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', marginBottom: 8, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>
                      Select Absent Teachers
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
                      {staff.map(st => {
                        const isAbsent = absentTeachers.includes(st.name)
                        return (
                          <div key={st.id}
                            onClick={() => toggleAbsentTeacher(st.name)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 10,
                              padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                              border: `1.5px solid ${isAbsent ? '#f59e0b' : '#e5e7eb'}`,
                              background: isAbsent ? '#fffbeb' : '#fafafa',
                            }}>
                            <input type="checkbox" checked={isAbsent} onChange={() => {}} style={{ cursor: 'pointer', width: 14, height: 14 }} />
                            <span style={{ fontSize: 12, color: genderColor(st), fontWeight: 700, minWidth: 16 }}>
                              {genderIcon(st)}
                            </span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{st.name}</div>
                              <div style={{ fontSize: 11, color: '#6b7280' }}>{st.role}</div>
                            </div>
                            {isAbsent && (
                              <span style={{ fontSize: 11, color: '#d97706', fontWeight: 600 }}>Absent</span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Reason per teacher */}
                  {absentTeachers.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', marginBottom: 8, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>
                        Reason (optional)
                      </div>
                      {absentTeachers.map(name => (
                        <div key={name} style={{ marginBottom: 8 }}>
                          <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>{name}</label>
                          <input
                            placeholder="Sick leave, personal, training..."
                            value={subReasons[name] ?? ''}
                            onChange={e => setSubReasons(r => ({ ...r, [name]: e.target.value }))}
                            style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 12, color: '#111827', outline: 'none', boxSizing: 'border-box' as const }}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Next button */}
                  {absentTeachers.length > 0 && (
                    <button onClick={() => setSubTab('cover')}
                      style={{ width: '100%', padding: '11px', borderRadius: 8, border: 'none', background: '#4f46e5', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                      Next: Assign Cover →
                    </button>
                  )}
                </div>
              )}

              {/* ── TAB: Assign Cover ── */}
              {subTab === 'cover' && (
                <div>
                  {absentTeachers.map(teacherName => {
                    const slots = getAbsentSlots(teacherName)
                    return (
                      <div key={teacherName} style={{ marginBottom: 24 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#dc2626' }}>
                            ⚠ {teacherName} — {DAY_DISPLAY[absentDay] ?? absentDay}
                          </div>
                          <button onClick={() => autoFill(teacherName)}
                            style={{ padding: '4px 12px', borderRadius: 6, border: 'none', background: '#4f46e5', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                            ⚡ Auto-fill best
                          </button>
                        </div>

                        {slots.length === 0 && (
                          <div style={{ fontSize: 12, color: '#94a3b8', padding: '12px', background: '#f8fafc', borderRadius: 8 }}>
                            No class periods for this teacher on {DAY_DISPLAY[absentDay] ?? absentDay}.
                          </div>
                        )}

                        {slots.map(slot => {
                          const key = `${slot.sectionName}|${absentDay}|${slot.periodId}`
                          const assignedName = subAssignments[key] ?? ''
                          const candidates = staff
                            .filter(s => s.name !== teacherName)
                            .map(s => ({ s, ...scoreCandidate(s, slot, absentDay, classTT, teacherTT, subAssignments) }))
                            .sort((a, b) => b.score - a.score)
                          const sec = sections.find(s => s.name === slot.sectionName)
                          const isClassTeacherOfSec = (st: Staff) =>
                            sec?.classTeacher === st.id || (sec as any)?.classTeacherName === st.name

                          return (
                            <div key={key} style={{ marginBottom: 12, background: '#f8fafc', borderRadius: 10, padding: '12px', border: '1px solid #e5e7eb' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <div>
                                  <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{slot.periodName}</span>
                                  <span style={{ fontSize: 12, color: '#6b7280', marginLeft: 8 }}>{slot.sectionName} · {slot.subject}</span>
                                </div>
                                {assignedName && (
                                  <span style={{ fontSize: 11, color: '#059669', fontWeight: 700 }}>✓ {assignedName}</span>
                                )}
                              </div>

                              {/* Candidate cards — horizontal scroll */}
                              <div style={{ display: 'flex', gap: 8, overflowX: 'auto' as const, paddingBottom: 4 }}>
                                {candidates.slice(0, 8).map(({ s, subjectMatch, isBusy, workloadToday, workloadWeek, maxW, subFreq }) => {
                                  const selected = assignedName === s.name
                                  return (
                                    <div key={s.id} style={{
                                      minWidth: 140, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', flexShrink: 0,
                                      border: `1.5px solid ${selected ? '#059669' : isBusy ? '#fecaca' : '#e5e7eb'}`,
                                      background: selected ? '#f0fdf4' : isBusy ? '#fff5f5' : '#fff',
                                    }}
                                      onClick={() => setSubAssignments(a => ({ ...a, [key]: selected ? '' : s.name }))}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                                        <span style={{ fontSize: 11, color: genderColor(s), fontWeight: 700 }}>{genderIcon(s)}</span>
                                        <span style={{ fontSize: 12, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{s.name}</span>
                                      </div>
                                      <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 3, marginBottom: 6 }}>
                                        {subjectMatch && (
                                          <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 8, background: '#d1fae5', color: '#065f46', fontWeight: 600 }}>★ Same subject</span>
                                        )}
                                        {isBusy && (
                                          <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 8, background: '#fee2e2', color: '#dc2626', fontWeight: 600 }}>⚠ Busy</span>
                                        )}
                                        {isClassTeacherOfSec(s) && (
                                          <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 8, background: '#e0e7ff', color: '#3730a3', fontWeight: 600 }}>👨‍🏫 CT</span>
                                        )}
                                      </div>
                                      <div style={{ fontSize: 9, color: '#6b7280', marginBottom: 4 }}>
                                        Workload: {workloadToday} today / {workloadWeek}/{maxW} wk
                                      </div>
                                      <div style={{ fontSize: 9, color: '#94a3b8', marginBottom: 6 }}>
                                        Subbed {subFreq}× so far
                                      </div>
                                      <button style={{
                                        width: '100%', padding: '4px', borderRadius: 5, border: 'none', fontSize: 10, fontWeight: 700, cursor: 'pointer',
                                        background: selected ? '#059669' : '#4f46e5', color: '#fff',
                                      }}>
                                        {selected ? '✓ Selected' : 'Select'}
                                      </button>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* ── TAB: Report ── */}
              {subTab === 'report' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>
                      {Object.keys(subAssignments).filter(k => subAssignments[k]).length} substitution(s)
                    </span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={exportCSV}
                        style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                        Export CSV
                      </button>
                      <button onClick={() => setSubAssignments({})}
                        style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid #fecaca', background: '#fff1f2', color: '#be123c', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                        Clear All
                      </button>
                    </div>
                  </div>

                  {Object.keys(subAssignments).filter(k => subAssignments[k]).length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center' as const, color: '#94a3b8', fontSize: 13 }}>
                      No substitutions assigned yet.
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f9fafb' }}>
                          {['Class', 'Day', 'Period', 'Subject', 'Orig.', 'Sub'].map(h => (
                            <th key={h} style={{ padding: '6px 8px', fontSize: 10, fontWeight: 700, textAlign: 'left' as const, borderBottom: '1.5px solid #e5e7eb', color: '#6b7280', whiteSpace: 'nowrap' as const }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(subAssignments).filter(([, v]) => v).map(([key, sub]) => {
                          const [sectionName, day, periodId] = key.split('|')
                          const cell = classTT[sectionName]?.[day]?.[periodId]
                          const period = periods.find(p => p.id === periodId)
                          return (
                            <tr key={key} style={{ borderBottom: '1px solid #f3f4f6', background: '#fffbeb' }}>
                              <td style={{ padding: '6px 8px', fontSize: 11, fontWeight: 600 }}>{sectionName}</td>
                              <td style={{ padding: '6px 8px', fontSize: 11, color: '#92400e' }}>{DAY_DISPLAY[day] ?? day}</td>
                              <td style={{ padding: '6px 8px', fontSize: 11 }}>{period?.name ?? periodId}</td>
                              <td style={{ padding: '6px 8px', fontSize: 11 }}>{cell?.subject ?? '—'}</td>
                              <td style={{ padding: '6px 8px', fontSize: 11, color: '#dc2626' }}>{cell?.teacher ?? '—'}</td>
                              <td style={{ padding: '6px 8px', fontSize: 11, color: '#059669', fontWeight: 700 }}>{sub}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>

            {/* Drawer footer */}
            <div style={{ padding: '14px 20px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: 10 }}>
              <button onClick={() => setSubDrawerOpen(false)}
                style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', color: '#374151', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                Cancel
              </button>
              <button
                onClick={applySubstitutions}
                disabled={Object.keys(subAssignments).filter(k => subAssignments[k]).length === 0}
                style={{
                  flex: 2, padding: '10px', borderRadius: 8, border: 'none',
                  background: Object.keys(subAssignments).filter(k => subAssignments[k]).length > 0 ? '#059669' : '#e5e7eb',
                  color: Object.keys(subAssignments).filter(k => subAssignments[k]).length > 0 ? '#fff' : '#9ca3af',
                  fontWeight: 700, fontSize: 13, cursor: Object.keys(subAssignments).filter(k => subAssignments[k]).length > 0 ? 'pointer' : 'not-allowed',
                }}>
                Apply Substitutions
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
