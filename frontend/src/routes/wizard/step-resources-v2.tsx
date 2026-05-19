/**
 * Step 2 — Resources  (v3, matches mockup)
 *
 * Layout:
 *   ┌─ Left sidebar (4 tabs) ──┬─ Content area ──────────────────────────┐
 *   │  🎓 Classes      52       │  [AI Banner]                             │
 *   │  📖 Subjects     38       │  Classes  (showing 8 of 52)  [btns]      │
 *   │  👤 Teachers     84       │  ┌──────────────────────────────────┐    │
 *   │  🏫 Rooms        60       │  │  table rows …                    │    │
 *   │                           │  └──────────────────────────────────┘    │
 *   │                           │  Showing 8 of 52 · View all · Import     │
 *   └───────────────────────────┴────────────────────────────────────────── ┘
 *   [← Step 1]  Step 2 of 5 · All 4 resource types required  [Next →]
 */

import { useState, useMemo, useEffect } from 'react'
import { useTimetableStore } from '@/store/timetableStore'
import { generateStaff, generateSubjects, generateBreaks } from '@/lib/orgData'
import type { Section, Subject, Staff } from '@/types'
import {
  Sparkles, Users, BookOpen, Building2, GraduationCap,
  ChevronLeft, ChevronRight, Plus, RefreshCw, Pencil,
  Trash2, Copy, Download, CheckCircle2, AlertCircle,
} from 'lucide-react'

// ─── Constants ───────────────────────────────────────────────────
type TabKey = 'classes' | 'subjects' | 'teachers' | 'rooms'

const GRADE_GROUP: Record<string, string> = {
  Nursery: 'Pre-Primary', LKG: 'Pre-Primary', UKG: 'Pre-Primary',
  I: 'Primary', II: 'Primary', III: 'Primary', IV: 'Primary', V: 'Primary',
  VI: 'Upper Primary', VII: 'Upper Primary', VIII: 'Upper Primary',
  IX: 'Secondary', X: 'Secondary',
  XI: 'Sr. Secondary', XII: 'Sr. Secondary',
}

const GRP_CLR: Record<string, { bg: string; text: string }> = {
  'Pre-Primary':   { bg: '#F3F0FF', text: '#7C6FE0' },
  'Primary':       { bg: '#EFF6FF', text: '#2563EB' },
  'Upper Primary': { bg: '#ECFDF5', text: '#059669' },
  'Secondary':     { bg: '#FFF7ED', text: '#EA580C' },
  'Sr. Secondary': { bg: '#FDF4FF', text: '#9333EA' },
}

const DEFAULT_STRENGTH: Record<string, number> = {
  'Pre-Primary': 25, 'Primary': 35, 'Upper Primary': 40, 'Secondary': 45, 'Sr. Secondary': 40,
}

const TAB_META: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'classes',  label: 'Classes',  icon: <GraduationCap size={15} /> },
  { key: 'subjects', label: 'Subjects', icon: <BookOpen size={15} /> },
  { key: 'teachers', label: 'Teachers', icon: <Users size={15} /> },
  { key: 'rooms',    label: 'Rooms',    icon: <Building2 size={15} /> },
]

const SUBJECT_CATEGORY_CLR: Record<string, { bg: string; text: string }> = {
  'Core': { bg: '#EFF6FF', text: '#2563EB' },
  'CCA':  { bg: '#F0FDF4', text: '#16A34A' },
}

const ROOM_TYPE_CLR: Record<string, { bg: string; text: string }> = {
  'classroom': { bg: '#F8F7FF', text: '#6B7280' },
  'lab':       { bg: '#FFF7ED', text: '#EA580C' },
  'special':   { bg: '#FDF4FF', text: '#9333EA' },
  'office':    { bg: '#F0FDF4', text: '#059669' },
}

function makeId() { return Math.random().toString(36).slice(2, 9) }

// ─── Default data builders ────────────────────────────────────────
function buildDefaultSections(): Section[] {
  const out: Section[] = []
  const push = (grade: string, sec: string) =>
    out.push({ id: makeId(), name: `${grade}-${sec}`, grade, room: `Room ${100 + out.length + 1}`, classTeacher: '' } as Section)

  for (const g of ['Nursery', 'LKG', 'UKG'])    for (const s of ['A','B','C'])         push(g, s)
  for (const g of ['I','II','III','IV','V'])      for (const s of ['A','B','C'])         push(g, s)
  for (const g of ['VI','VII','VIII'])            for (const s of ['A','B','C','D'])     push(g, s)
  for (const g of ['IX','X'])                    for (const s of ['A','B','C','D'])     push(g, s)
  for (const g of ['XI','XII'])                  for (const s of ['Sci-A','Sci-B','Com-A','Arts']) push(g, s)
  return out  // 9+15+12+8+8 = 52
}

