/**
 * TeachersPanel — relationship-driven teacher management.
 *
 * Key relationships owned here:
 *   Teacher ↔ Subject  (inline chip picker, drawer multi-select)
 *   Teacher ↔ Class    (inline class-teacher dropdown)
 *
 * Data model: Staff (legacy) — subjects: string[], isClassTeacher: string
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import type { Staff, Section, Subject } from '@/types'
import { Plus, Search, Trash2, X, ChevronDown } from 'lucide-react'

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const P = '#7C6FE0'
const ROLES = ['Teacher', 'HoD', 'Coordinator', 'Principal', 'Vice Principal', 'Lab Incharge', 'Librarian']
const GENDERS: Array<'male' | 'female' | 'other' | ''> = ['', 'female', 'male', 'other']

function makeId() { return Math.random().toString(36).slice(2, 9) }

// ─────────────────────────────────────────────────────────────
// Shared primitives
// ─────────────────────────────────────────────────────────────

function Chip({ label, onRemove, color = P }: {
  label: string; onRemove?: () => void; color?: string
}) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      padding: '2px 7px 2px 8px', borderRadius: 20,
      background: `${color}14`, border: `1px solid ${color}2A`,
      color, fontSize: 10.5, fontWeight: 600, lineHeight: 1.4, whiteSpace: 'nowrap',
      maxWidth: 130, overflow: 'hidden',
    }}>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
      {onRemove && (
        <button onClick={e => { e.stopPropagation(); onRemove() }}
          style={{
            border: 'none', background: 'none', cursor: 'pointer',
            padding: 0, color, lineHeight: 1, display: 'flex', alignItems: 'center', flexShrink: 0,
          }}>
          <X size={8} />
        </button>
      )}
    </span>
  )
}

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

function SearchDropdown({ items, value, onSelect, placeholder = 'None', emptyLabel = '— None' }: {
  items: { id: string; name: string }[]
  value: string
  onSelect: (v: string) => void
  placeholder?: string
  emptyLabel?: string
}) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const close = useCallback(() => { setOpen(false); setQ('') }, [])
  useClickOutside(ref, close, open)

  const filtered = items.filter(i => i.name.toLowerCase().includes(q.toLowerCase()))

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
          maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{value || placeholder}</span>
        <ChevronDown size={9} style={{ flexShrink: 0 }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 400,
          background: '#fff', border: '1px solid #E8E4FF', borderRadius: 8,
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)', minWidth: 180, maxWidth: 240,
          padding: '6px 0',
        }}>
          <div style={{ padding: '4px 8px 6px' }}>
            <input autoFocus value={q} onChange={e => setQ(e.target.value)}
              placeholder="Search…"
              style={{
                width: '100%', padding: '5px 8px', borderRadius: 5,
                border: '1px solid #E5E7EB', fontSize: 11, fontFamily: 'inherit',
                outline: 'none', boxSizing: 'border-box',
              }} />
          </div>
          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            <button onClick={() => { onSelect(''); close() }}
              style={dropItemStyle(value === '')}>
              {emptyLabel}
            </button>
            {filtered.map(item => (
              <button key={item.id} onClick={() => { onSelect(item.name); close() }}
                style={dropItemStyle(value === item.name)}
                onMouseEnter={e => (e.currentTarget.style.background = '#F5F2FF')}
                onMouseLeave={e => (e.currentTarget.style.background = value === item.name ? '#F5F2FF' : 'transparent')}>
                {item.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function dropItemStyle(active: boolean): React.CSSProperties {
  return {
    display: 'block', width: '100%', padding: '6px 12px',
    border: 'none', background: active ? '#F5F2FF' : 'transparent',
    textAlign: 'left', fontSize: 11.5, color: active ? P : '#13111E',
    cursor: 'pointer', fontFamily: 'inherit',
  }
}

// ─────────────────────────────────────────────────────────────
// Subject chip picker (inline)
// ─────────────────────────────────────────────────────────────

function SubjectChipPicker({ value, allSubjects, onChange }: {
  value: string[]
  allSubjects: Subject[]
  onChange: (v: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const close = useCallback(() => { setOpen(false); setQ('') }, [])
  useClickOutside(ref, close, open)

  const available = allSubjects.filter(
    s => !value.includes(s.name) && s.name.toLowerCase().includes(q.toLowerCase())
  )

  return (
    <div ref={ref} style={{ position: 'relative', display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
      {value.slice(0, 3).map(sub => (
        <Chip key={sub} label={sub} onRemove={() => onChange(value.filter(s => s !== sub))} />
      ))}
      {value.length > 3 && (
        <span style={{
          fontSize: 10, color: '#9B8EF5', fontWeight: 600,
          padding: '2px 6px', borderRadius: 10, background: '#F0EEFF',
        }}>+{value.length - 3}</span>
      )}
      <button onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 2,
          padding: '2px 7px', borderRadius: 20,
          border: '1px dashed #C4BDFF', background: 'transparent',
          color: '#9B8EF5', fontSize: 10, fontWeight: 600, cursor: 'pointer',
        }}>
        <Plus size={8} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 400,
          background: '#fff', border: '1px solid #E8E4FF', borderRadius: 8,
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)', width: 220, padding: '6px 0',
        }}>
          <div style={{ padding: '4px 8px 6px' }}>
            <input autoFocus value={q} onChange={e => setQ(e.target.value)}
              placeholder="Search subjects…"
              style={{
                width: '100%', padding: '5px 8px', borderRadius: 5,
                border: '1px solid #E5E7EB', fontSize: 11, fontFamily: 'inherit',
                outline: 'none', boxSizing: 'border-box',
              }} />
          </div>
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {available.length === 0
              ? <div style={{ padding: '6px 12px', fontSize: 11, color: '#9CA3AF' }}>No more subjects</div>
              : available.map(s => (
                <button key={s.id} onClick={() => { onChange([...value, s.name]); setQ('') }}
                  style={dropItemStyle(false)}
                  onMouseEnter={e => (e.currentTarget.style.background = '#F5F2FF')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  {s.name}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  )
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
        position: 'absolute', right: 0, top: 0, bottom: 0, width: 440,
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

// ─────────────────────────────────────────────────────────────
// Drawer form helpers
// ─────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{
        display: 'block', fontSize: 10.5, fontWeight: 700, color: '#9B8EF5',
        textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6,
      }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', borderRadius: 7,
  border: '1px solid #E5E7EB', fontSize: 13, fontFamily: 'inherit',
  color: '#13111E', outline: 'none', boxSizing: 'border-box',
}

const selectStyle: React.CSSProperties = {
  ...inputStyle, background: '#fff', cursor: 'pointer',
}

// ─────────────────────────────────────────────────────────────
// Teacher edit drawer
// ─────────────────────────────────────────────────────────────

function TeacherDrawer({ teacher, sections, allSubjects, onSave, onClose }: {
  teacher: Staff | null
  sections: Section[]
  allSubjects: Subject[]
  onSave: (t: Staff) => void
  onClose: () => void
}) {
  const [form, setForm] = useState<Staff | null>(null)
  useEffect(() => { setForm(teacher ? { ...teacher } : null) }, [teacher])

  if (!form) return null

  const set = (patch: Partial<Staff>) => setForm(f => f ? { ...f, ...patch } : f)
  const sectionItems = sections.map(s => ({ id: s.id, name: s.name }))

  return (
    <Drawer
      open={!!teacher}
      onClose={onClose}
      title={
        <div>
          <div style={{ fontSize: 10.5, color: '#9B8EF5', fontWeight: 600, marginBottom: 2 }}>
            {form.name ? 'Edit Teacher' : 'New Teacher'}
          </div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#13111E' }}>
            {form.name || 'Unnamed Teacher'}
          </h3>
        </div>
      }
    >
      {/* Identity */}
      <Field label="Full Name">
        <input value={form.name} onChange={e => set({ name: e.target.value })}
          placeholder="e.g. Mrs Ananya Das"
          style={inputStyle}
          onFocus={e => (e.currentTarget.style.borderColor = P)}
          onBlur={e => (e.currentTarget.style.borderColor = '#E5E7EB')} />
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Role">
          <select value={form.role} onChange={e => set({ role: e.target.value })} style={selectStyle}>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </Field>
        <Field label="Gender">
          <select value={form.gender ?? ''} onChange={e => set({ gender: (e.target.value || undefined) as any })} style={selectStyle}>
            {GENDERS.map(g => <option key={g} value={g}>{g || '— Unspecified'}</option>)}
          </select>
        </Field>
      </div>

      {/* Subject expertise */}
      <div style={{ borderTop: '1px solid #F0EFF9', paddingTop: 16, marginTop: 4 }}>
        <Field label="Subject Expertise">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            {form.subjects.length === 0
              ? <span style={{ fontSize: 11, color: '#9CA3AF' }}>No subjects assigned</span>
              : form.subjects.map(sub => (
                <Chip key={sub} label={sub}
                  onRemove={() => set({ subjects: form.subjects.filter(s => s !== sub) })} />
              ))}
          </div>
          <select
            defaultValue=""
            onChange={e => {
              const v = e.target.value
              if (v && !form.subjects.includes(v)) set({ subjects: [...form.subjects, v] })
              e.target.value = ''
            }}
            style={{ ...selectStyle, width: 'auto', fontSize: 11.5, padding: '5px 10px' }}>
            <option value="" disabled>+ Add subject…</option>
            {allSubjects.filter(s => !form.subjects.includes(s.name)).map(s => (
              <option key={s.id} value={s.name}>{s.name}</option>
            ))}
          </select>
        </Field>
      </div>

      {/* Class teacher */}
      <div style={{ borderTop: '1px solid #F0EFF9', paddingTop: 16, marginTop: 4 }}>
        <Field label="Class Teacher Of">
          <SearchDropdown
            items={sectionItems}
            value={form.isClassTeacher}
            onSelect={v => set({ isClassTeacher: v })}
            placeholder="— Not a class teacher"
            emptyLabel="— Not a class teacher"
          />
        </Field>
      </div>

      {/* Load */}
      <div style={{ borderTop: '1px solid #F0EFF9', paddingTop: 16, marginTop: 4 }}>
        <Field label="Max Periods / Week">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="number" min={0} max={60} value={form.maxPeriodsPerWeek}
              onChange={e => set({ maxPeriodsPerWeek: +e.target.value })}
              style={{ ...inputStyle, width: 80, textAlign: 'right' }}
              onFocus={e => (e.currentTarget.style.borderColor = P)}
              onBlur={e => (e.currentTarget.style.borderColor = '#E5E7EB')} />
            <span style={{ fontSize: 12, color: '#9CA3AF' }}>periods / week</span>
          </div>
        </Field>
      </div>

      {/* Future-ready constraints card */}
      <div style={{
        marginTop: 20, padding: '12px 14px', borderRadius: 8,
        background: '#FAFAFE', border: '1px solid #F0EFF9',
      }}>
        <div style={{
          fontSize: 10.5, fontWeight: 700, color: '#C4BDFF',
          textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5,
        }}>
          Constraints · Coming soon
        </div>
        <div style={{ fontSize: 11, color: '#C0BCCC', lineHeight: 1.6 }}>
          Preferred shift, unavailable days, and workload balancing rules —
          will feed directly into the AI scheduling engine.
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
        <button onClick={() => onSave(form)}
          style={{
            flex: 1, padding: '10px', borderRadius: 8, border: 'none',
            background: P, color: '#fff', fontSize: 13, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
          Save Teacher
        </button>
        <button onClick={onClose}
          style={{
            padding: '10px 18px', borderRadius: 8,
            border: '1px solid #E5E7EB', background: '#fff',
            color: '#6B7280', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
          }}>
          Cancel
        </button>
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

export function TeachersPanel({ staff, setStaff, sections, subjects }: {
  staff: Staff[]
  setStaff: (s: Staff[]) => void
  sections: Section[]
  subjects: Subject[]
}) {
  const [search, setSearch]           = useState('')
  const [drawer, setDrawer]           = useState<Staff | null>(null)
  const [confirmDelete, setConfirm]   = useState<string | null>(null)

  const filtered = useMemo(() =>
    staff.filter(t => t.name.toLowerCase().includes(search.toLowerCase()))
  , [staff, search])

  const update = useCallback((id: string, patch: Partial<Staff>) =>
    setStaff(staff.map(t => t.id === id ? { ...t, ...patch } : t))
  , [staff, setStaff])

  const handleSave = useCallback((updated: Staff) => {
    const exists = staff.some(t => t.id === updated.id)
    setStaff(exists
      ? staff.map(t => t.id === updated.id ? updated : t)
      : [...staff, updated]
    )
    setDrawer(null)
  }, [staff, setStaff])

  const handleDelete = useCallback((id: string) => {
    setStaff(staff.filter(t => t.id !== id))
    setConfirm(null)
  }, [staff, setStaff])

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <button
          onClick={() => setDrawer({
            id: makeId(), name: '', role: 'Teacher',
            subjects: [], classes: [], isClassTeacher: '', maxPeriodsPerWeek: 30,
          } as Staff)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 7, border: 'none',
            background: P, color: '#fff', fontSize: 12, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
          <Plus size={12} /> Add Teacher
        </button>

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={12} style={{ position: 'absolute', left: 8, color: '#C0BDDA', pointerEvents: 'none' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search teachers…"
            style={{
              paddingLeft: 26, paddingRight: 10, paddingTop: 6, paddingBottom: 6,
              borderRadius: 7, border: '1px solid #E5E7EB',
              fontSize: 12, fontFamily: 'inherit', outline: 'none', width: 200, color: '#374151',
            }} />
        </div>

        <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 'auto' }}>
          {staff.length} teacher{staff.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Relationship context note */}
      <div style={{
        padding: '9px 14px', borderRadius: 8,
        background: '#F5F2FF', border: '1px solid #EDE9FF',
        marginBottom: 14, fontSize: 11.5, color: '#4B5275', lineHeight: 1.5,
      }}>
        <strong style={{ color: '#13111E' }}>Teachers own subject expertise and class assignments.</strong>
        {' '}Edit subjects inline with chips. Class teacher assignment here reflects in the Classes tab.
      </div>

      {/* Table */}
      <div style={{ border: '1px solid #F0EFF9', borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...TH, width: 190 }}>Teacher</th>
              <th style={TH}>Subject Expertise</th>
              <th style={{ ...TH, width: 160 }}>Class Teacher</th>
              <th style={{ ...TH, width: 88, textAlign: 'right' }}>Load</th>
              <th style={{ ...TH, width: 44 }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} style={{ ...TD, textAlign: 'center', color: '#9CA3AF', padding: '40px 12px' }}>
                  {search ? 'No teachers match your search.' : 'No teachers yet — click "Add Teacher" or use AI Generate.'}
                </td>
              </tr>
            )}
            {filtered.map(teacher => (
              <tr key={teacher.id}
                onMouseEnter={e => (e.currentTarget.style.background = '#FAFAFE')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>

                {/* Name + avatar */}
                <td style={{ ...TD, cursor: 'pointer' }} onClick={() => setDrawer(teacher)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                      background: `${P}14`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10.5, fontWeight: 700, color: P,
                    }}>
                      {teacher.name ? teacher.name.replace(/^(Mr|Mrs|Ms|Dr|Prof)\.?\s+/i, '').slice(0, 2).toUpperCase() : '?'}
                    </div>
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: '#13111E' }}>{teacher.name || '—'}</div>
                      <div style={{ fontSize: 10, color: '#9CA3AF' }}>{teacher.role || 'Teacher'}</div>
                    </div>
                  </div>
                </td>

                {/* Subject chips */}
                <td style={TD} onClick={e => e.stopPropagation()}>
                  <SubjectChipPicker
                    value={teacher.subjects}
                    allSubjects={subjects}
                    onChange={subs => update(teacher.id, { subjects: subs })}
                  />
                </td>

                {/* Class teacher picker */}
                <td style={TD} onClick={e => e.stopPropagation()}>
                  <SearchDropdown
                    items={sections.map(s => ({ id: s.id, name: s.name }))}
                    value={teacher.isClassTeacher}
                    onSelect={v => update(teacher.id, { isClassTeacher: v })}
                    placeholder="None"
                    emptyLabel="— Not a class teacher"
                  />
                </td>

                {/* Load */}
                <td style={{ ...TD, textAlign: 'right' }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, color: '#6B5ECD',
                    fontFamily: "'DM Mono', monospace",
                  }}>
                    {teacher.maxPeriodsPerWeek}<span style={{ fontWeight: 400, color: '#C4BDFF' }}>p/w</span>
                  </span>
                </td>

                {/* Delete */}
                <td style={TD} onClick={e => e.stopPropagation()}>
                  <button onClick={() => setConfirm(teacher.id)}
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
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete confirm dialog */}
      {confirmDelete && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 500,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(19,17,30,0.25)',
        }}>
          <div style={{
            background: '#fff', borderRadius: 12, padding: '24px 28px',
            boxShadow: '0 8px 40px rgba(0,0,0,0.15)', width: 320,
            fontFamily: "'Inter', sans-serif",
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#13111E', marginBottom: 8 }}>Delete teacher?</div>
            <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 20 }}>
              <strong>{staff.find(t => t.id === confirmDelete)?.name}</strong> will be removed.
              Any class-teacher or subject assignments will be cleared.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => handleDelete(confirmDelete)}
                style={{
                  flex: 1, padding: '9px', borderRadius: 7, border: 'none',
                  background: '#EF4444', color: '#fff', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}>Delete</button>
              <button onClick={() => setConfirm(null)}
                style={{
                  flex: 1, padding: '9px', borderRadius: 7,
                  border: '1px solid #E5E7EB', background: '#fff',
                  color: '#6B7280', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit / add drawer */}
      <TeacherDrawer
        teacher={drawer}
        sections={sections}
        allSubjects={subjects}
        onSave={handleSave}
        onClose={() => setDrawer(null)}
      />
    </div>
  )
}
