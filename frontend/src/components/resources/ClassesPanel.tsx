/**
 * ClassesPanel — operational class setup.
 *
 * Relationships owned here:
 *   Class → Home Room  (searchable dropdown from rooms list)
 *   Class → Class Teacher  (read-only display, derived from staff.isClassTeacher)
 *
 * Intentionally does NOT allow assigning class teachers here —
 * that relationship is owned by TeachersPanel (single source of truth).
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import type { Section, Staff } from '@/types'
import type { RoomRow } from '@/components/master/EntityGrids'
import { Plus, Search, Trash2, X, ChevronDown, User } from 'lucide-react'

const P = '#7C6FE0'
const STREAMS = ['', 'Science', 'Commerce', 'Humanities', 'General']

function makeId() { return Math.random().toString(36).slice(2, 9) }

function extractGrade(name: string): string {
  const idx = name.lastIndexOf('-')
  if (idx <= 0) return ''
  const suffix = name.slice(idx + 1)
  if (suffix.length === 0 || suffix.length > 3) return ''
  const mid = name.slice(0, idx)
  return mid.replace(/-(sci|com|arts?|hum|gen|pcm|pcb)$/i, '').trim()
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

function RoomPicker({ value, rooms, onChange }: {
  value: string
  rooms: RoomRow[]
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const close = useCallback(() => { setOpen(false); setQ('') }, [])
  useClickOutside(ref, close, open)

  const filtered = rooms.filter(r => r.name.toLowerCase().includes(q.toLowerCase()))

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '3px 8px', borderRadius: 6,
          border: value ? `1px solid ${P}38` : '1px dashed #D1D5DB',
          background: value ? '#F5F2FF' : 'transparent',
          color: value ? P : '#9CA3AF',
          fontSize: 11, fontWeight: value ? 600 : 400,
          cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
          maxWidth: 140, overflow: 'hidden',
        }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{value || 'Assign room…'}</span>
        <ChevronDown size={9} style={{ flexShrink: 0 }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 400,
          background: '#fff', border: '1px solid #E8E4FF', borderRadius: 8,
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)', minWidth: 200,
          padding: '6px 0',
        }}>
          <div style={{ padding: '4px 8px 6px' }}>
            <input autoFocus value={q} onChange={e => setQ(e.target.value)}
              placeholder="Search rooms…"
              style={{
                width: '100%', padding: '5px 8px', borderRadius: 5,
                border: '1px solid #E5E7EB', fontSize: 11, fontFamily: 'inherit',
                outline: 'none', boxSizing: 'border-box',
              }} />
          </div>
          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            <button onClick={() => { onChange(''); close() }}
              style={itemStyle(false)}>
              — No room assigned
            </button>
            {filtered.map(r => (
              <button key={r.id} onClick={() => { onChange(r.name); close() }}
                style={itemStyle(value === r.name)}
                onMouseEnter={e => (e.currentTarget.style.background = '#F5F2FF')}
                onMouseLeave={e => (e.currentTarget.style.background = value === r.name ? '#F5F2FF' : 'transparent')}>
                <span style={{ flex: 1 }}>{r.name}</span>
                <span style={{ fontSize: 9.5, color: '#9CA3AF', marginLeft: 8 }}>{r.type}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function itemStyle(active: boolean): React.CSSProperties {
  return {
    display: 'flex', alignItems: 'center', width: '100%', padding: '6px 12px',
    border: 'none', background: active ? '#F5F2FF' : 'transparent',
    textAlign: 'left', fontSize: 11.5, color: active ? P : '#13111E',
    cursor: 'pointer', fontFamily: 'inherit',
  }
}

// ─────────────────────────────────────────────────────────────
// Drawer
// ─────────────────────────────────────────────────────────────

function Drawer({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: React.ReactNode; children: React.ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  if (!open) return null
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(19,17,30,0.18)' }} onClick={onClose} />
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: 420,
        background: '#fff', boxShadow: '-8px 0 40px rgba(0,0,0,0.12)',
        display: 'flex', flexDirection: 'column',
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}>
        <div style={{
          padding: '18px 24px 14px', borderBottom: '1px solid #F0EFF9',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{ flex: 1 }}>{title}</div>
          <button onClick={onClose} style={{
            border: 'none', background: '#F5F4FC', cursor: 'pointer',
            width: 28, height: 28, borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280',
          }}><X size={14} /></button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px 32px' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{
        display: 'block', fontSize: 10.5, fontWeight: 700, color: '#9B8EF5',
        textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6,
      }}>{label}</label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', borderRadius: 7,
  border: '1px solid #E5E7EB', fontSize: 13, fontFamily: 'inherit',
  color: '#13111E', outline: 'none', boxSizing: 'border-box',
}

// ─────────────────────────────────────────────────────────────
// Section edit drawer
// ─────────────────────────────────────────────────────────────

type SectionExt = Section & { strength?: number; stream?: string }

function SectionDrawer({ section, rooms, classTeacherName, onSave, onClose }: {
  section: SectionExt | null
  rooms: RoomRow[]
  classTeacherName: string
  onSave: (s: SectionExt) => void
  onClose: () => void
}) {
  const [form, setForm] = useState<SectionExt | null>(null)
  useEffect(() => { setForm(section ? { ...section } : null) }, [section])

  if (!form) return null
  const set = (patch: Partial<SectionExt>) => setForm(f => f ? { ...f, ...patch } : f)

  return (
    <Drawer open={!!section} onClose={onClose} title={
      <div>
        <div style={{ fontSize: 10.5, color: '#9B8EF5', fontWeight: 600, marginBottom: 2 }}>
          {form.name ? 'Edit Class' : 'New Class'}
        </div>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#13111E' }}>
          {form.name || 'Unnamed Class'}
        </h3>
      </div>
    }>
      <Field label="Section Name">
        <input value={form.name} onChange={e => {
          const name = e.target.value
          set({ name, grade: extractGrade(name) || form.grade })
        }}
          placeholder="e.g. IX-B or XI-Sci-A"
          style={inputStyle}
          onFocus={e => (e.currentTarget.style.borderColor = P)}
          onBlur={e => (e.currentTarget.style.borderColor = '#E5E7EB')} />
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Grade">
          <input value={form.grade} onChange={e => set({ grade: e.target.value })}
            placeholder="e.g. IX"
            style={inputStyle}
            onFocus={e => (e.currentTarget.style.borderColor = P)}
            onBlur={e => (e.currentTarget.style.borderColor = '#E5E7EB')} />
        </Field>
        <Field label="Strength">
          <input type="number" min={0} max={100} value={(form as any).strength ?? ''}
            onChange={e => set({ strength: +e.target.value } as any)}
            placeholder="35"
            style={inputStyle}
            onFocus={e => (e.currentTarget.style.borderColor = P)}
            onBlur={e => (e.currentTarget.style.borderColor = '#E5E7EB')} />
        </Field>
      </div>

      <Field label="Stream (XI–XII only)">
        <select value={(form as any).stream ?? ''} onChange={e => set({ stream: e.target.value } as any)}
          style={{ ...inputStyle, background: '#fff', cursor: 'pointer' }}>
          {STREAMS.map(s => <option key={s} value={s}>{s || '— Not applicable'}</option>)}
        </select>
      </Field>

      <div style={{ borderTop: '1px solid #F0EFF9', paddingTop: 16, marginTop: 4 }}>
        <Field label="Home Room">
          <RoomPicker value={form.room} rooms={rooms} onChange={v => set({ room: v })} />
        </Field>
      </div>

      {/* Class teacher — read-only from Teachers tab */}
      <div style={{ borderTop: '1px solid #F0EFF9', paddingTop: 16, marginTop: 4 }}>
        <div style={{
          fontSize: 10.5, fontWeight: 700, color: '#9B8EF5',
          textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8,
        }}>
          Class Teacher
        </div>
        {classTeacherName ? (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '7px 12px', borderRadius: 8,
            background: '#F5F2FF', border: `1px solid ${P}28`,
          }}>
            <div style={{
              width: 22, height: 22, borderRadius: 6, background: `${P}18`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9.5, fontWeight: 700, color: P,
            }}>
              {classTeacherName.replace(/^(Mr|Mrs|Ms|Dr)\.?\s+/i, '').slice(0, 2).toUpperCase()}
            </div>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: P }}>{classTeacherName}</span>
          </div>
        ) : (
          <div style={{ fontSize: 12, color: '#9CA3AF', fontStyle: 'italic' }}>
            No class teacher assigned — go to the Teachers tab to assign.
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
        <button onClick={() => onSave(form)}
          style={{
            flex: 1, padding: '10px', borderRadius: 8, border: 'none',
            background: P, color: '#fff', fontSize: 13, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>Save Class</button>
        <button onClick={onClose}
          style={{
            padding: '10px 18px', borderRadius: 8,
            border: '1px solid #E5E7EB', background: '#fff',
            color: '#6B7280', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
          }}>Cancel</button>
      </div>
    </Drawer>
  )
}

// ─────────────────────────────────────────────────────────────
// Table styles
// ─────────────────────────────────────────────────────────────

const TH: React.CSSProperties = {
  padding: '9px 12px', textAlign: 'left',
  fontSize: 10, fontWeight: 800, color: '#9CA3AF',
  textTransform: 'uppercase', letterSpacing: '0.08em',
  background: '#FAFAFE', borderBottom: '2px solid #F0EFF9',
  whiteSpace: 'nowrap',
}

const TD: React.CSSProperties = {
  padding: '10px 12px', borderBottom: '1px solid #F5F4FC',
  verticalAlign: 'middle',
}

// ─────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────

export function ClassesPanel({ sections, setSections, rooms, staff }: {
  sections: Section[]
  setSections: (s: Section[]) => void
  rooms: RoomRow[]
  staff: Staff[]
}) {
  const [search, setSearch]   = useState('')
  const [drawer, setDrawer]   = useState<SectionExt | null>(null)
  const [confirmDel, setDel]  = useState<string | null>(null)

  // Derive class teacher name for a given section
  const classTeacherMap = useMemo(() => {
    const map: Record<string, string> = {}
    staff.forEach(t => { if (t.isClassTeacher) map[t.isClassTeacher] = t.name })
    return map
  }, [staff])

  const filtered = useMemo(() =>
    sections.filter(s => s.name.toLowerCase().includes(search.toLowerCase()))
  , [sections, search])

  const update = useCallback((id: string, patch: Partial<Section>) =>
    setSections(sections.map(s => s.id === id ? { ...s, ...patch } : s))
  , [sections, setSections])

  const handleSave = useCallback((updated: SectionExt) => {
    const exists = sections.some(s => s.id === updated.id)
    setSections(exists
      ? sections.map(s => s.id === updated.id ? updated : s)
      : [...sections, updated]
    )
    setDrawer(null)
  }, [sections, setSections])

  const handleDelete = useCallback((id: string) => {
    setSections(sections.filter(s => s.id !== id))
    setDel(null)
  }, [sections, setSections])

  // Group sections by grade for a visual separator
  const gradeGroups = useMemo(() => {
    const groups: { grade: string; rows: SectionExt[] }[] = []
    const seen: Record<string, number> = {}
    filtered.forEach(s => {
      const g = (s as any).grade || '—'
      if (seen[g] === undefined) { seen[g] = groups.length; groups.push({ grade: g, rows: [] }) }
      groups[seen[g]].rows.push(s as SectionExt)
    })
    return groups
  }, [filtered])

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <button
          onClick={() => setDrawer({
            id: makeId(), name: '', grade: '', room: '', classTeacher: '',
          } as SectionExt)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 7, border: 'none',
            background: P, color: '#fff', fontSize: 12, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
          <Plus size={12} /> Add Class
        </button>

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={12} style={{ position: 'absolute', left: 8, color: '#C0BDDA', pointerEvents: 'none' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search classes…"
            style={{
              paddingLeft: 26, paddingRight: 10, paddingTop: 6, paddingBottom: 6,
              borderRadius: 7, border: '1px solid #E5E7EB',
              fontSize: 12, fontFamily: 'inherit', outline: 'none', width: 200, color: '#374151',
            }} />
        </div>

        <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 'auto' }}>
          {sections.length} section{sections.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Context note */}
      <div style={{
        padding: '9px 14px', borderRadius: 8,
        background: '#F0FDF4', border: '1px solid #BBF7D0',
        marginBottom: 14, fontSize: 11.5, color: '#166534', lineHeight: 1.5,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <User size={13} style={{ flexShrink: 0 }} />
        <span>
          <strong>Class teacher assignments</strong> are managed in the Teachers tab and reflected here as read-only.
          Home rooms are assigned directly in this tab.
        </span>
      </div>

      {/* Table */}
      <div style={{ border: '1px solid #F0EFF9', borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...TH, width: 140 }}>Class</th>
              <th style={{ ...TH, width: 90 }}>Grade</th>
              <th style={{ ...TH, width: 120 }}>Stream</th>
              <th style={{ ...TH, width: 80, textAlign: 'right' }}>Strength</th>
              <th style={{ ...TH, width: 160 }}>Home Room</th>
              <th style={TH}>Class Teacher</th>
              <th style={{ ...TH, width: 44 }}></th>
            </tr>
          </thead>
          <tbody>
            {gradeGroups.length === 0 && (
              <tr>
                <td colSpan={7} style={{ ...TD, textAlign: 'center', color: '#9CA3AF', padding: '40px 12px' }}>
                  {search ? 'No classes match your search.' : 'No classes yet — click "Add Class" or use AI Generate.'}
                </td>
              </tr>
            )}
            {gradeGroups.map(({ grade, rows }) => (
              rows.map((sec, idx) => (
                <>
                  {idx === 0 && (
                    <tr key={`grade-${grade}`}>
                      <td colSpan={7} style={{
                        padding: '6px 12px 4px',
                        fontSize: 9.5, fontWeight: 800, color: '#C0BDDA',
                        textTransform: 'uppercase', letterSpacing: '0.1em',
                        background: '#FAFAFE', borderBottom: '1px solid #F0EFF9',
                      }}>
                        Grade {grade}
                      </td>
                    </tr>
                  )}
                  <tr key={sec.id}
                    onMouseEnter={e => (e.currentTarget.style.background = '#FAFAFE')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>

                    <td style={{ ...TD, fontWeight: 600, cursor: 'pointer' }} onClick={() => setDrawer(sec)}>
                      <span style={{ fontSize: 12.5, color: '#13111E' }}>{sec.name}</span>
                    </td>

                    <td style={{ ...TD, fontSize: 12, color: '#4B5275' }}>
                      {sec.grade || '—'}
                    </td>

                    <td style={TD}>
                      {(sec as any).stream ? (
                        <span style={{
                          fontSize: 10.5, fontWeight: 600, padding: '2px 8px', borderRadius: 10,
                          background: '#F0EEFF', color: '#7C6FE0',
                        }}>{(sec as any).stream}</span>
                      ) : <span style={{ color: '#D1D5DB', fontSize: 11 }}>—</span>}
                    </td>

                    <td style={{ ...TD, textAlign: 'right', fontSize: 12, color: '#4B5275', fontFamily: "'DM Mono', monospace" }}>
                      {(sec as any).strength ?? '—'}
                    </td>

                    <td style={TD} onClick={e => e.stopPropagation()}>
                      <RoomPicker
                        value={sec.room}
                        rooms={rooms}
                        onChange={v => update(sec.id, { room: v })}
                      />
                    </td>

                    <td style={TD}>
                      {classTeacherMap[sec.name] ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{
                            width: 20, height: 20, borderRadius: 5, background: `${P}14`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 9, fontWeight: 700, color: P, flexShrink: 0,
                          }}>
                            {classTeacherMap[sec.name].replace(/^(Mr|Mrs|Ms|Dr)\.?\s+/i, '').slice(0, 2).toUpperCase()}
                          </div>
                          <span style={{ fontSize: 11.5, color: '#4B5275', fontWeight: 500 }}>
                            {classTeacherMap[sec.name]}
                          </span>
                        </div>
                      ) : (
                        <span style={{ fontSize: 11, color: '#D1D5DB', fontStyle: 'italic' }}>
                          Not assigned
                        </span>
                      )}
                    </td>

                    <td style={TD} onClick={e => e.stopPropagation()}>
                      <button onClick={() => setDel(sec.id)}
                        style={{
                          border: 'none', background: 'transparent', cursor: 'pointer',
                          color: '#D1D5DB', padding: '3px 4px', borderRadius: 5,
                          display: 'flex', alignItems: 'center',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#D1D5DB')}>
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                </>
              ))
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete confirm */}
      {confirmDel && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 500,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(19,17,30,0.25)',
        }}>
          <div style={{
            background: '#fff', borderRadius: 12, padding: '24px 28px',
            boxShadow: '0 8px 40px rgba(0,0,0,0.15)', width: 300,
            fontFamily: "'Inter', sans-serif",
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#13111E', marginBottom: 8 }}>Delete class?</div>
            <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 20 }}>
              <strong>{sections.find(s => s.id === confirmDel)?.name}</strong> will be removed.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => handleDelete(confirmDel)}
                style={{
                  flex: 1, padding: '9px', borderRadius: 7, border: 'none',
                  background: '#EF4444', color: '#fff', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}>Delete</button>
              <button onClick={() => setDel(null)}
                style={{
                  flex: 1, padding: '9px', borderRadius: 7,
                  border: '1px solid #E5E7EB', background: '#fff',
                  color: '#6B7280', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <SectionDrawer
        section={drawer}
        rooms={rooms}
        classTeacherName={drawer ? classTeacherMap[drawer.name] ?? '' : ''}
        onSave={handleSave}
        onClose={() => setDrawer(null)}
      />
    </div>
  )
}
