/**
 * Step — Resources
 *
 * Four entity tabs, all using the unified <DataGrid>:
 *   Classes (Sections) · Subjects · Teachers · Rooms
 *
 * Each entity supports:
 *   - Inline editing, paste, bulk fill, CSV import/export, transpose
 *   - Per-row Scope authoring (the new schedU Scope System)
 *
 * Philosophy: ask users the minimum. The AI infers teacher-subject
 * assignments and per-class period overrides from the strength matrix
 * later — no more 2-axis assignment grids here.
 */

import { useState, useEffect, useMemo } from 'react'
import { useTimetableStore } from '@/store/timetableStore'
import {
  generateSections, generateStaff, generateSubjects, generateBreaks,
  GRADE_GROUP_GRADES,
} from '@/lib/orgData'
import type { Subject, Section, Staff, ScopeMatrix } from '@/types'
import { DataGrid, DataGridColumn } from '@/components/DataGrid/DataGrid'
import { ScopeMatrixModal } from '@/components/DataGrid/ScopeMatrixModal'
import {
  Users, BookOpen, Building2, GraduationCap, RefreshCw, ArrowRight,
} from 'lucide-react'

type Tab = 'classes' | 'subjects' | 'teachers' | 'rooms'

interface RoomRow {
  id: string
  name: string
  type: string
  capacity: number
  building: string
  floor: string
  scope?: ScopeMatrix
}

const SUBJECT_CATS = ['Core', 'Language', 'Elective', 'Optional', 'Lab', 'CCA', 'Activity', 'Other']
const ROOM_TYPES   = ['Classroom', 'Lab', 'Computer Lab', 'Library', 'Hall', 'Gym', 'Staff Room', 'Other']
const ROLES        = ['Teacher', 'HoD', 'Coordinator', 'Principal', 'Vice Principal', 'Counsellor', 'Lab Incharge', 'Librarian']
const GENDERS      = ['', 'female', 'male', 'other']
const STREAMS      = ['', 'Science', 'Commerce', 'Humanities', 'General']

const CBSE_PW: Record<string, number> = {
  Mathematics: 6, English: 5, Hindi: 5, Science: 6, 'Social Studies': 5,
  Computer: 3, 'Physical Education': 3, 'Art & Craft': 2, Music: 2, Dance: 2,
  EVS: 4, 'G.K.': 1, CCA: 2, Odia: 4,
}
const suggestPW = (name: string) => CBSE_PW[name] ?? 4
function makeId() { return Math.random().toString(36).slice(2, 8) }

