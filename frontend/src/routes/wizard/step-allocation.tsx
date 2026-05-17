/**
 * Step 3 — Allocation
 *
 * Two sub-tabs:
 *   1. Period Allocation   — Class × Subject periods-per-week matrix
 *                            (drives the engine's time allotment)
 *   2. Student Strengths   — Section × Subject student-count matrix
 *                            (drives dynamic optional-block grouping)
 */

import { useState } from 'react'
import { AllocationGrid } from '@/components/master/AllocationGrid'
import { StepSectionStrengths } from './step-section-strengths'
import { Grid3x3, Users2 } from 'lucide-react'

type Sub = 'periods' | 'strengths'

export function StepAllocation() {
  const [sub, setSub] = useState<Sub>('periods')

  return (
    <div style={{ padding: '20px 24px 24px', maxWidth: 1280, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: '#EDE9FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Grid3x3 size={20} color="#7C6FE0" />
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: '#13111E', margin: 0, lineHeight: 1.1 }}>
            Allocation
          </h2>
          <div style={{ fontSize: 12, color: '#4B5275', marginTop: 3 }}>
            <em style={{ color: '#7C6FE0' }}>AI</em> uses both matrices: periods drive how long each subject runs, strengths drive cross-class grouping.
          </div>
        </div>
      </div>

      {/* Sub-tabs */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 14,
        background: '#F8F7FF', padding: 4, borderRadius: 10, width: 'fit-content',
      }}>
        <SubTab active={sub === 'periods'}   onClick={() => setSub('periods')}   icon={<Grid3x3 size={13} />} label="Period Allocation" />
        <SubTab active={sub === 'strengths'} onClick={() => setSub('strengths')} icon={<Users2  size={13} />} label="Student Strengths" />
      </div>

      {sub === 'periods'   && <AllocationGrid />}
      {sub === 'strengths' && (
        <div style={{ marginLeft: -24, marginRight: -24, marginTop: -20 /* compensate for nested padding */ }}>
          <StepSectionStrengths />
        </div>
      )}
    </div>
  )
}

function SubTab({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick}
      style={{
        padding: '7px 14px', borderRadius: 7, border: 'none',
        background: active ? '#fff' : 'transparent',
        color: active ? '#13111E' : '#4B5275',
        fontSize: 12, fontWeight: 700, cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', gap: 6,
        boxShadow: active ? '0 1px 3px rgba(124,111,224,0.15)' : 'none',
        fontFamily: 'inherit',
      }}>
      <span style={{ color: active ? '#7C6FE0' : '#8B87AD' }}>{icon}</span>
      {label}
    </button>
  )
}
