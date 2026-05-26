/**
 * Step 4 — Student Groups
 *
 * Three panels:
 *   1. Student Preference Matrix — editable class × optional-subject count grid
 *   2. Subject Grouping Rules    — per-subject cross-class behavior chips
 *   3. AI-Generated Groups       — cards showing AI's proposed learning groups
 *
 * Writes directly to Zustand (sectionStrengths + subjectGroupingRules + dynamicLearningGroups).
 */

import { useMemo, useEffect, useState, useRef, useCallback } from 'react'
import { useTimetableStore } from '@/store/timetableStore'
import type { SectionStrength } from '@/types'
import { Sparkles, Users2, ChevronRight, ChevronLeft, RefreshCw, BookOpen, Users, GraduationCap, CheckSquare } from 'lucide-react'

// ── types ─────────────────────────────────────────────────────

type GroupingBehavior = 'NO_GROUPING' | 'SAME_GRADE_ONLY' | 'CROSS_GRADE_ALLOWED' | 'FLEXIBLE_GROUPING'

const BEHAVIOR_META: Record<GroupingBehavior, { label: string; short: string; bg: string; fg: string; border: string; desc: string }> = {
  NO_GROUPING:         { label: 'No grouping',      short: 'No group',    bg: '#F8F7FF', fg: '#8B87AD', border: '#E8E4FF', desc: 'Each class schedules independently' },
  SAME_GRADE_ONLY:     { label: 'Same grade only',  short: 'Same grade',  bg: '#EFF6FF', fg: '#1D4ED8', border: '#DBEAFE', desc: 'Groups sections within the same grade' },
  CROSS_GRADE_ALLOWED: { label: 'Cross grade',       short: 'Cross grade', bg: '#EDE9FF', fg: '#7C3AED', border: '#C4B5FD', desc: 'Can mix students from different grades' },
  FLEXIBLE_GROUPING:   { label: 'Flexible',          short: 'Flexible',    bg: '#DCFCE7', fg: '#15803D', border: '#BBF7D0', desc: 'AI decides best grouping strategy' },
}

const BEHAVIORS: GroupingBehavior[] = ['NO_GROUPING', 'SAME_GRADE_ONLY', 'CROSS_GRADE_ALLOWED', 'FLEXIBLE_GROUPING']

// Group dot colors
const GROUP_COLORS = ['#7C6FE0', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899', '#8B5CF6', '#06B6D4']
function groupColor(i: number) { return GROUP_COLORS[i % GROUP_COLORS.length] }

// AI Logic items
const AI_LOGIC_ITEMS = [
  'Sections with ≥ 5 students in an optional subject form a group',
  'Groups of < 5 students from the same grade merge into combined sections',
  'Cross-grade groups only form when same-grade count < 3',
  'Each group gets its own room and time slot automatically',
  'Teacher assignment respects availability and max weekly load',
  'Groups that conflict in timing are automatically rescheduled',
]

// ── helpers ──────────────────────────────────────────────────

function guessStream(secName: string): string {
  const u = secName.toUpperCase()
  if (u.includes('SCIENCE') || u.includes('SCI') || u.includes('PCM') || u.includes('PCB')) return 'Science'
  if (u.includes('COMMERCE') || u.includes('COM')) return 'Commerce'
  if (u.includes('HUM') || u.includes('ARTS')) return 'Humanities'
  return 'General'
}

function generateGroupId(subject: string, idx: number): string {
  const prefix = subject.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4)
  return `${prefix}_G${idx + 1}`
}

// ── component ─────────────────────────────────────────────────

