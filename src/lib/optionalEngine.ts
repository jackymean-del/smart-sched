/**
 * Optional Subject Scheduling Engine
 * For XI-XII classes with floating optional subjects.
 *
 * Flow (aligned with Schedu master document):
 *  1. User defines optional lines in the Academic Matrix (mutually exclusive groups)
 *  2. Engine generates all valid combinations (cartesian product of lines)
 *  3. Coordinator enters per-combination student counts (section_subject_strengths)
 *  4. Engine derives InstructionalClusters and SubjectPools
 *  5. Engine generates ParallelBlocks so optional subjects run simultaneously
 *  6. Scheduler fills SessionInstances using cluster + parallel block constraints
 */

import type {
  ClassOptionalConfig,
  OptionalCombination,
  SubjectPool,
  CombinationStrength,
  InstructionalCluster,
  ParallelBlock,
  SectionSubjectStrength,
  AcademicCombination,
  SubjectExpression,
} from '@/types'
import { parseSubjectExpression } from '@/types'

// ─────────────────────────────────────────────────────────────
// COMBINATION GENERATION
// ─────────────────────────────────────────────────────────────

/** Generate all valid subject combinations via cartesian product of optional lines. */
export function generateCombinations(config: ClassOptionalConfig): OptionalCombination[] {
  if (!config.optionalLines.length) return []

  const cartesian = (lines: string[][]): string[][] => {
    if (lines.length === 0) return [[]]
    const [first, ...rest] = lines
    const restProduct = cartesian(rest)
    return first.flatMap(item => restProduct.map(combo => [item, ...combo]))
  }

  const lineSubjects = config.optionalLines.map(l => l.subjects.filter(s => s.trim()))
  const validLines = lineSubjects.filter(l => l.length > 0)
  if (!validLines.length) return []

  return cartesian(validLines).map((subjects, i) => ({
    id: `combo-${config.classId}-${i}`,
    subjects,
    label: subjects.join(' + '),
  }))
}

// ─────────────────────────────────────────────────────────────
// STRENGTH VALIDATION
// ─────────────────────────────────────────────────────────────

/** Validate that combination student counts sum to the class total strength. */
export function validateStrengths(
  config: ClassOptionalConfig,
  combinations: OptionalCombination[]
): { valid: boolean; message: string; total: number } {
  const strengths = config.combinationStrengths.filter(s => s.sectionId === config.classId)
  const total = strengths.reduce((a, s) => a + (s.studentCount || 0), 0)

  if (total === 0) return { valid: false, message: 'No strengths entered yet', total }
  if (total !== config.totalStudents) {
    const diff = Math.abs(total - config.totalStudents)
    return {
      valid: false,
      message: `Total ${total} ≠ class strength ${config.totalStudents} (difference: ${diff})`,
      total,
    }
  }
  return { valid: true, message: `${total} students = class strength ✓`, total }
}

// ─────────────────────────────────────────────────────────────
// SUBJECT POOL DERIVATION
// ─────────────────────────────────────────────────────────────

/**
 * Derive SubjectPools from multiple class optional configs.
 * A pool aggregates all students across sections who take the same subject.
 * Used to estimate teacher demand and room requirements.
 */
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

// ─────────────────────────────────────────────────────────────
// INSTRUCTIONAL CLUSTER GENERATION
// ─────────────────────────────────────────────────────────────

/**
 * Generate InstructionalClusters from a class optional config.
 * Each cluster = one subject × one class = one teaching group.
 * e.g. "XI-C Maths" cluster with 20 students.
 */
export function generateClusters(
  config: ClassOptionalConfig,
  combinations: OptionalCombination[],
  sessionId: string
): InstructionalCluster[] {
  const subjectStudentMap = new Map<string, number>()

  config.combinationStrengths.forEach(cs => {
    const combo = combinations.find(c => c.id === cs.combinationId)
    if (!combo || !cs.studentCount) return
    combo.subjects.forEach(subject => {
      subjectStudentMap.set(subject, (subjectStudentMap.get(subject) ?? 0) + cs.studentCount)
    })
  })

  return [...subjectStudentMap.entries()].map(([subjectName, count], i) => ({
    id: `cluster-${config.classId}-${i}`,
    classId: config.classId,
    subjectId: subjectName,       // resolved to actual subject ID in the store
    clusterName: `${config.classId} ${subjectName}`,
    studentCount: count,
    parallelBlockId: null,
  }))
}

