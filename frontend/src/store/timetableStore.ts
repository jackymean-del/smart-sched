import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type {
  // Core Schedu model
  Organization,
  AcademicSession,
  SchedulingProfile,
  SchoolClass,
  Subject,
  SubjectCategory,
  Teacher,
  Classroom,
  Student,
  SectionSubjectStrength,
  StudentSubjectSelection,
  InstructionalCluster,
  ParallelBlock,
  BellSchedule,
  TimeSlot,
  Shift,
  SessionInstance,
  AcademicCombination,
  MatrixColumn,
  SubjectRule,
  PeriodAllocationResult,
  TeacherRequirementResult,
  TimetableHealthScore,
  TimetableStatus,
  ProfileType,

  // Timetable output
  ClassTimetable,
  TeacherSchedule,
  TimetableCell,
  Conflict,
  Suggestion,

  // Wizard
  WizardConfig,

  // Optional engine
  ClassOptionalConfig,
  SubjectPool,
  OptionalCombination,

  // Legacy (used by existing wizard + engine)
  Section,
  Staff,
  Period,
  Room,
  TeacherPool,
  Facility,
  ParticipantPool,
} from '@/types'
import { defaultWizardConfig } from '@/types'

// ─────────────────────────────────────────────────────────────
// STATE SHAPE
// ─────────────────────────────────────────────────────────────

interface ScheduState {
  // ── Wizard nav ──────────────────────────────────────────────
  step: number

  // ── Wizard config (setup flow) ──────────────────────────────
  config: WizardConfig

  // ════════════════════════════════════════════════════════════
  //  SCHEDU MODEL — Full institutional data
  // ════════════════════════════════════════════════════════════

  // Layer 1: Resource Engine
  organization: Organization | null
  academicSession: AcademicSession | null
  schedulingProfiles: SchedulingProfile[]
  classes: SchoolClass[]
  subjects: Subject[]
  subjectCategories: SubjectCategory[]
  teachers: Teacher[]
  classrooms: Classroom[]
  students: Student[]

  // Layer 2: Academic Engine
  sectionSubjectStrengths: SectionSubjectStrength[]
  studentSubjectSelections: StudentSubjectSelection[]
  periodAllocations: PeriodAllocationResult[]
  teacherRequirements: TeacherRequirementResult[]
  subjectRules: SubjectRule[]
  matrixColumns: MatrixColumn[]
  academicCombinations: AcademicCombination[]

  // Layer 3: Dynamic Scheduling Engine
  instructionalClusters: InstructionalCluster[]
  parallelBlocks: ParallelBlock[]
  bellSchedule: BellSchedule | null
  timeSlots: TimeSlot[]

  // Layer 4: Timetable Output
  sessionInstances: SessionInstance[]
  timetableStatus: TimetableStatus
  timetableHealthScore: TimetableHealthScore | null

  // ── View state ───────────────────────────────────────────────
  viewTab: 'class' | 'teacher' | 'room' | 'student'
  transposed: boolean
  showTeacher: boolean
  showRoom: boolean
  editMode: boolean
  sidebarTab: 'legend' | 'staff' | 'shifts' | 'health' | 'pools'

  // ════════════════════════════════════════════════════════════
  //  LEGACY STATE — for existing wizard and scheduling engine
  //  (backed by old types; kept until full migration)
  // ════════════════════════════════════════════════════════════
  sections: Section[]
  staff: Staff[]
  breaks: Period[]
  periods: Period[]
  classTT: ClassTimetable
  teacherTT: Record<string, TeacherSchedule>
  substitutions: Record<string, string>
  conflicts: Conflict[]
  suggestions: Suggestion[]
  participantPools: ParticipantPool[]
  facilities: Facility[]
  teacherPools: TeacherPool[]
  rooms: Room[]
  optionalConfigs: ClassOptionalConfig[]
  subjectPools: SubjectPool[]
  schedulingMode: 'period-based' | 'duration-based'
  workingDaysPerYear: number

  // ─────────────────────────────────────────────────────────────
  //  ACTIONS — Schedu model
  // ─────────────────────────────────────────────────────────────
  setStep: (n: number) => void
  setConfig: (c: Partial<WizardConfig>) => void

  setOrganization: (o: Organization | null) => void
  setAcademicSession: (s: AcademicSession | null) => void
  setSchedulingProfiles: (p: SchedulingProfile[]) => void
  upsertSchedulingProfile: (p: SchedulingProfile) => void

