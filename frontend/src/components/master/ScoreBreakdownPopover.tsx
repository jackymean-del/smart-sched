/**
 * ScoreBreakdownPopover — clickable Score pill that reveals per-
 * constraint contributions to the total score.
 *
 * Aggregates penalties by `constraint`, sums their weights, and
 * shows a sorted list with severity-coloured bars proportional to
 * each constraint's share of the total.
 *
 * Drop-in replacement for the static <Pill>: pass it the live
 * penalties array and current score.
 */

import { useMemo, useState } from 'react'
import { TrendingDown, Activity, ChevronDown, ChevronUp } from 'lucide-react'

interface PenaltyEntry {
  constraint: string
  penalty: number
  details: string
}

interface Props {
  penalties: PenaltyEntry[]
  liveScore: number
  originalScore: number
}

const CONSTRAINT_LABEL: Record<string, string> = {
  'workload-imbalance':      'Workload imbalance',
  'teacher-overload':        'Teacher overload',
  'subject-scope-locked':    'Subject scope locked',
  'section-scope-disabled':  'Section scope disabled',
  'subject-scope-disabled':  'Subject scope disabled',
  'teacher-scope-disabled':  'Teacher scope disabled',
  'consecutive-heavy':       'Consecutive same subject',
  'teacher-availability':    'No teacher available',
  'block-capacity-overflow': 'Block capacity overflow',
}

const CONSTRAINT_COLOR: Record<string, { bg: string; fg: string }> = {
  'workload-imbalance':      { bg: '#EDE9FF', fg: '#7C6FE0' },
  'teacher-overload':        { bg: '#FEE2E2', fg: '#991B1B' },
  'subject-scope-locked':    { bg: '#FEE2E2', fg: '#DC2626' },
  'section-scope-disabled':  { bg: '#FEF3C7', fg: '#92400E' },
  'subject-scope-disabled':  { bg: '#FEF3C7', fg: '#92400E' },
  'teacher-scope-disabled':  { bg: '#FEF3C7', fg: '#92400E' },
  'consecutive-heavy':       { bg: '#FFFBEB', fg: '#D4920E' },
  'teacher-availability':    { bg: '#FEE2E2', fg: '#991B1B' },
  'block-capacity-overflow': { bg: '#FEE2E2', fg: '#991B1B' },
}

export function ScoreBreakdownPopover({ penalties, liveScore, originalScore }: Props) {
  const [open, setOpen] = useState(false)

  const breakdown = useMemo(() => {
    const m = new Map<string, { count: number; total: number; details: string[] }>()
    penalties.forEach(p => {
      const e = m.get(p.constraint) ?? { count: 0, total: 0, details: [] }
      e.count++
      e.total += p.penalty
      e.details.push(p.details)
      m.set(p.constraint, e)
    })
    return Array.from(m.entries())
      .map(([c, v]) => ({ constraint: c, ...v }))
      .sort((a, b) => b.total - a.total)
  }, [penalties])

  const maxPenalty = Math.max(1, ...breakdown.map(b => b.total))
  const delta = liveScore - originalScore
  const improved = delta < 0

  return (
    <span style={{ position: 'relative' as const, display: 'inline-flex' }}>
      <button
        onClick={() => setOpen(v => !v)}
        title="Click for score breakdown"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '3px 10px', borderRadius: 12,
          background: '#EDE9FF', color: '#7C6FE0',
          border: '1px solid #D8D2FF',
          fontSize: 10.5, fontWeight: 700, cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        Score: {liveScore}
        {liveScore !== originalScore && (
          <span style={{ color: improved ? '#16A34A' : '#DC2626', fontWeight: 800, fontFamily: "'DM Mono', monospace" }}>
            ({delta > 0 ? '+' : ''}{delta})
          </span>
        )}
        {open ? <ChevronUp size={9} /> : <ChevronDown size={9} />}
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 9998 }} />
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'absolute' as const,
              left: 0, top: '100%',
              marginTop: 6,
              zIndex: 9999,
              minWidth: 340, maxWidth: 420,
              background: '#fff',
              border: '1px solid #ECEAFB',
              borderRadius: 12,
              boxShadow: '0 14px 38px rgba(19,17,30,0.18)',
              padding: 0,
              fontFamily: "'Inter', sans-serif",
              textAlign: 'left' as const,
            }}>
            {/* Header */}
            <div style={{
              padding: '12px 14px', borderBottom: '1px solid #F3F1FF',
              background: 'linear-gradient(135deg, #EDE9FF 0%, #FAFAFE 100%)',
              borderRadius: '12px 12px 0 0',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Activity size={12} color="#7C6FE0" />
                <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: '#7C6FE0' }}>
                  Score Breakdown
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 24, fontWeight: 900, color: '#13111E', fontFamily: "'DM Mono', monospace", letterSpacing: '-0.5px' }}>
                  {liveScore}
                </span>
                <span style={{ fontSize: 11, color: '#8B87AD' }}>
                  total penalty points
                </span>
                {liveScore !== originalScore && (
                  <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: improved ? '#16A34A' : '#DC2626' }}>
                    {improved && <TrendingDown size={11} />}
                    {delta > 0 ? '+' : ''}{delta} vs solve
                  </span>
                )}
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: '10px 14px 14px', maxHeight: 320, overflowY: 'auto' as const }}>
              {breakdown.length === 0 ? (
                <div style={{ padding: '20px 0', textAlign: 'center' as const, color: '#15803D', fontSize: 12, fontWeight: 600 }}>
                  ✓ No penalties — clean state
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
                  {breakdown.map(b => {
                    const c = CONSTRAINT_COLOR[b.constraint] ?? { bg: '#F1F5F9', fg: '#475569' }
                    const label = CONSTRAINT_LABEL[b.constraint] ?? b.constraint
                    const share = (b.total / maxPenalty) * 100
                    return (
                      <div key={b.constraint}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{
                            padding: '2px 8px', borderRadius: 10,
                            fontSize: 9, fontWeight: 800, letterSpacing: '0.04em',
                            background: c.bg, color: c.fg,
                          }}>
                            {label}
                          </span>
                          <span style={{ fontSize: 10, color: '#8B87AD' }}>
                            {b.count} occurrence{b.count !== 1 ? 's' : ''}
                          </span>
                          <span style={{
                            marginLeft: 'auto',
                            fontSize: 12, fontWeight: 800,
                            fontFamily: "'DM Mono', monospace", color: c.fg,
                          }}>
                            {b.total}
                          </span>
                        </div>
                        <div style={{ height: 4, background: '#F5F2FF', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', width: `${share}%`,
                            background: c.fg, opacity: 0.85,
                            transition: 'width 0.25s',
                          }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Footer hint */}
              <div style={{
                fontSize: 10, color: '#8B87AD', marginTop: 12,
                padding: '6px 8px', background: '#FAFAFE', borderRadius: 6,
                lineHeight: 1.5,
              }}>
                Lower is better. Workload-related penalties update live as you Apply fixes; scope/placement penalties need a re-solve to refresh.
              </div>
            </div>
          </div>
        </>
      )}
    </span>
  )
}