function buildDefaultSubjects(): Subject[] {
  const defs: Array<{ name: string; cat: string; ppw: number }> = [
    { name: 'Mathematics',            cat: 'Core', ppw: 6 },
    { name: 'English',                cat: 'Core', ppw: 6 },
    { name: 'Science',                cat: 'Core', ppw: 5 },
    { name: 'Social Studies',         cat: 'Core', ppw: 4 },
    { name: 'Hindi',                  cat: 'Core', ppw: 5 },
    { name: 'Sanskrit / MIL',         cat: 'Core', ppw: 3 },
    { name: 'EVS',                    cat: 'Core', ppw: 3 },
    { name: 'Computer Science',       cat: 'Core', ppw: 2 },
    { name: 'Physics',                cat: 'Core', ppw: 5 },
    { name: 'Chemistry',              cat: 'Core', ppw: 5 },
    { name: 'Biology',                cat: 'Core', ppw: 4 },
    { name: 'Accountancy',            cat: 'Core', ppw: 5 },
    { name: 'Business Studies',       cat: 'Core', ppw: 4 },
    { name: 'Economics',              cat: 'Core', ppw: 4 },
    { name: 'History',                cat: 'Core', ppw: 3 },
    { name: 'Geography',              cat: 'Core', ppw: 3 },
    { name: 'Political Science',      cat: 'Core', ppw: 3 },
    { name: 'Psychology',             cat: 'Core', ppw: 3 },
    { name: 'Informatics Practices',  cat: 'Core', ppw: 2 },
    { name: 'English Literature',     cat: 'Core', ppw: 3 },
    { name: 'Moral Science',          cat: 'Core', ppw: 1 },
    { name: 'Entrepreneurship',       cat: 'Core', ppw: 2 },
    { name: 'Environmental Studies',  cat: 'Core', ppw: 2 },
    { name: 'Number Work',            cat: 'Core', ppw: 4 },
    { name: 'Nursery Rhymes & Stories', cat: 'Core', ppw: 3 },
    { name: 'G.K.',                   cat: 'Core', ppw: 1 },
    { name: 'Drawing',                cat: 'Core', ppw: 2 },
    { name: 'Activity / Free Play',   cat: 'Core', ppw: 3 },
    { name: 'Mathematics (Optional)', cat: 'Core', ppw: 5 },
    { name: 'Odia / Regional Language', cat: 'Core', ppw: 3 },
    { name: 'Physical Education',     cat: 'CCA',  ppw: 2 },
    { name: 'Art & Craft',            cat: 'CCA',  ppw: 2 },
    { name: 'Music',                  cat: 'CCA',  ppw: 1 },
    { name: 'Dance',                  cat: 'CCA',  ppw: 1 },
    { name: 'Library',                cat: 'CCA',  ppw: 1 },
    { name: 'SUPW / Life Skills',     cat: 'CCA',  ppw: 1 },
    { name: 'Yoga & Health',          cat: 'CCA',  ppw: 1 },
    { name: 'Scout & Guide',          cat: 'CCA',  ppw: 1 },
  ]  // 30 Core + 8 CCA = 38 ✓
  return defs.map(d => ({
    id: makeId(), name: d.name, periodsPerWeek: d.ppw,
    category: d.cat as any, isOptional: false,
  } as unknown as Subject))
}

function buildDefaultRooms() {
  const rooms: Array<{ id: string; actualName: string; generatedName: string; roomType: string; capacity: number }> = []
  for (let i = 0; i < 52; i++)
    rooms.push({ id: makeId(), actualName: `Room ${101 + i}`, generatedName: `Room ${101 + i}`, roomType: 'classroom', capacity: 40 })
  const specials = [
    { name: 'Science Lab 1', type: 'lab', cap: 35 },
    { name: 'Science Lab 2', type: 'lab', cap: 35 },
    { name: 'Computer Lab',  type: 'lab', cap: 40 },
    { name: 'Library',       type: 'special', cap: 60 },
    { name: 'Art Room',      type: 'special', cap: 35 },
    { name: 'Music Room',    type: 'special', cap: 30 },
    { name: 'Dance Hall',    type: 'special', cap: 50 },
    { name: 'Activity Hall', type: 'special', cap: 80 },
  ]
  specials.forEach(s => rooms.push({ id: makeId(), actualName: s.name, generatedName: s.name, roomType: s.type, capacity: s.cap }))
  return rooms.slice(0, 60)
}

// ─── Inline edit buffer ──────────────────────────────────────────
interface EditBuf {
  name?: string
  strength?: string
  classTeacher?: string
  periodsPerWeek?: string
  capacity?: string
}

