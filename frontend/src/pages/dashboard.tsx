import { useState } from 'react'
import {
  CalendarDays, Plus, Clock, Users, BookOpen,
  ChevronRight, Sparkles, ArrowRight, RefreshCw,
  AlertTriangle, CheckCircle2, TrendingUp,
  FileText, MapPin,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useTimetableStore } from '@/store/timetableStore'
import { CalendarView } from '@/components/CalendarView'
import { PageHeader } from '@/components/layout/PageHeader'
import { SchedUWordmark, BhuskuFooter } from '@/components/branding/Logos'
import type { Staff } from '@/types'

// ── Helpers ────────────────────────────────────────────────
const GREETING = () => {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

const DAY_DISPLAY: Record<string, string> = {
  MONDAY: 'Mon', TUESDAY: 'Tue', WEDNESDAY: 'Wed',
  THURSDAY: 'Thu', FRIDAY: 'Fri', SATURDAY: 'Sat', SUNDAY: 'Sun',
}

const genderIcon = (st: Staff) =>
  st.gender === 'female' ? '♀' : st.gender === 'male' ? '♂' : '○'

const genderColor = (st: Staff) =>
  st.gender === 'female' ? '#ec4899' : st.gender === 'male' ? '#3b82f6' : '#94a3b8'

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
  ).reduce((a: number, d: any) =>
    a + Object.values(d).filter((x: any) => x?.subject).length, 0)
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
  const { user } = useAuthStore()
  const store = useTimetableStore()
  const { classTT, teacherTT, staff, sections, subjects, periods, substitutions, config } = store

  const [subDrawerOpen, setSubDrawerOpen] = useState(false)
  const [subTab, setSubTab] = useState<'mark' | 'cover' | 'report'>('mark')
  const [absentDay, setAbsentDay] = useState<string>((config.workDays ?? [])[0] ?? 'MONDAY')
  const [absentTeachers, setAbsentTeachers] = useState<string[]>([])
  const [subReasons, setSubReasons] = useState<Record<string, string>>({})
  const [subAssignments, setSubAssignments] = useState<Record<string, string>>(() => ({ ...substitutions }))

  if (!user) { window.location.href = '/login'; return null }

  const hasTimetable = Object.keys(classTT ?? {}).length > 0
  const staffCount = staff.length
  const sectionCount = sections.length
  const subjectCount = subjects.length
  const workDays = config.workDays ?? []
  const timetableName = (config as any).timetableName ?? 'Current Timetable'
  const timetableStatus: string = (store as any).timetableStatus ?? 'draft'
  const activeSubKeys = Object.keys(substitutions)

  const toggleAbsentTeacher = (name: string) => {
    setAbsentTeachers(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    )
  }

  const getAbsentSlots = (teacherName: string) => {
    const slots: { sectionName: string; subject: string; periodId: string; periodName: string }[] = []
    periods.filter(p => p.type === 'class').forEach(p => {
      sections.forEach(sec => {
        const cell = classTT[sec.name]?.[absentDay]?.[p.id]
        if (cell?.teacher === teacherName && cell?.subject) {
          slots.push({ sectionName: sec.name, subject: cell.subject, periodId: p.id, periodName: p.name })
        }
      })
    })
    return slots
  }

  const autoFill = (teacherName: string) => {
    const slots = getAbsentSlots(teacherName)
    const newA = { ...subAssignments }
    const used: Record<string, string> = {}
    slots.forEach(slot => {
      const key = `${slot.sectionName}|${absentDay}|${slot.periodId}`
      if (newA[key]) return
      const scored = staff
        .filter(s => s.name !== teacherName)
        .map(s => ({ s, ...scoreCandidate(s, slot, absentDay, classTT, teacherTT, newA) }))
        .filter(c => !c.isBusy && (!used[slot.periodId] || used[slot.periodId] === c.s.name))
        .sort((a, b) => b.score - a.score)
      if (scored.length > 0) {
        newA[key] = scored[0].s.name
        used[slot.periodId] = scored[0].s.name
      }
    })
    setSubAssignments(newA)
  }

  const applySubstitutions = () => {
    store.setSubstitutions?.(subAssignments)
    setSubDrawerOpen(false)
  }

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

  const calendarAbsentHighlights = absentTeachers.map(t => ({ teacher: t, day: absentDay }))

  // ── STATS ──────────────────────────────────────────────────
  const publishedCount = hasTimetable && timetableStatus === 'published' ? 1 : 0
  const draftCount     = hasTimetable && timetableStatus !== 'published' ? 1 : 0
  const roomsCount     = ((config as any).rooms?.length ?? 0) || sectionCount
  const stats = [
    { icon: <CheckCircle2 size={16} color="#16a34a" />, label: 'Published', value: publishedCount, bg: '#DCFCE7', color: '#16a34a' },
    { icon: <FileText     size={16} color="#D4920E" />, label: 'Draft',     value: draftCount,     bg: '#FEF3C7', color: '#D4920E' },
    { icon: <Users        size={16} color="#7C6FE0" />, label: 'Teachers',  value: staffCount,     bg: '#EDE9FF', color: '#7C6FE0' },
    { icon: <BookOpen     size={16} color="#9B8EF5" />, label: 'Classes',   value: sectionCount,   bg: '#F3E8FF', color: '#9B8EF5' },
    { icon: <Clock        size={16} color="#0EA5E9" />, label: 'Subjects',  value: subjectCount,   bg: '#E0F2FE', color: '#0EA5E9' },
    { icon: <MapPin       size={16} color="#D946EF" />, label: 'Rooms',     value: roomsCount,     bg: '#FAE8FF', color: '#D946EF' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#F9F8FF', display: 'flex', flexDirection: 'column' }}>

      {/* ── SchedU branding strip ─────────────────────────────── */}
      <div style={{
        background: '#FFFFFF', borderBottom: '1px solid #E8E4FF',
        padding: '12px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
      }}>
        <SchedUWordmark iconSize={36} fontSize={18} showTagline />
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#8B87AD' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E' }} />
            All systems normal
          </div>
        </div>
      </div>

      {/* ── Page header ──────────────────────────────────────── */}
      <PageHeader
        icon="🏠"
        title={`${GREETING()}, ${user.name.split(' ')[0]}`}
        description={user.schoolName ?? 'Welcome to Schedu'}
        status="saved"
        actions={
          <div style={{
            padding: '3px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600,
            background: '#EDE9FF', color: '#7C6FE0', border: '1px solid #D8D2FF',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <CheckCircle2 size={11} /> Owner
          </div>
        }
      />

      {/* ── Two-column body ──────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '280px minmax(0, 1fr)',
        gap: 0,
        alignItems: 'start',
        minHeight: 'calc(100vh - 70px)',
      }}>

        {/* ════════════════════════════════════════
            LEFT COLUMN — actions & stats
        ════════════════════════════════════════ */}
        <div style={{
          borderRight: '1px solid #E8E4FF',
          padding: '20px 18px',
          background: '#FAFAFE',
          minHeight: 'calc(100vh - 70px)',
          overflow: 'hidden',
          minWidth: 0,
        }}>

          {/* Stats — 2×3 compact grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
            {stats.map(s => (
              <div key={s.label} style={{
                background: '#fff', borderRadius: 9, padding: '10px 11px',
                border: '1px solid #E8E4FF', display: 'flex', alignItems: 'center', gap: 9, minWidth: 0,
              }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 7, background: s.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {s.icon}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#13111E', lineHeight: 1, fontFamily: "'DM Mono',monospace" }}>
                    {s.value}
                  </div>
                  <div style={{ fontSize: 10, color: '#8B87AD', marginTop: 2, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
              Quick Actions
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                onClick={() => window.location.href = '/wizard'}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                  borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: 'linear-gradient(135deg,#7C6FE0,#9B8EF5)', color: '#fff',
                  textAlign: 'left', width: '100%',
                }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Sparkles size={15} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{hasTimetable ? 'New Timetable' : 'Start Setup Wizard'}</div>
                  <div style={{ fontSize: 11, opacity: 0.8, marginTop: 1 }}>AI-powered conflict-free generation</div>
                </div>
                <ChevronRight size={14} style={{ opacity: 0.7 }} />
              </button>

              <button
                onClick={() => window.location.href = hasTimetable ? '/timetable' : '/wizard'}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                  borderRadius: 10, border: '1px solid #e5e7eb', cursor: 'pointer',
                  background: '#fff', color: '#111827', textAlign: 'left', width: '100%',
                }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CalendarDays size={15} color="#4b5563" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>View Timetable</div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>
                    {hasTimetable ? `${sectionCount} classes · ${staffCount} teachers` : 'No timetable yet'}
                  </div>
                </div>
                <ArrowRight size={14} color="#9ca3af" />
              </button>

              {hasTimetable && (
                <button
                  onClick={() => { setSubDrawerOpen(true); setSubTab('mark') }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                    borderRadius: 10, border: '1.5px solid #fcd34d', cursor: 'pointer',
                    background: '#fffbeb', color: '#92400e', textAlign: 'left', width: '100%',
                  }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <RefreshCw size={15} color="#D4920E" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>Manage Substitutions</div>
                    <div style={{ fontSize: 11, opacity: 0.75, marginTop: 1 }}>
                      {activeSubKeys.length > 0 ? `${activeSubKeys.length} active substitution(s)` : 'Mark absent teachers'}
                    </div>
                  </div>
                  {activeSubKeys.length > 0 && (
                    <span style={{
                      padding: '2px 8px', borderRadius: 12, background: '#f59e0b',
                      color: '#fff', fontSize: 10, fontWeight: 700,
                    }}>
                      {activeSubKeys.length}
                    </span>
                  )}
                </button>
              )}

              <button
                onClick={() => window.location.href = '/timetable'}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                  borderRadius: 10, border: '1px solid #e5e7eb', cursor: 'pointer',
                  background: '#fff', color: '#111827', textAlign: 'left', width: '100%',
                }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <TrendingUp size={15} color="#7C6FE0" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Reports & Analytics</div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>Workload, coverage insights</div>
                </div>
                <ArrowRight size={14} color="#9ca3af" />
              </button>
            </div>
          </div>

          {/* Substitution Report (compact) */}
          {activeSubKeys.length > 0 && (
            <div style={{
              background: '#fff', borderRadius: 10, border: '1px solid #fde68a',
              overflow: 'hidden',
            }}>
              <div style={{
                padding: '10px 14px', background: '#fffbeb',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <AlertTriangle size={14} color="#D4920E" />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#92400e', flex: 1 }}>
                  Active Substitutions
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: '#fef3c7', color: '#D4920E' }}>
                  {activeSubKeys.length}
                </span>
                <button onClick={exportCSV}
                  style={{ fontSize: 10, padding: '3px 8px', borderRadius: 6, border: '1px solid #fcd34d', background: '#fff', color: '#92400e', cursor: 'pointer', fontWeight: 600 }}>
                  CSV
                </button>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#fef9c3' }}>
                      {['Day', 'Period', 'Class', 'Orig.', 'Sub'].map(h => (
                        <th key={h} style={{
                          padding: '6px 10px', fontSize: 10, fontWeight: 700,
                          textAlign: 'left', borderBottom: '1px solid #fde68a',
                          color: '#92400e', whiteSpace: 'nowrap',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {activeSubKeys.slice(0, 5).map(key => {
                      const [sn, day, pid] = key.split('|')
                      const cell = classTT[sn]?.[day]?.[pid]
                      const period = periods.find(p => p.id === pid)
                      return (
                        <tr key={key} style={{ borderBottom: '1px solid #fef3c7' }}>
                          <td style={{ padding: '5px 10px', fontSize: 11, color: '#92400e', fontWeight: 600 }}>{DAY_DISPLAY[day] ?? day}</td>
                          <td style={{ padding: '5px 10px', fontSize: 11 }}>{period?.name ?? pid}</td>
                          <td style={{ padding: '5px 10px', fontSize: 11, fontWeight: 600 }}>{sn}</td>
                          <td style={{ padding: '5px 10px', fontSize: 11, color: '#dc2626' }}>{cell?.teacher ?? '—'}</td>
                          <td style={{ padding: '5px 10px', fontSize: 11, color: '#7C6FE0', fontWeight: 700 }}>{substitutions[key]}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              {activeSubKeys.length > 5 && (
                <div style={{ padding: '8px 14px', textAlign: 'center' }}>
                  <a href="/timetable" style={{ fontSize: 11, color: '#7C6FE0', fontWeight: 600, textDecoration: 'none' }}>
                    View all {activeSubKeys.length} substitutions →
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ════════════════════════════════════════
            RIGHT COLUMN — My Schedule / Calendar
        ════════════════════════════════════════ */}
        <div style={{ background: '#fff', minHeight: 'calc(100vh - 70px)', display: 'flex', flexDirection: 'column' }}>

          {/* Section header */}
          <div style={{
            padding: '18px 24px 14px',
            borderBottom: '1px solid #f3f4f6',
            display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
          }}>
            <CalendarDays size={18} color="#7C6FE0" />
            <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>My Schedule</span>

            {hasTimetable && (
              <>
                <span style={{ fontSize: 13, color: '#6b7280' }}>·</span>
                <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{timetableName}</span>
                <span style={{
                  padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                  background: timetableStatus === 'published' ? '#EDE9FF' : '#fef3c7',
                  color: timetableStatus === 'published' ? '#065f46' : '#92400e',
                }}>
                  {timetableStatus === 'published' ? '✓ Published' : '📋 Draft'}
                </span>
              </>
            )}

            <div style={{ flex: 1 }} />

            {hasTimetable && (
              <>
                <button
                  onClick={() => { setSubDrawerOpen(true); setSubTab('mark') }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 14px', borderRadius: 7,
                    border: '1.5px solid #fcd34d', background: '#fffbeb',
                    color: '#92400e', fontWeight: 600, fontSize: 12, cursor: 'pointer',
                  }}>
                  <RefreshCw size={12} /> Substitutions
                  {activeSubKeys.length > 0 && (
                    <span style={{ background: '#f59e0b', color: '#fff', borderRadius: 8, fontSize: 10, fontWeight: 700, padding: '0px 5px', marginLeft: 2 }}>
                      {activeSubKeys.length}
                    </span>
                  )}
                </button>
                <a href="/timetable" style={{ textDecoration: 'none' }}>
                  <button style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '6px 14px', borderRadius: 7, border: '1px solid #e5e7eb',
                    background: '#f9fafb', color: '#374151', fontWeight: 600, fontSize: 12, cursor: 'pointer',
                  }}>
                    Full view <ArrowRight size={12} />
                  </button>
                </a>
              </>
            )}
          </div>

          {/* Calendar body */}
          {hasTimetable ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
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
          ) : (
            /* Empty state */
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '60px 40px', textAlign: 'center',
            }}>
              <div style={{
                width: 72, height: 72, borderRadius: 20, background: '#EDE9FF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 20,
              }}>
                <CalendarDays size={32} color="#7C6FE0" />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
                No schedule yet
              </h3>
              <p style={{ fontSize: 13, color: '#6b7280', maxWidth: 300, lineHeight: 1.6, marginBottom: 24 }}>
                Complete the setup wizard to generate your first AI-powered, conflict-free timetable.
              </p>
              <button
                onClick={() => window.location.href = '/wizard'}
                style={{
                  padding: '10px 22px', borderRadius: 8, border: 'none',
                  background: '#7C6FE0', color: '#fff', fontWeight: 700,
                  fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7,
                }}>
                <Plus size={14} /> Start Setup Wizard
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          SUBSTITUTION DRAWER
      ═══════════════════════════════════════════════ */}
      {subDrawerOpen && (
        <>
          <div
            onClick={() => setSubDrawerOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 200 }}
          />
          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, width: 420,
            background: '#fff', zIndex: 201, display: 'flex', flexDirection: 'column',
            boxShadow: '-4px 0 24px rgba(0,0,0,0.14)',
          }}>
            {/* Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 12 }}>
              <RefreshCw size={18} color="#D4920E" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Manage Substitutions</div>
                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>Mark absent · Assign cover · View report</div>
              </div>
              <button onClick={() => setSubDrawerOpen(false)}
                style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 14, color: '#6b7280' }}>
                ✕
              </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '2px solid #f3f4f6', flexShrink: 0 }}>
              {([
                { key: 'mark', label: '📋 Mark Absent' },
                { key: 'cover', label: '🔄 Assign Cover' },
                { key: 'report', label: '📊 Report' },
              ] as const).map(t => (
                <button key={t.key} onClick={() => setSubTab(t.key)}
                  disabled={t.key === 'cover' && absentTeachers.length === 0}
                  style={{
                    flex: 1, padding: '10px 4px', border: 'none',
                    borderBottom: subTab === t.key ? '2px solid #7C6FE0' : '2px solid transparent',
                    background: 'transparent',
                    cursor: t.key === 'cover' && absentTeachers.length === 0 ? 'not-allowed' : 'pointer',
                    fontSize: 11, fontWeight: subTab === t.key ? 700 : 400,
                    color: subTab === t.key ? '#7C6FE0' : t.key === 'cover' && absentTeachers.length === 0 ? '#d1d5db' : '#6b7280',
                    marginBottom: -2,
                  }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>

              {/* ── Mark Absent ── */}
              {subTab === 'mark' && (
                <div>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Select Day
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {workDays.map(d => (
                        <button key={d} onClick={() => setAbsentDay(d)}
                          style={{
                            padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                            border: `1.5px solid ${absentDay === d ? '#7C6FE0' : '#e5e7eb'}`,
                            background: absentDay === d ? '#EDE9FF' : '#fff',
                            color: absentDay === d ? '#7C6FE0' : '#374151',
                            cursor: 'pointer',
                          }}>
                          {DAY_DISPLAY[d] ?? d}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Select Absent Teacher(s)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                    {staff.map(st => {
                      const isAbsent = absentTeachers.includes(st.name)
                      return (
                        <div key={st.id}
                          onClick={() => toggleAbsentTeacher(st.name)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                            borderRadius: 8, cursor: 'pointer',
                            border: `1.5px solid ${isAbsent ? '#f59e0b' : '#e5e7eb'}`,
                            background: isAbsent ? '#fffbeb' : '#fafafa',
                          }}>
                          <input type="checkbox" checked={isAbsent} onChange={() => {}} style={{ cursor: 'pointer' }} />
                          <span style={{ fontSize: 13, color: genderColor(st), fontWeight: 700, minWidth: 16 }}>{genderIcon(st)}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{st.name}</div>
                            <div style={{ fontSize: 11, color: '#6b7280' }}>{st.role}</div>
                          </div>
                          {isAbsent && <span style={{ fontSize: 11, color: '#D4920E', fontWeight: 600 }}>Absent</span>}
                        </div>
                      )
                    })}
                  </div>

                  {absentTeachers.length > 0 && (
                    <>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Reason (optional)
                      </div>
                      {absentTeachers.map(name => (
                        <div key={name} style={{ marginBottom: 8 }}>
                          <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>{name}</label>
                          <input
                            placeholder="Sick leave, personal, training…"
                            value={subReasons[name] ?? ''}
                            onChange={e => setSubReasons(r => ({ ...r, [name]: e.target.value }))}
                            style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 12, color: '#111827', outline: 'none', boxSizing: 'border-box' }}
                          />
                        </div>
                      ))}
                      <button onClick={() => setSubTab('cover')}
                        style={{ width: '100%', padding: '11px', borderRadius: 8, border: 'none', background: '#7C6FE0', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', marginTop: 8 }}>
                        Next: Assign Cover →
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* ── Assign Cover ── */}
              {subTab === 'cover' && (
                <div>
                  {absentTeachers.map(teacherName => {
                    const slots = getAbsentSlots(teacherName)
                    return (
                      <div key={teacherName} style={{ marginBottom: 24 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#dc2626' }}>⚠ {teacherName}</span>
                          <button onClick={() => autoFill(teacherName)}
                            style={{ padding: '4px 12px', borderRadius: 6, border: 'none', background: '#7C6FE0', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                            ⚡ Auto-fill best
                          </button>
                        </div>
                        {slots.length === 0 && (
                          <div style={{ fontSize: 12, color: '#94a3b8', padding: '12px', background: '#f8fafc', borderRadius: 8 }}>
                            No class periods on {DAY_DISPLAY[absentDay] ?? absentDay}.
                          </div>
                        )}
                        {slots.map(slot => {
                          const key = `${slot.sectionName}|${absentDay}|${slot.periodId}`
                          const assignedName = subAssignments[key] ?? ''
                          const candidates = staff
                            .filter(s => s.name !== teacherName)
                            .map(s => ({ s, ...scoreCandidate(s, slot, absentDay, classTT, teacherTT, subAssignments) }))
                            .sort((a, b) => b.score - a.score)
                          return (
                            <div key={key} style={{ marginBottom: 12, background: '#f8fafc', borderRadius: 10, padding: '12px', border: '1px solid #e5e7eb' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <div>
                                  <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{slot.periodName}</span>
                                  <span style={{ fontSize: 11, color: '#6b7280', marginLeft: 8 }}>{slot.sectionName} · {slot.subject}</span>
                                </div>
                                {assignedName && <span style={{ fontSize: 11, color: '#7C6FE0', fontWeight: 700 }}>✓ {assignedName}</span>}
                              </div>
                              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                                {candidates.slice(0, 8).map(({ s, subjectMatch, isBusy, workloadToday, workloadWeek, maxW, subFreq }) => {
                                  const selected = assignedName === s.name
                                  return (
                                    <div key={s.id}
                                      onClick={() => setSubAssignments(a => ({ ...a, [key]: selected ? '' : s.name }))}
                                      style={{
                                        minWidth: 130, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', flexShrink: 0,
                                        border: `1.5px solid ${selected ? '#7C6FE0' : isBusy ? '#fecaca' : '#e5e7eb'}`,
                                        background: selected ? '#f0fdf4' : isBusy ? '#fff5f5' : '#fff',
                                      }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                                        <span style={{ fontSize: 11, color: genderColor(s), fontWeight: 700 }}>{genderIcon(s)}</span>
                                        <span style={{ fontSize: 12, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                                      </div>
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 5 }}>
                                        {subjectMatch && <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 8, background: '#EDE9FF', color: '#065f46', fontWeight: 600 }}>★ Subject</span>}
                                        {isBusy && <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 8, background: '#fee2e2', color: '#dc2626', fontWeight: 600 }}>⚠ Busy</span>}
                                      </div>
                                      <div style={{ fontSize: 9, color: '#6b7280' }}>Today: {workloadToday} · Week: {workloadWeek}/{maxW}</div>
                                      <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 2, marginBottom: 5 }}>Subbed {subFreq}× so far</div>
                                      <button style={{
                                        width: '100%', padding: '3px', borderRadius: 5, border: 'none', fontSize: 10, fontWeight: 700, cursor: 'pointer',
                                        background: selected ? '#7C6FE0' : '#7C6FE0', color: '#fff',
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

              {/* ── Report ── */}
              {subTab === 'report' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>
                      {Object.keys(subAssignments).filter(k => subAssignments[k]).length} substitution(s)
                    </span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={exportCSV}
                        style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                        Export CSV
                      </button>
                      <button onClick={() => setSubAssignments({})}
                        style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #fecaca', background: '#fff1f2', color: '#be123c', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                        Clear All
                      </button>
                    </div>
                  </div>
                  {Object.keys(subAssignments).filter(k => subAssignments[k]).length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                      No substitutions assigned yet.
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f9fafb' }}>
                          {['Class', 'Day', 'Period', 'Subject', 'Orig.', 'Sub'].map(h => (
                            <th key={h} style={{ padding: '6px 8px', fontSize: 10, fontWeight: 700, textAlign: 'left', borderBottom: '1.5px solid #e5e7eb', color: '#6b7280', whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(subAssignments).filter(([, v]) => v).map(([key, sub]) => {
                          const [sn, day, pid] = key.split('|')
                          const cell = classTT[sn]?.[day]?.[pid]
                          const period = periods.find(p => p.id === pid)
                          return (
                            <tr key={key} style={{ borderBottom: '1px solid #f3f4f6', background: '#fffbeb' }}>
                              <td style={{ padding: '6px 8px', fontSize: 11, fontWeight: 600 }}>{sn}</td>
                              <td style={{ padding: '6px 8px', fontSize: 11, color: '#92400e' }}>{DAY_DISPLAY[day] ?? day}</td>
                              <td style={{ padding: '6px 8px', fontSize: 11 }}>{period?.name ?? pid}</td>
                              <td style={{ padding: '6px 8px', fontSize: 11 }}>{cell?.subject ?? '—'}</td>
                              <td style={{ padding: '6px 8px', fontSize: 11, color: '#dc2626' }}>{cell?.teacher ?? '—'}</td>
                              <td style={{ padding: '6px 8px', fontSize: 11, color: '#7C6FE0', fontWeight: 700 }}>{sub}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '12px 20px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: 10 }}>
              <button onClick={() => setSubDrawerOpen(false)}
                style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', color: '#374151', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                Cancel
              </button>
              <button
                onClick={applySubstitutions}
                disabled={Object.keys(subAssignments).filter(k => subAssignments[k]).length === 0}
                style={{
                  flex: 2, padding: '10px', borderRadius: 8, border: 'none',
                  background: Object.keys(subAssignments).filter(k => subAssignments[k]).length > 0 ? '#7C6FE0' : '#e5e7eb',
                  color: Object.keys(subAssignments).filter(k => subAssignments[k]).length > 0 ? '#fff' : '#9ca3af',
                  fontWeight: 700, fontSize: 13,
                  cursor: Object.keys(subAssignments).filter(k => subAssignments[k]).length > 0 ? 'pointer' : 'not-allowed',
                }}>
                Apply Substitutions
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Bhusku footer ──────────────────────────────────── */}
      <BhuskuFooter />
    </div>
  )
}
