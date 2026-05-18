/**
 * PenaltyTrendChart — compact sparkline showing score evolution as
 * the user applies fixes. Each tick is one penalty score snapshot.
 *
 * Lower score = better, so the line trending DOWN is good.
 * Color gradient applied per segment: red → amber → green based on
 * the trend direction.
 *
 * Self-contained SVG, no charting library, no external deps.
 */

import { TrendingDown, TrendingUp, Minus } from 'lucide-react'

export interface ScorePoint {
  /** Cumulative score at this point */
  score: number
  /** Optional event label ("initial", "fix", "auto-fix", etc.) */
  event?: string
  /** Optional human-readable timestamp ("Just now", "2s ago") */
  label?: string
}

interface Props {
  history: ScorePoint[]
  width?: number
  height?: number
}

export function PenaltyTrendChart({ history, width = 220, height = 44 }: Props) {
  if (history.length < 2) {
    // Not enough data — show a neutral placeholder
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '4px 10px', borderRadius: 6,
        background: '#F8F7FF', border: '1px solid #ECEAFB',
        fontSize: 10, color: '#8B87AD',
      }}>
        <Minus size={11} />
        <span>Trend appears after first fix</span>
      </div>
    )
  }

  const pad = 6
  const innerW = width - pad * 2
  const innerH = height - pad * 2
  const scores = history.map(p => p.score)
  const minScore = Math.min(...scores)
  const maxScore = Math.max(...scores)
  const range = Math.max(1, maxScore - minScore)

  const xFor = (i: number) =>
    pad + (history.length === 1 ? innerW / 2 : (i / (history.length - 1)) * innerW)
  const yFor = (score: number) =>
    pad + innerH - ((score - minScore) / range) * innerH

  // Build path
  let path = ''
  history.forEach((p, i) => {
    const x = xFor(i)
    const y = yFor(p.score)
    path += (i === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : ` L ${x.toFixed(1)} ${y.toFixed(1)}`)
  })

  const first = history[0].score
  const last  = history[history.length - 1].score
  const delta = last - first
  const trendTone = delta < 0 ? '#16A34A' : delta > 0 ? '#DC2626' : '#7C6FE0'
  const trendIcon = delta < 0
    ? <TrendingDown size={12} color="#16A34A" />
    : delta > 0
      ? <TrendingUp size={12} color="#DC2626" />
      : <Minus size={12} color="#7C6FE0" />

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 10,
      padding: '6px 12px', borderRadius: 8,
      background: '#FAFAFE', border: '1px solid #ECEAFB',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        {trendIcon}
        <span style={{
          fontSize: 10.5, fontWeight: 800, color: trendTone,
          fontFamily: "'DM Mono', monospace", letterSpacing: '0.02em',
        }}>
          {delta > 0 ? '+' : ''}{delta}
        </span>
      </div>
      <svg width={width} height={height} style={{ display: 'block' }}>
        {/* Gradient: red→green based on trend */}
        <defs>
          <linearGradient id="trend-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={trendTone} stopOpacity="0.18" />
            <stop offset="100%" stopColor={trendTone} stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Filled area */}
        <path d={`${path} L ${xFor(history.length - 1).toFixed(1)} ${(pad + innerH).toFixed(1)} L ${xFor(0).toFixed(1)} ${(pad + innerH).toFixed(1)} Z`}
          fill="url(#trend-area)" />
        {/* Trend line */}
        <path d={path} fill="none" stroke={trendTone} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Dots per point */}
        {history.map((p, i) => {
          const isLast = i === history.length - 1
          const isFirst = i === 0
          return (
            <circle key={i}
              cx={xFor(i)} cy={yFor(p.score)}
              r={isLast ? 3.5 : isFirst ? 3 : 2}
              fill={isLast ? trendTone : '#fff'}
              stroke={trendTone} strokeWidth="1.5"
            />
          )
        })}
      </svg>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#4B5275' }}>
        <span style={{ fontFamily: "'DM Mono', monospace", color: '#8B87AD' }}>{first}</span>
        <span>→</span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700, color: trendTone }}>{last}</span>
      </div>
    </div>
  )
}
