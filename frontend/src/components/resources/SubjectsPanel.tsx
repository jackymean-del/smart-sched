/**
 * SubjectsPanel — relationship-driven subject setup.
 *
 * Core relationship modelled here:
 *   Subject → Applicable Classes  (which sections teach this subject)
 *   Subject → Eligible Teachers   (read-only, derived from staff.subjects[])
 *
 * Per-class period config (periodsPerWeek, maxPeriodsPerDay, sessionDuration)
 * lives in Subject.classConfigs[] and is editable per class inside the drawer.
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import type { Subject, SubjectClassConfig } from '@/types'
import type { Staff, Section } from '@/types'
import { Plus, Search, Trash2, X, ChevronDown, ChevronRight, BookOpen, Users, Settings } from 'lucide-react'

const P = '#7C6FE0'
const CATEGORIES = [
  'Compulsory', 'Language', '4th Optional', '5th Optional', '6th Optional',
  'Practical', 'Activity', 'EST', 'CCA', 'Skill',
]

function makeId() { return Math.random().toString(36).slice(2, 9) }

function extractGrade(name: string): string {
  const idx = name.lastIndexOf('-')
  if (idx <= 0) return name.replace(/-.*$/, '').trim()
  const suffix = name.slice(idx + 1)
  if (suffix.length === 0 || suffix.length > 3) return name.replace(/-.*$/, '').trim()
  return name.slice(0, idx).replace(/-(sci|com|arts?|hum|gen|pcm|pcb)$/i, '').trim()
}

// ─────────────────────────────────────────────────────────────
// Primitives
// ─────────────────────────────────────────────────────────────

function useClickOutside(ref: React.RefObject<HTMLElement | null>, fn: () => void, active: boolean) {
  useEffect(() => {
    if (!active) return
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) fn()
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [active, fn, ref])
}

const TH: React.CSSProperties = {
  padding: '10px 14px', textAlign: 'left', fontWeight: 600,
  fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase',
  color: '#888', borderBottom: '1px solid #f0f0f0', whiteSpace: 'nowrap',
}
const TD: React.CSSProperties = {
  padding: '10px 14px', fontSize: 13, color: '#1a1a2e',
  borderBottom: '1px solid #f7f7f9', verticalAlign: 'middle',
}

// ─────────────────────────────────────────────────────────────
// ClassChips — inline chip display for applicable classes
// ─────────────────────────────────────────────────────────────

function ClassChips({ sections, count }: { sections: string[]; count: number }) {
  const visible = sections.slice(0, 3)
  const overflow = count - visible.length
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
      {count === 0 ? (
        <span style={{ fontSize: 12, color: '#bbb', fontStyle: 'italic' }}>None assigned</span>
      ) : (
        <>
          {visible.map(s => (
            <span key={s} style={{
              background: '#f0eeff', color: P, borderRadius: 4, padding: '2px 7px',
              fontSize: 11, fontWeight: 500, border: `1px solid ${P}22`,
            }}>{s}</span>
          ))}
          {overflow > 0 && (
            <span style={{
              background: '#f5f5f5', color: '#666', borderRadius: 4, padding: '2px 7px',
              fontSize: 11, fontWeight: 500, border: '1px solid #e8e8e8',
            }}>+{overflow} more</span>
          )}
        </>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// TeacherChips — derived from staff.subjects
// ─────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.replace(/^(Mr|Mrs|Ms|Dr|Prof)\.?\s*/i, '')
    .split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('')
}

