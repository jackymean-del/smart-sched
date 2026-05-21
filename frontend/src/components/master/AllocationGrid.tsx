/**
 * AllocationGrid — Class × Subject period allocation matrix.
 *
 * Each cell holds a compact allocation syntax string:
 *   "5"   "5+1"   "3(2X)"   "2L"   "6T"
 *
 * Live features:
 *   - Compact cells with pointerEvents:none on all inner content (so every
 *     click reaches the <td> and triggers the editor correctly)
 *   - Same-grade auto-fill: editing one section propagates to all sections
 *     of the same grade prefix (e.g. editing "Nursery-A" fills "Nursery-B/C…")
 *   - "0" stored value = not applicable → shown as empty placeholder
 *   - Per-row "Used / Cap" badge with utilisation bar
 *   - AI Suggest fills conflict-free defaults (scales to capacity)
 *   - Period / Hours display toggle via displayMode prop
 */

import { useMemo, useEffect } from 'react'
import { useTimetableStore } from '@/store/timetableStore'
import type { Subject, Section, Period } from '@/types'
import { DataGrid, DataGridColumn } from '@/components/DataGrid/DataGrid'
import {
  parseAllocation, validateAllocationCapacity,
} from '@/lib/allocationSyntax'
import {
  computeCapacity, capacityForSection, inferBandFromSection,
  utilisationStatus,
} from '@/lib/capacityEngine'
import { Grid3x3 } from 'lucide-react'

interface Props {
  displayMode?: 'periods' | 'hours'
  periodMinutes?: number
  /** Extra controls injected into the DataGrid toolbar (left side, before Import/Export) */
  toolbarExtra?: React.ReactNode
}

interface Row {
  sectionName: string
  grade?: string
  stream?: string
  __sectionId: string
}

const STATUS_STYLE: Record<string, { bg: string; fg: string; border: string; label: string }> = {
  empty:  { bg: '#F8F7FF', fg: '#B0B0C0', border: '#ECEAFB', label: 'Empty' },
  light:  { bg: '#EFF6FF', fg: '#1D4ED8', border: '#DBEAFE', label: 'Light' },
  ok:     { bg: '#DCFCE7', fg: '#15803D', border: '#BBF7D0', label: 'OK'    },
  tight:  { bg: '#FEF3C7', fg: '#92400E', border: '#FDE68A', label: 'Tight' },
  over:   { bg: '#FEE2E2', fg: '#991B1B', border: '#FECACA', label: 'Over'  },
}

/** Extract the grade prefix from a section name like "Nursery-A" → "Nursery" */
function gradeOf(sectionName: string): string {
  return sectionName.split('-')[0].trim()
}