  setClasses: (c: SchoolClass[]) => void
  upsertClass: (c: SchoolClass) => void
  removeClass: (id: string) => void

  setSubjects: (s: Subject[]) => void
  upsertSubject: (s: Subject) => void
  removeSubject: (id: string) => void

  setSubjectCategories: (c: SubjectCategory[]) => void

  setTeachers: (t: Teacher[]) => void
  upsertTeacher: (t: Teacher) => void
  removeTeacher: (id: string) => void

  setClassrooms: (r: Classroom[]) => void
  upsertClassroom: (r: Classroom) => void
  removeClassroom: (id: string) => void

  setStudents: (s: Student[]) => void
  upsertStudent: (s: Student) => void

  setSectionSubjectStrengths: (s: SectionSubjectStrength[]) => void
  upsertStrength: (s: SectionSubjectStrength) => void
  removeStrength: (id: string) => void

  setStudentSubjectSelections: (s: StudentSubjectSelection[]) => void

  setPeriodAllocations: (p: PeriodAllocationResult[]) => void
  setTeacherRequirements: (r: TeacherRequirementResult[]) => void
  setSubjectRules: (r: SubjectRule[]) => void
  setMatrixColumns: (c: MatrixColumn[]) => void
  setAcademicCombinations: (c: AcademicCombination[]) => void
  upsertAcademicCombination: (c: AcademicCombination) => void
  removeAcademicCombination: (id: string) => void

  setInstructionalClusters: (c: InstructionalCluster[]) => void
  upsertCluster: (c: InstructionalCluster) => void

  setParallelBlocks: (b: ParallelBlock[]) => void
  upsertParallelBlock: (b: ParallelBlock) => void

  setBellSchedule: (b: BellSchedule | null) => void
  setTimeSlots: (t: TimeSlot[]) => void

  setSessionInstances: (s: SessionInstance[]) => void
  setTimetableStatus: (s: TimetableStatus) => void
  setTimetableHealthScore: (h: TimetableHealthScore | null) => void

  setViewTab: (t: 'class' | 'teacher' | 'room' | 'student') => void
  setTransposed: (v: boolean) => void
  setShowTeacher: (v: boolean) => void
  setShowRoom: (v: boolean) => void
  setEditMode: (v: boolean) => void
  setSidebarTab: (t: 'legend' | 'staff' | 'shifts' | 'health' | 'pools') => void

  // ── Legacy actions (for old wizard) ─────────────────────────
  setSections: (s: Section[]) => void
  setLegacySubjects: (s: Subject[]) => void
  setStaff: (s: Staff[]) => void
  setBreaks: (b: Period[]) => void
  setPeriods: (p: Period[]) => void
  setClassTT: (tt: ClassTimetable) => void
  setTeacherTT: (tt: Record<string, TeacherSchedule>) => void
  setSubstitutions: (s: Record<string, string>) => void
  setConflicts: (c: Conflict[]) => void
  setSuggestions: (s: Suggestion[]) => void
  setParticipantPools: (p: ParticipantPool[]) => void
  setFacilities: (f: Facility[]) => void
  setTeacherPools: (p: TeacherPool[]) => void
  setRooms: (r: Room[]) => void
  setOptionalConfigs: (c: ClassOptionalConfig[]) => void
  setSubjectPools: (p: SubjectPool[]) => void
  setSchedulingMode: (m: 'period-based' | 'duration-based') => void
  setWorkingDaysPerYear: (n: number) => void

  togglePeriodShiftable: (periodId: string) => void
  updateCell: (section: string, day: string, periodId: string, cell: Partial<TimetableCell>) => void

  resetWizard: () => void
  resetAll: () => void
}

// ─────────────────────────────────────────────────────────────
// INITIAL STATE
// ─────────────────────────────────────────────────────────────

