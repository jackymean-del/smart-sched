/**
 * RoomsPanel — room setup with class and subject relationships.
 *
 * Relationships owned here:
 *   Room → Home Class  (read-only, derived from sections where section.room === room.name)
 *   Room → Subject mapping  (e.g. Physics Lab → Physics Practical)
 *
 * Room details and usage rules are editable via a side drawer.
 */

import { useState, useRef, useEffect, useMemo } from 'react'
import type { Subject, Section } from '@/types'
import type { RoomRow } from '@/components/master/EntityGrids'
import { Plus, Search, Trash2, X, Building2, Home, BookOpen } from 'lucide-react'

const P = '#7C6FE0'
const ROOM_TYPES = ['Classroom', 'Lab', 'Computer Lab', 'Library', 'Hall', 'Gym', 'Staff Room', 'Other']

function makeId() { return Math.random().toString(36).slice(2, 9) }

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
// RoomTypeBadge
// ─────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<string, string> = {
  Classroom: '#4a9eff', Lab: '#e74c3c', 'Computer Lab': '#2ecc71',
  Library: '#f39c12', Hall: '#9b59b6', Gym: '#1abc9c',
  'Staff Room': '#95a5a6', Other: '#888',
}

function RoomTypeBadge({ type }: { type: string }) {
  const color = TYPE_COLORS[type] ?? '#888'
  return (
    <span style={{
      background: color + '18', color, borderRadius: 4,
      padding: '2px 7px', fontSize: 11, fontWeight: 600,
      border: `1px solid ${color}33`,
    }}>{type}</span>
  )
}

// ─────────────────────────────────────────────────────────────
// SubjectChipPicker — inline chip multi-select for subject mapping
// ─────────────────────────────────────────────────────────────