// ─────────────────────────────────────────────────────────────
// PARALLEL BLOCK GENERATION
// ─────────────────────────────────────────────────────────────

/**
 * Generate ParallelBlocks from a set of optional lines.
 * All subjects in an optional line must run at the SAME time (parallel).
 * Students self-select into one cluster per block.
 *
 * Example:
 *   Line A: [Maths, Biology]         → ParallelBlock A
 *   Line B: [PED, Painting, NONE]    → ParallelBlock B
 */
export function generateParallelBlocks(
  config: ClassOptionalConfig,
  grade: string,
  stream: string
): ParallelBlock[] {
  return config.optionalLines.map((line, i) => ({
    id: `block-${config.classId}-${i}`,
    name: `${grade} ${line.name}`,
    grade,
    stream,
    subjectIds: line.subjects.filter(s => s.trim()),
  }))
}

// ─────────────────────────────────────────────────────────────
// SECTION SUBJECT STRENGTH EXTRACTION
// ─────────────────────────────────────────────────────────────

/**
 * Convert ClassOptionalConfig into SectionSubjectStrength records.
 * These are stored in the DB and drive the scheduler.
 */
export function extractStrengths(
  config: ClassOptionalConfig,
  combinations: OptionalCombination[],
  categoryId: string
): SectionSubjectStrength[] {
  const subjectStudentMap = new Map<string, number>()

  config.combinationStrengths.forEach(cs => {
    const combo = combinations.find(c => c.id === cs.combinationId)
    if (!combo || !cs.studentCount) return
    combo.subjects.forEach(subject => {
      subjectStudentMap.set(subject, (subjectStudentMap.get(subject) ?? 0) + cs.studentCount)
    })
  })

  return [...subjectStudentMap.entries()].map(([subjectId, count], i) => ({
    id: `strength-${config.classId}-${i}`,
    classId: config.classId,
    subjectId,
    categoryId,
    studentCount: count,
  }))
}

// ─────────────────────────────────────────────────────────────
// ACADEMIC COMBINATION MATRIX HELPERS
// ─────────────────────────────────────────────────────────────

/**
 * Derive the common subjects across all combination groups.
 * Common subjects can be scheduled as shared sessions (same teacher, all students).
 * This reduces teacher load, room usage, and scheduling complexity.
 */
export function extractCommonSubjects(combinations: AcademicCombination[]): string[] {
  if (!combinations.length) return []

  const allSubjectSets = combinations.map(combo =>
    new Set(
      combo.subjectSlots.flatMap(slot => {
        const expr = slot.expression
        if (expr.type === 'AND') return expr.subjects
        return []  // OR/NONE subjects are NOT common
      })
    )
  )

  // Intersection of all sets
  const [first, ...rest] = allSubjectSets
  const common = [...first].filter(s => rest.every(set => set.has(s)))
  return common
}

/**
 * Derive optional (non-common) subjects that require parallel block scheduling.
 */
export function extractOptionalSubjects(combinations: AcademicCombination[]): string[][] {
  const orGroups: string[][] = []

  combinations.forEach(combo => {
    combo.subjectSlots.forEach(slot => {
      if (slot.expression.type === 'OR') {
        const subjects = slot.expression.subjects
        const existing = orGroups.find(g =>
          g.length === subjects.length && subjects.every(s => g.includes(s))
        )
        if (!existing) orGroups.push(subjects)
      }
    })
  })

  return orGroups
}

// ─────────────────────────────────────────────────────────────
// UTILITY HELPERS
// ─────────────────────────────────────────────────────────────

/** Check if two subjects belong to the same optional line (mutually exclusive). */
export function inSameOptionalLine(
  sub1: string,
  sub2: string,
  config: ClassOptionalConfig
): boolean {
  return config.optionalLines.some(line =>
    line.subjects.includes(sub1) && line.subjects.includes(sub2)
  )
}

/** Get a subject's total student count across all pools. */
export function getSubjectStrength(subjectName: string, pools: SubjectPool[]): number {
  return pools.find(p => p.subjectName === subjectName)?.totalStudents ?? 0
}

/** Estimate teachers needed for a subject given its total load and teacher capacity. */
export function estimateTeachersRequired(
  totalWeeklyPeriods: number,
  maxPeriodsPerTeacher: number
): number {
  return Math.ceil(totalWeeklyPeriods / maxPeriodsPerTeacher)
}
