/// <reference types="vite/client" />
import axios from 'axios'
import type {
  Organization, AcademicSession, SchedulingProfile,
  SchoolClass, Subject, Teacher, Classroom, Student,
  SectionSubjectStrength, InstructionalCluster, ParallelBlock,
  BellSchedule, SessionInstance, AcademicCombination, SubjectRule,
  PeriodAllocationResult, TeacherRequirementResult,
  TimetableStatus, WizardConfig,
} from '@/types'

// ─────────────────────────────────────────────────────────────
// AXIOS INSTANCE
// ─────────────────────────────────────────────────────────────

export const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('auth_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ─────────────────────────────────────────────────────────────
// ORGANIZATION & SESSION
// ─────────────────────────────────────────────────────────────

export const orgApi = {
  get:    ()                         => apiClient.get<Organization>('/org'),
  upsert: (data: Partial<Organization>) => apiClient.put('/org', data),
}

export const sessionApi = {
  list:   ()                              => apiClient.get<AcademicSession[]>('/sessions'),
  get:    (id: string)                    => apiClient.get<AcademicSession>(`/sessions/${id}`),
  create: (data: Omit<AcademicSession, 'id'>) => apiClient.post<AcademicSession>('/sessions', data),
  update: (id: string, data: Partial<AcademicSession>) => apiClient.put(`/sessions/${id}`, data),
  delete: (id: string)                    => apiClient.delete(`/sessions/${id}`),
}

export const profileApi = {
  list:   (sessionId?: string) => apiClient.get<SchedulingProfile[]>('/profiles', { params: { sessionId } }),
  upsert: (data: SchedulingProfile) => apiClient.post('/profiles', data),
  delete: (id: string)         => apiClient.delete(`/profiles/${id}`),
}

// ─────────────────────────────────────────────────────────────
// RESOURCE ENGINE
// ─────────────────────────────────────────────────────────────

export const classApi = {
  list:   (sessionId: string)                        => apiClient.get<SchoolClass[]>('/classes', { params: { sessionId } }),
  create: (data: Omit<SchoolClass, 'id'>)            => apiClient.post<SchoolClass>('/classes', data),
  update: (id: string, data: Partial<SchoolClass>)   => apiClient.put(`/classes/${id}`, data),
  delete: (id: string)                               => apiClient.delete(`/classes/${id}`),
  bulkCreate: (rows: Omit<SchoolClass, 'id'>[])      => apiClient.post('/classes/bulk', rows),
}

export const subjectApi = {
  list:   ()                                         => apiClient.get<Subject[]>('/subjects'),
  create: (data: Omit<Subject, 'id'>)                => apiClient.post<Subject>('/subjects', data),
  update: (id: string, data: Partial<Subject>)       => apiClient.put(`/subjects/${id}`, data),
  delete: (id: string)                               => apiClient.delete(`/subjects/${id}`),
  bulkCreate: (rows: Omit<Subject, 'id'>[])          => apiClient.post('/subjects/bulk', rows),
}

export const teacherApi = {
  list:   ()                                         => apiClient.get<Teacher[]>('/teachers'),
  create: (data: Omit<Teacher, 'id'>)                => apiClient.post<Teacher>('/teachers', data),
  update: (id: string, data: Partial<Teacher>)       => apiClient.put(`/teachers/${id}`, data),
  delete: (id: string)                               => apiClient.delete(`/teachers/${id}`),
  bulkCreate: (rows: Omit<Teacher, 'id'>[])          => apiClient.post('/teachers/bulk', rows),
  requirements: (sessionId: string)                  => apiClient.get<TeacherRequirementResult[]>('/teachers/requirements', { params: { sessionId } }),
}

export const classroomApi = {
  list:   ()                                         => apiClient.get<Classroom[]>('/classrooms'),
  create: (data: Omit<Classroom, 'id'>)              => apiClient.post<Classroom>('/classrooms', data),
  update: (id: string, data: Partial<Classroom>)     => apiClient.put(`/classrooms/${id}`, data),
  delete: (id: string)                               => apiClient.delete(`/classrooms/${id}`),
  bulkCreate: (rows: Omit<Classroom, 'id'>[])        => apiClient.post('/classrooms/bulk', rows),
}

export const studentApi = {
  list:   (classId: string)                          => apiClient.get<Student[]>('/students', { params: { classId } }),
  create: (data: Omit<Student, 'id'>)                => apiClient.post<Student>('/students', data),
  bulkCreate: (rows: Omit<Student, 'id'>[])          => apiClient.post('/students/bulk', rows),
  delete: (id: string)                               => apiClient.delete(`/students/${id}`),
}

// ─────────────────────────────────────────────────────────────
// ACADEMIC ENGINE
// ─────────────────────────────────────────────────────────────

export const strengthApi = {
  list:   (classId: string)                          => apiClient.get<SectionSubjectStrength[]>('/strengths', { params: { classId } }),
  upsert: (data: SectionSubjectStrength)             => apiClient.post('/strengths', data),
  bulkUpsert: (rows: SectionSubjectStrength[])       => apiClient.post('/strengths/bulk', rows),
  delete: (id: string)                               => apiClient.delete(`/strengths/${id}`),
}

export const combinationApi = {
  list:   (sessionId: string)                        => apiClient.get<AcademicCombination[]>('/combinations', { params: { sessionId } }),
  upsert: (data: AcademicCombination)                => apiClient.post('/combinations', data),
  delete: (id: string)                               => apiClient.delete(`/combinations/${id}`),
}

export const periodAllocationApi = {
  generate: (sessionId: string)                      => apiClient.post<PeriodAllocationResult[]>('/period-allocation/generate', { sessionId }),
  list:     (sessionId: string)                      => apiClient.get<PeriodAllocationResult[]>('/period-allocation', { params: { sessionId } }),
}

export const subjectRuleApi = {
  list:   ()                                         => apiClient.get<SubjectRule[]>('/subject-rules'),
  upsert: (data: SubjectRule)                        => apiClient.post('/subject-rules', data),
}

// ─────────────────────────────────────────────────────────────
// DYNAMIC SCHEDULING ENGINE
// ─────────────────────────────────────────────────────────────

export const clusterApi = {
  list:     (sessionId: string)                      => apiClient.get<InstructionalCluster[]>('/clusters', { params: { sessionId } }),
  generate: (sessionId: string)                      => apiClient.post<InstructionalCluster[]>('/clusters/generate', { sessionId }),
  upsert:   (data: InstructionalCluster)             => apiClient.post('/clusters', data),
  delete:   (id: string)                             => apiClient.delete(`/clusters/${id}`),
}

export const parallelBlockApi = {
  list:     (sessionId: string)                      => apiClient.get<ParallelBlock[]>('/parallel-blocks', { params: { sessionId } }),
  generate: (sessionId: string)                      => apiClient.post<ParallelBlock[]>('/parallel-blocks/generate', { sessionId }),
  upsert:   (data: ParallelBlock)                    => apiClient.post('/parallel-blocks', data),
  delete:   (id: string)                             => apiClient.delete(`/parallel-blocks/${id}`),
}

export const bellScheduleApi = {
  get:    ()                                         => apiClient.get<BellSchedule>('/bell-schedule'),
  upsert: (data: Partial<BellSchedule>)              => apiClient.post('/bell-schedule', data),
}

// ─────────────────────────────────────────────────────────────
// TIMETABLE GENERATION & VIEWS
// ─────────────────────────────────────────────────────────────

export const schedulerApi = {
  generate:  (data: { sessionId: string; config?: WizardConfig }) =>
    apiClient.post('/scheduler/generate', data),
  status:    (jobId: string) =>
    apiClient.get<{ status: TimetableStatus; progress?: number }>(`/scheduler/status/${jobId}`),
  cancel:    (jobId: string) =>
    apiClient.delete(`/scheduler/jobs/${jobId}`),
}

export const timetableApi = {
  list:           ()                               => apiClient.get('/timetables'),
  get:            (id: string)                     => apiClient.get(`/timetables/${id}`),
  create:         (data: unknown)                  => apiClient.post('/timetables', data),
  update:         (id: string, data: unknown)      => apiClient.put(`/timetables/${id}`, data),
  delete:         (id: string)                     => apiClient.delete(`/timetables/${id}`),
  publish:        (id: string)                     => apiClient.post(`/timetables/${id}/publish`),
  lock:           (id: string)                     => apiClient.post(`/timetables/${id}/lock`),
  unlock:         (id: string)                     => apiClient.post(`/timetables/${id}/unlock`),
  versions:       (id: string)                     => apiClient.get(`/timetables/${id}/versions`),
  restoreVersion: (id: string, version: number)    => apiClient.post(`/timetables/${id}/restore`, { version }),
  health:         (id: string)                     => apiClient.get(`/timetables/${id}/health`),
  export:         (id: string, format: 'xlsx' | 'pdf' | 'csv') =>
    apiClient.post(`/timetables/${id}/export`, { format }, { responseType: 'blob' }),
}

export const timetableViewApi = {
  byClass:   (sessionId: string, classId: string)   => apiClient.get(`/timetable/class/${classId}`, { params: { sessionId } }),
  byTeacher: (sessionId: string, teacherId: string) => apiClient.get(`/timetable/teacher/${teacherId}`, { params: { sessionId } }),
  byRoom:    (sessionId: string, roomId: string)    => apiClient.get(`/timetable/room/${roomId}`, { params: { sessionId } }),
  byStudent: (sessionId: string, studentId: string) => apiClient.get(`/timetable/student/${studentId}`, { params: { sessionId } }),
}

// ─────────────────────────────────────────────────────────────
// SUBSTITUTION ENGINE
// ─────────────────────────────────────────────────────────────

export const substitutionApi = {
  suggest:   (timetableId: string, teacherId: string, date: string, periodIds: string[]) =>
    apiClient.post(`/timetables/${timetableId}/substitute/suggest`, { teacherId, date, periodIds }),
  apply:     (timetableId: string, data: unknown) =>
    apiClient.post(`/timetables/${timetableId}/substitute`, data),
  history:   (timetableId: string) =>
    apiClient.get(`/timetables/${timetableId}/substitutions`),
}

// ─────────────────────────────────────────────────────────────
// ORG CONFIG (country/board standards)
// ─────────────────────────────────────────────────────────────

export const configApi = {
  orgConfig:  ()              => apiClient.get('/org-config'),
  health:     ()              => apiClient.get('/health'),
}