const initialState: Omit<ScheduState,
  | 'setStep' | 'setConfig'
  | 'setOrganization' | 'setAcademicSession' | 'setSchedulingProfiles' | 'upsertSchedulingProfile'
  | 'setClasses' | 'upsertClass' | 'removeClass'
  | 'setSubjects' | 'upsertSubject' | 'removeSubject'
  | 'setSubjectCategories'
  | 'setTeachers' | 'upsertTeacher' | 'removeTeacher'
  | 'setClassrooms' | 'upsertClassroom' | 'removeClassroom'
  | 'setStudents' | 'upsertStudent'
  | 'setSectionSubjectStrengths' | 'upsertStrength' | 'removeStrength'
  | 'setStudentSubjectSelections'
  | 'setPeriodAllocations' | 'setTeacherRequirements' | 'setSubjectRules'
  | 'setMatrixColumns' | 'setAcademicCombinations' | 'upsertAcademicCombination' | 'removeAcademicCombination'
  | 'setInstructionalClusters' | 'upsertCluster'
  | 'setParallelBlocks' | 'upsertParallelBlock'
  | 'setBellSchedule' | 'setTimeSlots'
  | 'setSessionInstances' | 'setTimetableStatus' | 'setTimetableHealthScore'
  | 'setViewTab' | 'setTransposed' | 'setShowTeacher' | 'setShowRoom' | 'setEditMode' | 'setSidebarTab'
  | 'setSections' | 'setLegacySubjects' | 'setStaff' | 'setBreaks' | 'setPeriods'
  | 'setClassTT' | 'setTeacherTT' | 'setSubstitutions' | 'setConflicts' | 'setSuggestions'
  | 'setParticipantPools' | 'setFacilities' | 'setTeacherPools' | 'setRooms'
  | 'setOptionalConfigs' | 'setSubjectPools' | 'setSchedulingMode' | 'setWorkingDaysPerYear'
  | 'togglePeriodShiftable' | 'updateCell'
  | 'resetWizard' | 'resetAll'
> = {
  step: 1,
  config: defaultWizardConfig,

  // Schedu model
  organization: null,
  academicSession: null,
  schedulingProfiles: [],
  classes: [],
  subjects: [],
  subjectCategories: [],
  teachers: [],
  classrooms: [],
  students: [],
  sectionSubjectStrengths: [],
  studentSubjectSelections: [],
  periodAllocations: [],
  teacherRequirements: [],
  subjectRules: [],
  matrixColumns: [],
  academicCombinations: [],
  instructionalClusters: [],
  parallelBlocks: [],
  bellSchedule: null,
  timeSlots: [],
  sessionInstances: [],
  timetableStatus: 'draft',
  timetableHealthScore: null,

  // View state
  viewTab: 'class',
  transposed: false,
  showTeacher: true,
  showRoom: false,
  editMode: false,
  sidebarTab: 'legend',

  // Legacy
  sections: [],
  staff: [],
  breaks: [],
  periods: [],
  classTT: {},
  teacherTT: {},
  substitutions: {},
  conflicts: [],
  suggestions: [],
  participantPools: [],
  facilities: [],
  teacherPools: [],
  rooms: [],
  optionalConfigs: [],
  subjectPools: [],
  schedulingMode: 'period-based',
  workingDaysPerYear: 220,
}

// ─────────────────────────────────────────────────────────────
// STORE
// ─────────────────────────────────────────────────────────────

