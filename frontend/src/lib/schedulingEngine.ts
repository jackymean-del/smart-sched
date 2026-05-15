/**
 * Schedu Scheduling Engine
 * 
 * Implements CSP (Constraint Satisfaction Problem) solver in TypeScript.
 * This is the frontend JS equivalent of OR-Tools CP-SAT.
 * 
 * Supports:
 *   MODE 1 — Period-Based (weekly_periods given directly)
 *   MODE 2 — Duration-Based (convert total hours → weekly periods)
 * 
 * All scheduling data internally converts to:
 *   Class + Subject + WeeklyFrequency
 * before entering the constraint engine.
 */

import type { Section, Staff, Subject, Period, ClassTimetable, TeacherSchedule, Conflict, Suggestion, SchedulingRequirement } from '@/types'

// ─── Mode 2: Duration → Weekly Periods Formula ───────────
export interface DurationInput {
  subjectName: string
  className: string
  requiredHours: number    // total instructional hours needed
  periodDurationMins: number
  workingDaysPerYear: number
  workingDaysPerWeek: number
}

export function durationToWeeklyPeriods(input: DurationInput): number {
  const workingWeeks = input.workingDaysPerYear / input.workingDaysPerWeek
  const weekly = (input.requiredHours * 60) / (input.periodDurationMins * workingWeeks)
  return Math.round(weekly)
}


// ─── Hard Constraints ─────────────────────────────────────
export interface HardConstraint {
  type: 'teacher-clash' | 'room-clash' | 'weekly-frequency' | 'teacher-eligibility' | 'shift-boundary' | 'break' | 'daily-limit'
  description: string
}

// ─── Soft Constraints with Penalty Weights ────────────────
export interface SoftConstraint {
  type: string
  penaltyWeight: number
  description: string
}

export const DEFAULT_SOFT_CONSTRAINTS: SoftConstraint[] = [
  { type: 'teacher-gap',          penaltyWeight: 5,  description: 'Minimize free periods between classes for a teacher' },
  { type: 'teacher-overload',     penaltyWeight: 10, description: 'Avoid exceeding max weekly periods' },
  { type: 'consecutive-heavy',    penaltyWeight: 7,  description: 'Avoid consecutive heavy subjects (Maths after Maths)' },
  { type: 'last-period-overload', penaltyWeight: 4,  description: 'Avoid heavy subjects in last period' },
  { type: 'workload-imbalance',   penaltyWeight: 8,  description: 'Balance teacher workload evenly' },
  { type: 'subject-spread',       penaltyWeight: 6,  description: 'Distribute subjects evenly across week' },
]

// ─── CSP Solver ───────────────────────────────────────────
export interface SolverInput {
  sections: Section[]
  staff: Staff[]
  subjects: Subject[]
  periods: Period[]
  workDays: string[]
  requirements: SchedulingRequirement[]
  softConstraints?: SoftConstraint[]
}

export interface SolverOutput {
  classTT: ClassTimetable
  teacherTT: Record<string, TeacherSchedule>
  conflicts: Conflict[]
  penalties: { constraint: string; penalty: number; details: string }[]
  score: number       // lower = better (total penalty)
  iterations: number
}