function TeacherChips({ teachers }: { teachers: Staff[] }) {
  const visible = teachers.slice(0, 3)
  const overflow = teachers.length - visible.length
  if (teachers.length === 0)
    return <span style={{ fontSize: 12, color: '#bbb', fontStyle: 'italic' }}>No teachers</span>
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {visible.map(t => (
        <span key={t.id} title={t.name} style={{
          width: 26, height: 26, borderRadius: '50%', background: '#e8e4ff',
          color: P, fontSize: 10, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `1.5px solid ${P}33`,
        }}>{initials(t.name)}</span>
      ))}
      {overflow > 0 && (
        <span style={{
          width: 26, height: 26, borderRadius: '50%', background: '#f5f5f5',
          color: '#666', fontSize: 10, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1.5px solid #e8e8e8',
        }}>+{overflow}</span>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// ColorDot
// ─────────────────────────────────────────────────────────────

function ColorDot({ color }: { color: string }) {
  return (
    <span style={{
      display: 'inline-block', width: 10, height: 10, borderRadius: '50%',
      background: color, marginRight: 6, flexShrink: 0,
      border: '1.5px solid rgba(0,0,0,0.08)',
    }} />
  )
}

// ─────────────────────────────────────────────────────────────
// PerClassConfig — expandable row in the drawer
// ─────────────────────────────────────────────────────────────

function PerClassConfig({ section, config, onChange }: {
  section: Section
  config: SubjectClassConfig
  onChange: (c: SubjectClassConfig) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderRadius: 6, border: '1px solid #eeebff', marginBottom: 4, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 8,
          padding: '7px 12px', background: '#faf9ff', border: 'none', cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        {open
          ? <ChevronDown size={13} color={P} />
          : <ChevronRight size={13} color="#aaa" />}
        <span style={{ fontSize: 12, fontWeight: 600, color: '#1a1a2e', flex: 1 }}>{section.name}</span>
        <span style={{ fontSize: 11, color: '#888' }}>
          {config.periodsPerWeek}p/w · {config.sessionDuration}min
        </span>
      </button>
      {open && (
        <div style={{
          padding: '10px 12px', background: '#fff',
          borderTop: '1px solid #eeebff', display: 'flex', gap: 12, flexWrap: 'wrap',
        }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 11, color: '#666' }}>
            Periods/week
            <input
              type="number" min={0} max={30} value={config.periodsPerWeek}
              onChange={e => onChange({ ...config, periodsPerWeek: +e.target.value })}
              style={inputStyle}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 11, color: '#666' }}>
            Max/day
            <input
              type="number" min={1} max={8} value={config.maxPeriodsPerDay}
              onChange={e => onChange({ ...config, maxPeriodsPerDay: +e.target.value })}
              style={inputStyle}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 11, color: '#666' }}>
            Duration (min)
            <input
              type="number" min={10} max={180} step={5} value={config.sessionDuration}
              onChange={e => onChange({ ...config, sessionDuration: +e.target.value })}
              style={inputStyle}
            />
          </label>
        </div>
      )}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: 72, padding: '5px 8px', border: '1px solid #e0dcff',
  borderRadius: 5, fontSize: 13, color: '#1a1a2e', outline: 'none',
}

// ─────────────────────────────────────────────────────────────
// SubjectDrawer
// ─────────────────────────────────────────────────────────────

interface DrawerSubject extends Subject {
  _classConfigs: Map<string, SubjectClassConfig>
}

