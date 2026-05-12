import { z } from 'zod'

// ─── Org Types ───────────────────────────────────────────
export type OrgType = 'school' | 'college' | 'corporate' | 'hospital' | 'ngo' | 'factory'

export const OrgTypeSchema = z.enum(['school','college','corporate','hospital','ngo','factory'])

// ─── Section / Class ─────────────────────────────────────
export const SectionSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  room: z.string(),
  grade: z.string(),
  classTeacher: z.string().optional(),
})
export type Section = z.infer<typeof SectionSchema>

// ─── Staff ───────────────────────────────────────────────
export const StaffSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  role: z.string(),
  subjects: z.array(z.string()),
  classes: z.array(z.string()),
  isClassTeacher: z.string().optional(),
  maxPeriodsPerWeek: z.number().int().positive(),
})
export type Staff = z.infer<typeof StaffSchema>

// ─── Subject ─────────────────────────────────────────────
export const SubjectSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  periodsPerWeek: z.number().int().positive(),
  color: z.string(),
  sections: z.array(z.string()),
})
export type Subject = z.infer<typeof SubjectSchema>

// ─── Period / Break ──────────────────────────────────────
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

// ─── Cell ────────────────────────────────────────────────
export interface TimetableCell {
  subject: string
  teacher: string
  room: string
  isClassTeacher?: boolean
  isSubstituted?: boolean
  substituteTeacher?: string
}

// ─── Timetable ───────────────────────────────────────────
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

// ─── Country ─────────────────────────────────────────────
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

// ─── Config ──────────────────────────────────────────────
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
}

// ─── Conflict ────────────────────────────────────────────
export interface Conflict {
  type: 'double-booking' | 'overload' | 'missing-ct'
  message: string
  teacher?: string
  day?: string
  period?: string
}
