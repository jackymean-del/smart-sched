/**
 * Optional Subject Scheduling Engine
 * For XI-XII classes with floating optional subjects
 * 
 * Flow:
 * 1. Define optional lines (mutually exclusive subject groups)
 * 2. Auto-generate valid combinations (one from each line)
 * 3. Collect section-wise student counts per combination
 * 4. Derive subject pools (students from multiple sections)
 * 5. Run parallel block scheduler for optional periods
 */

import type { ClassOptionalConfig, OptionalCombination, SubjectPool, CombinationStrength } from '@/types'

// ─── Generate all valid combinations ─────────────────────
export function generateCombinations(config: ClassOptionalConfig): OptionalCombination[] {
  if (!config.optionalLines.length) return []

  // Cartesian product of all lines
  const cartesian = (lines: string[][]): string[][] => {
    if (lines.length === 0) return [[]]
    const [first, ...rest] = lines
    const restProduct = cartesian(rest)
    return first.flatMap(item => restProduct.map(combo => [item, ...combo]))
  }

  const lineSubjects = config.optionalLines.map(l => l.subjects.filter(s => s.trim()))
  const validLines = lineSubjects.filter(l => l.length > 0)
  if (!validLines.length) return []

  const combos = cartesian(validLines)
  return combos.map((subjects, i) => ({
    id: `combo-${i}`,
    subjects,
    label: subjects.join(' + '),
  }))
}

// ─── Validate combination strengths ──────────────────────
export function validateStrengths(
  config: ClassOptionalConfig,
  combinations: OptionalCombination[]
): { valid: boolean; message: string; total: number } {
  const strengths = config.combinationStrengths.filter(s => s.sectionId === config.classId)
  const total = strengths.reduce((a, s) => a + (s.studentCount || 0), 0)
  const expected = config.totalStudents

  if (total === 0) return { valid: false, message: 'No strengths entered yet', total }
  if (total !== expected) return {
    valid: false,
    message: `Total ${total} ≠ section strength ${expected} (difference: ${Math.abs(total - expected)})`,
    total,
  }
  return { valid: true, message: `✅ ${total} students = section strength`, total }
}

// ─── Derive subject pools from all sections ───────────────
export function deriveSubjectPools(
  configs: ClassOptionalConfig[],
  allCombinations: Map<string, OptionalCombination[]>
): SubjectPool[] {
  const poolMap = new Map<string, SubjectPool>()

  configs.forEach(cfg => {
    if (!cfg.hasOptionals) return
    const combos = allCombinations.get(cfg.classId) ?? []

    cfg.combinationStrengths.forEach(cs => {
      const combo = combos.find(c => c.id === cs.combinationId)
      if (!combo || !cs.studentCount) return

      combo.subjects.forEach(subjectName => {
        const existing = poolMap.get(subjectName)
        if (existing) {
          existing.totalStudents += cs.studentCount
          if (!existing.sections.includes(cfg.classId)) existing.sections.push(cfg.classId)
        } else {
          poolMap.set(subjectName, {
            subjectName,
            totalStudents: cs.studentCount,
            sections: [cfg.classId],
          })
        }
      })
    })
  })

  return [...poolMap.values()].sort((a, b) => b.totalStudents - a.totalStudents)
}

// ─── Check if two subjects are in same optional line ──────
export function inSameOptionalLine(
  sub1: string,
  sub2: string,
  config: ClassOptionalConfig
): boolean {
  return config.optionalLines.some(line =>
    line.subjects.includes(sub1) && line.subjects.includes(sub2)
  )
}

// ─── Get subject strength across all sections ─────────────
export function getSubjectStrength(
  subjectName: string,
  pools: SubjectPool[]
): number {
  return pools.find(p => p.subjectName === subjectName)?.totalStudents ?? 0
}
