import { z } from 'zod'

export type OrgType = 'school' | 'college' | 'corporate' | 'hospital' | 'ngo' | 'factory'
export const OrgTypeSchema = z.enum(['school','college','corporate','hospital','ngo','factory'])

export const SectionSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  room: z.string(),
  grade: z.string(),
  classTeacher: z.string().optional().default(''),
  shiftId: z.string().optional(), // which shift this class belongs to
})
export type Section = z.infer<typeof SectionSchema>

export const StaffSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  role: z.string(),
  subjects: z.array(z.string()),
  classes: z.array(z.string()),
  isClassTeacher: z.string().default(''),
  maxPeriodsPerWeek: z.number().int().positive(),
})
export type Staff = z.infer<typeof StaffSchema>

// ── Subject with class-wise settings ──
export interface SubjectClassConfig {
  sectionName: string      // e.g. "Nursery" or "I" (base class)
  periodsPerWeek: number
  maxPeriodsPerDay: number // max slots per day for this subject in this class
  sessionDuration: number  // minutes per period
}

export const SubjectSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  periodsPerWeek: z.number().int().positive(),
  sessionDuration: z.number().default(40),
  maxPeriodsPerDay: z.number().default(2),
  color: z.string(),
  sections: z.array(z.string()),
  classConfigs: z.array(z.object({
    sectionName: z.string(),
    periodsPerWeek: z.number(),
    maxPeriodsPerDay: z.number(),
    sessionDuration: z.number(),
  })).default([]),
})
export type Subject = {
  id: string
  name: string
  periodsPerWeek: number
  sessionDuration: number   // always 40 by default
  maxPeriodsPerDay: number  // always 2 by default
  color: string
  sections: string[]
  classConfigs: { sectionName: string; periodsPerWeek: number; maxPeriodsPerDay: number; sessionDuration: number }[]
}

export const PeriodTypeSchema = z.enum(['class', 'fixed-start', 'break', 'lunch', 'fixed-end'])
export type PeriodType = z.infer<typeof PeriodTypeSchema>

export const PeriodSchema = z.object({
  id: z.string(),
  name: z.string(),
  duration: z.number().int().positive(),
  type: PeriodTypeSchema,
  shiftable: z.boolean(),
})
export type Period = z.infer<typeof PeriodSchema>

// ── Shift: a named start/end time block ──
export interface Shift {
  id: string
  name: string        // e.g. "Morning Shift", "Afternoon Shift"
  startTime: string   // "09:00"
  endTime: string     // "13:30"
  assignedClasses: string[] // base class names assigned to this shift
}

export interface TimetableCell {
  subject: string
  teacher: string
  room: string
  isClassTeacher?: boolean
  isSubstituted?: boolean
  substituteTeacher?: string
}

export interface ClassTimetable {
  [sectionName: string]: {
    [day: string]: {
      [periodId: string]: TimetableCell
    }
  }
}

export interface TeacherSchedule {
  classes: string[]
  subjects: string[]
  schedule: {
    [day: string]: {
      [periodId: string]: {
        subject: string
        room: string
        sectionName: string
        isClassTeacher?: boolean
        conflict?: boolean
      }
    }
  }
}

export interface Country {
  code: string
  flag: string
  name: string
  subtitle: string
  standard: string
  maxPeriodsWeek: number
  maxPeriodsDay: number
  firstNames: string[]
  lastNames: string[]
  titles: string[]
  grades: string[]
  sections: string[]
  subjects: string[]
  breaks: string[]
  roomPrefix: string
  roomStart: number
}

export interface WizardConfig {
  orgType: OrgType | null
  countryCode: string | null
  timeFormat: '12h' | '24h'
  workDays: string[]
  startTime: string
  endTime: string
  numStaff: number
  numSections: number
  numSubjects: number
  periodsPerDay: number
  numBreaks: number
  shifts: Shift[]           // multiple shifts support
  defaultSessionDuration: number // global default minutes per period
}

export interface Conflict {
  type: 'double-booking' | 'overload' | 'missing-ct'
  message: string
  teacher?: string
  day?: string
  period?: string
}

// ─── Teacher Pool ─────────────────────────────────────────
export interface TeacherPool {
  id: string
  name: string              // "Primary Maths Teachers"
  subjectName: string
  gradeRangeStart: number   // 1
  gradeRangeEnd: number     // 5
  teacherCount: number
  maxPeriodsPerWeek: number
  teachers: GeneratedTeacher[]
}

export interface GeneratedTeacher {
  id: string
  generatedName: string     // "Primary Maths Teacher 1" (auto)
  actualName: string        // editable by user
  poolId: string
  assignedClasses: string[]
}

// ─── Room ─────────────────────────────────────────────────
export interface Room {
  id: string
  generatedName: string     // "Room 1" (auto)
  actualName: string        // editable
  roomType: 'classroom' | 'lab' | 'hall' | 'gym' | 'other'
  capacity: number
  shiftId?: string
}

// ─── Scheduling Requirement (internal universal format) ───
export interface SchedulingRequirement {
  classId: string
  subjectId: string
  weeklyPeriods: number
  maxPeriodsPerDay: number
  sessionDuration: number
  mode: 'period-based' | 'duration-based'
  requiredHours?: number    // Mode 2 only
}

// ─── Suggestion from engine ───────────────────────────────
export interface Suggestion {
  type: 'warning' | 'info' | 'error'
  message: string
  action?: string
}

// ─── Participant Pool (Spec §3.1 participant_pools) ───────
export interface ParticipantPool {
  id: string
  name: string                 // "Primary Maths Pool"
  resourceName: string         // Subject/Task this pool teaches
  gradeRangeStart: number      // eligible from grade (1)
  gradeRangeEnd: number        // eligible to grade (5)
  participantCount: number     // auto-generates N participants
  maxSessionsPerWeek: number   // workload cap per participant
  generatedParticipants: GeneratedParticipant[]
}

export interface GeneratedParticipant {
  id: string
  generatedName: string        // "Primary Maths Teacher 1" (auto)
  actualName: string           // editable by user
  poolId: string
}

// ─── Facility (Spec §3.1 facilities) ─────────────────────
export interface Facility {
  id: string
  generatedName: string        // "Room 1", "Lab 1" (auto)
  actualName: string           // editable
  facilityType: 'classroom' | 'lab' | 'hall' | 'gym' | 'other'
  capacity?: number
  shiftId?: string
}

// ─── Optional Subject System (XI-XII Advanced Scheduling) ─

export interface OptionalLine {
  id: string
  name: string           // "Optional Line A", "Optional Line B"
  subjects: string[]     // subject names in this line (mutually exclusive)
}

export interface OptionalCombination {
  id: string
  // One subject from each line, e.g. ["Maths", "PED"]
  subjects: string[]
  label: string          // "Maths + PED"
}

export interface CombinationStrength {
  sectionId: string
  combinationId: string
  studentCount: number
}

export interface SubjectPool {
  subjectName: string
  totalStudents: number
  sections: string[]     // which sections contribute to this pool
  assignedRoom?: string
  assignedTeacher?: string
}

export interface ClassOptionalConfig {
  classId: string        // section name e.g. "XI-C"
  hasOptionals: boolean
  totalStudents: number
  optionalLines: OptionalLine[]
  combinations: OptionalCombination[]
  combinationStrengths: CombinationStrength[]
}
