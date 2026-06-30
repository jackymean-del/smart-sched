/**
 * Step 1 — Structure (user-facing)
 *
 * Spec internal: Step 1 — Academic structure builder.
 *
 * Sub-tabs:
 *   1. School & Board  — board, country, grade groups, scale
 *   2. Classes         — class–section roster (DataGrid)
 *
 * The Bell schedule moved to Step 2 (Subjects & Timing).
 */

import { useState } from 'react'
import { useTimetableStore } from '@/store/timetableStore'
import { ScopeMatrixModal } from '@/components/DataGrid/ScopeMatrixModal'
import { ClassesGrid } from '@/components/master/EntityGrids'
import { Step1Org } from './step1-org'
import { School, GraduationCap } from 'lucide-react'
import type { Section, ScopeMatrix } from '@/types'

type Sub = 'school' | 'classes'

export function StepStructure() {
  const [sub, setSub] = useState<Sub>('school')
  const store = useTimetableStore() as any
  const { sections, staff, setSections, config } = store
  const periods = store.periods ?? []
  const workDays: string[] = config?.workDays ?? ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
  const [scopeTarget, setScopeTarget] = useState<Section | null>(null)

  return (
    <div style={{ padding: '20px 24px 0', maxWidth: 1280, margin: '0 auto' }}>
      <div style={{
        display: 'flex', gap: 4, marginBottom: 14,
        background: '#F8F7FF', padding: 4, borderRadius: 10, width: 'fit-content',
      }}>
        <SubTab active={sub === 'school'}  onClick={() => setSub('school')}  icon={<School size={13} />}         label="School & Board" />
        <SubTab active={sub === 'classes'} onClick={() => setSub('classes')} icon={<GraduationCap size={13} />}  label="Classes" />
      </div>

      {sub === 'school' && <Step1Org />}

      {sub === 'classes' && (
        <div style={{ padding: '4px 0 24px' }}>
          <ClassesGrid
            sections={sections}
            setSections={setSections}
            staff={staff}
            onScope={(s) => setScopeTarget(s)}
          />
        </div>
      )}

      {scopeTarget && (
        <ScopeMatrixModal
          entityName={scopeTarget.name}
          entityKind="Section"
          scope={scopeTarget.scope}
          workDays={workDays}
          periods={periods}
          onSave={(nextScope: ScopeMatrix | undefined) => {
            setSections(sections.map((s: Section) => s.id === scopeTarget.id ? { ...s, scope: nextScope } : s))
          }}
          onClose={() => setScopeTarget(null)}
        />
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