// ─── Main Solver (JS CSP implementation) ─────────────────
export function solveTimetable(input: SolverInput): SolverOutput {
  const { sections, staff, subjects, periods, workDays } = input
  const classPeriods = periods.filter(p => p.type === 'class')
  const classTT: ClassTimetable = {}
  const penalties: SolverOutput['penalties'] = []
  
  // Initialize empty timetable
  sections.forEach(sec => {
    classTT[sec.name] = {}
    workDays.forEach(day => { classTT[sec.name][day] = {} })
  })

  // Build teacher availability map
  const teacherBusy: Record<string, Record<string, Set<string>>> = {}
  staff.forEach(st => {
    teacherBusy[st.name] = {}
    workDays.forEach(day => { teacherBusy[st.name][day] = new Set() })
  })

  // Build subject frequency tracker
  const subjectCount: Record<string, Record<string, number>> = {}
  sections.forEach(sec => {
    subjectCount[sec.name] = {}
    subjects.forEach(sub => { subjectCount[sec.name][sub.name] = 0 })
  })

  // Class teacher map — resolve IDs to names (UI stores staff.id, engine needs staff.name)
  const classTeacherMap: Record<string, string> = {}
  staff.forEach(st => { if (st.isClassTeacher) classTeacherMap[st.isClassTeacher] = st.name })
  sections.forEach(sec => {
    if (!sec.classTeacher) return
    // sec.classTeacher may be a staff ID or a staff name — resolve to name
    const resolved = staff.find(s => s.id === sec.classTeacher || s.name === sec.classTeacher)
    if (resolved) classTeacherMap[sec.name] = resolved.name
  })

  // Helper: ensure teacherBusy entry exists for a name (guards against dynamic additions)
  const ensureBusy = (name: string) => {
    if (!teacherBusy[name]) {
      teacherBusy[name] = Object.fromEntries(workDays.map(d => [d, new Set<string>()]))
    }
  }

  // ── Pass 1: Place class teachers in Period 1 (hard constraint) ──
  sections.forEach((sec) => {
    const ctName = classTeacherMap[sec.name]
    if (!ctName) return
    ensureBusy(ctName)
    const ctStaff = staff.find(s => s.name === ctName)
    // Pick a subject this teacher can actually teach for this section
    const ctRawSubs: string[] = ctStaff?.subjects ?? []
    const ctSubjectRaw = ctRawSubs.find(s =>
      s === `${sec.name}::${s.replace(/.*::/, '')}` ||   // section-specific
      (!s.includes('::'))                                  // or global
    ) ?? ctRawSubs[0] ?? subjects[0]?.name ?? ''
    const ctSubject = ctSubjectRaw.replace(/.*::/, '')

    workDays.forEach(day => {
      const p = classPeriods[0]
      if (!p) return
      if (!teacherBusy[ctName][day].has(p.id)) {
        classTT[sec.name][day][p.id] = {
          subject: ctSubject,
          teacher: ctName,
          room: sec.room,
          isClassTeacher: true,
        }
        teacherBusy[ctName][day].add(p.id)
        subjectCount[sec.name][ctSubject] = (subjectCount[sec.name][ctSubject] ?? 0) + 1
      }
    })
  })

  // ── Pass 2: Fill remaining periods with constraint checking ──
  sections.forEach((sec, si) => {
    // Get subjects for this section.
    // Empty sub.sections means "applies to all classes" — treat as universal.
    const sectionSubjects = subjects.filter(sub => {
      const secs = sub.sections ?? []
      return secs.length === 0 || secs.includes(sec.name)
    })
    if (!sectionSubjects.length) return

    // Sort subjects by weekly periods (highest first — greedy)
    const sorted = [...sectionSubjects].sort((a, b) => b.periodsPerWeek - a.periodsPerWeek)

    workDays.forEach((day, di) => {
      classPeriods.forEach((period, pi) => {
        if (pi === 0) return // already filled by class teacher pass

        // Skip if already filled
        if (classTT[sec.name][day][period.id]) return

        // Find best subject to place (rotating, respecting max per day)
        const availableSubs = sorted.filter(sub => {
          const weeklyDone = subjectCount[sec.name][sub.name] ?? 0
          const maxPD = (sub as any).maxPeriodsPerDay ?? 2
          // Check daily limit
          const todayCount = Object.values(classTT[sec.name][day] ?? {})
            .filter(cell => cell?.subject === sub.name).length
          return weeklyDone < sub.periodsPerWeek && todayCount < maxPD
        })

        if (!availableSubs.length) {
          // No subject fits — mark as free
          return
        }

        // Rotate subject selection to distribute evenly
        const subIdx = (si * 11 + di * 7 + pi * 3) % availableSubs.length
        const chosenSub = availableSubs[subIdx]

        // ── Teacher eligibility ───────────────────────────────
        // Priority 1: teacher explicitly assigned to this section+subject via matrix
        // Priority 2: teacher with grade-level assignment
        // Priority 3: teacher with global subject name
        // In all cases: hard constraint — teacher must not be already busy this slot

        const sectionKey = `${sec.name}::${chosenSub.name}`
        const gradeKey   = sec.grade ? `${sec.grade}::${chosenSub.name}` : ''
        const simpleKey  = chosenSub.name

        const isAvailable = (st: any) =>
          !teacherBusy[st.name]?.[day]?.has(period.id)

        const matchesSub = (st: any): boolean => {
          const subs: string[] = st.subjects ?? []
          if (!subs.length) return false
          // If this teacher has any section-specific assignments, use section/grade matching
          if (subs.some(s => s.includes('::'))) {
            return subs.some(s =>
              s === sectionKey ||
              (gradeKey !== '' && s === gradeKey)
            )
          }
          // Global subject name
          return subs.includes(simpleKey)
        }

        // Build candidate list: section-specific first, then global fallback
        let eligibleTeachers = staff.filter(st => matchesSub(st) && isAvailable(st))

        // Fallback: if no section-specific teacher available, use any teacher
        // who knows this subject globally and isn't busy
        if (!eligibleTeachers.length) {
          eligibleTeachers = staff.filter(st =>
            (st.subjects ?? []).includes(simpleKey) && isAvailable(st)
          )
        }
        // Last resort: any non-busy teacher at all (prevents empty slots when
        // teacher-subject links are incomplete)
        if (!eligibleTeachers.length) {
          eligibleTeachers = staff.filter(st => isAvailable(st))
        }

        // Soft constraint: prefer teacher with fewer periods today
        // Pre-compute teacher load counts for this day to avoid O(n²) sort
        const teacherLoadToday: Record<string, number> = {}
        Object.values(classTT).forEach(secData => {
          Object.values(secData[day] ?? {}).forEach(cell => {
            if (cell?.teacher) teacherLoadToday[cell.teacher] = (teacherLoadToday[cell.teacher] ?? 0) + 1
          })
        })
        const sortedTeachers = eligibleTeachers.sort((a, b) =>
          (teacherLoadToday[a.name] ?? 0) - (teacherLoadToday[b.name] ?? 0)
        )

        const teacher = sortedTeachers[0]
        if (!teacher) {
          // Soft penalty: no teacher available
          penalties.push({
            constraint: 'teacher-availability',
            penalty: 5,
            details: `No teacher for ${chosenSub.name} in ${sec.name} ${day} ${period.id}`,
          })
          return
        }

        // Soft constraint: avoid consecutive same subject
        const prevPeriod = classPeriods[pi - 1]
        if (prevPeriod && classTT[sec.name][day][prevPeriod.id]?.subject === chosenSub.name) {
          penalties.push({ constraint: 'consecutive-heavy', penalty: 7, details: `${chosenSub.name} consecutive in ${sec.name}` })
        }

        ensureBusy(teacher.name)
        classTT[sec.name][day][period.id] = {
          subject: chosenSub.name,
          teacher: teacher.name,
          room: sec.room,
        }
        teacherBusy[teacher.name][day].add(period.id)
        subjectCount[sec.name][chosenSub.name] = (subjectCount[sec.name][chosenSub.name] ?? 0) + 1
      })
    })
  })

  // ── Build Teacher Timetable ──
  const teacherTT: Record<string, TeacherSchedule> = {}
  staff.forEach(st => {
    teacherTT[st.name] = {
      classes: [...(st.classes ?? [])],
      subjects: [...(st.subjects ?? [])],
      schedule: Object.fromEntries(workDays.map(d => [d, {}])),
    }
  })

  Object.entries(classTT).forEach(([secName, secData]) => {
    Object.entries(secData).forEach(([day, dayData]) => {
      Object.entries(dayData).forEach(([periodId, cell]) => {
        if (!cell?.teacher) return
        if (!teacherTT[cell.teacher]) {
          teacherTT[cell.teacher] = { classes: [], subjects: [], schedule: Object.fromEntries(workDays.map(d => [d, {}])) }
        }
        const existing = teacherTT[cell.teacher].schedule[day]?.[periodId]
        if (existing) {
          existing.subject += ` / ${cell.subject}(${secName})`
          existing.conflict = true
        } else {
          teacherTT[cell.teacher].schedule[day][periodId] = {
            subject: `${cell.subject} (${secName})`,
            room: cell.room,
            sectionName: secName,
            isClassTeacher: cell.isClassTeacher,
          }
        }
      })
    })
  })

  // ── Detect Hard Conflicts ──
  const conflicts: Conflict[] = []
  classPeriods.forEach(p => {
    workDays.forEach(day => {
      const teacherMap: Record<string, string> = {}
      Object.entries(classTT).forEach(([sec, sd]) => {
        const cell = sd[day]?.[p.id]
        if (cell?.teacher) {
          if (teacherMap[cell.teacher]) {
            conflicts.push({
              type: 'double-booking',
              message: `${cell.teacher} double-booked: ${teacherMap[cell.teacher]} & ${sec} on ${day} ${p.name}`,
              teacher: cell.teacher, day, period: p.name,
            })
          } else teacherMap[cell.teacher] = sec
        }
      })
    })
  })

  const totalPenalty = penalties.reduce((a, p) => a + p.penalty, 0)

  return {
    classTT,
    teacherTT,
    conflicts,
    penalties,
    score: totalPenalty,
    iterations: sections.length * workDays.length * classPeriods.length,
  }
}

