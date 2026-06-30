/**
 * AllocationGrid — Class × Subject period allocation matrix.
 *
 * Subject cells use NO col.render — only getValue/setValue/cellStyle.
 * This guarantees every cell is always clickable/editable via DataGrid's
 * native interaction path (no invisible overlay, no pointer-event issues).
 *
 * Auto-fills conflict-free values on mount (or whenever conflicts exist).
 * Same-grade sections sync automatically when one is edited.
 */

import { useMemo, useEffect } from 'react'
import { useTimetableStore } from '@/store/timetableStore'
import type { Subject, Section, Period } from '@/types'
import { DataGrid, DataGridColumn } from '@/components/DataGrid/DataGrid'
import { parseAllocation, validateAllocationCapacity } from '@/lib/allocationSyntax'
import {
  computeCapacity, capacityForSection, inferBandFromSection, utilisationStatus,
} from '@/lib/capacityEngine'

interface Props {
  displayMode?: 'periods' | 'hours'
  periodMinutes?: number
  density?: 'compact' | 'normal' | 'comfortable'
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

/** Extract grade prefix: "Nursery-A" → "Nursery", "Class-1-A" → "Class-1" */
function gradeOf(name: string): string {
  const parts = name.split('-')
  return parts.length > 1 ? parts.slice(0, -1).join('-') : name
}

/** Convert periods → compact "1h30m" string (display only) */
function toHourMin(periods: number, periodMinutes: number): string {
  const totalMins = Math.round(periods * periodMinutes)
  const h = Math.floor(totalMins / 60)
  const m = totalMins % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h${m}m`
}

/**
 * Parse user-typed hours string back to number of periods.
 * Accepts: "1h30m", "1h30", "1.5h", "90m", "1.5" (decimal hours)
 * Returns period count as string, or '' if invalid.
 */
function parseHoursInput(val: string, periodMinutes: number): string {
  val = val.trim()
  // "1h30m" or "1h30" format
  const hm = val.match(/^(\d+)h\s*(\d+)m?$/i)
  if (hm) {
    const mins = parseInt(hm[1]) * 60 + parseInt(hm[2])
    return String(Math.max(0, Math.round(mins / periodMinutes)))
  }
  // "1h" or "1.5h"
  const h = val.match(/^(\d+(?:\.\d+)?)h$/i)
  if (h) {
    const mins = parseFloat(h[1]) * 60
    return String(Math.max(0, Math.round(mins / periodMinutes)))
  }
  // "30m" or "45.5m"
  const m = val.match(/^(\d+(?:\.\d+)?)m$/i)
  if (m) {
    return String(Math.max(0, Math.round(parseFloat(m[1]) / periodMinutes)))
  }
  // Plain decimal "1.5" (hours)
  const n = parseFloat(val)
  if (!isNaN(n) && n >= 0) {
    return String(Math.max(0, Math.round(n * 60 / periodMinutes)))
  }
  return ''
}

export function AllocationGrid({ displayMode = 'periods', periodMinutes = 40, density = 'compact', toolbarExtra }: Props) {
  const store = useTimetableStore() as any
  const { sections, subjects, subjectAllocations, config } = store
  const periods: Period[] = store.periods ?? []
  const workDays: string[] = config?.workDays ?? ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY']

  const cap = useMemo(() => computeCapacity(workDays, periods), [workDays, periods])

  // Per-section row totals — "0" = not applicable, skip
  const rowTotals = useMemo(() => {
    const m: Record<string, number> = {}
    ;(sections as Section[]).forEach((sec: Section) => {
      const row = subjectAllocations[sec.name] ?? {}
      let total = 0
      ;(subjects as Subject[]).forEach((sub: Subject) => {
        const raw = row[sub.name]
        if (!raw || raw === '0') return
        const parsed = parseAllocation(raw)
        if (parsed.valid) total += parsed.weeklyTotal
      })
      m[sec.name] = total
    })
    return m
  }, [sections, subjects, subjectAllocations])

  // ── Capacity-aware AI fill (uses Math.floor to guarantee no OVER) ──
  const handleAISuggest = () => {
    const next: Record<string, Record<string, string>> = {}

    ;(sections as Section[]).forEach((sec: Section) => {
      const band = inferBandFromSection(sec.name)
      const capacity = capacityForSection(cap, band)

      const ideal = (subjects as Subject[])
        .filter(s => s.periodsPerWeek && s.periodsPerWeek > 0)
        .map(s => ({ name: s.name, pw: s.periodsPerWeek!, isLab: !!(s as any).requiresLab }))

      if (!ideal.length) return

      const totalIdeal = ideal.reduce((a, s) => a + s.pw, 0)
      const row: Record<string, string> = {}

      if (capacity <= 0 || totalIdeal <= capacity) {
        // Everything fits — use as-is with lab syntax
        ideal.forEach(s => {
          row[s.name] = s.isLab ? `${Math.max(1, s.pw - 1)}+1L` : String(s.pw)
        })
      } else {
        // Scale down with Math.floor to guarantee total ≤ capacity
        // Last subject absorbs the remainder so total == capacity exactly
        const scale = capacity / totalIdeal
        let allocated = 0
        ideal.forEach((s, i) => {
          const isLast = i === ideal.length - 1
          const raw = isLast
            ? Math.max(0, capacity - allocated)
            : Math.max(1, Math.floor(s.pw * scale))   // floor = never over-cap
          if (raw > 0) row[s.name] = String(raw)
          allocated += raw
        })
      }

      if (Object.keys(row).length) next[sec.name] = row
    })

    store.setSubjectAllocations?.(next)
  }

  // Auto-run on mount: fill when empty or when any section is over capacity
  useEffect(() => {
    const hasConflicts = (sections as Section[]).some((sec: Section) => {
      const band = inferBandFromSection(sec.name)
      const c = capacityForSection(cap, band)
      const u = rowTotals[sec.name] ?? 0
      return c > 0 && u > c
    })
    const hasAny = Object.values(subjectAllocations ?? {}).some(
      (row: any) => Object.values(row ?? {}).some(
        (v: any) => v && String(v).trim() !== '' && v !== '0'
      )
    )
    if (!hasAny || hasConflicts) handleAISuggest()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Build rows
  const rows: Row[] = useMemo(() => (sections as Section[]).map((sec: any) => ({
    sectionName: sec.name,
    grade: sec.grade,
    stream: sec.stream,
    __sectionId: sec.id,
  })), [sections])

  // Build columns
  const columns: DataGridColumn<Row>[] = useMemo(() => {
    const base: DataGridColumn<Row>[] = [
      {
        key: 'sectionName', label: 'Class', type: 'text',
        sticky: true, width: 100, readonly: true,
      },
      {
        // "Used / Cap" — compact inline, no bar, just "40/48 ●"
        key: '__usage', label: 'Used', type: 'computed', width: 72, readonly: true,
        align: 'right' as const,
        format: (row) => {
          const band = inferBandFromSection(row.sectionName)
          const c = capacityForSection(cap, band)
          const u = rowTotals[row.sectionName] ?? 0
          return displayMode === 'hours'
            ? `${toHourMin(u, periodMinutes)}/${toHourMin(c, periodMinutes)}`
            : `${u}/${c}`
        },
        render: (_, row) => {
          const band = inferBandFromSection(row.sectionName)
          const c = capacityForSection(cap, band)
          const u = rowTotals[row.sectionName] ?? 0
          const status = utilisationStatus(u, c)
          // Dot color only — no labels, no bars
          const dotColor = status === 'over' ? '#DC2626' : status === 'tight' ? '#D97706' : status === 'ok' ? '#16A34A' : u > 0 ? '#2563EB' : '#D1D5DB'
          const textColor = status === 'over' ? '#DC2626' : status === 'tight' ? '#92400E' : '#13111E'
          const uLabel = displayMode === 'hours' ? toHourMin(u, periodMinutes) : String(u)
          const cLabel = displayMode === 'hours' ? toHourMin(c, periodMinutes) : String(c)
          return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 5, padding: '0 8px', pointerEvents: 'none' }}>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: textColor, fontFamily: "'DM Mono', monospace", whiteSpace: 'nowrap' as const }}>
                {uLabel}<span style={{ color: '#C4C0D8', fontWeight: 400 }}>/{cLabel}</span>
              </span>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
            </div>
          )
        },
        cellStyle: (_, row) => {
          const band = inferBandFromSection(row.sectionName)
          const c = capacityForSection(cap, band)
          const u = rowTotals[row.sectionName] ?? 0
          const status = utilisationStatus(u, c)
          if (status === 'over') return { background: '#FEF2F2' }
          if (status === 'tight') return { background: '#FFFBEB' }
          return {}
        },
      },
    ]

    ;(subjects as Subject[]).forEach((sub: Subject) => {
      base.push({
        key: `subj:${sub.name}`,
        label: sub.shortName ?? sub.name,
        // type: 'text' — DataGrid's native path: click td → onMouseDown → setEditing → input
        // NO col.render here — eliminates all pointer-event overlap issues
        type: 'text',
        minWidth: 56,
        align: 'right' as const,
        placeholder: sub.periodsPerWeek ? (
          displayMode === 'hours'
            ? toHourMin(sub.periodsPerWeek, periodMinutes)
            : String(sub.periodsPerWeek)
        ) : '—',

        // getValue: what the cell displays AND what the editor starts with.
        // Hours mode: returns the hours-equivalent number so users type hours.
        // "0" = not applicable → empty cell.
        getValue: (r) => {
          const v = subjectAllocations[r.sectionName]?.[sub.name]
          if (!v || v === '0') return ''
          if (displayMode === 'hours') {
            const parsed = parseAllocation(v)
            if (parsed.valid && parsed.weeklyTotal > 0) {
              return toHourMin(parsed.weeklyTotal, periodMinutes)
            }
            return '' // invalid stored value — show empty in hours mode
          }
          return v
        },

        // setValue: stores back to the store.
        // Hours mode: converts typed number (or "Nh") back to periods before storing.
        // Same-grade auto-fill: propagates to all sibling sections atomically.
        setValue: (r, v) => {
          let val = String(v ?? '').trim()

          if (displayMode === 'hours') {
            const parsed = parseHoursInput(val, periodMinutes)
            val = parsed
          }

          // Collect this section + all same-grade siblings for atomic update
          const grade = gradeOf(r.sectionName)
          const siblings: Section[] = grade !== r.sectionName
            ? (sections as Section[]).filter(
                (s: Section) => gradeOf(s.name) === grade && s.name !== r.sectionName
              )
            : []

          // Build a single merged subjectAllocations update
          const merged: Record<string, Record<string, string>> = { ...subjectAllocations }

          const applyToSection = (secName: string) => {
            const existing = { ...(subjectAllocations[secName] ?? {}) }
            if (val === '') {
              delete existing[sub.name]
            } else {
              existing[sub.name] = val
            }
            if (Object.keys(existing).length === 0) {
              delete merged[secName]
            } else {
              merged[secName] = existing
            }
          }

          applyToSection(r.sectionName)
          siblings.forEach(s => applyToSection(s.name))

          store.setSubjectAllocations?.(merged)
          return r
        },

        // cellStyle: validation background based on raw stored allocation
        cellStyle: (_, row) => {
          const rawV = subjectAllocations[row.sectionName]?.[sub.name]
          if (!rawV || rawV === '0') return {}
          const parsed = parseAllocation(rawV)
          if (!parsed.valid) return { background: '#FEF2F2' }
          const band = inferBandFromSection(row.sectionName)
          const cellCap = capacityForSection(cap, band)
          if (!validateAllocationCapacity(parsed, cellCap).ok) return { background: '#FFFBEB' }
          return {}
        },
      })
    })

    return base
  }, [subjects, sections, cap, rowTotals, subjectAllocations, displayMode, periodMinutes])

  const handleChange = (_: Row[]) => { /* per-cell writes via setValue */ }

  return (
    <DataGrid<Row>
      columns={columns}
      rows={rows}
      rowKey={(r) => r.__sectionId}
      onChange={handleChange}
      toolbarExtra={toolbarExtra}
      density={density}
      toolbar={{
        add: false, importCSV: true, exportCSV: true, importXLSX: false, exportXLSX: false,
        paste: true, search: true, transpose: false, bulkActions: false,
        undoRedo: true, filters: false, fillDown: true,
      }}
    />
  )
}
