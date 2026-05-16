/**
 * ScopeMatrixModal — author per-entity slot allowability.
 *
 * Lets the user define WHERE in the week an entity (teacher / subject /
 * room / section / activity) is structurally allowed to be scheduled.
 *
 * Three states per (day, period) cell:
 *   allowed  — entity may be scheduled here (default)
 *   disabled — soft penalty, AI avoids
 *   locked   — HARD constraint, AI must never violate
 *
 * Visual states per design spec:
 *   allowed  : #EEFDF3 bg, #16A34A text
 *   disabled : #FAFAFB bg, #B0B0C0 text
 *   locked   : #FEE2E2 bg, #DC2626 text
 *
 * Bulk ops: click a row header to cycle entire day, click a column header
 * to cycle entire period across all days, "All allowed" / "Reset" buttons.
 */

import { useState, useEffect } from 'react'
import type { ScopeMatrix, ScopeState, Period } from '@/types'
import { X, Check, Lock, Ban, RotateCcw, Info } from 'lucide-react'

const DAY_LABEL: Record<string, string> = {
  MONDAY: 'Mon', TUESDAY: 'Tue', WEDNESDAY: 'Wed',
  THURSDAY: 'Thu', FRIDAY: 'Fri', SATURDAY: 'Sat', SUNDAY: 'Sun',
}

const STATE_STYLE: Record<ScopeState, {
  bg: string; fg: string; border: string; label: string; symbol: string;
}> = {
  allowed:  { bg: '#EEFDF3', fg: '#16A34A', border: '#BBF7D0', label: 'Allowed',  symbol: '●' },
  disabled: { bg: '#FAFAFB', fg: '#B0B0C0', border: '#E5E7EB', label: 'Disabled', symbol: '·' },
  locked:   { bg: '#FEE2E2', fg: '#DC2626', border: '#FECACA', label: 'Locked',   symbol: '✕' },
}

const NEXT_STATE: Record<ScopeState, ScopeState> = {
  allowed: 'disabled',
  disabled: 'locked',
  locked: 'allowed',
}

interface Props {
  /** Entity name shown in header */
  entityName: string
  /** Entity kind for label context (Teacher, Subject, Room, Section, Activity) */
  entityKind?: string
  /** Current scope (or undefined = all allowed) */
  scope?: ScopeMatrix
  /** All work days from the wizard config */
  workDays: string[]
  /** Periods (only class periods are shown; breaks omitted) */
  periods: Period[]
  /** Save handler */
  onSave: (next: ScopeMatrix | undefined) => void
  /** Cancel/close */
  onClose: () => void
}