export const useTimetableStore = create<ScheduState>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        // ── Wizard nav ───────────────────────────────────────
        setStep: (n) => set({ step: n }),
        setConfig: (c) => set((s) => ({ config: { ...s.config, ...c } })),

        // ── Organization & Session ───────────────────────────
        setOrganization: (organization) => set({ organization }),
        setAcademicSession: (academicSession) => set({ academicSession }),

        setSchedulingProfiles: (schedulingProfiles) => set({ schedulingProfiles }),
        upsertSchedulingProfile: (p) => set((s) => ({
          schedulingProfiles: s.schedulingProfiles.some(x => x.id === p.id)
            ? s.schedulingProfiles.map(x => x.id === p.id ? p : x)
            : [...s.schedulingProfiles, p],
        })),

        // ── Classes ──────────────────────────────────────────
        setClasses: (classes) => set({ classes }),
        upsertClass: (c) => set((s) => ({
          classes: s.classes.some(x => x.id === c.id)
            ? s.classes.map(x => x.id === c.id ? c : x)
            : [...s.classes, c],
        })),
        removeClass: (id) => set((s) => ({ classes: s.classes.filter(x => x.id !== id) })),

        // ── Subjects ─────────────────────────────────────────
        setSubjects: (subjects) => set({ subjects }),
        upsertSubject: (sub) => set((s) => ({
          subjects: s.subjects.some(x => x.id === sub.id)
            ? s.subjects.map(x => x.id === sub.id ? sub : x)
            : [...s.subjects, sub],
        })),
        removeSubject: (id) => set((s) => ({ subjects: s.subjects.filter(x => x.id !== id) })),

        setSubjectCategories: (subjectCategories) => set({ subjectCategories }),

        // ── Teachers ─────────────────────────────────────────
        setTeachers: (teachers) => set({ teachers }),
        upsertTeacher: (t) => set((s) => ({
          teachers: s.teachers.some(x => x.id === t.id)
            ? s.teachers.map(x => x.id === t.id ? t : x)
            : [...s.teachers, t],
        })),
        removeTeacher: (id) => set((s) => ({ teachers: s.teachers.filter(x => x.id !== id) })),

        // ── Classrooms ───────────────────────────────────────
        setClassrooms: (classrooms) => set({ classrooms }),
        upsertClassroom: (r) => set((s) => ({
          classrooms: s.classrooms.some(x => x.id === r.id)
            ? s.classrooms.map(x => x.id === r.id ? r : x)
            : [...s.classrooms, r],
        })),
        removeClassroom: (id) => set((s) => ({ classrooms: s.classrooms.filter(x => x.id !== id) })),

        // ── Students ─────────────────────────────────────────
        setStudents: (students) => set({ students }),
        upsertStudent: (s) => set((st) => ({
          students: st.students.some(x => x.id === s.id)
            ? st.students.map(x => x.id === s.id ? s : x)
            : [...st.students, s],
        })),

        // ── Strengths ────────────────────────────────────────
        setSectionSubjectStrengths: (sectionSubjectStrengths) => set({ sectionSubjectStrengths }),
        upsertStrength: (s) => set((st) => ({
          sectionSubjectStrengths: st.sectionSubjectStrengths.some(x => x.id === s.id)
            ? st.sectionSubjectStrengths.map(x => x.id === s.id ? s : x)
            : [...st.sectionSubjectStrengths, s],
        })),
        removeStrength: (id) => set((s) => ({
          sectionSubjectStrengths: s.sectionSubjectStrengths.filter(x => x.id !== id),
        })),

        setStudentSubjectSelections: (studentSubjectSelections) => set({ studentSubjectSelections }),

        // ── Academic Engine ───────────────────────────────────
        setPeriodAllocations: (periodAllocations) => set({ periodAllocations }),
        setTeacherRequirements: (teacherRequirements) => set({ teacherRequirements }),
        setSubjectRules: (subjectRules) => set({ subjectRules }),
        setMatrixColumns: (matrixColumns) => set({ matrixColumns }),

        setAcademicCombinations: (academicCombinations) => set({ academicCombinations }),
        upsertAcademicCombination: (c) => set((s) => ({
          academicCombinations: s.academicCombinations.some(x => x.id === c.id)
            ? s.academicCombinations.map(x => x.id === c.id ? c : x)
            : [...s.academicCombinations, c],
        })),
        removeAcademicCombination: (id) => set((s) => ({
          academicCombinations: s.academicCombinations.filter(x => x.id !== id),
        })),

        // ── Clusters & Blocks ────────────────────────────────
        setInstructionalClusters: (instructionalClusters) => set({ instructionalClusters }),
        upsertCluster: (c) => set((s) => ({
          instructionalClusters: s.instructionalClusters.some(x => x.id === c.id)
            ? s.instructionalClusters.map(x => x.id === c.id ? c : x)
            : [...s.instructionalClusters, c],
        })),

        setParallelBlocks: (parallelBlocks) => set({ parallelBlocks }),
        upsertParallelBlock: (b) => set((s) => ({
          parallelBlocks: s.parallelBlocks.some(x => x.id === b.id)
            ? s.parallelBlocks.map(x => x.id === b.id ? b : x)
            : [...s.parallelBlocks, b],
        })),

        // ── Bell Schedule & Slots ────────────────────────────
        setBellSchedule: (bellSchedule) => set({ bellSchedule }),
        setTimeSlots: (timeSlots) => set({ timeSlots }),

        // ── Timetable Output ─────────────────────────────────
        setSessionInstances: (sessionInstances) => set({ sessionInstances }),
        setTimetableStatus: (timetableStatus) => set({ timetableStatus }),
        setTimetableHealthScore: (timetableHealthScore) => set({ timetableHealthScore }),

        // ── View state ───────────────────────────────────────
        setViewTab: (viewTab) => set({ viewTab }),
        setTransposed: (transposed) => set({ transposed }),
        setShowTeacher: (showTeacher) => set({ showTeacher }),
        setShowRoom: (showRoom) => set({ showRoom }),
        setEditMode: (editMode) => set({ editMode }),
        setSidebarTab: (sidebarTab) => set({ sidebarTab }),

        // ── Legacy setters ───────────────────────────────────
        setSections: (sections) => set({ sections }),
        setLegacySubjects: (subjects) => set({ subjects }),
        setStaff: (staff) => set({ staff }),
        setBreaks: (breaks) => set({ breaks }),
        setPeriods: (periods) => set({ periods }),
        setClassTT: (classTT) => set({ classTT }),
        setTeacherTT: (teacherTT) => set({ teacherTT }),
        setSubstitutions: (substitutions) => set({ substitutions }),
        setConflicts: (conflicts) => set({ conflicts }),
        setSuggestions: (suggestions) => set({ suggestions }),
        setParticipantPools: (participantPools) => set({ participantPools }),
        setFacilities: (facilities) => set({ facilities }),
        setTeacherPools: (teacherPools) => set({ teacherPools }),
        setRooms: (rooms) => set({ rooms }),
        setOptionalConfigs: (optionalConfigs) => set({ optionalConfigs }),
        setSubjectPools: (subjectPools) => set({ subjectPools }),
        setSchedulingMode: (schedulingMode) => set({ schedulingMode }),
        setWorkingDaysPerYear: (workingDaysPerYear) => set({ workingDaysPerYear }),

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
                [periodId]: {
                  ...s.classTT[section]?.[day]?.[periodId],
                  ...cell,
                } as TimetableCell,
              },
            },
          },
        })),

        resetWizard: () => set({
          step: 1,
          config: defaultWizardConfig,
          sections: [], staff: [], breaks: [], periods: [],
          classTT: {}, teacherTT: {}, substitutions: {}, conflicts: [],
          suggestions: [], optionalConfigs: [], subjectPools: [],
        }),

        resetAll: () => set({ ...initialState }),
      }),
      {
        name: 'schedu-v3',
        merge: (persisted: unknown, current: ScheduState): ScheduState => {
          const p = persisted as Partial<ScheduState> | null
          return {
            ...current,
            ...p,
            config: {
              ...current.config,
              ...(p?.config ?? {}),
              shifts: p?.config?.shifts ?? [],
              defaultSessionDuration: p?.config?.defaultSessionDuration ?? 45,
            },
          }
        },
        partialize: (state) => ({
          // Persist all wizard + model data, exclude transient UI state
          step: state.step,
          config: state.config,
          organization: state.organization,
          academicSession: state.academicSession,
          schedulingProfiles: state.schedulingProfiles,
          classes: state.classes,
          subjects: state.subjects,
          subjectCategories: state.subjectCategories,
          teachers: state.teachers,
          classrooms: state.classrooms,
          students: state.students,
          sectionSubjectStrengths: state.sectionSubjectStrengths,
          studentSubjectSelections: state.studentSubjectSelections,
          periodAllocations: state.periodAllocations,
          teacherRequirements: state.teacherRequirements,
          subjectRules: state.subjectRules,
          matrixColumns: state.matrixColumns,
          academicCombinations: state.academicCombinations,
          instructionalClusters: state.instructionalClusters,
          parallelBlocks: state.parallelBlocks,
          bellSchedule: state.bellSchedule,
          timeSlots: state.timeSlots,
          sessionInstances: state.sessionInstances,
          timetableStatus: state.timetableStatus,
          // Legacy
          sections: state.sections,
          staff: state.staff,
          breaks: state.breaks,
          periods: state.periods,
          classTT: state.classTT,
          teacherTT: state.teacherTT,
          participantPools: state.participantPools,
          facilities: state.facilities,
          teacherPools: state.teacherPools,
          rooms: state.rooms,
          optionalConfigs: state.optionalConfigs,
          subjectPools: state.subjectPools,
          schedulingMode: state.schedulingMode,
          workingDaysPerYear: state.workingDaysPerYear,
        }),
      }
    ),
    { name: 'schedu' }
  )
)
