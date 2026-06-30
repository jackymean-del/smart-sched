/**
 * DashboardTimetablePanel — inline, read-only view of the ACTIVE timetable
 * rendered directly on the dashboard. Uses the same <CalendarView> the full
 * editor uses, so it supports the Section / Faculty / Subject / Room filters,
 * the entity dropdown, and the Faculty/Room toggles. Substitutions already
 * applied to the schedule are reflected (the substitutions prop), and the
 * "Open full editor" button jumps to /timetable for editing + substitution
 * management.
 *
 * Renders nothing when there's no active timetable with data, so the dashboard
 * is unchanged for users who haven't generated one yet.
 */
import { useState, useMemo, useEffect } from 'react'
import { useTimetableStore } from '@/store/timetableStore'
import { loadActiveTimetableIntoStore } from '@/lib/ttRegistry'
import { CalendarView } from '@/components/CalendarView'
import { BookOpen, ExternalLink } from 'lucide-react'

type ViewMode = 'class' | 'teacher' | 'subject' | 'room'

const MODE_TABS: { key: ViewMode; label: string }[] = [
  { key: 'class',   label: 'Section' },
  { key: 'teacher', label: 'Faculty' },
  { key: 'subject', label: 'Subject' },
  { key: 'room',    label: 'Room'    },
]

export function DashboardTimetablePanel() {
  const store = useTimetableStore() as any
  const {
    classTT, teacherTT, periods, config,
    sections, staff, subjects, substitutions,
  } = store

  // Hydrate the active snapshot if the store is empty (direct dashboard load).
  useEffect(() => { loadActiveTimetableIntoStore() }, [])

  const [viewMode, setViewMode]   = useState<ViewMode>('class')
  const [entity, setEntity]       = useState<string>('ALL')
  const [showTeacher, setShowTeacher] = useState(true)
  const [showRoom, setShowRoom]   = useState(false)

  const hasTimetable =
    (sections?.length ?? 0) > 0 && Object.keys(classTT ?? {}).length > 0

  // Entity options for the current view mode.
  const entityOptions = useMemo<string[]>(() => {
    const names: string[] =
      viewMode === 'class'   ? (sections ?? []).map((s: any) => s.name)
    : viewMode === 'teacher' ? (staff ?? []).map((s: any) => s.name)
    : viewMode === 'subject' ? (subjects ?? []).map((s: any) => s.name)
    : (store.rooms ?? []).map((r: any) => r.actualName || r.generatedName || r.name)
    const clean = names.filter((n): n is string => Boolean(n))
    return ['ALL', ...Array.from(new Set(clean)).sort()]
  }, [viewMode, sections, staff, subjects, store.rooms])

  // Reset the entity filter to ALL whenever the view mode changes.
  useEffect(() => { setEntity('ALL') }, [viewMode])

  if (!hasTimetable) return null

  const workDays: string[] = config?.workDays?.length
    ? config.workDays
    : ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{
        background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12,
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 12, flexWrap: 'wrap',
          padding: '14px 16px', borderBottom: '1px solid #F1F1F4',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BookOpen size={16} color="#7C6FE0" />
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#13111E', margin: 0 }}>
              Active schedule
            </h2>
          </div>
          <a
            href="/timetable"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 8,
              background: '#7C6FE0', color: '#fff',
              fontSize: 12.5, fontWeight: 600, textDecoration: 'none',
            }}
          >
            Open full editor <ExternalLink size={13} />
          </a>
        </div>

        {/* Controls */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
          padding: '10px 16px', background: '#FAF9FF', borderBottom: '1px solid #F1F1F4',
        }}>
          {/* View-mode tabs */}
          <div style={{ display: 'flex', border: '1px solid #E5E7EB', borderRadius: 8, overflow: 'hidden' }}>
            {MODE_TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setViewMode(t.key)}
                style={{
                  padding: '5px 12px', border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
                  background: viewMode === t.key ? '#7C6FE0' : '#fff',
                  color: viewMode === t.key ? '#fff' : '#64748b',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Entity filter */}
          <select
            value={entity}
            onChange={e => setEntity(e.target.value)}
            style={{
              padding: '6px 10px', borderRadius: 8,
              border: '1px solid #DDD8FF', fontSize: 12.5,
              fontWeight: 600, color: '#13111E', background: '#fff', cursor: 'pointer',
            }}
          >
            {entityOptions.map(o => (
              <option key={o} value={o}>{o === 'ALL' ? 'All' : o}</option>
            ))}
          </select>

          <div style={{ flex: 1 }} />

          {/* Toggles */}
          <label style={toggleStyle}>
            <input type="checkbox" checked={showTeacher} onChange={e => setShowTeacher(e.target.checked)} />
            Faculty
          </label>
          <label style={toggleStyle}>
            <input type="checkbox" checked={showRoom} onChange={e => setShowRoom(e.target.checked)} />
            Room
          </label>
        </div>

        {/* The schedule grid */}
        <div style={{ padding: 12, overflowX: 'auto' }}>
          <CalendarView
            classTT={classTT}
            teacherTT={teacherTT}
            periods={periods}
            workDays={workDays}
            startTime={config?.startTime ?? '09:00'}
            timeFormat={config?.timeFormat as '12h' | '24h' | undefined}
            staff={staff}
            sections={sections}
            subjects={subjects}
            substitutions={substitutions ?? {}}
            viewMode={viewMode}
            selectedEntity={entity}
            showTeacher={showTeacher}
            showRoom={showRoom}
            rooms={store.rooms ?? []}
            sectionStrengths={store.sectionStrengths ?? []}
            classwiseBreaks={(config as any)?.classwiseBreaks}
          />
        </div>
      </div>
    </div>
  )
}

const toggleStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 5,
  fontSize: 12.5, fontWeight: 600, color: '#4B5275', cursor: 'pointer',
}