export function ScopeMatrixModal({
  entityName, entityKind = 'Entity', scope, workDays, periods, onSave, onClose,
}: Props) {
  const classPeriods = periods.filter(p => p.type === 'class' || !p.type)
  const visibleDays = workDays.filter(d => DAY_LABEL[d])

  // Local state — drafting until user saves
  const [cells, setCells] = useState<Record<string, Record<string, ScopeState>>>(() => {
    return JSON.parse(JSON.stringify(scope?.cells ?? {}))
  })
  const [note, setNote] = useState(scope?.note ?? '')

  useEffect(() => {
    setCells(JSON.parse(JSON.stringify(scope?.cells ?? {})))
    setNote(scope?.note ?? '')
  }, [scope])

  // Helpers
  const getState = (day: string, periodId: string): ScopeState =>
    cells[day]?.[periodId] ?? 'allowed'

  const setState = (day: string, periodId: string, st: ScopeState) => {
    setCells(prev => {
      const next = { ...prev, [day]: { ...(prev[day] ?? {}) } }
      if (st === 'allowed') {
        delete next[day][periodId]
        if (Object.keys(next[day]).length === 0) delete next[day]
      } else {
        next[day][periodId] = st
      }
      return next
    })
  }

  const cycleCell = (day: string, periodId: string) => {
    setState(day, periodId, NEXT_STATE[getState(day, periodId)])
  }

  // Bulk row: cycle next "majority" state across all periods in this day
  const cycleRow = (day: string) => {
    const counts: Record<ScopeState, number> = { allowed: 0, disabled: 0, locked: 0 }
    classPeriods.forEach(p => counts[getState(day, p.id)]++)
    const majority = (Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]) as ScopeState
    const next = NEXT_STATE[majority]
    classPeriods.forEach(p => setState(day, p.id, next))
  }

  // Bulk col: cycle next majority state for this period across all days
  const cycleCol = (periodId: string) => {
    const counts: Record<ScopeState, number> = { allowed: 0, disabled: 0, locked: 0 }
    visibleDays.forEach(d => counts[getState(d, periodId)]++)
    const majority = (Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]) as ScopeState
    const next = NEXT_STATE[majority]
    visibleDays.forEach(d => setState(d, periodId, next))
  }

  const allowAll = () => { setCells({}) }
  const lockAll = () => {
    const next: Record<string, Record<string, ScopeState>> = {}
    visibleDays.forEach(d => {
      next[d] = {}
      classPeriods.forEach(p => next[d][p.id] = 'locked')
    })
    setCells(next)
  }
  const onlyWeekdays = () => {
    // Allow Mon-Fri, lock Sat
    const next: Record<string, Record<string, ScopeState>> = {}
    visibleDays.forEach(d => {
      if (d === 'SATURDAY' || d === 'SUNDAY') {
        next[d] = {}
        classPeriods.forEach(p => next[d][p.id] = 'locked')
      }
    })
    setCells(next)
  }

  // Summary stats
  const allCells = visibleDays.length * classPeriods.length
  const allowedCount = visibleDays.reduce((s, d) =>
    s + classPeriods.filter(p => getState(d, p.id) === 'allowed').length, 0)
  const disabledCount = visibleDays.reduce((s, d) =>
    s + classPeriods.filter(p => getState(d, p.id) === 'disabled').length, 0)
  const lockedCount = allCells - allowedCount - disabledCount

  // Save: collapse to undefined if all cells are allowed and no note
  const handleSave = () => {
    const anyConstraints = Object.keys(cells).length > 0
    if (!anyConstraints && !note.trim()) {
      onSave(undefined)  // fully unscoped — strip the matrix
    } else {
      onSave({ cells, note: note.trim() || undefined })
    }
    onClose()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(19,17,30,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: 20, backdropFilter: 'blur(4px)',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 16, width: '100%', maxWidth: 760,
        maxHeight: '92vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 60px rgba(19,17,30,0.35)',
      }}>

        {/* Header */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid #ECEAFB',
          display: 'flex', alignItems: 'center', gap: 12,
          background: 'linear-gradient(135deg, #EDE9FF 0%, #FAFAFE 100%)', borderRadius: '16px 16px 0 0',
        }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: '#7C6FE0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Lock size={16} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#7C6FE0' }}>
              Scope · {entityKind}
            </div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#13111E', letterSpacing: '-0.3px' }}>
              {entityName}
            </div>
            <div style={{ fontSize: 11, color: '#4B5275', marginTop: 2 }}>
              Where in the week is this {entityKind.toLowerCase()} <em style={{ color: '#7C6FE0' }}>structurally allowed</em>?
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: '#8B87AD', display: 'flex' }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>

          {/* Helper hint */}
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 8,
            padding: '10px 12px', background: '#F5F2FF', borderRadius: 8,
            border: '1px solid #ECEAFB', marginBottom: 14,
          }}>
            <Info size={13} color="#7C6FE0" style={{ marginTop: 1, flexShrink: 0 }} />
            <div style={{ fontSize: 11.5, color: '#4B5275', lineHeight: 1.6 }}>
              <strong style={{ color: '#13111E' }}>Click a cell</strong> to cycle: Allowed → Disabled → Locked.
              <strong style={{ color: '#13111E' }}> Click a row/column header</strong> to cycle the whole row/column.
              <span style={{ color: '#DC2626' }}> Locked = AI never schedules here.</span>
            </div>
          </div>

          {/* Quick actions */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            <BulkBtn icon={<Check size={11} />} label="Allow all" onClick={allowAll} accent="#16A34A" />
            <BulkBtn icon={<Ban size={11} />} label="Lock weekends" onClick={onlyWeekdays} accent="#7C6FE0" />
            <BulkBtn icon={<Lock size={11} />} label="Lock all" onClick={lockAll} accent="#DC2626" />
            <div style={{ flex: 1 }} />
            <div style={{ display: 'flex', gap: 10, fontSize: 11, color: '#4B5275' }}>
              <StatPill label="Allowed"  count={allowedCount}  state="allowed" />
              <StatPill label="Disabled" count={disabledCount} state="disabled" />
              <StatPill label="Locked"   count={lockedCount}   state="locked" />
            </div>
          </div>

          {/* Matrix table */}
          <div style={{
            border: '1px solid #ECEAFB', borderRadius: 12, overflow: 'hidden',
          }}>
            <table style={{ borderCollapse: 'collapse', width: '100%', tableLayout: 'fixed' }}>
              <thead>
                <tr>
                  <th style={{
                    background: '#F8F7FF', padding: '10px 12px',
                    fontSize: 10, fontWeight: 800, letterSpacing: '0.08em',
                    textTransform: 'uppercase', color: '#4B5275',
                    borderBottom: '1px solid #ECEAFB', borderRight: '1px solid #ECEAFB',
                    width: 90, textAlign: 'left' as const,
                  }}>
                    Day
                  </th>
                  {classPeriods.map((p, ci) => (
                    <th key={p.id}
                      onClick={() => cycleCol(p.id)}
                      title={`Cycle ${p.name} across all days`}
                      style={{
                        background: '#F8F7FF', padding: '10px 6px',
                        fontSize: 10, fontWeight: 800, letterSpacing: '0.06em',
                        textTransform: 'uppercase', color: '#4B5275',
                        borderBottom: '1px solid #ECEAFB',
                        borderRight: ci < classPeriods.length - 1 ? '1px solid #ECEAFB' : 'none',
                        cursor: 'pointer',
                        textAlign: 'center' as const,
                      }}>
                      {p.name.replace('Period ', 'P')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleDays.map((day, ri) => (
                  <tr key={day}>
                    <td
                      onClick={() => cycleRow(day)}
                      title={`Cycle ${day}`}
                      style={{
                        background: '#FAFAFE', padding: '10px 12px',
                        fontSize: 12, fontWeight: 700, color: '#13111E',
                        borderRight: '1px solid #ECEAFB',
                        borderBottom: ri < visibleDays.length - 1 ? '1px solid #ECEAFB' : 'none',
                        cursor: 'pointer',
                      }}>
                      {DAY_LABEL[day]}
                    </td>
                    {classPeriods.map((p, ci) => {
                      const st = getState(day, p.id)
                      const style = STATE_STYLE[st]
                      return (
                        <td key={p.id}
                          onClick={() => cycleCell(day, p.id)}
                          title={`${DAY_LABEL[day]} ${p.name} — ${style.label}`}
                          style={{
                            padding: 0,
                            background: style.bg,
                            color: style.fg,
                            borderRight: ci < classPeriods.length - 1 ? '1px solid #ECEAFB' : 'none',
                            borderBottom: ri < visibleDays.length - 1 ? '1px solid #ECEAFB' : 'none',
                            textAlign: 'center' as const,
                            cursor: 'pointer',
                            transition: 'background 0.1s, color 0.1s',
                            height: 44,
                          }}>
                          <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            gap: 4, height: '100%',
                            fontSize: 14, fontWeight: 700,
                          }}>
                            {style.symbol}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Note */}
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8B87AD', marginBottom: 5 }}>
              Note (optional)
            </div>
            <input
              value={note} onChange={e => setNote(e.target.value)}
              placeholder="e.g. Contractual — only Fri/Sat afternoons"
              style={{
                width: '100%', padding: '9px 12px', fontSize: 12.5,
                borderRadius: 8, border: '1px solid #ECEAFB',
                background: '#FAFAFE', color: '#13111E', outline: 'none',
              }}
            />
          </div>

        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px', borderTop: '1px solid #ECEAFB',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
        }}>
          <div style={{ fontSize: 11, color: '#8B87AD' }}>
            {Object.keys(cells).length === 0
              ? 'Unscoped — all slots allowed (default)'
              : <>Saving as <strong style={{ color: '#13111E' }}>scoped</strong> constraint set.</>}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { setCells({}); setNote('') }}
              style={btnGhost} title="Reset to all allowed">
              <RotateCcw size={12} /> Reset
            </button>
            <button onClick={onClose} style={btnGhost}>Cancel</button>
            <button onClick={handleSave} style={btnPri}>Save Scope</button>
          </div>
        </div>

      </div>
    </div>
  )
}

const btnPri: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '8px 14px', borderRadius: 8, border: 'none',
  background: '#7C6FE0', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
}
const btnGhost: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '7px 12px', borderRadius: 7, border: '1px solid #ECEAFB',
  background: '#fff', color: '#4B5275', fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
}

function BulkBtn({ icon, label, onClick, accent }: { icon: React.ReactNode; label: string; onClick: () => void; accent: string }) {
  return (
    <button onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '5px 10px', borderRadius: 6,
        border: '1px solid #ECEAFB', background: '#fff',
        color: accent, fontSize: 10.5, fontWeight: 700, cursor: 'pointer',
        letterSpacing: '0.02em',
      }}>
      {icon} {label}
    </button>
  )
}

function StatPill({ label, count, state }: { label: string; count: number; state: ScopeState }) {
  const s = STATE_STYLE[state]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 9px', borderRadius: 12,
      background: s.bg, color: s.fg, border: `1px solid ${s.border}`,
      fontSize: 10, fontWeight: 700,
    }}>
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11 }}>{count}</span>
      <span style={{ opacity: 0.85 }}>{label}</span>
    </span>
  )
}
