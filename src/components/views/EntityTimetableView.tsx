/**
 * EntityTimetableView — shared component for Teacher & Room timetables.
 *
 * Renders a weekly grid where ROWS = entities (teachers OR rooms) and
 * COLUMNS = days. Each cell shows what that entity is doing at that
 * (day, period) — derived from classTT.
 *
 * For TEACHER mode: scans cells where cell.teacher === entityName
 *                   OR any cell.options[i].teacher === entityName
 * For ROOM mode:    scans cells where cell.room === entityName
 *                   OR any cell.options[i].room === entityName
 */

import { useMemo } from 'react'
import type { ClassTimetable, Period, Staff, Section, TimetableCell } from '@/types'
import { getSubjectColor } from '@/lib/orgData'

interface Props {
  mode: 'teacher' | 'room'
  classTT: ClassTimetable
  staff: Staff[]
  sections: Section[]
  periods: Period[]
  workDays: string[]
  rooms?: { id?: string; name: string }[]
  selectedEntity?: string  // when set, show only this entity
}

const DAY_LABEL: Record<string, string> = {
  MONDAY: 'Mon', TUESDAY: 'Tue', WEDNESDAY: 'Wed',
  THURSDAY: 'Thu', FRIDAY: 'Fri', SATURDAY: 'Sat', SUNDAY: 'Sun',
}

interface CellMatch {
  section: string
  subject: string
  teacher: string
  room: string
  isBlock?: boolean
}

/** Find what's happening for this entity at (day, periodId). Returns array
 *  because one teacher may serve multiple sections via cross-section pooling. */
function findEntityCells(
  mode: 'teacher' | 'room',
  entityName: string,
  classTT: ClassTimetable,
  day: string,
  periodId: string,
): CellMatch[] {
  const matches: CellMatch[] = []
  Object.entries(classTT).forEach(([sec, secData]) => {
    const cell: any = secData[day]?.[periodId]
    if (!cell?.subject) return

    // Optional block — check each option
    if (cell.options && Array.isArray(cell.options)) {
      cell.options.forEach((opt: any) => {
        const target = mode === 'teacher' ? opt.teacher : opt.room
        if (target === entityName) {
          matches.push({
            section: sec,
            subject: opt.subject,
            teacher: opt.teacher ?? '',
            room: opt.room ?? '',
            isBlock: true,
          })
        }
      })
      return
    }

    // Regular single-subject cell
    const target = mode === 'teacher' ? cell.teacher : cell.room
    if (target === entityName) {
      matches.push({
        section: sec,
        subject: cell.subject,
        teacher: cell.teacher ?? '',
        room: cell.room ?? '',
      })
    }
  })
  return matches
}

