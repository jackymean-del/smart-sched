import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type {
  Section, Staff, Subject, Period,
  ClassTimetable, TeacherSchedule, WizardConfig, Conflict,
} from '@/types'

interface TimetableState {
  step: number
  config: WizardConfig
  sections: Section[]
  staff: Staff[]
  subjects: Subject[]
  breaks: Period[]
  periods: Period[]
  classTT: ClassTimetable
  teacherTT: Record<string, TeacherSchedule>
  substitutions: Record<string, string>
  conflicts: Conflict[]
  viewTab: 'class' | 'teacher'
  transposed: boolean
  showTeacher: boolean
  showRoom: boolean
  editMode: boolean
  sidebarTab: 'legend' | 'staff' | 'shifts'
  setStep: (n: number) => void
  setConfig: (c: Partial<WizardConfig>) => void
  setSections: (s: Section[]) => void
  setStaff: (s: Staff[]) => void
  setSubjects: (s: Subject[]) => void
  setBreaks: (b: Period[]) => void
  setPeriods: (p: Period[]) => void
  setClassTT: (tt: ClassTimetable) => void
  setTeacherTT: (tt: Record<string, TeacherSchedule>) => void
  setSubstitutions: (s: Record<string, string>) => void
  setConflicts: (c: Conflict[]) => void
  setViewTab: (t: 'class' | 'teacher') => void
  setTransposed: (v: boolean) => void
  setShowTeacher: (v: boolean) => void
  setShowRoom: (v: boolean) => void
  setEditMode: (v: boolean) => void
  setSidebarTab: (t: 'legend' | 'staff' | 'shifts') => void
  togglePeriodShiftable: (periodId: string) => void
  updateCell: (section: string, day: string, periodId: string, cell: Partial<import('@/types').TimetableCell>) => void
  resetWizard: () => void
}

const defaultConfig: WizardConfig = {
  orgType: null,
  countryCode: null,
  timeFormat: '12h',
  workDays: ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY'],
  startTime: '09:00',
  endTime: '16:00',
  numStaff: 12,
  numSections: 8,
  numSubjects: 8,
  periodsPerDay: 8,
  numBreaks: 4,
}

export const useTimetableStore = create<TimetableState>()(
  devtools(
    persist(
      (set) => ({
        step: 1,
        config: defaultConfig,
        sections: [],
        staff: [],
        subjects: [],
        breaks: [],
        periods: [],
        classTT: {},
        teacherTT: {},
        substitutions: {},
        conflicts: [],
        viewTab: 'class',
        transposed: false,
        showTeacher: true,
        showRoom: false,
        editMode: false,
        sidebarTab: 'legend',

        setStep: (n) => set({ step: n }),
        setConfig: (c) => set((s) => ({ config: { ...s.config, ...c } })),
        setSections: (sections) => set({ sections }),
        setStaff: (staff) => set({ staff }),
        setSubjects: (subjects) => set({ subjects }),
        setBreaks: (breaks) => set({ breaks }),
        setPeriods: (periods) => set({ periods }),
        setClassTT: (classTT) => set({ classTT }),
        setTeacherTT: (teacherTT) => set({ teacherTT }),
        setSubstitutions: (substitutions) => set({ substitutions }),
        setConflicts: (conflicts) => set({ conflicts }),
        setViewTab: (viewTab) => set({ viewTab }),
        setTransposed: (transposed) => set({ transposed }),
        setShowTeacher: (showTeacher) => set({ showTeacher }),
        setShowRoom: (showRoom) => set({ showRoom }),
        setEditMode: (editMode) => set({ editMode }),
        setSidebarTab: (sidebarTab) => set({ sidebarTab }),

        togglePeriodShiftable: (periodId) => set((s) => ({
          periods: s.periods.map(p =>
            p.id === periodId ? { ...p, shiftable: !p.shiftable } : p
          ),
        })),

        updateCell: (section, day, periodId, cell) => set((s) => ({
          classTT: {
            ...s.classTT,
            [section]: {
              ...s.classTT[section],
              [day]: {
                ...s.classTT[section]?.[day],
                [periodId]: { ...s.classTT[section]?.[day]?.[periodId], ...cell } as import('@/types').TimetableCell,
              },
            },
          },
        })),

        resetWizard: () => set({
          step: 1, config: defaultConfig,
          sections: [], staff: [], subjects: [], breaks: [], periods: [],
          classTT: {}, teacherTT: {}, substitutions: {}, conflicts: [],
        }),
      }),
      {
        name: 'schedu-wizard', // localStorage key
        partialize: (state) => ({
          // Only persist wizard data, not UI state
          step: state.step,
          config: state.config,
          sections: state.sections,
          staff: state.staff,
          subjects: state.subjects,
          breaks: state.breaks,
          periods: state.periods,
          classTT: state.classTT,
          teacherTT: state.teacherTT,
        }),
      }
    ),
    { name: 'schedu' }
  )
)