export function StepResources() {
  const store = useTimetableStore() as any
  const {
    config, sections, staff, subjects, rooms: storedRooms,
    setSections, setStaff, setBreaks, setRooms: setStoredRooms,
  } = store
  const setSubjects = store.setSubjects ?? store.setLegacySubjects

  const [tab, setTab] = useState<Tab>('classes')

  // Local rooms state (kept locally for now; mirrored to store on demand)
  const [rooms, setRooms] = useState<RoomRow[]>(() => {
    if (Array.isArray(storedRooms) && storedRooms.length > 0) {
      return storedRooms.map((r: any) => ({
        id: r.id ?? makeId(),
        name: r.actualName ?? r.name ?? r.generatedName ?? 'Room',
        type: r.roomType ?? r.type ?? 'Classroom',
        capacity: r.capacity ?? 40,
        building: r.building ?? 'Main Block',
        floor: r.floor ?? 'Ground',
        scope: r.scope,
      }))
    }
    return (sections.length > 0 ? sections : []).map((s: any, i: number) => ({
      id: makeId(), name: s.room ?? `Room ${101 + i}`,
      type: 'Classroom', capacity: 40, building: 'Main Block', floor: 'Ground',
    }))
  })

  // Scope modal target
  const [scopeTarget, setScopeTarget] = useState<{ kind: string; entity: any } | null>(null)
  const workDays: string[] = config?.workDays ?? ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
  const periods = store.periods ?? []

  // ─── Regenerate all ───
  const regenAll = () => {
    const o = config.orgType ?? 'school'
    const c = config.countryCode ?? 'IN'
    const gradeGroups = config.gradeGroups?.length ? config.gradeGroups : undefined
    const newSections = generateSections(o, c, config.numSections, gradeGroups)
    setSections(newSections)
    setStaff(generateStaff(o, c, config.numStaff))
    setSubjects(generateSubjects(o, c, config.numSubjects, gradeGroups) as Subject[])
    setBreaks(generateBreaks(o, config.numBreaks))
    setRooms(newSections.map((s: any, i: number) => ({
      id: makeId(), name: s.room ?? `Room ${101 + i}`,
      type: 'Classroom', capacity: 40, building: 'Main Block', floor: 'Ground',
    })))
  }

  // Auto-generate on first load if needed
  useEffect(() => {
    const countsMismatch =
      sections.length !== config.numSections ||
      staff.length    !== config.numStaff    ||
      subjects.length !== config.numSubjects
    const gg = config.gradeGroups?.length ? config.gradeGroups : null
    const validGrades = gg ? new Set(gg.flatMap((g: any) => GRADE_GROUP_GRADES[g] ?? [])) : null
    const gradesMismatch = validGrades && sections.some((s: any) => s.grade && !validGrades.has(s.grade))
    const staffNamesStale = staff.length > 0 && staff.some((s: any) => !/^.+\s\d+$/.test(s.name))
    if (sections.length === 0 || countsMismatch || gradesMismatch || staffNamesStale) regenAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Mirror rooms to store on changes
  useEffect(() => {
    if (setStoredRooms) {
      setStoredRooms(rooms.map(r => ({
        id: r.id, generatedName: r.name, actualName: r.name,
        roomType: (r.type.toLowerCase().replace(/ /g, '-') as any) || 'classroom',
        capacity: r.capacity, scope: r.scope,
      })))
    }
  }, [rooms])

  const TABS: { key: Tab; label: string; icon: React.ReactNode; count: number }[] = [
    { key: 'classes',  label: 'Classes',  icon: <GraduationCap size={14} />, count: sections.length },
    { key: 'subjects', label: 'Subjects', icon: <BookOpen      size={14} />, count: subjects.length },
    { key: 'teachers', label: 'Teachers', icon: <Users         size={14} />, count: staff.length },
    { key: 'rooms',    label: 'Rooms',    icon: <Building2     size={14} />, count: rooms.length },
  ]

  return (
    <div style={{ padding: 24, maxWidth: 1280, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: '#EDE9FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Users size={20} color="#7C6FE0" />
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: '#13111E', margin: 0, lineHeight: 1.1 }}>
            Resources
          </h2>
          <div style={{ fontSize: 12, color: '#4B5275', marginTop: 3 }}>
            Classes, Subjects, Teachers, Rooms — all editable like a spreadsheet.
          </div>
        </div>
        <button onClick={regenAll}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 13px', borderRadius: 8, border: '1px solid #ECEAFB', background: '#fff', color: '#7C6FE0', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
          <RefreshCw size={13} /> Regenerate all
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 14,
        background: '#F8F7FF', padding: 4, borderRadius: 10,
      }}>
        {TABS.map(t => {
          const active = tab === t.key
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{
                flex: '0 1 auto', padding: '7px 14px', borderRadius: 7,
                border: 'none', background: active ? '#fff' : 'transparent',
                color: active ? '#13111E' : '#4B5275',
                fontSize: 12, fontWeight: 700, cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 7,
                boxShadow: active ? '0 1px 3px rgba(124,111,224,0.15)' : 'none',
              }}>
              <span style={{ color: active ? '#7C6FE0' : '#8B87AD' }}>{t.icon}</span>
              {t.label}
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 10,
                background: active ? '#EDE9FF' : '#fff', color: '#7C6FE0',
              }}>{t.count}</span>
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      {tab === 'classes'  && <ClassesGrid  sections={sections} setSections={setSections} staff={staff} onScope={(s) => setScopeTarget({ kind: 'Section', entity: s })} />}
      {tab === 'subjects' && <SubjectsGrid subjects={subjects} setSubjects={setSubjects} onScope={(s) => setScopeTarget({ kind: 'Subject', entity: s })} />}
      {tab === 'teachers' && <TeachersGrid staff={staff} setStaff={setStaff} sections={sections} subjects={subjects} onScope={(t) => setScopeTarget({ kind: 'Teacher', entity: t })} />}
      {tab === 'rooms'    && <RoomsGrid    rooms={rooms} setRooms={setRooms} onScope={(r) => setScopeTarget({ kind: 'Room', entity: r })} />}

      {/* Scope modal */}
      {scopeTarget && (
        <ScopeMatrixModal
          entityName={scopeTarget.entity.name ?? scopeTarget.entity.actualName ?? '—'}
          entityKind={scopeTarget.kind}
          scope={scopeTarget.entity.scope}
          workDays={workDays}
          periods={periods}
          onSave={(nextScope) => {
            const k = scopeTarget.kind
            if (k === 'Section') {
              setSections(sections.map((s: Section) => s.id === scopeTarget.entity.id ? { ...s, scope: nextScope } : s))
            } else if (k === 'Subject') {
              setSubjects(subjects.map((s: Subject) => s.id === scopeTarget.entity.id ? { ...s, scope: nextScope } : s))
            } else if (k === 'Teacher') {
              setStaff(staff.map((t: Staff) => t.id === scopeTarget.entity.id ? { ...t, scope: nextScope } : t))
            } else if (k === 'Room') {
              setRooms(rooms.map(r => r.id === scopeTarget.entity.id ? { ...r, scope: nextScope } : r))
            }
          }}
          onClose={() => setScopeTarget(null)}
        />
      )}

      {/* Continue */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
        <button onClick={() => store.setStep((store.step ?? 3) + 1)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: 9, border: 'none', background: '#7C6FE0', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          Continue to Strengths <ArrowRight size={14} />
        </button>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════
// CLASSES GRID
// ═════════════════════════════════════════════════════════════
function ClassesGrid({ sections, setSections, staff, onScope }: {
  sections: Section[]; setSections: (s: Section[]) => void; staff: Staff[]; onScope: (s: Section) => void;
}) {
  const staffOptions = useMemo(() => ['', ...staff.map((s: any) => s.name)], [staff])
  const columns: DataGridColumn<Section>[] = [
    { key: 'name',  label: 'Section',       type: 'text',   sticky: true, width: 120 },
    { key: 'grade', label: 'Grade',         type: 'text',   width: 100 },
    { key: 'room',  label: 'Home Room',     type: 'text',   width: 110 },
    { key: 'stream', label: 'Stream',       type: 'select', options: STREAMS, width: 130,
      getValue: (r) => (r as any).stream ?? '',
      setValue: (r, v) => ({ ...r, stream: v }) as any },
    { key: 'classTeacher', label: 'Class Teacher', type: 'select', options: staffOptions, width: 180 },
  ]
  return (
    <DataGrid<Section>
      title="Classes & Sections"
      description="One row per section. Stream is optional for Grade XI-XII."
      icon={<GraduationCap size={16} />}
      columns={columns}
      rows={sections}
      rowKey={(r) => r.id}
      onChange={setSections}
      onScope={onScope}
      newRow={() => ({
        id: makeId(), name: `Section ${sections.length + 1}`,
        room: `Room ${101 + sections.length}`, grade: '', classTeacher: '',
      } as Section)}
      toolbar={{ add: true, importCSV: true, exportCSV: true, paste: true, search: true, transpose: true, bulkActions: true }}
    />
  )
}

// ═════════════════════════════════════════════════════════════
// SUBJECTS GRID
// ═════════════════════════════════════════════════════════════
function SubjectsGrid({ subjects, setSubjects, onScope }: {
  subjects: Subject[]; setSubjects: (s: Subject[]) => void; onScope: (s: Subject) => void;
}) {
  const columns: DataGridColumn<Subject>[] = [
    { key: 'name',     label: 'Subject',       type: 'text',   sticky: true, width: 160 },
    { key: 'shortName',label: 'Short',         type: 'text',   width: 80 },
    { key: 'category', label: 'Category',      type: 'select', options: SUBJECT_CATS, width: 130 },
    { key: 'periodsPerWeek', label: 'Per/Wk',  type: 'number', width: 90, align: 'right' },
    { key: 'sessionDuration',label: 'Duration',type: 'number', width: 90, align: 'right' },
    { key: 'maxPeriodsPerDay',label: 'Max/Day',type: 'number', width: 90, align: 'right' },
    {
      key: 'isOptional', label: 'Optional', type: 'badge', width: 90, align: 'center',
      getValue: (r) => r.isOptional ? 'Yes' : '—',
      setValue: (r, v) => ({ ...r, isOptional: v === 'Yes' || v === true }),
      badgeColor: (v) => v === 'Yes'
        ? { bg: '#FEF3C7', fg: '#92400E', border: '#FDE68A' }
        : { bg: '#F8F7FF', fg: '#B0B0C0', border: '#ECEAFB' },
    },
    {
      key: 'requiresLab', label: 'Lab', type: 'badge', width: 80, align: 'center',
      getValue: (r) => r.requiresLab ? 'Yes' : '—',
      setValue: (r, v) => ({ ...r, requiresLab: v === 'Yes' || v === true }),
      badgeColor: (v) => v === 'Yes'
        ? { bg: '#DBEAFE', fg: '#1E40AF', border: '#BFDBFE' }
        : { bg: '#F8F7FF', fg: '#B0B0C0', border: '#ECEAFB' },
    },
  ]
  return (
    <DataGrid<Subject>
      title="Subjects"
      description="Core, optional, lab — toggle as needed. AI uses these flags to plan."
      icon={<BookOpen size={16} />}
      columns={columns}
      rows={subjects}
      rowKey={(r) => r.id}
      onChange={setSubjects}
      onScope={onScope}
      newRow={() => ({
        id: makeId(), name: `Subject ${subjects.length + 1}`,
        shortName: `S${subjects.length + 1}`, category: 'Core',
        periodsPerWeek: 4, sessionDuration: 45, maxPeriodsPerDay: 2,
        isOptional: false, requiresLab: false, color: '#7C6FE0',
        sections: [], classConfigs: [],
      } as Subject)}
      toolbar={{ add: true, importCSV: true, exportCSV: true, paste: true, search: true, transpose: true, bulkActions: true }}
    />
  )
}

// ═════════════════════════════════════════════════════════════
// TEACHERS GRID
// ═════════════════════════════════════════════════════════════
function TeachersGrid({ staff, setStaff, sections, subjects, onScope }: {
  staff: Staff[]; setStaff: (s: Staff[]) => void; sections: Section[]; subjects: Subject[]; onScope: (t: Staff) => void;
}) {
  const sectionOptions = useMemo(() => ['', ...sections.map((s: any) => s.name)], [sections])
  const columns: DataGridColumn<Staff>[] = [
    { key: 'name',     label: 'Teacher',      type: 'text',   sticky: true, width: 160 },
    { key: 'role',     label: 'Role',         type: 'select', options: ROLES, width: 140 },
    {
      key: 'subjects', label: 'Subjects',     type: 'text',   width: 240,
      getValue: (r) => (r.subjects ?? []).join(', '),
      setValue: (r, v) => ({
        ...r,
        subjects: String(v ?? '').split(',').map(s => s.trim()).filter(Boolean),
      }),
      placeholder: 'Math, English, ...',
    },
    {
      key: 'maxPeriodsPerWeek', label: 'Max/Wk', type: 'number', width: 90, align: 'right',
    },
    { key: 'gender',         label: 'Gender',     type: 'select', options: GENDERS, width: 100 },
    {
      key: 'isClassTeacher', label: 'CT of',     type: 'select', options: sectionOptions, width: 120,
      getValue: (r) => r.isClassTeacher ?? '',
      setValue: (r, v) => ({ ...r, isClassTeacher: v ?? '' }),
    },
  ]
  return (
    <DataGrid<Staff>
      title="Teachers"
      description="Subjects = comma-separated list. Click Scope to set per-teacher availability."
      icon={<Users size={16} />}
      columns={columns}
      rows={staff}
      rowKey={(r) => r.id}
      onChange={setStaff}
      onScope={onScope}
      newRow={() => ({
        id: makeId(), name: `Teacher ${staff.length + 1}`,
        role: 'Teacher', subjects: [], classes: [],
        isClassTeacher: '', maxPeriodsPerWeek: 30,
      } as Staff)}
      toolbar={{ add: true, importCSV: true, exportCSV: true, paste: true, search: true, transpose: true, bulkActions: true }}
    />
  )
}

// ═════════════════════════════════════════════════════════════
// ROOMS GRID
// ═════════════════════════════════════════════════════════════
function RoomsGrid({ rooms, setRooms, onScope }: {
  rooms: RoomRow[]; setRooms: (r: RoomRow[]) => void; onScope: (r: RoomRow) => void;
}) {
  const columns: DataGridColumn<RoomRow>[] = [
    { key: 'name',     label: 'Room',        type: 'text',   sticky: true, width: 140 },
    { key: 'type',     label: 'Type',        type: 'select', options: ROOM_TYPES, width: 140 },
    { key: 'capacity', label: 'Capacity',    type: 'number', width: 100, align: 'right' },
    { key: 'building', label: 'Building',    type: 'text',   width: 140 },
    { key: 'floor',    label: 'Floor',       type: 'text',   width: 100 },
  ]
  return (
    <DataGrid<RoomRow>
      title="Rooms"
      description="Classrooms, labs, halls. Scope a room to time-window its availability."
      icon={<Building2 size={16} />}
      columns={columns}
      rows={rooms}
      rowKey={(r) => r.id}
      onChange={setRooms}
      onScope={onScope}
      newRow={() => ({
        id: makeId(), name: `Room ${100 + rooms.length + 1}`,
        type: 'Classroom', capacity: 40, building: 'Main Block', floor: 'Ground',
      })}
      toolbar={{ add: true, importCSV: true, exportCSV: true, paste: true, search: true, transpose: true, bulkActions: true }}
    />
  )
}