export function StepStudentGroups() {
  const store = useTimetableStore() as any
  const {
    sections, subjects, sectionStrengths, setSectionStrengths,
    subjectGroupingRules, setSubjectGroupingRule,
    dynamicLearningGroups, setDynamicLearningGroups,
    setStep,
  } = store

  const [regenerating, setRegenerating] = useState(false)
  const [logicChecked, setLogicChecked] = useState<Record<number, boolean>>(
    Object.fromEntries(AI_LOGIC_ITEMS.map((_, i) => [i, true]))
  )

  // ── Only optional subjects drive the grouping matrix ──────────────────────
  const optionalSubjects = useMemo(() => subjects.filter((s: any) => s.isOptional), [subjects])
  const subjectList = useMemo(() => optionalSubjects.map((s: any) => s.name) as string[], [optionalSubjects])

  // ── Only sections that have at least one optional subject assigned ─────────
  const optionalSections = useMemo(() => {
    const sectionSet = new Set<string>()
    for (const sub of optionalSubjects) {
      // Mirror getAssignedClasses: classConfigs first, then sections fallback
      const fromConfigs = (sub.classConfigs ?? []).map((c: any) => c.sectionName).filter(Boolean) as string[]
      const assigned = fromConfigs.length > 0 ? fromConfigs : (sub.sections ?? [])
      for (const cls of assigned) sectionSet.add(cls)
    }
    return sections.filter((s: any) => sectionSet.has(s.name))
  }, [sections, optionalSubjects])

  // Initialize section strengths if empty
  useEffect(() => {
    if (sectionStrengths.length === 0 && optionalSections.length > 0 && subjectList.length > 0) {
      const init: SectionStrength[] = optionalSections.map((sec: any) => ({
        sectionName: sec.name,
        stream: guessStream(sec.name),
        subjectStrengths: Object.fromEntries(subjectList.map((s: string) => [s, 0])),
      }))
      setSectionStrengths(init)
    }
  }, [optionalSections.length, subjectList.length])

  // Materialized rows — only optional sections × optional subjects
  const rows: SectionStrength[] = useMemo(() =>
    optionalSections.map((sec: any) =>
      sectionStrengths.find((r: SectionStrength) => r.sectionName === sec.name) ?? {
        sectionName: sec.name,
        stream: guessStream(sec.name),
        subjectStrengths: Object.fromEntries(subjectList.map((s: string) => [s, 0])),
      }
    ), [optionalSections, sectionStrengths, subjectList])

  // Update a single cell
  const updateCell = (sectionName: string, subjectName: string, value: number) => {
    const updated = rows.map(r =>
      r.sectionName === sectionName
        ? { ...r, subjectStrengths: { ...r.subjectStrengths, [subjectName]: Math.max(0, value) } }
        : r
    )
    setSectionStrengths(updated)
  }

  // Ref to the table wrapper — used to scope querySelector for ↑↓ navigation
  const tableWrapRef = useRef<HTMLDivElement>(null)

  // Arrow-key + Enter navigation between inputs in the preference matrix
  const handleCellKey = useCallback((e: React.KeyboardEvent<HTMLInputElement>, ri: number, ci: number) => {
    if (e.key === 'Escape') {
      e.currentTarget.blur()
      return
    }
    let nextR = ri, nextC = ci
    if (e.key === 'ArrowDown'  || (e.key === 'Enter' && !e.shiftKey)) { nextR = ri + 1; e.preventDefault() }
    else if (e.key === 'ArrowUp' || (e.key === 'Enter' &&  e.shiftKey)) { nextR = ri - 1; e.preventDefault() }
    else if (e.key === 'ArrowRight') { nextC = ci + 1; e.preventDefault() }
    else if (e.key === 'ArrowLeft')  { nextC = ci - 1; e.preventDefault() }
    else return
    const next = tableWrapRef.current?.querySelector<HTMLInputElement>(
      `input[data-row="${nextR}"][data-col="${nextC}"]`
    )
    if (next) { next.focus(); next.select() }
  }, [])

  // AI Regenerate groups
  const handleRegenerate = async () => {
    setRegenerating(true)
    await new Promise(r => setTimeout(r, 900)) // simulate AI

    const generated: typeof dynamicLearningGroups = []
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    const periods = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6']

    subjectList.forEach((subName: string, si: number) => {
      const behavior = subjectGroupingRules[subName] ?? 'SAME_GRADE_ONLY'
      if (behavior === 'NO_GROUPING') return

      // Collect sections with strength > 0 for this subject
      const activeSections = rows
        .filter(r => (r.subjectStrengths?.[subName] ?? 0) >= 5)
        .map(r => r.sectionName)
      if (activeSections.length < 2) return

      // Group into batches of 2-3 sections
      const batchSize = behavior === 'CROSS_GRADE_ALLOWED' ? 3 : 2
      for (let gi = 0; gi < activeSections.length; gi += batchSize) {
        const batch = activeSections.slice(gi, gi + batchSize)
        const totalStr = batch.reduce((a, sn) => {
          const row = rows.find(r => r.sectionName === sn)
          return a + (row?.subjectStrengths?.[subName] ?? 0)
        }, 0)
        generated.push({
          id: `${generateGroupId(subName, Math.floor(gi / batchSize))}_${Date.now()}`,
          subject: subName,
          sectionNames: batch,
          totalStrength: totalStr,
          teacher: '',
          room: `Room ${100 + si + Math.floor(gi / batchSize)}`,
          behavior,
          day: days[si % days.length],
          periodId: periods[(gi + si) % periods.length],
        })
      }
    })

    setDynamicLearningGroups(generated)
    setRegenerating(false)
  }

  // Column widths
  const colW = Math.max(70, Math.min(100, Math.floor((1100 - 140 - 100) / Math.max(1, subjectList.length))))

  return (
    <div style={{ padding: '20px 24px 40px', maxWidth: 1280, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: '#EDE9FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Users2 size={20} color="#7C6FE0" />
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: '#13111E', margin: 0, lineHeight: 1.1 }}>
            Student Groups
          </h2>
          <div style={{ fontSize: 12, color: '#4B5275', marginTop: 3 }}>
            <em style={{ color: '#7C6FE0' }}>AI</em> uses student counts + grouping rules to create optimised cross-class learning groups.
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════
          PANEL 1: Student Preference Matrix
      ══════════════════════════════════ */}
      <Section title="Student Preference Matrix" icon={<GraduationCap size={15} color="#7C6FE0" />}
        hint="Enter number of students selecting each subject per class. AI uses these counts to form optimised groups.">
        {subjectList.length === 0 ? (
          <EmptyState msg={
            subjects.length === 0
              ? 'Add subjects in Step 1 → Resources, then mark them as Optional to appear here.'
              : 'Mark at least one subject as Optional (in the Subjects panel) to see the preference matrix.'
          } />
        ) : optionalSections.length === 0 ? (
          <EmptyState msg="Assign optional subjects to classes (in the Subjects panel) to see which sections appear here." />
        ) : (
          <div ref={tableWrapRef} style={{ overflowX: 'auto' as const }}>
            <table style={{ borderCollapse: 'collapse' as const, width: '100%', minWidth: 400 }}>
              <thead>
                <tr>
                  <th style={thStyle(140, true)}>Class / Section</th>
                  <th style={thStyle(100)}>Total Students</th>
                  {subjectList.map((s: string) => (
                    <th key={s} style={thStyle(colW)}>{s}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, ri) => {
                  const total = Object.values(row.subjectStrengths ?? {}).reduce((a, v) => a + (v as number), 0)
                  return (
                    <tr key={row.sectionName}
                      style={{ background: ri % 2 === 0 ? '#fff' : '#FAFAFE' }}>
                      <td style={tdSticky()}>{row.sectionName}</td>
                      <td style={tdCenter()}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#4B5275', fontFamily: "'DM Mono', monospace" }}>
                          {total || '—'}
                        </span>
                      </td>
                      {subjectList.map((subName: string, ci: number) => {
                        const val = row.subjectStrengths?.[subName] ?? 0
                        return (
                          <td key={subName} style={tdCenter()}>
                            <input
                              type="number" min={0} max={99} value={val || ''}
                              placeholder="0"
                              data-row={ri} data-col={ci}
                              onChange={e => updateCell(row.sectionName, subName, parseInt(e.target.value) || 0)}
                              onKeyDown={e => handleCellKey(e, ri, ci)}
                              onFocus={e => e.currentTarget.select()}
                              style={{
                                width: '100%', maxWidth: 60, textAlign: 'center' as const,
                                padding: '4px 6px', borderRadius: 6,
                                border: `1px solid ${val >= 5 ? '#7C6FE0' : '#E8E4FF'}`,
                                background: val >= 5 ? '#F5F2FF' : '#fff',
                                fontSize: 12, fontWeight: 700, fontFamily: "'DM Mono', monospace",
                                color: val >= 5 ? '#7C3AED' : '#4B5275',
                                outline: 'none',
                              }}
                            />
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        <div style={{ fontSize: 10, color: '#B8B4D4', marginTop: 8 }}>
          ✦ Cells highlighted in purple have ≥ 5 students — AI will form a group for these.
        </div>
        <TableKeyboardHint />
      </Section>

      {/* ══════════════════════════════════
          PANEL 2: Subject Grouping Rules
      ══════════════════════════════════ */}
      <Section title="Subject Grouping Rules" icon={<BookOpen size={15} color="#7C6FE0" />}
        hint="Set how AI groups students for each subject. Flexible lets AI decide the best approach.">
        {subjectList.length === 0 ? (
          <EmptyState msg="Mark subjects as Optional in the Subjects panel to configure their grouping rules here." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
            {subjectList.map((subName: string) => {
              const current = (subjectGroupingRules[subName] ?? 'SAME_GRADE_ONLY') as GroupingBehavior
              const meta = BEHAVIOR_META[current]
              return (
                <div key={subName} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px', borderRadius: 10,
                  background: '#fff', border: '1px solid #E8E4FF',
                  flexWrap: 'wrap' as const,
                }}>
                  <div style={{ minWidth: 140, fontSize: 13, fontWeight: 600, color: '#13111E' }}>
                    {subName}
                  </div>
                  <div style={{ flex: 1, display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
                    {BEHAVIORS.map(beh => {
                      const bMeta = BEHAVIOR_META[beh]
                      const active = beh === current
                      return (
                        <button key={beh}
                          onClick={() => setSubjectGroupingRule(subName, beh)}
                          title={bMeta.desc}
                          style={{
                            padding: '4px 10px', borderRadius: 20,
                            border: `1px solid ${active ? bMeta.border : '#E8E4FF'}`,
                            background: active ? bMeta.bg : '#F8F7FF',
                            color: active ? bMeta.fg : '#8B87AD',
                            fontSize: 10, fontWeight: 700, cursor: 'pointer',
                            fontFamily: 'inherit', transition: 'all 0.12s',
                          }}>
                          {bMeta.short}
                        </button>
                      )
                    })}
                  </div>
                  <span style={{
                    fontSize: 10, color: meta.fg, fontWeight: 600,
                    padding: '2px 8px', borderRadius: 10,
                    background: meta.bg, border: `1px solid ${meta.border}`,
                  }}>
                    {meta.label}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </Section>

      {/* ══════════════════════════════════
          PANEL 3: AI Logic Summary
      ══════════════════════════════════ */}
      <Section title="AI Logic Summary" icon={<CheckSquare size={15} color="#7C6FE0" />}
        hint="These are the rules the AI applies when generating groups. Uncheck to disable a rule.">
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
          {AI_LOGIC_ITEMS.map((item, i) => (
            <label key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              padding: '8px 12px', borderRadius: 8,
              background: logicChecked[i] ? '#F5F2FF' : '#F8F7FF',
              border: `1px solid ${logicChecked[i] ? '#D8D2FF' : '#E8E4FF'}`,
              cursor: 'pointer',
            }}>
              <input
                type="checkbox"
                checked={logicChecked[i] ?? true}
                onChange={e => setLogicChecked(prev => ({ ...prev, [i]: e.target.checked }))}
                style={{ marginTop: 2, accentColor: '#7C6FE0', width: 14, height: 14, flexShrink: 0 }}
              />
              <span style={{ fontSize: 12, color: logicChecked[i] ? '#13111E' : '#B8B4D4', lineHeight: 1.5 }}>
                {item}
              </span>
            </label>
          ))}
        </div>
      </Section>

      {/* ══════════════════════════════════
          PANEL 4: AI-Generated Groups
      ══════════════════════════════════ */}
      <Section title="AI-Generated Groups" icon={<Sparkles size={15} color="#7C6FE0" />}
        hint={dynamicLearningGroups.length > 0
          ? `${dynamicLearningGroups.length} group${dynamicLearningGroups.length !== 1 ? 's' : ''} generated. Each group gets its own room & time slot.`
          : 'Click "Regenerate groups" to let AI build optimised learning groups from the data above.'}>
        {dynamicLearningGroups.length === 0 ? (
          <div style={{
            padding: '32px 24px', textAlign: 'center' as const,
            background: '#F8F7FF', borderRadius: 10, border: '1px dashed #D8D2FF',
          }}>
            <Sparkles size={28} color="#C4B5FD" style={{ marginBottom: 10 }} />
            <div style={{ fontSize: 13, color: '#8B87AD', marginBottom: 6 }}>No groups generated yet</div>
            <div style={{ fontSize: 11, color: '#B8B4D4' }}>
              Fill in the preference matrix and click ✦ Regenerate groups below
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {dynamicLearningGroups.map((grp: any, gi: number) => (
              <GroupCard key={grp.id} grp={grp} colorDot={groupColor(gi)} />
            ))}
          </div>
        )}
      </Section>

      {/* ══════════════════════════════════
          NAVIGATION BUTTONS
      ══════════════════════════════════ */}
      <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap' as const, alignItems: 'center' }}>
        <button onClick={() => setStep(3)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '9px 16px', borderRadius: 8, border: '1px solid #E8E4FF',
            background: '#fff', color: '#4B5275', fontSize: 12, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
          <ChevronLeft size={14} /> Period allocation
        </button>

        <button onClick={handleRegenerate} disabled={regenerating}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '9px 18px', borderRadius: 8, border: '1px solid #C4B5FD',
            background: regenerating ? '#EDE9FF' : '#F5F2FF', color: '#7C3AED',
            fontSize: 12, fontWeight: 700, cursor: regenerating ? 'wait' : 'pointer',
            fontFamily: 'inherit', transition: 'all 0.15s',
          }}>
          <RefreshCw size={13} style={{ animation: regenerating ? 'spin 0.7s linear infinite' : 'none' }} />
          {regenerating ? 'Generating…' : '✦ Regenerate groups'}
        </button>

        <div style={{ flex: 1 }} />

        <button onClick={() => setStep(5)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '9px 20px', borderRadius: 8, border: 'none',
            background: 'linear-gradient(135deg, #7C6FE0, #9B8EF5)', color: '#fff',
            fontSize: 12, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(124,111,224,0.35)',
          }}>
          Next: Review & generate <ChevronRight size={14} />
        </button>
      </div>

      {/* spin keyframe */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────

function Section({ title, icon, hint, children }: {
  title: string; icon: React.ReactNode; hint?: string; children: React.ReactNode
}) {
  return (
    <div style={{
      background: '#fff', borderRadius: 12, border: '1px solid #E8E4FF',
      marginBottom: 16, overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '12px 16px', borderBottom: '1px solid #F0EDFF',
        background: '#FAFAFE',
      }}>
        {icon}
        <span style={{ fontSize: 13, fontWeight: 700, color: '#13111E' }}>{title}</span>
        {hint && <span style={{ fontSize: 11, color: '#8B87AD', marginLeft: 4 }}>— {hint}</span>}
      </div>
      <div style={{ padding: '14px 16px' }}>
        {children}
      </div>
    </div>
  )
}

function EmptyState({ msg }: { msg: string }) {
  return (
    <div style={{ padding: '20px 0', textAlign: 'center' as const, color: '#B8B4D4', fontSize: 12 }}>
      {msg}
    </div>
  )
}

function GroupCard({ grp, colorDot }: { grp: any; colorDot: string }) {
  const behMeta = BEHAVIOR_META[grp.behavior as GroupingBehavior] ?? BEHAVIOR_META.SAME_GRADE_ONLY

  return (
    <div style={{
      borderRadius: 10, border: '1px solid #E8E4FF',
      background: '#fff', overflow: 'hidden',
      boxShadow: '0 1px 4px rgba(124,111,224,0.07)',
    }}>
      {/* Card header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 12px',
        background: 'linear-gradient(135deg, #F5F2FF, #FAFAFE)',
        borderBottom: '1px solid #F0EDFF',
      }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: colorDot, flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 800, color: '#13111E', fontFamily: "'DM Mono', monospace", flex: 1 }}>
          {grp.id.split('_')[0]}_{grp.id.split('_')[1]}
        </span>
        <span style={{
          fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 10,
          background: behMeta.bg, color: behMeta.fg, border: `1px solid ${behMeta.border}`,
        }}>
          {behMeta.short}
        </span>
      </div>

      {/* Card body */}
      <div style={{ padding: '10px 12px' }}>
        <div style={{ fontSize: 11, color: '#4B5275', marginBottom: 6 }}>
          <strong style={{ color: '#13111E' }}>Subject:</strong> {grp.subject}
        </div>

        {/* Members */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' as const, marginBottom: 6 }}>
          {grp.sectionNames.map((sn: string) => (
            <span key={sn} style={{
              padding: '2px 7px', borderRadius: 8,
              background: '#EDE9FF', color: '#7C3AED',
              fontSize: 10, fontWeight: 700, border: '1px solid #C4B5FD',
            }}>
              {sn}
            </span>
          ))}
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 12, fontSize: 10, color: '#8B87AD' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Users size={9} /> {grp.totalStrength} students
          </span>
          {grp.room && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              🏫 {grp.room}
            </span>
          )}
        </div>

        {/* Timetable preview slot */}
        {(grp.day || grp.periodId) && (
          <div style={{
            marginTop: 8, padding: '5px 8px', borderRadius: 6,
            background: '#F5F2FF', border: '1px solid #E8E4FF',
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 10, color: '#7C3AED', fontWeight: 600,
          }}>
            📅 {grp.day ? grp.day.slice(0, 3) : ''} {grp.periodId}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Table cell styles ─────────────────────────────────────────

function thStyle(width: number, sticky = false): React.CSSProperties {
  return {
    width, minWidth: width,
    padding: '8px 10px',
    fontSize: 10, fontWeight: 800, color: '#8B87AD',
    textTransform: 'uppercase', letterSpacing: '0.08em',
    background: '#F8F7FF',
    borderBottom: '2px solid #E8E4FF',
    textAlign: sticky ? 'left' : 'center',
    whiteSpace: 'nowrap',
    position: sticky ? 'sticky' : 'static',
    left: sticky ? 0 : undefined,
    zIndex: sticky ? 1 : undefined,
  } as React.CSSProperties
}

function tdSticky(): React.CSSProperties {
  return {
    padding: '6px 10px', fontSize: 12, fontWeight: 700, color: '#13111E',
    borderBottom: '1px solid #F0EDFF',
    position: 'sticky', left: 0, background: 'inherit', zIndex: 1,
    whiteSpace: 'nowrap',
  }
}

function tdCenter(): React.CSSProperties {
  return {
    padding: '4px 6px', textAlign: 'center',
    borderBottom: '1px solid #F0EDFF',
  }
}

// ── Keyboard shortcut hint bar (shared with DataGrid) ─────────
const TABLE_SHORTCUTS = [
  { key: 'Tab',    label: 'Next field'  },
  { key: 'Enter',  label: 'Next row'    },
  { key: '↑ ↓',   label: 'Navigate'    },
  { key: '← →',   label: 'Navigate'    },
  { key: 'Esc',   label: 'Cancel'       },
]
function TableKeyboardHint() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px 16px',
      padding: '7px 4px', marginTop: 4,
    }}>
      <span style={{ fontSize: 10, color: '#B8B4D4', fontWeight: 700, flexShrink: 0 }}>
        Keyboard shortcuts:
      </span>
      {TABLE_SHORTCUTS.map(s => (
        <span key={s.key + s.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
          <kbd style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            padding: '1px 7px', borderRadius: 4,
            border: '1px solid #E8E4FF',
            background: '#fff', color: '#555',
            fontSize: 10, fontWeight: 700,
            fontFamily: 'inherit',
            boxShadow: '0 1px 0 rgba(0,0,0,0.06)',
            whiteSpace: 'nowrap' as const,
          }}>
            {s.key}
          </kbd>
          <span style={{ fontSize: 10, color: '#B8B4D4' }}>{s.label}</span>
        </span>
      ))}
    </div>
  )
}