// ─── Auto Suggestions Engine ─────────────────────────────
// Suggestion type imported from @/types above

export function generateSuggestions(
  classTT: ClassTimetable,
  teacherTT: Record<string, TeacherSchedule>,
  staff: Staff[],
  subjects: Subject[],
  workDays: string[],
  periods: Period[]
): Suggestion[] {
  const suggestions: Suggestion[] = []
  const classPeriods = periods.filter(p => p.type === 'class')

  // Check workload imbalance
  staff.forEach(st => {
    const sched = teacherTT[st.name]?.schedule ?? {}
    const total = Object.values(sched).reduce((a, d) => a + Object.values(d).filter(x => x?.subject).length, 0)
    const max = st.maxPeriodsPerWeek
    if (total > max) {
      suggestions.push({ type: 'error', message: `${st.name} is overloaded: ${total}/${max} periods/week`, action: 'Reduce assignments' })
    } else if (total < max * 0.5 && total > 0) {
      suggestions.push({ type: 'info', message: `${st.name} is underutilized: ${total}/${max} periods/week`, action: 'Assign more classes' })
    }
  })

  // Check subject distribution
  Object.entries(classTT).forEach(([sec, secData]) => {
    subjects.forEach(sub => {
      let count = 0
      workDays.forEach(day => {
        count += Object.values(secData[day] ?? {}).filter(c => c?.subject === sub.name).length
      })
      if (count < sub.periodsPerWeek) {
        suggestions.push({ type: 'warning', message: `${sec}: ${sub.name} has ${count}/${sub.periodsPerWeek} periods placed`, action: 'Check teacher availability' })
      }
    })
  })

  return suggestions
}