// ─── Main component ───────────────────────────────────────────────
export function StepResourcesV2() {
  const store          = useTimetableStore() as any
  const { config, sections, staff, subjects, setSections, setStaff, setBreaks, setStep } = store
  const setSubjects    = store.setSubjects ?? store.setLegacySubjects

  const rooms: Array<{ id: string; actualName?: string; generatedName?: string; roomType?: string; capacity?: number }> =
    store.rooms ?? []

  // UI state
  const [activeTab, setActiveTab]   = useState<TabKey>('classes')
  const [showAll, setShowAll]       = useState<Record<TabKey, boolean>>({ classes: false, subjects: false, teachers: false, rooms: false })
  const [editingId, setEditingId]   = useState<string | null>(null)
  const [editBuf, setEditBuf]       = useState<EditBuf>({})
  const [generating, setGenerating] = useState(false)

  const hasAnyData = sections.length > 0 || staff.length > 0 || subjects.length > 0 || rooms.length > 0

  const counts: Record<TabKey, number> = {
    classes:  sections.length,
    subjects: subjects.length,
    teachers: staff.length,
    rooms:    rooms.length,
  }

  const allReady = sections.length > 0 && staff.length > 0 && subjects.length > 0 && rooms.length > 0

  // Auto-generate breaks if empty
  useEffect(() => {
    if ((store.breaks ?? []).length === 0) {
      setBreaks(generateBreaks(config.orgType ?? 'school', config.numBreaks ?? 3))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Generate all ──────────────────────────────────────────────
  const handleGenerateAll = async () => {
    setGenerating(true)
    await new Promise(r => setTimeout(r, 900))

    const newSections = buildDefaultSections()
    const newStaff: Staff[] = generateStaff(config.orgType ?? 'school', config.countryCode ?? 'IN', 84)
    const newSubjects = buildDefaultSubjects()
    const newRooms = buildDefaultRooms()

    // Assign class teachers to sections
    const withTeachers = newSections.map((sec, i) => ({
      ...sec,
      classTeacher: newStaff[i % newStaff.length]?.name ?? '',
      strength: DEFAULT_STRENGTH[GRADE_GROUP[(sec as any).grade] ?? 'Primary'] ?? 35,
    }))

    setSections(withTeachers)
    setStaff(newStaff)
    setSubjects(newSubjects)
    store.setRooms?.(newRooms)
    store.setConfig?.({ ...config, bandStrengths: {}, numStaff: 84, numSubjects: 38, numRooms: 60 })
    setGenerating(false)
  }

  // ── Add row ────────────────────────────────────────────────────
  const handleAddRow = () => {
    if (activeTab === 'classes') {
      const newSec = { id: makeId(), name: 'New-A', grade: 'I', room: '', classTeacher: '', strength: 35 } as any
      setSections([...sections, newSec])
      setEditingId(newSec.id)
      setEditBuf({ name: newSec.name, strength: '35', classTeacher: '' })
    } else if (activeTab === 'subjects') {
      const newSub = { id: makeId(), name: 'New Subject', periodsPerWeek: 3, category: 'Core', isOptional: false } as unknown as Subject
      setSubjects([...subjects, newSub])
      setEditingId(newSub.id)
      setEditBuf({ name: 'New Subject', periodsPerWeek: '3' })
    } else if (activeTab === 'teachers') {
      const newStaff = { id: makeId(), name: 'New Teacher', subjects: [], maxPeriodsPerWeek: 36 }
      setStaff([...staff, newStaff])
      setEditingId(newStaff.id)
      setEditBuf({ name: 'New Teacher' })
    } else if (activeTab === 'rooms') {
      const newRoom = { id: makeId(), actualName: 'New Room', generatedName: 'New Room', roomType: 'classroom', capacity: 40 }
      store.setRooms?.([...rooms, newRoom])
      setEditingId(newRoom.id)
      setEditBuf({ name: 'New Room', capacity: '40' })
    }
  }

  // ── Delete row ─────────────────────────────────────────────────
  const handleDelete = (id: string) => {
    if (editingId === id) { setEditingId(null); setEditBuf({}) }
    if (activeTab === 'classes')  setSections(sections.filter((s: Section) => s.id !== id))
    if (activeTab === 'subjects') setSubjects(subjects.filter((s: Subject) => s.id !== id))
    if (activeTab === 'teachers') setStaff(staff.filter((s: Staff) => s.id !== id))
    if (activeTab === 'rooms')    store.setRooms?.(rooms.filter((r: any) => r.id !== id))
  }

  // ── Save inline edit ───────────────────────────────────────────
  const handleSaveEdit = () => {
    if (!editingId) return
    if (activeTab === 'classes') {
      setSections(sections.map((s: any) => s.id !== editingId ? s : {
        ...s,
        name:         editBuf.name         ?? s.name,
        strength:     parseInt(editBuf.strength ?? '') || (s.strength ?? 35),
        classTeacher: editBuf.classTeacher ?? s.classTeacher,
      }))
    } else if (activeTab === 'subjects') {
      setSubjects(subjects.map((s: any) => s.id !== editingId ? s : {
        ...s,
        name:           editBuf.name           ?? s.name,
        periodsPerWeek: parseInt(editBuf.periodsPerWeek ?? '') || s.periodsPerWeek,
      }))
    } else if (activeTab === 'teachers') {
      setStaff(staff.map((s: any) => s.id !== editingId ? s : {
        ...s,
        name: editBuf.name ?? s.name,
      }))
    } else if (activeTab === 'rooms') {
      store.setRooms?.(rooms.map((r: any) => r.id !== editingId ? r : {
        ...r,
        actualName:  editBuf.name     ?? r.actualName,
        capacity:    parseInt(editBuf.capacity ?? '') || r.capacity,
      }))
    }
    setEditingId(null)
    setEditBuf({})
  }

  // ── Derived row data ───────────────────────────────────────────
  const PAGE_SIZE = 8
  const visibleCount = (key: TabKey) => showAll[key] ? counts[key] : Math.min(PAGE_SIZE, counts[key])

  const teacherNames = useMemo(() => staff.map((s: Staff) => s.name), [staff])

  // ── AI banner text per tab ─────────────────────────────────────
  const AI_BANNER: Record<TabKey, string> = {
    classes:  `AI generated ${counts.classes} classes from your Nursery–XII range. Review and edit any row inline.`,
    subjects: `AI generated ${counts.subjects} subjects across all grade groups. Assign periods per week as needed.`,
    teachers: `AI generated ${counts.teachers} teachers with Indian curriculum expertise. Assign subjects & load below.`,
    rooms:    `AI generated ${counts.rooms} rooms including classrooms, labs and special spaces. Edit names inline.`,
  }

  // ─────────────────────────────────────────────────────────────
  return (
    <div style={{
      display: 'flex', minHeight: 'calc(100vh - 165px)',
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>

      {/* ══ Left sidebar ══════════════════════════════════════ */}
      <div style={{
        width: 192, flexShrink: 0,
        background: '#fff',
        borderRight: '1px solid #E5E7EB',
        padding: '18px 0',
        position: 'sticky', top: 0,
        height: 'calc(100vh - 165px)',
        overflowY: 'auto',
      }}>
        <div style={{ padding: '0 16px 10px', fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9CA3AF' }}>
          Resource Types
        </div>
        {TAB_META.map(tab => {
          const active = activeTab === tab.key
          const count  = counts[tab.key]
          const ready  = count > 0
          return (
            <button key={tab.key}
              onClick={() => { setActiveTab(tab.key); setShowAll(prev => ({ ...prev, [tab.key]: false })) }}
              style={{
                width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer',
                padding: '9px 16px',
                background: active ? '#F5F2FF' : 'transparent',
                borderRight: active ? '2.5px solid #7C6FE0' : '2.5px solid transparent',
                display: 'flex', alignItems: 'center', gap: 10,
                fontFamily: 'inherit',
                transition: 'background 0.1s',
              }}>
              <span style={{ color: active ? '#7C6FE0' : ready ? '#6B7280' : '#D1D5DB', display: 'flex' }}>
                {tab.icon}
              </span>
              <span style={{ flex: 1, fontSize: 13, fontWeight: active ? 600 : 400, color: active ? '#7C6FE0' : '#374151' }}>
                {tab.label}
              </span>
              {ready ? (
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 10,
                  background: active ? '#7C6FE0' : '#F3F4F6',
                  color: active ? '#fff' : '#6B7280',
                  minWidth: 24, textAlign: 'center',
                }}>
                  {count}
                </span>
              ) : (
                <span style={{ fontSize: 10, color: '#FCA5A5', fontWeight: 600 }}>—</span>
              )}
            </button>
          )
        })}

        {/* Progress summary */}
        <div style={{ margin: '16px 12px 0', padding: '10px 12px', background: '#FAFAFE', borderRadius: 8, border: '1px solid #E8E4FF' }}>
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8B87AD', marginBottom: 8 }}>
            Readiness
          </div>
          {TAB_META.map(tab => {
            const ok = counts[tab.key] > 0
            return (
              <div key={tab.key} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: ok ? '#22C55E' : '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {ok && <CheckCircle2 size={8} color="#fff" />}
                </div>
                <span style={{ fontSize: 11, color: ok ? '#16A34A' : '#9CA3AF', fontWeight: ok ? 600 : 400 }}>{tab.label}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ══ Content area ══════════════════════════════════════ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ flex: 1, padding: '20px 24px 8px' }}>

          {/* ── Quick Setup (empty state) ──────────────────── */}
          {!hasAnyData && (
            <div style={{ maxWidth: 560, margin: '40px auto 0', textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: 16, background: '#EDE9FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Sparkles size={28} color="#7C6FE0" />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#13111E', margin: '0 0 8px', letterSpacing: '-0.3px' }}>
                AI-generate your school resources
              </h2>
              <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 28px', lineHeight: 1.6 }}>
                One click generates a complete Indian school dataset — 52 classes (Nursery–XII), 84 teachers, 38 subjects and 60 rooms. Review and edit every row inline.
              </p>
              <button
                onClick={handleGenerateAll}
                disabled={generating}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '13px 28px', borderRadius: 10, border: 'none',
                  background: generating ? '#D8D2FF' : 'linear-gradient(135deg, #7C6FE0, #9B8EF5)',
                  color: '#fff', fontSize: 14, fontWeight: 700,
                  cursor: generating ? 'default' : 'pointer', fontFamily: 'inherit',
                  boxShadow: generating ? 'none' : '0 4px 12px rgba(124,111,224,0.35)',
                }}>
                {generating
                  ? <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Generating…</>
                  : <><Sparkles size={14} /> AI Generate All Resources</>}
              </button>
              <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 12 }}>
                Or switch to a tab on the left to add resources manually.
              </p>
              <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            </div>
          )}

          {/* ── Table view ────────────────────────────────── */}
          {hasAnyData && (
            <div>
              {/* AI Banner */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 14px', borderRadius: 8,
                background: '#F5F2FF', border: '1px solid #E0D9FF',
                marginBottom: 16,
              }}>
                <Sparkles size={13} color="#7C6FE0" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: '#4B5275', lineHeight: 1.4 }}>
                  {AI_BANNER[activeTab]}
                </span>
                <button
                  onClick={handleGenerateAll}
                  disabled={generating}
                  style={{
                    marginLeft: 'auto', flexShrink: 0,
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '5px 11px', borderRadius: 6, border: 'none',
                    background: '#7C6FE0', color: '#fff',
                    fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                  <RefreshCw size={11} /> Regenerate all
                </button>
              </div>

              {/* Table header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#13111E', margin: 0, letterSpacing: '-0.2px' }}>
                  {TAB_META.find(t => t.key === activeTab)?.label}
                  <span style={{ fontWeight: 400, color: '#9CA3AF', fontSize: 13 }}>
                    {' '}(showing {visibleCount(activeTab)} of {counts[activeTab]})
                  </span>
                </h3>
                <div style={{ flex: 1 }} />
                <button onClick={handleAddRow} style={btnOutline}>
                  <Plus size={12} /> Add {activeTab === 'classes' ? 'class' : activeTab === 'subjects' ? 'subject' : activeTab === 'teachers' ? 'teacher' : 'room'}
                </button>
                {activeTab === 'classes' && (
                  <button style={btnOutline}>
                    <Copy size={12} /> Duplicate section
                  </button>
                )}
                <button onClick={handleGenerateAll} disabled={generating} style={btnOutline}>
                  <Sparkles size={12} /> AI regenerate
                </button>
              </div>

              {/* Tables */}
              {activeTab === 'classes' && (
                <ClassesTable
                  sections={sections}
                  visibleCount={visibleCount('classes')}
                  editingId={editingId}
                  editBuf={editBuf}
                  teacherNames={teacherNames}
                  onEdit={(id, buf) => { setEditingId(id); setEditBuf(buf) }}
                  onSave={handleSaveEdit}
                  onCancel={() => { setEditingId(null); setEditBuf({}) }}
                  onDelete={handleDelete}
                />
              )}
              {activeTab === 'subjects' && (
                <SubjectsTable
                  subjects={subjects}
                  visibleCount={visibleCount('subjects')}
                  editingId={editingId}
                  editBuf={editBuf}
                  onEdit={(id, buf) => { setEditingId(id); setEditBuf(buf) }}
                  onSave={handleSaveEdit}
                  onCancel={() => { setEditingId(null); setEditBuf({}) }}
                  onDelete={handleDelete}
                />
              )}
              {activeTab === 'teachers' && (
                <TeachersTable
                  staff={staff}
                  visibleCount={visibleCount('teachers')}
                  editingId={editingId}
                  editBuf={editBuf}
                  onEdit={(id, buf) => { setEditingId(id); setEditBuf(buf) }}
                  onSave={handleSaveEdit}
                  onCancel={() => { setEditingId(null); setEditBuf({}) }}
                  onDelete={handleDelete}
                />
              )}
              {activeTab === 'rooms' && (
                <RoomsTable
                  rooms={rooms}
                  visibleCount={visibleCount('rooms')}
                  editingId={editingId}
                  editBuf={editBuf}
                  onEdit={(id, buf) => { setEditingId(id); setEditBuf(buf) }}
                  onSave={handleSaveEdit}
                  onCancel={() => { setEditingId(null); setEditBuf({}) }}
                  onDelete={handleDelete}
                />
              )}

              {/* Table footer */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 0 4px', fontSize: 12, color: '#9CA3AF' }}>
                <span>Showing {visibleCount(activeTab)} of {counts[activeTab]}</span>
                {!showAll[activeTab] && counts[activeTab] > PAGE_SIZE && (
                  <>
                    <span>·</span>
                    <button
                      onClick={() => setShowAll(prev => ({ ...prev, [activeTab]: true }))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7C6FE0', fontSize: 12, fontWeight: 600, padding: 0, fontFamily: 'inherit' }}>
                      View all
                    </button>
                  </>
                )}
                {showAll[activeTab] && counts[activeTab] > PAGE_SIZE && (
                  <>
                    <span>·</span>
                    <button
                      onClick={() => setShowAll(prev => ({ ...prev, [activeTab]: false }))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7C6FE0', fontSize: 12, fontWeight: 600, padding: 0, fontFamily: 'inherit' }}>
                      Collapse
                    </button>
                  </>
                )}
                <span>·</span>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 12, padding: 0, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Download size={11} /> Import from Excel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ══ Bottom navigation bar ════════════════════════ */}
        <div style={{
          position: 'sticky', bottom: 0,
          background: '#fff', borderTop: '1px solid #E5E7EB',
          padding: '10px 24px',
          display: 'flex', alignItems: 'center', gap: 12,
          zIndex: 10,
        }}>
          <button
            onClick={() => setStep(1)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '8px 16px', borderRadius: 8,
              border: '1px solid #E5E7EB', background: '#fff',
              color: '#4B5275', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
            <ChevronLeft size={14} /> Step 1
          </button>

          <div style={{ flex: 1, textAlign: 'center' }}>
            <span style={{ fontSize: 12, color: '#9CA3AF' }}>Step 2 of 5</span>
            {!allReady && (
              <span style={{ fontSize: 12, color: '#EA580C', marginLeft: 10, fontWeight: 500 }}>
                · All 4 resource types required before proceeding
              </span>
            )}
            {allReady && (
              <span style={{ fontSize: 12, color: '#16A34A', marginLeft: 10, fontWeight: 500 }}>
                · All resources ready ✓
              </span>
            )}
          </div>

          <button
            onClick={() => setStep(3)}
            disabled={!allReady}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '8px 18px', borderRadius: 8, border: 'none',
              background: allReady ? 'linear-gradient(135deg, #7C6FE0, #9B8EF5)' : '#E8E4FF',
              color: allReady ? '#fff' : '#B8B4D4',
              fontSize: 12, fontWeight: 700, cursor: allReady ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit',
              boxShadow: allReady ? '0 2px 8px rgba(124,111,224,0.35)' : 'none',
            }}>
            Next: Allocation <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Classes table ────────────────────────────────────────────────
function ClassesTable({ sections, visibleCount, editingId, editBuf, teacherNames, onEdit, onSave, onCancel, onDelete }: {
  sections: Section[]
  visibleCount: number
  editingId: string | null
  editBuf: EditBuf
  teacherNames: string[]
  onEdit: (id: string, buf: EditBuf) => void
  onSave: () => void
  onCancel: () => void
  onDelete: (id: string) => void
}) {
  const rows = sections.slice(0, visibleCount)
  const cols = '2fr 1.2fr 80px 1.4fr 90px 80px 64px'
  const hdr: React.CSSProperties = {
    fontSize: 9, fontWeight: 800, letterSpacing: '0.08em',
    textTransform: 'uppercase', color: '#B8B4D4',
  }
  return (
    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'grid', gridTemplateColumns: cols, padding: '8px 14px', gap: 8, borderBottom: '1px solid #F3F4F6', background: '#FAFAFA' }}>
        <div style={hdr}>Class</div>
        <div style={hdr}>Group</div>
        <div style={hdr}>Strength</div>
        <div style={hdr}>Class Teacher</div>
        <div style={hdr}>Scope</div>
        <div style={hdr}>Status</div>
        <div style={hdr}></div>
      </div>
      {/* Rows */}
      {rows.map((sec: any) => {
        const grade   = sec.grade ?? sec.name.split('-')[0]
        const group   = GRADE_GROUP[grade] ?? (sec.name.includes('Sci') || sec.name.includes('Com') || sec.name.includes('Arts') ? 'Sr. Secondary' : 'Primary')
        const clr     = GRP_CLR[group] ?? GRP_CLR['Primary']
        const strength = sec.strength ?? DEFAULT_STRENGTH[group] ?? 35
        const teacher  = sec.classTeacher ?? ''
        const editing  = editingId === sec.id

        return (
          <div key={sec.id}
            style={{
              display: 'grid', gridTemplateColumns: cols, padding: '8px 14px', gap: 8,
              alignItems: 'center', borderBottom: '1px solid #F9FAFB',
              background: editing ? '#FAFAFE' : 'transparent',
            }}
            onMouseEnter={e => { if (!editing) (e.currentTarget as HTMLDivElement).style.background = '#FAFAFA' }}
            onMouseLeave={e => { if (!editing) (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
          >
            {/* Class name */}
            <div>
              {editing
                ? <input value={editBuf.name ?? sec.name} onChange={e => onEdit(sec.id, { ...editBuf, name: e.target.value })}
                    autoFocus onKeyDown={e => { if (e.key === 'Enter') onSave(); if (e.key === 'Escape') onCancel() }}
                    style={inlineInput} />
                : <span style={{ fontSize: 13, fontWeight: 600, color: '#13111E' }}>{sec.name}</span>
              }
            </div>

            {/* Group badge */}
            <div>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: clr.bg, color: clr.text }}>
                {group}
              </span>
            </div>

            {/* Strength */}
            <div>
              {editing
                ? <input type="number" value={editBuf.strength ?? String(strength)}
                    onChange={e => onEdit(sec.id, { ...editBuf, strength: e.target.value })}
                    onKeyDown={e => { if (e.key === 'Enter') onSave(); if (e.key === 'Escape') onCancel() }}
                    style={{ ...inlineInput, width: 56, textAlign: 'right' }} />
                : <span style={{ fontSize: 12, color: '#374151', fontFamily: "'DM Mono', monospace" }}>{strength}</span>
              }
            </div>

            {/* Class teacher */}
            <div>
              {editing
                ? <select value={editBuf.classTeacher ?? teacher}
                    onChange={e => onEdit(sec.id, { ...editBuf, classTeacher: e.target.value })}
                    style={{ ...inlineInput, width: '100%', cursor: 'pointer' }}>
                    <option value="">— none —</option>
                    {teacherNames.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                : <span style={{ fontSize: 12, color: '#6B7280' }}>{teacher || <span style={{ color: '#D1D5DB', fontStyle: 'italic' }}>Unassigned</span>}</span>
              }
            </div>

            {/* Scope dots (Mon–Fri) */}
            <div style={{ display: 'flex', gap: 3 }}>
              {['M','T','W','T','F'].map((d, di) => (
                <div key={di} title={['Mon','Tue','Wed','Thu','Fri'][di]}
                  style={{ width: 14, height: 14, borderRadius: '50%', background: clr.text, opacity: 0.85 }} />
              ))}
            </div>

            {/* Status badge */}
            <div>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: '#DCFCE7', color: '#16A34A' }}>
                Active
              </span>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
              {editing ? (
                <>
                  <button onClick={onSave} style={{ ...iconBtn, color: '#16A34A' }}>✓</button>
                  <button onClick={onCancel} style={{ ...iconBtn, color: '#9CA3AF', fontSize: 16 }}>✕</button>
                </>
              ) : (
                <>
                  <button onClick={() => onEdit(sec.id, { name: sec.name, strength: String(strength), classTeacher: teacher })} style={iconBtn}>
                    <Pencil size={11} />
                  </button>
                  <button onClick={() => onDelete(sec.id)} style={{ ...iconBtn, color: '#FCA5A5' }}>
                    <Trash2 size={11} />
                  </button>
                </>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Subjects table ───────────────────────────────────────────────
function SubjectsTable({ subjects, visibleCount, editingId, editBuf, onEdit, onSave, onCancel, onDelete }: {
  subjects: Subject[]
  visibleCount: number
  editingId: string | null
  editBuf: EditBuf
  onEdit: (id: string, buf: EditBuf) => void
  onSave: () => void
  onCancel: () => void
  onDelete: (id: string) => void
}) {
  const rows = subjects.slice(0, visibleCount)
  const cols = '2fr 100px 80px 80px 64px'
  const hdr: React.CSSProperties = { fontSize: 9, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#B8B4D4' }
  return (
    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: cols, padding: '8px 14px', gap: 8, borderBottom: '1px solid #F3F4F6', background: '#FAFAFA' }}>
        <div style={hdr}>Subject</div>
        <div style={hdr}>Category</div>
        <div style={hdr}>Periods/wk</div>
        <div style={hdr}>Status</div>
        <div style={hdr}></div>
      </div>
      {rows.map((sub: any) => {
        const cat  = sub.category ?? 'Core'
        const clr  = SUBJECT_CATEGORY_CLR[cat] ?? SUBJECT_CATEGORY_CLR['Core']
        const editing = editingId === sub.id
        return (
          <div key={sub.id}
            style={{ display: 'grid', gridTemplateColumns: cols, padding: '8px 14px', gap: 8, alignItems: 'center', borderBottom: '1px solid #F9FAFB', background: editing ? '#FAFAFE' : 'transparent' }}
            onMouseEnter={e => { if (!editing) (e.currentTarget as HTMLDivElement).style.background = '#FAFAFA' }}
            onMouseLeave={e => { if (!editing) (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
          >
            <div>
              {editing
                ? <input value={editBuf.name ?? sub.name} onChange={e => onEdit(sub.id, { ...editBuf, name: e.target.value })}
                    autoFocus onKeyDown={e => { if (e.key === 'Enter') onSave(); if (e.key === 'Escape') onCancel() }} style={inlineInput} />
                : <span style={{ fontSize: 13, fontWeight: 600, color: '#13111E' }}>{sub.name}</span>
              }
            </div>
            <div><span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: clr.bg, color: clr.text }}>{cat}</span></div>
            <div>
              {editing
                ? <input type="number" value={editBuf.periodsPerWeek ?? String(sub.periodsPerWeek ?? 3)}
                    onChange={e => onEdit(sub.id, { ...editBuf, periodsPerWeek: e.target.value })}
                    onKeyDown={e => { if (e.key === 'Enter') onSave(); if (e.key === 'Escape') onCancel() }}
                    style={{ ...inlineInput, width: 56, textAlign: 'right' }} />
                : <span style={{ fontSize: 12, color: '#374151', fontFamily: "'DM Mono', monospace" }}>{sub.periodsPerWeek ?? '—'}</span>
              }
            </div>
            <div><span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: '#DCFCE7', color: '#16A34A' }}>Active</span></div>
            <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
              {editing ? (
                <><button onClick={onSave} style={{ ...iconBtn, color: '#16A34A' }}>✓</button><button onClick={onCancel} style={{ ...iconBtn, color: '#9CA3AF', fontSize: 16 }}>✕</button></>
              ) : (
                <><button onClick={() => onEdit(sub.id, { name: sub.name, periodsPerWeek: String(sub.periodsPerWeek ?? 3) })} style={iconBtn}><Pencil size={11} /></button>
                  <button onClick={() => onDelete(sub.id)} style={{ ...iconBtn, color: '#FCA5A5' }}><Trash2 size={11} /></button></>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Teachers table ───────────────────────────────────────────────
function TeachersTable({ staff, visibleCount, editingId, editBuf, onEdit, onSave, onCancel, onDelete }: {
  staff: Staff[]
  visibleCount: number
  editingId: string | null
  editBuf: EditBuf
  onEdit: (id: string, buf: EditBuf) => void
  onSave: () => void
  onCancel: () => void
  onDelete: (id: string) => void
}) {
  const rows = staff.slice(0, visibleCount)
  const cols = '1.8fr 2fr 90px 80px 64px'
  const hdr: React.CSSProperties = { fontSize: 9, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#B8B4D4' }
  return (
    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: cols, padding: '8px 14px', gap: 8, borderBottom: '1px solid #F3F4F6', background: '#FAFAFA' }}>
        <div style={hdr}>Teacher</div>
        <div style={hdr}>Subjects</div>
        <div style={hdr}>Max periods/wk</div>
        <div style={hdr}>Status</div>
        <div style={hdr}></div>
      </div>
      {rows.map((t: any) => {
        const editing = editingId === t.id
        const subList = ((t.subjects ?? []) as string[]).slice(0, 3).join(', ') || '—'
        const maxP    = (t as any).maxPeriodsPerWeek ?? 36
        return (
          <div key={t.id}
            style={{ display: 'grid', gridTemplateColumns: cols, padding: '8px 14px', gap: 8, alignItems: 'center', borderBottom: '1px solid #F9FAFB', background: editing ? '#FAFAFE' : 'transparent' }}
            onMouseEnter={e => { if (!editing) (e.currentTarget as HTMLDivElement).style.background = '#FAFAFA' }}
            onMouseLeave={e => { if (!editing) (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
          >
            <div>
              {editing
                ? <input value={editBuf.name ?? t.name} onChange={e => onEdit(t.id, { ...editBuf, name: e.target.value })}
                    autoFocus onKeyDown={e => { if (e.key === 'Enter') onSave(); if (e.key === 'Escape') onCancel() }} style={inlineInput} />
                : <span style={{ fontSize: 13, fontWeight: 600, color: '#13111E' }}>{t.name}</span>
              }
            </div>
            <div><span style={{ fontSize: 11, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{subList}</span></div>
            <div><span style={{ fontSize: 12, color: '#374151', fontFamily: "'DM Mono', monospace" }}>{maxP}</span></div>
            <div><span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: '#DCFCE7', color: '#16A34A' }}>Active</span></div>
            <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
              {editing ? (
                <><button onClick={onSave} style={{ ...iconBtn, color: '#16A34A' }}>✓</button><button onClick={onCancel} style={{ ...iconBtn, color: '#9CA3AF', fontSize: 16 }}>✕</button></>
              ) : (
                <><button onClick={() => onEdit(t.id, { name: t.name })} style={iconBtn}><Pencil size={11} /></button>
                  <button onClick={() => onDelete(t.id)} style={{ ...iconBtn, color: '#FCA5A5' }}><Trash2 size={11} /></button></>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Rooms table ──────────────────────────────────────────────────
function RoomsTable({ rooms, visibleCount, editingId, editBuf, onEdit, onSave, onCancel, onDelete }: {
  rooms: Array<{ id: string; actualName?: string; generatedName?: string; roomType?: string; capacity?: number }>
  visibleCount: number
  editingId: string | null
  editBuf: EditBuf
  onEdit: (id: string, buf: EditBuf) => void
  onSave: () => void
  onCancel: () => void
  onDelete: (id: string) => void
}) {
  const rows = rooms.slice(0, visibleCount)
  const cols = '2fr 100px 80px 80px 64px'
  const hdr: React.CSSProperties = { fontSize: 9, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#B8B4D4' }
  return (
    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: cols, padding: '8px 14px', gap: 8, borderBottom: '1px solid #F3F4F6', background: '#FAFAFA' }}>
        <div style={hdr}>Room</div>
        <div style={hdr}>Type</div>
        <div style={hdr}>Capacity</div>
        <div style={hdr}>Status</div>
        <div style={hdr}></div>
      </div>
      {rows.map((r: any) => {
        const editing = editingId === r.id
        const name    = r.actualName ?? r.generatedName ?? 'Room'
        const type    = r.roomType ?? 'classroom'
        const cap     = r.capacity ?? 40
        const tclr    = ROOM_TYPE_CLR[type] ?? ROOM_TYPE_CLR['classroom']
        return (
          <div key={r.id}
            style={{ display: 'grid', gridTemplateColumns: cols, padding: '8px 14px', gap: 8, alignItems: 'center', borderBottom: '1px solid #F9FAFB', background: editing ? '#FAFAFE' : 'transparent' }}
            onMouseEnter={e => { if (!editing) (e.currentTarget as HTMLDivElement).style.background = '#FAFAFA' }}
            onMouseLeave={e => { if (!editing) (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
          >
            <div>
              {editing
                ? <input value={editBuf.name ?? name} onChange={e => onEdit(r.id, { ...editBuf, name: e.target.value })}
                    autoFocus onKeyDown={e => { if (e.key === 'Enter') onSave(); if (e.key === 'Escape') onCancel() }} style={inlineInput} />
                : <span style={{ fontSize: 13, fontWeight: 600, color: '#13111E' }}>{name}</span>
              }
            </div>
            <div><span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: tclr.bg, color: tclr.text, textTransform: 'capitalize' as const }}>{type}</span></div>
            <div>
              {editing
                ? <input type="number" value={editBuf.capacity ?? String(cap)}
                    onChange={e => onEdit(r.id, { ...editBuf, capacity: e.target.value })}
                    onKeyDown={e => { if (e.key === 'Enter') onSave(); if (e.key === 'Escape') onCancel() }}
                    style={{ ...inlineInput, width: 56, textAlign: 'right' }} />
                : <span style={{ fontSize: 12, color: '#374151', fontFamily: "'DM Mono', monospace" }}>{cap}</span>
              }
            </div>
            <div><span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: '#DCFCE7', color: '#16A34A' }}>Active</span></div>
            <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
              {editing ? (
                <><button onClick={onSave} style={{ ...iconBtn, color: '#16A34A' }}>✓</button><button onClick={onCancel} style={{ ...iconBtn, color: '#9CA3AF', fontSize: 16 }}>✕</button></>
              ) : (
                <><button onClick={() => onEdit(r.id, { name, capacity: String(cap) })} style={iconBtn}><Pencil size={11} /></button>
                  <button onClick={() => onDelete(r.id)} style={{ ...iconBtn, color: '#FCA5A5' }}><Trash2 size={11} /></button></>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Shared styles ────────────────────────────────────────────────
const inlineInput: React.CSSProperties = {
  padding: '3px 8px', borderRadius: 5, border: '1px solid #7C6FE0',
  fontSize: 12, fontFamily: 'inherit', color: '#13111E',
  outline: 'none', background: '#fff', width: '100%',
}

const iconBtn: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  color: '#9CA3AF', padding: 3, display: 'flex', alignItems: 'center',
  borderRadius: 4, fontSize: 13, lineHeight: 1, fontFamily: 'inherit',
}

const btnOutline: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 5,
  padding: '6px 12px', borderRadius: 7,
  border: '1px solid #E5E7EB', background: '#fff',
  color: '#374151', fontSize: 11, fontWeight: 600,
  cursor: 'pointer', fontFamily: 'inherit',
  whiteSpace: 'nowrap' as const,
}
