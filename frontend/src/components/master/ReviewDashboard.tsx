/**
 * ReviewDashboard — Doc 2 Step 5.
 *
 * Visual summary of the generated timetable for the user to inspect
 * before publishing. Five sections per spec:
 *   A. Academic Summary    — class / teacher / subject counts
 *   B. Capacity Summary    — per-band allocated vs capacity
 *   C. Teacher Load Chart  — per-teacher weekly load + fairness stddev
 *   D. Room Utilization    — % occupied per room
 *   E. Conflicts & Warnings — hard + soft from solver output
 *
 * Consumes the SolverOutput plus raw store data. Pure display component.
 */

import { useMemo } from 'react'
import type { Section, Subject, Staff, Period, OptionalBlock, Conflict, ClassTimetable } from '@/types'
import { computeCapacity, inferBandFromSection, utilisationStatus } from '@/lib/capacityEngine'
import {
  Users2, BookOpen, Building2, Layers, Sparkles,
  AlertTriangle, CheckCircle2, TrendingUp, Gauge, Clock,
} from 'lucide-react'

interface Props {
  classTT: ClassTimetable
  sections: Section[]
  staff: Staff[]
  subjects: Subject[]
  periods: Period[]
  workDays: string[]
  optionalBlocks?: OptionalBlock[]
  teacherWeeklyLoad?: Record<string, number>
  teacherLoadStddev?: number
  conflicts: Conflict[]
  penalties: { constraint: string; penalty: number; details: string }[]
  rooms?: any[]
  score: number
}