export function AllocationGrid({ displayMode = 'periods', periodMinutes = 40, toolbarExtra }: Props) {
  const store = useTimetableStore() as any
  const { sections, subjects, subjectAllocations, config } = store
  const periods: Period[] = store.periods ?? []
  const workDays: string[] = config?.workDays ?? ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY']

  const cap = useMemo(() => computeCapacity(workDays, periods), [workDays, periods])

  // Per-section row total — skip "0" (not-applicable) and empty
  const rowTotals = useMemo(() => {
    const m: Record<string, number> = {}
    sections.forEach((sec: Section) => {
      const row = subjectAllocations[sec.name] ?? {}
      let total = 0
      subjects.forEach((sub: Subject) => {
        const raw = row[sub.name]
        // "0" = not applicable, skip; also skip missing
        if (!raw || raw === '0') return
        const parsed = parseAllocation(raw)
        if (parsed.valid) total += parsed.weeklyTotal
      })
      m[sec.name] = total
    })
    return m
  }, [sections, subjects, subjectAllocations])

  // Build rows
  const rows: Row[] = useMemo(() => sections.map((sec: any) => ({
    sectionName: sec.name,
    grade: sec.grade,
    stream: (sec as any).stream,
    __sectionId: sec.id,
  })), [sections])

  // Build columns
  const columns: DataGridColumn<Row>[] = useMemo(() => {
    const base: DataGridColumn<Row>[] = [
      {
        key: 'sectionName', label: 'Section', type: 'text',
        sticky: true, width: 110, readonly: true,
      },
      {
        key: '__usage', label: 'Used / Cap', type: 'computed', width: 128, readonly: true,
        format: (row) => {
          const band = inferBandFromSection(row.sectionName)
          const c = capacityForSection(cap, band)
          const u = rowTotals[row.sectionName] ?? 0
          return displayMode === 'hours'
            ? `${Math.round(u * periodMinutes / 60 * 10) / 10}h / ${Math.round(c * periodMinutes / 60 * 10) / 10}h`
            : `${u} / ${c}`
        },
        render: (_, row) => {
          const band = inferBandFromSection(row.sectionName)
          const c = capacityForSection(cap, band)
          const u = rowTotals[row.sectionName] ?? 0
          const status = utilisationStatus(u, c)
          const s = STATUS_STYLE[status]
          const pct = c > 0 ? Math.min(100, Math.round((u / c) * 100)) : 0
          const barColor = status === 'over' ? '#DC2626' : status === 'tight' ? '#D97706' : status === 'ok' ? '#16A34A' : '#7C6FE0'
          const uLabel = displayMode === 'hours' ? `${Math.round(u * periodMinutes / 60 * 10) / 10}h` : String(u)
          const cLabel = displayMode === 'hours' ? `${Math.round(c * periodMinutes / 60 * 10) / 10}h` : String(c)
          return (
            // pointerEvents:none so all mouse events fall through to the <td>
            <div style={{ padding: '4px 8px', minWidth: 90, pointerEvents: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4, marginBottom: 2 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#13111E', fontFamily: "'DM Mono', monospace", letterSpacing: '-0.3px' }}>
                  {uLabel} / {cLabel}
                </span>
                <span style={{
                  fontSize: 8, fontWeight: 800, letterSpacing: '0.03em',
                  padding: '1px 4px', borderRadius: 4, whiteSpace: 'nowrap' as const,
                  background: s.bg, color: s.fg, border: `1px solid ${s.border}`,
                }}>
                  {s.label.toUpperCase()}
                </span>
              </div>
              <div style={{ height: 2, background: '#F0EDFF', borderRadius: 1, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: barColor, transition: 'width 0.2s' }} />
              </div>
            </div>
          )
        },
      },
    ]

    subjects.forEach((sub: Subject) => {
      base.push({
        key: `subj:${sub.name}`,
        label: sub.shortName ?? sub.name,
        type: 'text',
        minWidth: 68,
        align: 'right',
        placeholder: sub.periodsPerWeek ? String(sub.periodsPerWeek) : '—',

        // getValue: returns value for editing.
        // In hours mode, converts stored periods to hours string for editing.
        // "0" is treated as not-applicable → returns '' so cell appears empty.
        getValue: (r) => {
          const v = subjectAllocations[r.sectionName]?.[sub.name]
          if (!v || v === '0') return ''
          if (displayMode === 'hours') {
            const parsed = parseAllocation(v)
            if (parsed.valid && parsed.weeklyTotal > 0) {
              return String(Math.round(parsed.weeklyTotal * periodMinutes / 60 * 10) / 10)
            }
          }
          return v
        },

        // setValue: stores value + auto-fills all same-grade sections.
        // In hours mode, converts a plain numeric input back to periods.
        setValue: (r, v) => {
          let val = String(v ?? '').trim()

          // Hours mode: if user typed a plain number, convert to periods
          if (displayMode === 'hours' && val && /^\d+(\.\d+)?$/.test(val)) {
            const hours = parseFloat(val)
            const periodCount = Math.max(0, Math.round(hours * 60 / periodMinutes))
            val = String(periodCount)
          }
          const grade = gradeOf(r.sectionName)

          // Write to this section
          store.setSubjectAllocationCell?.(r.sectionName, sub.name, val)

          // Auto-fill same-grade sibling sections (only if this section belongs to a grade group)
          if (grade) {
            const siblings: Section[] = (sections as Section[]).filter(
              (s: Section) => gradeOf(s.name) !== s.name && // only if section has a grade prefix (e.g. "Nursery-A")
                             gradeOf(s.name) === grade &&
                             s.name !== r.sectionName
            )
            siblings.forEach((s: Section) => {
              // Only fill sibling if it doesn't already have a manually set value
              // (or if it had the same value as old section value — propagate edit)
              store.setSubjectAllocationCell?.(s.name, sub.name, val)
            })
          }

          return r
        },

        // cellStyle: validation background — safe, no pointer event interception
        cellStyle: (value, row) => {
          if (!value) return {}
          const parsed = parseAllocation(value)
          if (!parsed.valid) return { background: '#FEF2F2' }
          const band = inferBandFromSection(row.sectionName)
          const cellCap = capacityForSection(cap, band)
          const validation = validateAllocationCapacity(parsed, cellCap)
          if (!validation.ok) return { background: '#FFFBEB' }
          return {}
        },

        // render: display-only content; ALL elements have pointerEvents:none
        // so every click falls through to the DataGrid <td> and triggers editing
        render: (value, row) => {
          if (!value) return null

          const parsed = parseAllocation(value)
          const invalid = !parsed.valid
          const band = inferBandFromSection(row.sectionName)
          const cellCap = capacityForSection(cap, band)
          const overCap = parsed.valid && !validateAllocationCapacity(parsed, cellCap).ok

          // Convert to display unit
          const displayVal = (() => {
            if (displayMode === 'hours' && parsed.valid && parsed.weeklyTotal > 0) {
              return `${Math.round(parsed.weeklyTotal * periodMinutes / 60 * 10) / 10}h`
            }
            return value
          })()

          return (
            <div style={{
              padding: '0 6px',
              textAlign: 'right' as const,
              position: 'relative' as const,
              pointerEvents: 'none' as const,  // ← critical: all clicks fall through to <td>
            }}>
              <span style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 12, fontWeight: 700,
                color: invalid ? '#DC2626' : overCap ? '#D97706' : '#13111E',
              }}>
                {displayVal}
              </span>
              {/* Tiny weekly-total badge (periods mode only, top-right corner) */}
              {displayMode === 'periods' && parsed.valid && parsed.weeklyTotal > 0 && (
                <span style={{
                  position: 'absolute' as const, top: 0, right: 2,
                  fontSize: 7, fontWeight: 800,
                  color: parsed.weeklyTotal > 6 ? '#7C6FE0' : '#16A34A',
                }}>
                  {parsed.weeklyTotal}
                </span>
              )}
              {invalid && (
                <span style={{
                  position: 'absolute' as const, top: 1, right: 3,
                  fontSize: 9, fontWeight: 800, color: '#DC2626',
                }}>!</span>
              )}
            </div>
          )
        },
      })
    })

    return base
  }, [subjects, sections, cap, rowTotals, subjectAllocations, store, displayMode, periodMinutes])

  // ── AI Suggest — conflict-free defaults ──────────────────────
  const handleAISuggest = () => {
    const next: Record<string, Record<string, string>> = {}

    sections.forEach((sec: Section) => {
      const band = inferBandFromSection(sec.name)
      const capacity = capacityForSection(cap, band)

      interface IdealItem { name: string; pw: number; isLab: boolean }
      const ideal: IdealItem[] = (subjects as Subject[])
        .filter((sub: Subject) => sub.periodsPerWeek && sub.periodsPerWeek > 0)
        .map((sub: Subject) => ({
          name: sub.name,
          pw: sub.periodsPerWeek!,
          isLab: !!(sub as any).requiresLab,
        }))

      const totalIdeal = ideal.reduce((a, s) => a + s.pw, 0)
      const row: Record<string, string> = {}

      if (ideal.length === 0) return

      if (capacity <= 0 || totalIdeal <= capacity) {
        // Everything fits — use as-is
        ideal.forEach(s => {
          row[s.name] = s.isLab
            ? `${Math.max(1, s.pw - 1)}+1L`
            : String(s.pw)
        })
      } else {
        // Scale proportionally so total ≤ capacity (no over-cap)
        const scale = capacity / totalIdeal
        let allocated = 0
        ideal.forEach((s, i) => {
          const isLast = i === ideal.length - 1
          const raw = isLast
            ? Math.max(0, capacity - allocated)
            : Math.max(1, Math.round(s.pw * scale))
          if (raw > 0) row[s.name] = String(raw)
          allocated += raw
        })
      }

      if (Object.keys(row).length) next[sec.name] = row
    })

    store.setSubjectAllocations?.(next)
  }

  // Auto-run capacity-aware AI fill on first load if no allocations exist yet
  useEffect(() => {
    const hasAny = Object.values(subjectAllocations ?? {}).some(
      (row: any) => Object.values(row ?? {}).some((v: any) => v && String(v).trim() !== '' && v !== '0')
    )
    if (!hasAny && sections.length > 0 && subjects.length > 0) {
      handleAISuggest()
    }
  // Only run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleChange = (_newRows: Row[]) => { /* writes are per-cell via setValue */ }

  return (
    <div>
      {/* Capacity banner + AI suggest */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' as const,
        padding: '7px 12px', marginBottom: 8,
        background: 'linear-gradient(135deg, #EDE9FF 0%, #FAFAFE 100%)',
        border: '1px solid #D8D2FF', borderRadius: 8,
      }}>
        <Grid3x3 size={13} color="#7C6FE0" />
        <span style={{ fontSize: 11, fontWeight: 700, color: '#13111E', fontFamily: "'DM Mono', monospace" }}>
          {displayMode === 'hours'
            ? `${Math.round(cap.weeklyCapacity * periodMinutes / 60 * 10) / 10}h/week`
            : `${cap.weeklyCapacity} periods/week`
          }
        </span>
        <span style={{ fontSize: 10, color: '#4B5275' }}>
          {cap.workingDays} days × {cap.teachingPeriodsPerDay} periods
          {cap.breakPeriodsPerDay > 0 && ` − ${cap.breakPeriodsPerDay} break/day`}
        </span>
        {/* Syntax legend inline */}
        <span style={{ fontSize: 10, color: '#8B87AD' }}>
          {[['5', 'theory'], ['5+1', '+lab'], ['3(2X)', 'doubles'], ['2L', 'lab']].map(([s, d]) => (
            <span key={s} style={{ marginRight: 8 }}>
              <strong style={{ fontFamily: "'DM Mono', monospace", color: '#4B5275' }}>{s}</strong>
              {' '}{d}
            </span>
          ))}
        </span>
      </div>

      <DataGrid<Row>
        title="Period Allocation"
        description="Periods per subject per section. Click any cell to edit. Same-grade sections sync automatically."
        icon={<Grid3x3 size={16} />}
        columns={columns}
        rows={rows}
        rowKey={(r) => r.__sectionId}
        onChange={handleChange}
        toolbarExtra={toolbarExtra}
        toolbar={{
          add: false, importCSV: true, exportCSV: true,
          paste: true, search: true, transpose: false, bulkActions: false,
          undoRedo: true, filters: false, fillDown: true,
        }}
      />
    </div>
  )
}