function SubjectChipPicker({ selected, subjects, onChange }: {
  selected: string[]
  subjects: Subject[]
  onChange: (v: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  useClickOutside(ref, () => setOpen(false), open)

  const filtered = subjects.filter(s =>
    s.name.toLowerCase().includes(q.toLowerCase()) && !selected.includes(s.name)
  )

  function remove(name: string) { onChange(selected.filter(s => s !== name)) }
  function add(name: string) { onChange([...selected, name]); setQ('') }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          minHeight: 36, border: `1px solid ${open ? P : '#e0dcff'}`, borderRadius: 6,
          padding: '4px 8px', cursor: 'text', display: 'flex',
          flexWrap: 'wrap', gap: 4, alignItems: 'center', background: '#fff',
        }}
      >
        {selected.map(name => (
          <span key={name} style={{
            display: 'flex', alignItems: 'center', gap: 3,
            background: '#f0eeff', color: P, borderRadius: 4, padding: '2px 6px',
            fontSize: 11, fontWeight: 500, border: `1px solid ${P}22`,
          }}>
            {name}
            <button
              onClick={e => { e.stopPropagation(); remove(name) }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1, color: P }}
            >
              <X size={10} />
            </button>
          </span>
        ))}
        {selected.length === 0 && !open && (
          <span style={{ fontSize: 12, color: '#bbb' }}>Map subjects to this room…</span>
        )}
        <input
          value={q} onChange={e => { setQ(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder={selected.length > 0 ? '' : ''}
          style={{
            border: 'none', outline: 'none', fontSize: 12, color: '#1a1a2e',
            minWidth: 60, flex: 1, background: 'transparent',
          }}
        />
      </div>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: '#fff', border: '1px solid #e8e4ff', borderRadius: 7,
          boxShadow: '0 6px 20px rgba(124,111,224,0.12)', zIndex: 50,
          maxHeight: 180, overflowY: 'auto', marginTop: 3,
        }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '10px 12px', fontSize: 12, color: '#bbb' }}>
              {subjects.length === 0 ? 'No subjects added yet' : 'No matches'}
            </div>
          ) : filtered.map(s => (
            <div
              key={s.id}
              onMouseDown={e => { e.preventDefault(); add(s.name) }}
              style={{
                padding: '8px 12px', fontSize: 13, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f5f3ff')}
              onMouseLeave={e => (e.currentTarget.style.background = '')}
            >
              <span style={{
                width: 8, height: 8, borderRadius: '50%', background: s.color,
                flexShrink: 0,
              }} />
              {s.name}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// RoomDrawer
// ─────────────────────────────────────────────────────────────

interface RoomExt extends RoomRow {
  subjectMappings?: string[]  // subject names this room is mapped to
  notes?: string
}

function RoomDrawer({ room, sections, subjects, onSave, onDelete, onClose }: {
  room: RoomExt | null
  sections: Section[]
  subjects: Subject[]
  onSave: (r: RoomExt) => void
  onDelete: (id: string) => void
  onClose: () => void
}) {
  const isNew = !room?.id || room.id === '__new'

  const defaultRoom = (): RoomExt => ({
    id: makeId(), name: '', type: 'Classroom', capacity: 40,
    building: '', floor: '', subjectMappings: [], notes: '',
  })

  const [form, setForm] = useState<RoomExt>(room ?? defaultRoom())
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    setForm(room ?? defaultRoom())
    setShowDeleteConfirm(false)
  }, [room?.id])

  // Read-only: which section calls this room home
  const homeClass = useMemo(
    () => sections.filter(s => s.room === form.name),
    [sections, form.name]
  )

  const open = room !== null

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.18)',
          zIndex: 200, opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.2s',
        }}
      />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 480,
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
            width: 36, height: 36, borderRadius: 8,
            background: (TYPE_COLORS[form.type] ?? '#888') + '18',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Building2 size={17} color={TYPE_COLORS[form.type] ?? '#888'} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e' }}>
              {isNew ? 'New Room' : form.name || 'Room'}
            </div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 1 }}>
              {form.type} · Cap {form.capacity}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <X size={18} color="#999" />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

          {/* ── Room Details ── */}
          <section style={{ marginBottom: 22 }}>
            <SectionHeading>Room Details</SectionHeading>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label style={{ ...labelStyle, gridColumn: 'span 2' }}>
                Room Name *
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Room 101, Physics Lab"
                  style={fieldStyle}
                />
              </label>
              <label style={labelStyle}>
                Room Type
                <select
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  style={fieldStyle}
                >
                  {ROOM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
              <label style={labelStyle}>
                Capacity
                <input
                  type="number" min={1} max={999} value={form.capacity}
                  onChange={e => setForm(f => ({ ...f, capacity: +e.target.value }))}
                  style={fieldStyle}
                />
              </label>
              <label style={labelStyle}>
                Building
                <input
                  value={form.building}
                  onChange={e => setForm(f => ({ ...f, building: e.target.value }))}
                  placeholder="e.g. Block A"
                  style={fieldStyle}
                />
              </label>
              <label style={labelStyle}>
                Floor
                <input
                  value={form.floor}
                  onChange={e => setForm(f => ({ ...f, floor: e.target.value }))}
                  placeholder="e.g. Ground, 1st"
                  style={fieldStyle}
                />
              </label>
            </div>
          </section>

          {/* ── Home Class (read-only) ── */}
          <section style={{ marginBottom: 22 }}>
            <SectionHeading>Home Class</SectionHeading>
            <div style={{
              padding: '10px 14px', borderRadius: 8, background: '#faf9ff',
              border: '1px solid #eeebff', display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <Home size={14} color={P} />
              {homeClass.length === 0 ? (
                <span style={{ fontSize: 12, color: '#bbb', fontStyle: 'italic' }}>
                  {form.name
                    ? 'No class uses this as their home room'
                    : 'Save the room name to see home class assignments'}
                </span>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {homeClass.map(s => (
                    <span key={s.id} style={{
                      background: '#f0eeff', color: P, borderRadius: 4, padding: '2px 8px',
                      fontSize: 12, fontWeight: 500, border: `1px solid ${P}22`,
                    }}>{s.name}</span>
                  ))}
                </div>
              )}
            </div>
            <p style={{ fontSize: 11, color: '#aaa', marginTop: 6, marginBottom: 0 }}>
              Home room assignment is managed in the Classes tab.
            </p>
          </section>

          {/* ── Subject Mapping ── */}
          <section style={{ marginBottom: 22 }}>
            <SectionHeading>Subject Mapping</SectionHeading>
            <p style={{ fontSize: 12, color: '#888', marginBottom: 10, marginTop: 0 }}>
              Map subjects that are taught in this room (e.g. Physics Lab → Physics, Physics Practical).
              The scheduler will prefer this room when booking those subjects.
            </p>
            <SubjectChipPicker
              selected={form.subjectMappings ?? []}
              subjects={subjects}
              onChange={v => setForm(f => ({ ...f, subjectMappings: v }))}
            />
          </section>

          {/* ── Notes / Usage Rules ── */}
          <section style={{ marginBottom: 22 }}>
            <SectionHeading>Notes & Usage Rules</SectionHeading>
            <textarea
              value={form.notes ?? ''}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="e.g. Requires booking 48h in advance. Not available Mon morning."
              rows={3}
              style={{
                ...fieldStyle, width: '100%', resize: 'vertical',
                fontFamily: 'inherit', boxSizing: 'border-box',
              }}
            />
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
                  <Trash2 size={13} /> Remove Room
                </button>
              ) : (
                <div style={{
                  padding: '12px 14px', borderRadius: 8, background: '#fff5f5',
                  border: '1px solid #fde8e8',
                }}>
                  <div style={{ fontSize: 13, color: '#e74c3c', fontWeight: 600, marginBottom: 6 }}>
                    Remove "{form.name}"?
                  </div>
                  <div style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>
                    Any class using this as their home room will lose the assignment.
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
            onClick={() => onSave(form)}
            disabled={!form.name.trim()}
            style={{
              ...saveBtn,
              opacity: form.name.trim() ? 1 : 0.5,
              cursor: form.name.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            {isNew ? 'Add Room' : 'Save Changes'}
          </button>
        </div>
      </div>
    </>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, color: '#888',
      letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10,
    }}>{children}</div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11, color: '#666', fontWeight: 600,
}
const fieldStyle: React.CSSProperties = {
  padding: '7px 10px', border: '1px solid #e0dcff', borderRadius: 6,
  fontSize: 13, color: '#1a1a2e', outline: 'none', background: '#fff', fontFamily: 'inherit',
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

export function RoomsPanel({ rooms, setRooms, sections, subjects }: {
  rooms: RoomExt[]
  setRooms: (r: RoomExt[]) => void
  sections: Section[]
  subjects: Subject[]
}) {
  const [drawerRoom, setDrawerRoom] = useState<RoomExt | null>(null)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return rooms
    return rooms.filter(r =>
      r.name.toLowerCase().includes(q) || r.type.toLowerCase().includes(q) ||
      r.building.toLowerCase().includes(q)
    )
  }, [rooms, search])

  // Home class count per room name
  const homeClassCount = useMemo(() => {
    const map = new Map<string, number>()
    sections.forEach(s => {
      if (s.room) map.set(s.room, (map.get(s.room) ?? 0) + 1)
    })
    return map
  }, [sections])

  function openNew() {
    setDrawerRoom({
      id: '__new', name: '', type: 'Classroom', capacity: 40,
      building: '', floor: '', subjectMappings: [], notes: '',
    })
  }

  function handleSave(updated: RoomExt) {
    const exists = rooms.some(r => r.id === updated.id)
    if (exists) {
      setRooms(rooms.map(r => r.id === updated.id ? updated : r))
    } else {
      setRooms([...rooms, { ...updated, id: makeId() }])
    }
    setDrawerRoom(null)
  }

  function handleDelete(id: string) {
    setRooms(rooms.filter(r => r.id !== id))
    setDrawerRoom(null)
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>

      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '0 0 16px',
        borderBottom: '1px solid #f0f0f0',
      }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={14} color="#bbb" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search rooms..."
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
          <Plus size={15} /> Add Room
        </button>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto', marginTop: 14 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#bbb' }}>
            <Building2 size={32} color="#e0dcff" style={{ marginBottom: 12 }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: '#aaa', marginBottom: 6 }}>
              {search ? 'No rooms match your search' : 'No rooms yet'}
            </div>
            {!search && (
              <button
                onClick={openNew}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: '#f0eeff', color: P, border: `1px solid ${P}33`,
                  borderRadius: 6, padding: '8px 16px', fontSize: 13,
                  fontWeight: 600, cursor: 'pointer', marginTop: 8,
                }}
              >
                <Plus size={13} /> Add your first room
              </button>
            )}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#faf9ff' }}>
                <th style={TH}>Room</th>
                <th style={TH}>Type</th>
                <th style={{ ...TH, textAlign: 'center' }}>Cap</th>
                <th style={TH}>Location</th>
                <th style={TH}>Home Class</th>
                <th style={TH}>Subjects</th>
                <th style={{ ...TH, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(room => {
                const homeCt = homeClassCount.get(room.name) ?? 0
                const mappings = room.subjectMappings ?? []
                return (
                  <tr key={room.id}>
                    <td style={TD}>
                      <div style={{ fontWeight: 600, color: '#1a1a2e' }}>{room.name}</div>
                      {room.notes && (
                        <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }} title={room.notes}>
                          {room.notes.slice(0, 40)}{room.notes.length > 40 ? '…' : ''}
                        </div>
                      )}
                    </td>
                    <td style={TD}><RoomTypeBadge type={room.type} /></td>
                    <td style={{ ...TD, textAlign: 'center', fontWeight: 600, color: '#555' }}>
                      {room.capacity}
                    </td>
                    <td style={TD}>
                      <span style={{ fontSize: 12, color: '#666' }}>
                        {[room.building, room.floor].filter(Boolean).join(' · ') || '—'}
                      </span>
                    </td>
                    <td style={TD}>
                      {homeCt === 0 ? (
                        <span style={{ fontSize: 12, color: '#ccc' }}>—</span>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Home size={12} color={P} />
                          <span style={{ fontSize: 12, color: P, fontWeight: 600 }}>{homeCt} class{homeCt !== 1 ? 'es' : ''}</span>
                        </div>
                      )}
                    </td>
                    <td style={TD}>
                      {mappings.length === 0 ? (
                        <span style={{ fontSize: 12, color: '#ccc' }}>—</span>
                      ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                          {mappings.slice(0, 2).map(m => (
                            <span key={m} style={{
                              background: '#f0eeff', color: P, borderRadius: 4,
                              padding: '1px 6px', fontSize: 10, fontWeight: 500,
                              border: `1px solid ${P}22`,
                            }}>{m}</span>
                          ))}
                          {mappings.length > 2 && (
                            <span style={{
                              background: '#f5f5f5', color: '#888', borderRadius: 4,
                              padding: '1px 6px', fontSize: 10, fontWeight: 500,
                            }}>+{mappings.length - 2}</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td style={{ ...TD, textAlign: 'right' }}>
                      <button
                        onClick={() => setDrawerRoom(room)}
                        style={{
                          background: '#f0eeff', color: P, border: `1px solid ${P}33`,
                          borderRadius: 6, padding: '5px 12px', fontSize: 12,
                          fontWeight: 600, cursor: 'pointer',
                        }}
                      >
                        Edit
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
      <RoomDrawer
        room={drawerRoom}
        sections={sections}
        subjects={subjects}
        onSave={handleSave}
        onDelete={handleDelete}
        onClose={() => setDrawerRoom(null)}
      />
    </div>
  )
}

export type { RoomExt }