export function ReviewDashboard({
  classTT, sections, staff, subjects, periods, workDays,
  optionalBlocks = [], teacherWeeklyLoad, teacherLoadStddev,
  conflicts, penalties, rooms = [], score,
}: Props) {

  // ── Capacity summary per band ──
  const cap = useMemo(() => computeCapacity(workDays, periods), [workDays, periods])
  const bandSummary = useMemo(() => {
    const m = new Map<string, { allocated: number; sectionsCount: number }>()
    sections.forEach(sec => {
      const band = inferBandFromSection(sec.name)
      const row = m.get(band) ?? { allocated: 0, sectionsCount: 0 }
      const used = Object.values(classTT[sec.name] ?? {}).reduce(
        (a, dayMap: any) => a + Object.values(dayMap ?? {}).filter((c: any) => c?.subject).length, 0
      )
      // Average per section in this band
      row.allocated += used
      row.sectionsCount += 1
      m.set(band, row)
    })
    return Array.from(m.entries()).map(([band, v]) => ({
      band,
      avgAllocated: Math.round(v.allocated / Math.max(1, v.sectionsCount)),
      sectionsCount: v.sectionsCount,
    }))
  }, [classTT, sections])

  // ── Teacher load chart ──
  const teacherLoads = useMemo(() => {
    const list = staff.map(t => ({
      name: t.name,
      load: teacherWeeklyLoad?.[t.name] ?? 0,
      max: (t as any).maxPeriodsPerWeek ?? 40,
    }))
    return list.sort((a, b) => b.load - a.load)
  }, [staff, teacherWeeklyLoad])
  const loadStats = useMemo(() => {
    const loads = teacherLoads.map(t => t.load).filter(l => l > 0)
    if (loads.length === 0) return { mean: 0, min: 0, max: 0, stddev: 0 }
    const mean = loads.reduce((a, b) => a + b, 0) / loads.length
    const min  = Math.min(...loads)
    const max  = Math.max(...loads)
    const stddev = teacherLoadStddev ?? Math.sqrt(
      loads.reduce((a, l) => a + (l - mean) ** 2, 0) / loads.length
    )
    return { mean, min, max, stddev }
  }, [teacherLoads, teacherLoadStddev])
  const maxLoadInChart = Math.max(1, ...teacherLoads.map(t => t.load))

  // ── Room utilisation ──
  const roomUsage = useMemo(() => {
    const totalSlots = workDays.length * periods.filter(p => p.type === 'class' || !p.type).length
    if (totalSlots === 0) return []
    const counts = new Map<string, number>()
    Object.values(classTT).forEach(secMap =>
      Object.values(secMap ?? {}).forEach((dayMap: any) =>
        Object.values(dayMap ?? {}).forEach((cell: any) => {
          if (cell?.room) counts.set(cell.room, (counts.get(cell.room) ?? 0) + 1)
        })
      )
    )
    // Include rooms from store with 0 usage
    rooms.forEach((r: any) => {
      const name = r.actualName ?? r.name ?? r.generatedName
      if (name && !counts.has(name)) counts.set(name, 0)
    })
    return Array.from(counts.entries())
      .map(([room, used]) => ({ room, used, total: totalSlots, pct: Math.round((used / totalSlots) * 100) }))
      .sort((a, b) => b.pct - a.pct)
  }, [classTT, rooms, workDays, periods])

  // ── Issue categorisation ──
  const hardConflicts = conflicts.length
  const softPenalties = penalties.filter(p => p.penalty > 0)
  const overloadedTeachers = teacherLoads.filter(t => t.load > t.max)

  const fairness = score === 0 ? 'perfect' : loadStats.stddev < 2 ? 'good' : loadStats.stddev < 4 ? 'ok' : 'poor'
  const fairnessLabel = fairness === 'perfect' ? 'Perfect'
    : fairness === 'good' ? 'Good balance'
    : fairness === 'ok' ? 'Acceptable'
    : 'Needs attention'

  return (
    <div style={{
      width: '100%', maxWidth: 980, margin: '0 auto',
      display: 'flex', flexDirection: 'column' as const, gap: 14,
      textAlign: 'left' as const, fontFamily: "'Inter', sans-serif",
    }}>

      {/* ─── A. Academic Summary ─── */}
      <Card title="Academic Summary" icon={<Sparkles size={14} />}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
          <Stat icon={<Users2 size={14} />}    color="#7C6FE0" label="Classes"   value={sections.length} />
          <Stat icon={<BookOpen size={14} />}  color="#9B8EF5" label="Subjects"  value={subjects.length} />
          <Stat icon={<Users2 size={14} />}    color="#D4920E" label="Teachers"  value={staff.length} />
          <Stat icon={<Building2 size={14} />} color="#D946EF" label="Rooms"     value={rooms.length} />
          <Stat icon={<Layers size={14} />}    color="#0EA5E9" label="Opt Blocks" value={optionalBlocks.length} />
        </div>
      </Card>

      {/* ─── B. Capacity Summary ─── */}
      <Card title="Capacity Summary" icon={<Gauge size={14} />}>
        <div style={{ fontSize: 11, color: '#4B5275', marginBottom: 10 }}>
          Weekly capacity per band: <strong style={{ color: '#13111E', fontFamily: "'DM Mono', monospace" }}>{cap.weeklyCapacity}</strong> periods
          {' '}({cap.workingDays} days × {cap.teachingPeriodsPerDay} teaching periods)
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
          {bandSummary.length === 0 && <Empty text="No sections yet" />}
          {bandSummary.map(b => {
            const pct = Math.min(100, Math.round((b.avgAllocated / cap.weeklyCapacity) * 100))
            const status = utilisationStatus(b.avgAllocated, cap.weeklyCapacity)
            return (
              <div key={b.band} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 90, fontSize: 11, fontWeight: 700, color: '#13111E', textTransform: 'capitalize' as const }}>
                  {b.band} <span style={{ color: '#8B87AD', fontWeight: 500 }}>({b.sectionsCount})</span>
                </span>
                <div style={{ flex: 1, height: 14, background: '#F5F2FF', borderRadius: 4, overflow: 'hidden', position: 'relative' as const }}>
                  <div style={{
                    height: '100%', width: `${pct}%`,
                    background: status === 'over' ? '#DC2626' : status === 'tight' ? '#D4920E' : status === 'ok' ? '#16A34A' : '#7C6FE0',
                    transition: 'width 0.25s',
                  }} />
                </div>
                <span style={{ minWidth: 84, fontSize: 11, fontFamily: "'DM Mono', monospace", color: '#13111E', textAlign: 'right' as const }}>
                  {b.avgAllocated} / {cap.weeklyCapacity}
                </span>
              </div>
            )
          })}
        </div>
      </Card>

      {/* ─── C. Teacher Load Analysis ─── */}
      <Card title="Teacher Load Analysis" icon={<TrendingUp size={14} />}>
        <div style={{ display: 'flex', flexWrap: 'wrap' as const, alignItems: 'center', gap: 12, marginBottom: 12, fontSize: 11 }}>
          <Tag label="Mean"    value={loadStats.mean.toFixed(1)} color="#7C6FE0" />
          <Tag label="Min"     value={String(loadStats.min)}     color="#0EA5E9" />
          <Tag label="Max"     value={String(loadStats.max)}     color="#D4920E" />
          <Tag label="Stddev"  value={loadStats.stddev.toFixed(2)} color="#9B8EF5" />
          <div style={{ flex: 1 }} />
          <FairnessChip status={fairness} label={fairnessLabel} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 4, maxHeight: 280, overflowY: 'auto' as const }}>
          {teacherLoads.length === 0 && <Empty text="No teachers yet" />}
          {teacherLoads.map(t => {
            const pct = (t.load / maxLoadInChart) * 100
            const overloaded = t.load > t.max
            return (
              <div key={t.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '2px 0' }}>
                <span style={{ width: 130, fontSize: 11.5, color: '#13111E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, fontWeight: 600 }}>
                  {t.name}
                </span>
                <div style={{ flex: 1, height: 10, background: '#F5F2FF', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${pct}%`,
                    background: overloaded ? '#DC2626' : t.load === 0 ? '#D8D2FF' : '#7C6FE0',
                    transition: 'width 0.25s',
                  }} />
                </div>
                <span style={{ minWidth: 56, fontSize: 11, fontFamily: "'DM Mono', monospace", textAlign: 'right' as const, color: overloaded ? '#DC2626' : '#13111E' }}>
                  {t.load} / {t.max}
                </span>
              </div>
            )
          })}
        </div>
      </Card>

      {/* ─── D. Room Utilization ─── */}
      <Card title="Room Utilization" icon={<Building2 size={14} />}>
        {roomUsage.length === 0 && <Empty text="No room assignments" />}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8, maxHeight: 260, overflowY: 'auto' as const }}>
          {roomUsage.slice(0, 24).map(r => {
            const tone = r.pct >= 85 ? '#DC2626' : r.pct >= 60 ? '#16A34A' : r.pct >= 30 ? '#0EA5E9' : '#D8D2FF'
            return (
              <div key={r.room} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: '#13111E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                  {r.room}
                </span>
                <div style={{ width: 80, height: 6, background: '#F5F2FF', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${r.pct}%`, background: tone, transition: 'width 0.25s' }} />
                </div>
                <span style={{ minWidth: 38, fontSize: 10.5, fontFamily: "'DM Mono', monospace", textAlign: 'right' as const, color: '#13111E' }}>
                  {r.pct}%
                </span>
              </div>
            )
          })}
        </div>
      </Card>

      {/* ─── E. Conflicts & Warnings ─── */}
      <Card
        title="Conflicts & Warnings"
        icon={hardConflicts > 0 ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
        accent={hardConflicts > 0 ? '#DC2626' : softPenalties.length > 0 ? '#D4920E' : '#16A34A'}
      >
        <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap' as const }}>
          <Pill color="#DC2626" bg="#FEE2E2" label={`${hardConflicts} hard`} />
          <Pill color="#D4920E" bg="#FEF3C7" label={`${softPenalties.length} soft`} />
          <Pill color="#7C6FE0" bg="#EDE9FF" label={`Score: ${score}`} />
          {overloadedTeachers.length > 0 && (
            <Pill color="#DC2626" bg="#FEE2E2" label={`${overloadedTeachers.length} overloaded`} />
          )}
        </div>
        {(hardConflicts === 0 && softPenalties.length === 0) ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '12px 14px', background: '#DCFCE7', borderRadius: 8, border: '1px solid #BBF7D0',
          }}>
            <CheckCircle2 size={14} color="#15803D" />
            <span style={{ fontSize: 12, color: '#15803D', fontWeight: 600 }}>
              No conflicts or warnings — clean timetable.
            </span>
          </div>
        ) : (
          <div style={{ maxHeight: 220, overflowY: 'auto' as const, display: 'flex', flexDirection: 'column' as const, gap: 5 }}>
            {conflicts.map((c, i) => (
              <IssueRow key={`c${i}`} severity="hard" label={c.type ?? 'conflict'} desc={c.message ?? ''} />
            ))}
            {softPenalties.slice(0, 30).map((p, i) => (
              <IssueRow key={`p${i}`} severity="soft" label={p.constraint} desc={p.details} weight={p.penalty} />
            ))}
            {softPenalties.length > 30 && (
              <div style={{ fontSize: 10.5, color: '#8B87AD', padding: '4px 8px', textAlign: 'center' as const }}>
                … +{softPenalties.length - 30} more
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}

// ─── sub-components ───────────────────────────────────────

function Card({ title, icon, accent, children }: {
  title: string; icon?: React.ReactNode; accent?: string; children: React.ReactNode;
}) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #ECEAFB', borderRadius: 14,
      padding: '14px 16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ color: accent ?? '#7C6FE0', display: 'flex' }}>{icon}</div>
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#4B5275' }}>
          {title}
        </span>
      </div>
      {children}
    </div>
  )
}