function SubjectDrawer({ subject, allSections, staff, onSave, onDelete, onClose }: {
  subject: Subject | null
  allSections: Section[]
  staff: Staff[]
  onSave: (s: Subject) => void
  onDelete: (id: string) => void
  onClose: () => void
}) {
  const isNew = !subject?.id || subject.id === '__new'

  const defaultSubject = (): Subject => ({
    id: makeId(), name: '', category: 'Compulsory',
    periodsPerWeek: 5, sessionDuration: 40, maxPeriodsPerDay: 2,
    color: '#7C6FE0', sections: [], classConfigs: [],
  })

  const [form, setForm] = useState<Subject>(subject ?? defaultSubject())
  const [selectedSections, setSelectedSections] = useState<Set<string>>(
    new Set(subject?.sections ?? [])
  )
  const [classConfigs, setClassConfigs] = useState<Map<string, SubjectClassConfig>>(() => {
    const m = new Map<string, SubjectClassConfig>()
    subject?.classConfigs.forEach(c => {
      const key = c.sectionName ?? c.classId ?? ''
      if (key) m.set(key, c)
    })
    return m
  })
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [gradeSearch, setGradeSearch] = useState('')
  const [configOpen, setConfigOpen] = useState(false)

  // Reset when subject changes
  useEffect(() => {
    const s = subject ?? defaultSubject()
    setForm(s)
    setSelectedSections(new Set(s.sections ?? []))
    const m = new Map<string, SubjectClassConfig>()
    s.classConfigs.forEach(c => {
      const key = c.sectionName ?? c.classId ?? ''
      if (key) m.set(key, c)
    })
    setClassConfigs(m)
    setShowDeleteConfirm(false)
    setGradeSearch('')
  }, [subject?.id])

  // Grade-group all sections
  const gradeGroups = useMemo(() => {
    const map = new Map<string, Section[]>()
    allSections.forEach(s => {
      const g = extractGrade(s.name)
      if (!map.has(g)) map.set(g, [])
      map.get(g)!.push(s)
    })
    return map
  }, [allSections])

  const filteredGrades = useMemo(() => {
    const q = gradeSearch.toLowerCase()
    const result = new Map<string, Section[]>()
    gradeGroups.forEach((secs, grade) => {
      const matched = secs.filter(s =>
        !q || s.name.toLowerCase().includes(q) || grade.toLowerCase().includes(q)
      )
      if (matched.length > 0) result.set(grade, matched)
    })
    return result
  }, [gradeGroups, gradeSearch])

  const eligibleTeachers = useMemo(
    () => staff.filter(t => t.subjects.includes(form.name)),
    [staff, form.name]
  )

  function toggleSection(sectionName: string) {
    setSelectedSections(prev => {
      const next = new Set(prev)
      if (next.has(sectionName)) {
        next.delete(sectionName)
      } else {
        next.add(sectionName)
        if (!classConfigs.has(sectionName)) {
          setClassConfigs(m => {
            const nm = new Map(m)
            nm.set(sectionName, {
              sectionName,
              periodsPerWeek: form.periodsPerWeek,
              maxPeriodsPerDay: form.maxPeriodsPerDay,
              sessionDuration: form.sessionDuration,
            })
            return nm
          })
        }
      }
      return next
    })
  }

  function assignAll() {
    const next = new Set<string>()
    const nm = new Map(classConfigs)
    allSections.forEach(s => {
      next.add(s.name)
      if (!nm.has(s.name)) {
        nm.set(s.name, {
          sectionName: s.name,
          periodsPerWeek: form.periodsPerWeek,
          maxPeriodsPerDay: form.maxPeriodsPerDay,
          sessionDuration: form.sessionDuration,
        })
      }
    })
    setSelectedSections(next)
    setClassConfigs(nm)
  }

  function assignByGrade(grade: string) {
    const secs = gradeGroups.get(grade) ?? []
    const nm = new Map(classConfigs)
    const next = new Set(selectedSections)
    secs.forEach(s => {
      next.add(s.name)
      if (!nm.has(s.name)) {
        nm.set(s.name, {
          sectionName: s.name,
          periodsPerWeek: form.periodsPerWeek,
          maxPeriodsPerDay: form.maxPeriodsPerDay,
          sessionDuration: form.sessionDuration,
        })
      }
    })
    setSelectedSections(next)
    setClassConfigs(nm)
  }

  function clearAll() {
    setSelectedSections(new Set())
  }

  function handleSave() {
    const sections = Array.from(selectedSections)
    const configs: SubjectClassConfig[] = []
    classConfigs.forEach((cfg, key) => {
      if (selectedSections.has(key)) configs.push(cfg)
    })
    onSave({ ...form, sections, classConfigs: configs })
  }

  function updateConfig(sectionName: string, cfg: SubjectClassConfig) {
    setClassConfigs(m => new Map(m).set(sectionName, cfg))
  }

  const open = subject !== null
  const selectedList = allSections.filter(s => selectedSections.has(s.name))

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.18)',
          zIndex: 200, opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.2s',
        }}
      />
      {/* Panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 520,
        background: '#fff', zIndex: 201, boxShadow: '-4px 0 32px rgba(0,0,0,0.12)',
        display: 'flex', flexDirection: 'column',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.25s cubic-bezier(.32,.72,0,1)',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px', borderBottom: '1px solid #f0f0f0',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8, background: form.color + '22',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <BookOpen size={17} color={form.color || P} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e' }}>
              {isNew ? 'New Subject' : form.name || 'Subject'}
            </div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 1 }}>
              {selectedSections.size} class{selectedSections.size !== 1 ? 'es' : ''} assigned
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <X size={18} color="#999" />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

          {/* ── Basic Info ── */}
          <section style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
              Subject Info
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label style={labelStyle}>
                Subject Name *
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Mathematics"
                  style={{ ...fieldStyle, gridColumn: 'span 2' }}
                />
              </label>
              <label style={labelStyle}>
                Short Name
                <input
                  value={form.shortName ?? ''}
                  onChange={e => setForm(f => ({ ...f, shortName: e.target.value }))}
                  placeholder="e.g. Math"
                  style={fieldStyle}
                />
              </label>
              <label style={labelStyle}>
                Category
                <select
                  value={form.category ?? 'Compulsory'}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  style={fieldStyle}
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
              <label style={labelStyle}>
                Color
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="color" value={form.color}
                    onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                    style={{ width: 36, height: 32, border: '1px solid #e0dcff', borderRadius: 5, cursor: 'pointer', padding: 2 }}
                  />
                  <span style={{ fontSize: 12, color: '#888' }}>{form.color}</span>
                </div>
              </label>
            </div>

            {/* Default period config */}
            <div style={{ marginTop: 12, padding: '10px 12px', background: '#faf9ff', borderRadius: 8, border: '1px solid #eeebff' }}>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>Default Schedule (applied to newly assigned classes)</div>
              <div style={{ display: 'flex', gap: 12 }}>
                <label style={labelStyle}>
                  Periods/week
                  <input type="number" min={0} max={30} value={form.periodsPerWeek}
                    onChange={e => setForm(f => ({ ...f, periodsPerWeek: +e.target.value }))}
                    style={inputStyle} />
                </label>
                <label style={labelStyle}>
                  Max/day
                  <input type="number" min={1} max={8} value={form.maxPeriodsPerDay}
                    onChange={e => setForm(f => ({ ...f, maxPeriodsPerDay: +e.target.value }))}
                    style={inputStyle} />
                </label>
                <label style={labelStyle}>
                  Duration (min)
                  <input type="number" min={10} max={180} step={5} value={form.sessionDuration}
                    onChange={e => setForm(f => ({ ...f, sessionDuration: +e.target.value }))}
                    style={inputStyle} />
                </label>
              </div>
            </div>
          </section>

          {/* ── Applicable Classes ── */}
          <section style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '0.08em', textTransform: 'uppercase', flex: 1 }}>
                Applicable Classes
              </div>
              <button onClick={assignAll} style={ghostBtn}>Assign to All</button>
              <button onClick={clearAll} style={{ ...ghostBtn, color: '#e74c3c', borderColor: '#fde8e8' }}>Clear All</button>
            </div>

            {allSections.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: '#bbb', fontSize: 13 }}>
                No classes found. Add classes in the Classes tab first.
              </div>
            ) : (
              <>
                {/* Search */}
                <div style={{ position: 'relative', marginBottom: 10 }}>
                  <Search size={13} color="#bbb" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    value={gradeSearch}
                    onChange={e => setGradeSearch(e.target.value)}
                    placeholder="Search classes..."
                    style={{ ...fieldStyle, paddingLeft: 30, marginBottom: 0 }}
                  />
                </div>

                {/* Grade-grouped checkboxes */}
                <div style={{ maxHeight: 280, overflowY: 'auto', border: '1px solid #eeebff', borderRadius: 8, overflow: 'hidden' }}>
                  {Array.from(filteredGrades.entries()).map(([grade, secs], gi) => (
                    <div key={grade}>
                      {/* Grade header */}
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '6px 12px', background: '#f7f5ff',
                        borderBottom: '1px solid #eeebff',
                        borderTop: gi > 0 ? '1px solid #eeebff' : undefined,
                      }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: P, flex: 1 }}>Grade {grade}</span>
                        <button
                          onClick={() => assignByGrade(grade)}
                          style={{ fontSize: 10, color: P, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                        >
                          Select All
                        </button>
                      </div>
                      {/* Section rows */}
                      {secs.map(s => (
                        <label key={s.id} style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '7px 12px', cursor: 'pointer',
                          background: selectedSections.has(s.name) ? '#f0eeff' : '#fff',
                          borderBottom: '1px solid #f5f3ff',
                          transition: 'background 0.12s',
                        }}>
                          <input
                            type="checkbox"
                            checked={selectedSections.has(s.name)}
                            onChange={() => toggleSection(s.name)}
                            style={{ accentColor: P, width: 14, height: 14 }}
                          />
                          <span style={{ fontSize: 13, color: '#1a1a2e', flex: 1 }}>{s.name}</span>
                          {selectedSections.has(s.name) && (
                            <span style={{ fontSize: 11, color: '#888' }}>
                              {classConfigs.get(s.name)?.periodsPerWeek ?? form.periodsPerWeek}p/w
                            </span>
                          )}
                        </label>
                      ))}
                    </div>
                  ))}
                  {filteredGrades.size === 0 && (
                    <div style={{ padding: 20, textAlign: 'center', color: '#bbb', fontSize: 13 }}>
                      No classes match "{gradeSearch}"
                    </div>
                  )}
                </div>
              </>
            )}
          </section>

          {/* ── Per-Class Period Config ── */}
          {selectedList.length > 0 && (
            <section style={{ marginBottom: 24 }}>
              <button
                onClick={() => setConfigOpen(o => !o)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: configOpen ? 10 : 0,
                }}
              >
                <Settings size={13} color={configOpen ? P : '#aaa'} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '0.08em', textTransform: 'uppercase', flex: 1, textAlign: 'left' }}>
                  Per-Class Period Config
                </span>
                {configOpen
                  ? <ChevronDown size={14} color="#aaa" />
                  : <ChevronRight size={14} color="#aaa" />}
                <span style={{ fontSize: 11, color: '#bbb' }}>{selectedList.length} classes</span>
              </button>
              {configOpen && (
                <div>
                  {selectedList.map(s => (
                    <PerClassConfig
                      key={s.name}
                      section={s}
                      config={classConfigs.get(s.name) ?? {
                        sectionName: s.name,
                        periodsPerWeek: form.periodsPerWeek,
                        maxPeriodsPerDay: form.maxPeriodsPerDay,
                        sessionDuration: form.sessionDuration,
                      }}
                      onChange={cfg => updateConfig(s.name, cfg)}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ── Eligible Teachers ── */}
          <section style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
              Eligible Teachers
            </div>
            {eligibleTeachers.length === 0 ? (
              <div style={{
                padding: '12px 14px', borderRadius: 8, background: '#fdfcff',
                border: '1px dashed #ddd', fontSize: 12, color: '#aaa',
              }}>
                No teachers have "{form.name || 'this subject'}" in their expertise.
                Assign subject expertise in the Teachers tab.
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {eligibleTeachers.map(t => (
                  <div key={t.id} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: '#f0eeff', borderRadius: 6, padding: '4px 10px',
                    border: `1px solid ${P}22`,
                  }}>
                    <span style={{
                      width: 22, height: 22, borderRadius: '50%', background: P + '22',
                      color: P, fontSize: 9, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>{initials(t.name)}</span>
                    <span style={{ fontSize: 12, color: '#1a1a2e', fontWeight: 500 }}>{t.name}</span>
                    {t.isClassTeacher && (
                      <span style={{ fontSize: 10, color: '#888', marginLeft: 2 }}>
                        · {t.isClassTeacher}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── Danger zone ── */}
          {!isNew && (
            <section style={{ borderTop: '1px solid #fde8e8', paddingTop: 16 }}>
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: 'none', border: '1px solid #fde8e8', borderRadius: 6,
                    color: '#e74c3c', fontSize: 12, fontWeight: 600, padding: '6px 12px', cursor: 'pointer',
                  }}
                >
                  <Trash2 size={13} /> Remove Subject
                </button>
              ) : (
                <div style={{
                  padding: '12px 14px', borderRadius: 8, background: '#fff5f5',
                  border: '1px solid #fde8e8',
                }}>
                  <div style={{ fontSize: 13, color: '#e74c3c', fontWeight: 600, marginBottom: 8 }}>
                    Remove "{form.name}"?
                  </div>
                  <div style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>
                    This will remove the subject and all class assignments.
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => onDelete(form.id)}
                      style={{ background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                    >
                      Yes, Remove
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      style={{ background: '#f5f5f5', color: '#666', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px', borderTop: '1px solid #f0f0f0',
          display: 'flex', gap: 10, justifyContent: 'flex-end',
        }}>
          <button onClick={onClose} style={cancelBtn}>Cancel</button>
          <button
            onClick={handleSave}
            disabled={!form.name.trim()}
            style={{
              ...saveBtn,
              opacity: form.name.trim() ? 1 : 0.5,
              cursor: form.name.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            {isNew ? 'Add Subject' : 'Save Changes'}
          </button>
        </div>
      </div>
    </>
  )
}

const labelStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11, color: '#666', fontWeight: 600 }
const fieldStyle: React.CSSProperties = {
  padding: '7px 10px', border: '1px solid #e0dcff', borderRadius: 6,
  fontSize: 13, color: '#1a1a2e', outline: 'none', background: '#fff',
  fontFamily: 'inherit',
}
const ghostBtn: React.CSSProperties = {
  fontSize: 11, color: P, background: '#f0eeff', border: `1px solid ${P}33`,
  borderRadius: 5, padding: '4px 10px', cursor: 'pointer', fontWeight: 600,
}
const cancelBtn: React.CSSProperties = {
  padding: '8px 18px', background: '#f5f5f5', color: '#555', border: 'none',
  borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer',
}
const saveBtn: React.CSSProperties = {
  padding: '8px 20px', background: P, color: '#fff', border: 'none',
  borderRadius: 7, fontSize: 13, fontWeight: 700, cursor: 'pointer',
}

// ─────────────────────────────────────────────────────────────
// Main panel
// ─────────────────────────────────────────────────────────────

export function SubjectsPanel({ subjects, setSubjects, sections, staff }: {
  subjects: Subject[]
  setSubjects: (s: Subject[]) => void
  sections: Section[]
  staff: Staff[]
}) {
  const [drawerSubject, setDrawerSubject] = useState<Subject | null>(null)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return subjects
    return subjects.filter(s =>
      s.name.toLowerCase().includes(q) || (s.category ?? '').toLowerCase().includes(q)
    )
  }, [subjects, search])

  function openNew() {
    setDrawerSubject({
      id: '__new', name: '', category: 'Compulsory',
      periodsPerWeek: 5, sessionDuration: 40, maxPeriodsPerDay: 2,
      color: '#7C6FE0', sections: [], classConfigs: [],
    })
  }

  function handleSave(updated: Subject) {
    const exists = subjects.some(s => s.id === updated.id)
    if (exists) {
      setSubjects(subjects.map(s => s.id === updated.id ? updated : s))
    } else {
      setSubjects([...subjects, { ...updated, id: makeId() }])
    }
    setDrawerSubject(null)
  }

  function handleDelete(id: string) {
    setSubjects(subjects.filter(s => s.id !== id))
    setDrawerSubject(null)
  }

  const eligibleTeachersFor = useCallback(
    (subjectName: string) => staff.filter(t => t.subjects.includes(subjectName)),
    [staff]
  )

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>

      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '0 0 16px',
        borderBottom: '1px solid #f0f0f0', marginBottom: 0,
      }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={14} color="#bbb" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search subjects..."
            style={{
              width: '100%', padding: '8px 10px 8px 32px',
              border: '1px solid #e8e8f0', borderRadius: 8, fontSize: 13,
              color: '#1a1a2e', outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
        <button
          onClick={openNew}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: P, color: '#fff', border: 'none', borderRadius: 8,
            padding: '8px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            whiteSpace: 'nowrap', flexShrink: 0,
          }}
        >
          <Plus size={15} /> Add Subject
        </button>
      </div>

      {/* Subject→Classes relationship note */}
      <div style={{
        margin: '14px 0 0', padding: '10px 14px',
        background: '#fff8e8', borderRadius: 8, border: '1px solid #ffe8a3',
        fontSize: 12, color: '#8a6500', display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <BookOpen size={13} color="#c9920a" />
        <span>
          <strong>Subject → Classes relationship:</strong> Click "Assign" on any subject to choose which classes it applies to,
          set per-class periods, and see which teachers can teach it.
        </span>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto', marginTop: 14 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#bbb' }}>
            <BookOpen size={32} color="#e0dcff" style={{ marginBottom: 12 }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: '#aaa', marginBottom: 6 }}>
              {search ? 'No subjects match your search' : 'No subjects yet'}
            </div>
            {!search && (
              <button onClick={openNew} style={{ ...ghostBtn, fontSize: 13, padding: '8px 16px', marginTop: 8 }}>
                <Plus size={13} style={{ marginRight: 4 }} />Add your first subject
              </button>
            )}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#faf9ff' }}>
                <th style={TH}>Subject</th>
                <th style={TH}>Category</th>
                <th style={{ ...TH, textAlign: 'center' }}>p/w</th>
                <th style={TH}>Applicable Classes</th>
                <th style={TH}>Eligible Teachers</th>
                <th style={{ ...TH, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(sub => {
                const sectionNames = sub.sections ?? []
                const teachers = eligibleTeachersFor(sub.name)
                return (
                  <tr key={sub.id} style={{ cursor: 'default' }}>
                    <td style={TD}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <ColorDot color={sub.color} />
                        <span style={{ fontWeight: 600, color: '#1a1a2e' }}>{sub.name}</span>
                        {sub.shortName && (
                          <span style={{ fontSize: 10, color: '#aaa', fontWeight: 400 }}>({sub.shortName})</span>
                        )}
                      </div>
                    </td>
                    <td style={TD}>
                      <span style={{
                        background: '#f0f0f7', color: '#555', borderRadius: 4,
                        padding: '2px 7px', fontSize: 11, fontWeight: 500,
                      }}>
                        {sub.category ?? 'Compulsory'}
                      </span>
                    </td>
                    <td style={{ ...TD, textAlign: 'center', fontWeight: 700, color: P }}>
                      {sub.periodsPerWeek}
                    </td>
                    <td style={TD}>
                      <ClassChips sections={sectionNames} count={sectionNames.length} />
                    </td>
                    <td style={TD}>
                      <TeacherChips teachers={teachers} />
                    </td>
                    <td style={{ ...TD, textAlign: 'right' }}>
                      <button
                        onClick={() => setDrawerSubject(sub)}
                        style={{
                          background: '#f0eeff', color: P, border: `1px solid ${P}33`,
                          borderRadius: 6, padding: '5px 12px', fontSize: 12,
                          fontWeight: 600, cursor: 'pointer',
                        }}
                      >
                        Assign
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Drawer */}
      <SubjectDrawer
        subject={drawerSubject}
        allSections={sections}
        staff={staff}
        onSave={handleSave}
        onDelete={handleDelete}
        onClose={() => setDrawerSubject(null)}
      />
    </div>
  )
}