export function EntityTimetableView({
  mode, classTT, staff, sections, periods, workDays, rooms, selectedEntity,
}: Props) {
  // Build entity list
  const entities = useMemo(() => {
    if (mode === 'teacher') {
      return staff.map(s => ({ id: s.id, name: s.name, sub: (s.subjects ?? [])[0] ?? '' }))
    }
    // mode === 'room' — derive unique room names from classTT + sections + provided rooms list
    const set = new Set<string>()
    sections.forEach(s => { if ((s as any).room) set.add((s as any).room) })
    Object.values(classTT).forEach(secData =>
      Object.values(secData ?? {}).forEach(dayData =>
        Object.values(dayData ?? {}).forEach((cell: any) => {
          if (cell?.room) set.add(cell.room)
          if (cell?.options) cell.options.forEach((o: any) => { if (o.room) set.add(o.room) })
        })
      )
    )
    rooms?.forEach(r => { if (r.name) set.add(r.name) })
    return Array.from(set).sort().map(name => ({ id: name, name, sub: '' }))
  }, [mode, staff, sections, classTT, rooms])

  const visibleEntities = selectedEntity && selectedEntity !== 'ALL'
    ? entities.filter(e => e.name === selectedEntity)
    : entities

  const visibleDays = workDays.filter(d => DAY_LABEL[d])
  const classPeriods = periods.filter(p => p.type === 'class' || !p.type)

  const isEmpty = visibleEntities.length === 0 || Object.keys(classTT).length === 0

  return (
    <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', background: '#fff', borderRadius: 12 }}>

      {isEmpty && (
        <div style={{ padding: '60px 20px', textAlign: 'center', color: '#8B87AD' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>
            {mode === 'teacher' ? '👤' : '🚪'}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#13111E' }}>
            No {mode === 'teacher' ? 'teachers' : 'rooms'} to display
          </div>
          <div style={{ fontSize: 11, marginTop: 6 }}>
            Generate a timetable first to see the {mode} schedule.
          </div>
        </div>
      )}

      {!isEmpty && (
        <table style={{ borderCollapse: 'collapse', width: '100%', tableLayout: 'fixed' }}>
          <thead>
            <tr>
              <th style={{ width: 160, background: '#7C6FE0', color: '#fff', padding: '10px 8px', fontSize: 10, fontWeight: 800, border: '1px solid #9B8EF5', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {mode === 'teacher' ? 'Teacher' : 'Room'}
              </th>
              <th style={{ width: 78, background: '#7C6FE0', color: '#fff', padding: '8px 6px', fontSize: 10, fontWeight: 700, border: '1px solid #9B8EF5' }}>Day</th>
              {classPeriods.map(p => (
                <th key={p.id} style={{
                  background: '#7C6FE0', color: '#fff', border: '1px solid #9B8EF5',
                  padding: '8px 10px', fontSize: 10, fontWeight: 700,
                  textAlign: 'center' as const, minWidth: 110,
                }}>
                  <div>{p.name}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleEntities.flatMap((ent, eIdx) => {
              const entityBg = eIdx % 2 === 0 ? '#FAFAFE' : '#FFFFFF'
              return visibleDays.map((day, di) => {
                const isFirstRow = di === 0
                return (
                  <tr key={`${ent.id}-${day}`} style={{ background: entityBg }}>
                    {isFirstRow && (
                      <td rowSpan={visibleDays.length}
                        style={{
                          background: 'linear-gradient(180deg, #EDE9FF 0%, #F5F2FF 100%)',
                          border: '1px solid #D8D2FF',
                          borderBottom: eIdx < visibleEntities.length - 1 ? '3px solid #7C6FE0' : '1px solid #D8D2FF',
                          padding: '12px 10px', verticalAlign: 'middle' as const, textAlign: 'center' as const,
                        }}>
                        <div style={{ fontSize: 13, fontWeight: 900, color: '#13111E', letterSpacing: '0.02em', wordBreak: 'break-word' }}>{ent.name}</div>
                        {ent.sub && (
                          <div style={{ fontSize: 9, fontWeight: 600, color: '#7C6FE0', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>
                            {ent.sub}
                          </div>
                        )}
                        <div style={{ fontSize: 8, fontWeight: 600, color: '#8B87AD', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>
                          {mode === 'teacher' ? 'Teacher' : 'Room'}
                        </div>
                      </td>
                    )}
                    <td style={{
                      border: '1px solid #E8E4FF', padding: '6px 8px',
                      background: '#FAFAFE', verticalAlign: 'top' as const,
                      fontSize: 10, fontWeight: 700, color: '#13111E', textAlign: 'center' as const,
                    }}>
                      {DAY_LABEL[day]}
                    </td>
                    {classPeriods.map(p => {
                      const matches = findEntityCells(mode, ent.name, classTT, day, p.id)
                      return (
                        <td key={p.id} style={{ border: '1px solid #E8E4FF', padding: 3, verticalAlign: 'top' as const, minHeight: 40 }}>
                          {matches.length === 0
                            ? <div style={{ minHeight: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D8D2FF', fontSize: 11 }}>—</div>
                            : matches.map((m, mi) => (
                              <EntityCell key={mi} match={m} mode={mode} />
                            ))
                          }
                        </td>
                      )
                    })}
                  </tr>
                )
              })
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}

// ─── Compact cell for entity view ──────────────────────────
function EntityCell({ match, mode }: { match: CellMatch; mode: 'teacher' | 'room' }) {
  const cc = getSubjectColor(match.subject)
  return (
    <div className={cc} style={{
      borderRadius: 5, padding: '4px 7px',
      marginBottom: 2, minWidth: 0, overflow: 'hidden',
      position: 'relative' as const,
    }}>
      {/* Primary label: section (always shown in entity view) */}
      <div style={{ fontSize: 9, fontWeight: 800, opacity: 0.9, letterSpacing: '0.05em', textTransform: 'uppercase' as const, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
        {match.section}{match.isBlock && <span style={{ marginLeft: 4, color: '#7C6FE0' }}>◇</span>}
      </div>
      {/* Subject */}
      <div style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
        {match.subject}
      </div>
      {/* Secondary: the OTHER axis (room if teacher-view, teacher if room-view) */}
      {mode === 'teacher' && match.room && (
        <div style={{ fontSize: 8.5, opacity: 0.7, marginTop: 1, fontFamily: "'DM Mono', monospace" }}>
          {match.room}
        </div>
      )}
      {mode === 'room' && match.teacher && (
        <div style={{ fontSize: 8.5, opacity: 0.7, marginTop: 1 }}>
          {match.teacher}
        </div>
      )}
    </div>
  )
}