function Stat({ icon, color, label, value }: { icon: React.ReactNode; color: string; label: string; value: number }) {
  return (
    <div style={{
      background: '#FAFAFE', border: '1px solid #ECEAFB', borderRadius: 9,
      padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 9,
    }}>
      <div style={{
        width: 26, height: 26, borderRadius: 6, color,
        background: `${color}1A`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#13111E', lineHeight: 1, fontFamily: "'DM Mono', monospace" }}>{value}</div>
        <div style={{ fontSize: 9.5, color: '#8B87AD', marginTop: 3, fontWeight: 600, letterSpacing: '0.04em' }}>{label}</div>
      </div>
    </div>
  )
}

function Tag({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 10px', borderRadius: 12,
      background: `${color}14`, color, border: `1px solid ${color}33`,
      fontSize: 10.5, fontWeight: 700,
    }}>
      <span style={{ opacity: 0.7 }}>{label}</span>
      <span style={{ fontFamily: "'DM Mono', monospace" }}>{value}</span>
    </span>
  )
}

function Pill({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 12, fontSize: 10.5, fontWeight: 700,
      background: bg, color, border: `1px solid ${color}22`,
    }}>
      {label}
    </span>
  )
}

function FairnessChip({ status, label }: { status: string; label: string }) {
  const map: Record<string, { bg: string; fg: string }> = {
    perfect: { bg: '#DCFCE7', fg: '#15803D' },
    good:    { bg: '#DCFCE7', fg: '#15803D' },
    ok:      { bg: '#FEF3C7', fg: '#92400E' },
    poor:    { bg: '#FEE2E2', fg: '#991B1B' },
  }
  const s = map[status] ?? map.ok
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 10px', borderRadius: 12, fontSize: 10.5, fontWeight: 800,
      background: s.bg, color: s.fg, letterSpacing: '0.04em',
    }}>
      <Clock size={10} /> Fairness: {label}
    </span>
  )
}

function IssueRow({ severity, label, desc, weight }: {
  severity: 'hard' | 'soft'; label: string; desc: string; weight?: number;
}) {
  const colors = severity === 'hard'
    ? { bg: '#FEE2E2', fg: '#991B1B', border: '#FECACA' }
    : { bg: '#FFFBEB', fg: '#92400E', border: '#FDE68A' }
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 9,
      padding: '7px 10px', background: colors.bg,
      border: `1px solid ${colors.border}`, borderRadius: 7,
    }}>
      <span style={{
        fontSize: 9, fontWeight: 800, padding: '2px 6px',
        background: colors.fg, color: '#fff', borderRadius: 4,
        flexShrink: 0, marginTop: 1, letterSpacing: '0.04em',
      }}>{severity.toUpperCase()}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: '#13111E', fontFamily: "'DM Mono', monospace" }}>
          {label} {weight ? <span style={{ color: '#8B87AD', fontWeight: 500 }}>(+{weight})</span> : null}
        </div>
        <div style={{ fontSize: 11, color: colors.fg, marginTop: 1 }}>{desc}</div>
      </div>
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return <div style={{ fontSize: 11, color: '#8B87AD', fontStyle: 'italic' as const, padding: '8px 0' }}>{text}</div>
}