// ─── Standalone Conflict Detector ────────────────────────
// Call this after any cell edit to keep the conflicts badge accurate.
// Derives workDays from the classTT keys so no extra parameter needed.
export function detectConflicts(
  classTT: ClassTimetable,
  periods: Period[]
): Conflict[] {
  const conflicts: Conflict[] = []
  const classPeriods = periods.filter(p => p.type === 'class')

  // Derive the full day set from the timetable itself
  const workDays = new Set<string>()
  Object.values(classTT).forEach(secData =>
    Object.keys(secData).forEach(d => workDays.add(d))
  )

  classPeriods.forEach(p => {
    workDays.forEach(day => {
      const teacherMap: Record<string, string> = {}
      Object.entries(classTT).forEach(([sec, sd]) => {
        const cell = sd[day]?.[p.id]
        if (cell?.teacher) {
          if (teacherMap[cell.teacher]) {
            conflicts.push({
              type: 'double-booking',
              message: `${cell.teacher} double-booked: ${teacherMap[cell.teacher]} & ${sec} on ${day} ${p.name}`,
              teacher: cell.teacher,
              day,
              period: p.name,
            })
          } else {
            teacherMap[cell.teacher] = sec
          }
        }
      })
    })
  })

  return conflicts
}

// ─── Re-optimization after drag/drop ─────────────────────
export function reoptimizeAfterSwap(
  classTT: ClassTimetable,
  sec1: string, day1: string, periodId1: string,
  sec2: string, day2: string, periodId2: string,
  staff: Staff[],
  workDays: string[]
): { classTT: ClassTimetable; conflicts: Conflict[]; valid: boolean } {
  const newTT = JSON.parse(JSON.stringify(classTT)) as ClassTimetable

  // Perform swap
  const cell1 = newTT[sec1]?.[day1]?.[periodId1]
  const cell2 = newTT[sec2]?.[day2]?.[periodId2]

  if (newTT[sec1]?.[day1] && newTT[sec2]?.[day2]) {
    newTT[sec1][day1][periodId1] = cell2
    newTT[sec2][day2][periodId2] = cell1
  }

  // Validate no teacher clash after swap
  const conflicts: Conflict[] = []
  const classPeriods = [periodId1, periodId2]

  classPeriods.forEach(pid => {
    ;[day1, day2].forEach(day => {
      const teacherMap: Record<string, string> = {}
      Object.entries(newTT).forEach(([sec, sd]) => {
        const cell = sd[day]?.[pid]
        if (cell?.teacher) {
          if (teacherMap[cell.teacher]) {
            conflicts.push({
              type: 'double-booking',
              message: `Teacher clash after swap: ${cell.teacher}`,
              teacher: cell.teacher, day,
            })
          } else teacherMap[cell.teacher] = sec
        }
      })
    })
  })

  return { classTT: newTT, conflicts, valid: conflicts.length === 0 }
}
