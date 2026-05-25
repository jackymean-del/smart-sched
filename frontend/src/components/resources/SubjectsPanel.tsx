/**
 * SubjectsPanel — Tab 2. Premium compact redesign.
 *
 * Features:
 * - generateShortName()      — 50+ board-standard academic abbreviations (CBSE/ICSE/IB)
 * - suggestClassesForSubject()— curriculum-aware AI assignment engine
 * - AI Assign Classes         — applies grade/stream rules across all unassigned subjects
 * - Paste / Bulk Upload       — TSV/CSV import from Excel or Google Sheets
 * - Fixed column widths       — no more stretched empty columns
 * - Row-hover-reveal actions  — clean professional density
 */

import { useState, useRef, useMemo, useEffect } from 'react'
import type { Subject, Section } from '@/types'
import { Trash2, Plus, ChevronDown, ChevronRight, BookOpen, Settings } from 'lucide-react'
import { P, P_D, P_L, P_B, TH, TD, TABLE_CARD, InlineChipSelect, PasteModal } from './shared'
import type { ChipOption } from './shared'

function makeId() { return Math.random().toString(36).slice(2, 9) }

function getGrade(name: string): string {
  const t = name.trim()
  const idx = t.lastIndexOf('-')
  if (idx > 0 && t.slice(idx + 1).length <= 3)
    return t.slice(0, idx).replace(/-(sci|com|arts?|hum|gen|pcm|pcb)$/i, '').trim()
  return t
}

const GRADE_ORDER = ['Nursery','LKG','UKG','I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII']
function gradeKey(g: string) { const i = GRADE_ORDER.indexOf(g); return i >= 0 ? i : 100 + g.charCodeAt(0) }

const CATS = ['Compulsory','Language','4th Optional','5th Optional','6th Optional','Practical','Activity','EST','CCA','Skill']

// ─── AI Shortform Engine ──────────────────────────────────────────────────────
const SHORT_MAP: Record<string, string> = {
  'Mathematics': 'MATH', 'English': 'ENG', 'Science': 'SCI',
  'Social Studies': 'SST', 'Social Science': 'SOC SCI',
  'Physics': 'PHY', 'Chemistry': 'CHEM', 'Biology': 'BIO',
  'Hindi': 'HIN', 'Sanskrit': 'SANS', 'Sanskrit / MIL': 'SANS',
  'Odia': 'ODI', 'Odia / Regional Language': 'ODI',
  'Computer Science': 'CS', 'Informatics Practices': 'IP',
  'EVS': 'EVS', 'Environmental Studies': 'ENV',
  'Accountancy': 'ACC', 'Business Studies': 'BST',
  'Economics': 'ECO', 'History': 'HIST', 'Geography': 'GEO',
  'Political Science': 'POL SCI', 'Psychology': 'PSY',
  'Physical Education': 'PE', 'Artificial Intelligence': 'AI',
  'English Literature': 'ENG LIT', 'English Language': 'ENG',
  'Moral Science': 'MS', 'Entrepreneurship': 'ENT',
  'Number Work': 'NUM', 'G.K.': 'GK', 'General Knowledge': 'GK',
  'Drawing': 'DRW', 'Art & Craft': 'ART', 'Music': 'MUS',
  'Dance': 'DANCE', 'Library': 'LIB', 'SUPW / Life Skills': 'SUPW',
  'Yoga & Health': 'YOGA', 'Scout & Guide': 'SCOUT',
  'Activity / Free Play': 'ACT', 'Nursery Rhymes & Stories': 'NRS',
  'Mathematics (Optional)': 'MATH OPT', 'Applied Mathematics': 'APPL MATH',
  'Home Science': 'HOME SCI', 'Fine Arts': 'FINE ART',
  'Vocational Studies': 'VOC', 'Biotechnology': 'BIOTECH',
  'Legal Studies': 'LEGAL', 'Sociology': 'SOC', 'Statistics': 'STAT',
  'French': 'FRN', 'German': 'GER', 'Spanish': 'SPA',
  'Tamil': 'TAM', 'Telugu': 'TEL', 'Kannada': 'KAN',
  'Malayalam': 'MAL', 'Gujarati': 'GUJ', 'Punjabi': 'PUN',
  'Marathi': 'MAR', 'Urdu': 'URD', 'Bengali': 'BEN',
}

export function generateShortName(name: string): string {
  const n = name.trim()
  if (SHORT_MAP[n]) return SHORT_MAP[n]
  const lower = n.toLowerCase()
  for (const [k, v] of Object.entries(SHORT_MAP))
    if (k.toLowerCase() === lower) return v
  for (const [k, v] of Object.entries(SHORT_MAP))
    if (lower.startsWith(k.toLowerCase() + ' ')) return v + ' ' + lower.slice(k.length + 1).slice(0, 3).toUpperCase()
  const stopWords = new Set(['and','the','of','in','for','a','an','&','/'])
  const words = n.split(/[\s/&()+,]+/).filter(w => w.length > 1 && !/^\d+$/.test(w) && !stopWords.has(w.toLowerCase()))
  if (words.length === 0) return n.slice(0, 5).toUpperCase()
  if (words.length === 1) { const w = words[0].toUpperCase(); return w.length <= 5 ? w : w.slice(0, 4) }
  if (words.length === 2) {
    const [a, b] = words.map(w => w.toUpperCase())
    if (a.length <= 2 && b.length <= 4) return `${a} ${b}`
    return `${a.slice(0, 3)} ${b.slice(0, 3)}`
  }
  return words.slice(0, 3).map(w => w[0].toUpperCase()).join('')
}

// ─── AI Curriculum Engine ─────────────────────────────────────────────────────
const GRADE_GROUP_MAP = new Map<string, string>([
  ['Nursery','preK'], ['LKG','preK'], ['UKG','preK'],
  ['I','primary'], ['II','primary'], ['III','primary'], ['IV','primary'], ['V','primary'],
  ['VI','middle'], ['VII','middle'], ['VIII','middle'],
  ['IX','secondary'], ['X','secondary'],
  ['XI','srSec'], ['XII','srSec'],
])
function getGradeGroup(g: string) { return GRADE_GROUP_MAP.get(g) ?? 'middle' }
function detectStream(sec: string) {
  const n = sec.toLowerCase()
  if (/sci|pcm|pcb/.test(n)) return 'science'
  if (/com(?!p)/.test(n)) return 'commerce'
  if (/arts?|hum/.test(n)) return 'arts'
  return 'general'
}

interface CurrRule { grades: string[]; streams?: string[] }
const CURRICULUM: Record<string, CurrRule> = {
  // All levels
  'English':                  { grades: ['preK','primary','middle','secondary','srSec'] },
  'Physical Education':       { grades: ['preK','primary','middle','secondary','srSec'] },
  'Art & Craft':              { grades: ['preK','primary','middle','secondary'] },
  'Drawing':                  { grades: ['primary','middle','secondary'] },
  'Music':                    { grades: ['preK','primary','middle'] },
  'Dance':                    { grades: ['preK','primary','middle'] },
  'Library':                  { grades: ['preK','primary','middle','secondary'] },
  'Moral Science':            { grades: ['preK','primary','middle','secondary'] },
  'Yoga & Health':            { grades: ['primary','middle','secondary'] },
  'Scout & Guide':            { grades: ['primary','middle','secondary'] },
  'G.K.':                     { grades: ['preK','primary','middle'] },
  // Pre-K
  'Nursery Rhymes & Stories': { grades: ['preK'] },
  'Activity / Free Play':     { grades: ['preK'] },
  'Number Work':              { grades: ['preK'] },
  'EVS':                      { grades: ['preK','primary'] },
  // Primary+
  'Mathematics':              { grades: ['primary','middle','secondary','srSec'] },
  'Hindi':                    { grades: ['primary','middle','secondary'] },
  'Computer Science':         { grades: ['primary','middle','secondary','srSec'] },
  'SUPW / Life Skills':       { grades: ['middle','secondary'] },
  'Odia / Regional Language': { grades: ['primary','middle','secondary'] },
  // Middle+
  'Science':                  { grades: ['middle','secondary'] },
  'Social Studies':           { grades: ['middle','secondary'] },
  'Sanskrit / MIL':           { grades: ['middle','secondary'] },
  'Environmental Studies':    { grades: ['middle','secondary'] },
  // Secondary+
  'Physics':                  { grades: ['secondary','srSec'] },
  'Chemistry':                { grades: ['secondary','srSec'] },
  'Biology':                  { grades: ['secondary','srSec'] },
  'History':                  { grades: ['secondary','srSec'] },
  'Geography':                { grades: ['secondary','srSec'] },
  'Political Science':        { grades: ['secondary','srSec'] },
  'Economics':                { grades: ['secondary','srSec'] },
  // Sr. Secondary stream-specific
  'Accountancy':              { grades: ['srSec'], streams: ['commerce'] },
  'Business Studies':         { grades: ['srSec'], streams: ['commerce'] },
  'Informatics Practices':    { grades: ['srSec'], streams: ['science','commerce'] },
  'Mathematics (Optional)':   { grades: ['srSec'], streams: ['science','commerce'] },
  'Psychology':               { grades: ['srSec'], streams: ['arts'] },
  'Sociology':                { grades: ['srSec'], streams: ['arts'] },
  'Entrepreneurship':         { grades: ['srSec'] },
  'English Literature':       { grades: ['srSec'] },
  'English Language':         { grades: ['srSec'] },
}

export function suggestClassesForSubject(
  subjectName: string,
  sections: Array<{ name: string }>,
): string[] {
  const name = subjectName.trim()
  let rule: CurrRule | undefined = CURRICULUM[name]
  if (!rule) {
    const lower = name.toLowerCase()
    for (const [k, v] of Object.entries(CURRICULUM)) {
      if (k.toLowerCase() === lower) { rule = v; break }
    }
  }
  if (!rule) {
    const lower = name.toLowerCase()
    for (const [k, v] of Object.entries(CURRICULUM)) {
      if (lower.startsWith(k.toLowerCase()) || k.toLowerCase().split(' ').some(w => w.length > 4 && lower.includes(w))) {
        rule = v; break
      }
    }
  }
  if (!rule) rule = { grades: ['middle', 'secondary'] }

  return sections
    .filter(sec => {
      const group = getGradeGroup(getGrade(sec.name))
      if (!rule!.grades.includes(group)) return false
      if (group === 'srSec' && rule!.streams?.length) {
        const stream = detectStream(sec.name)
        return rule!.streams.includes(stream) || stream === 'general'
      }
      return true
    })
    .map(s => s.name)
}

// ─── Input style ──────────────────────────────────────────────────────────────
const inp: React.CSSProperties = {
  padding: '3px 6px', border: '1px solid #E4E0FF', borderRadius: 4,
  fontSize: 12, color: '#111028', outline: 'none', fontFamily: 'inherit', background: '#FAFAFE',
}

// Toolbar button styles
const outlineBtn = (active = false): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: 4,
  background: active ? P_L : '#fff',
  color: active ? P_D : '#6B6891',
  border: `1px solid ${active ? P_B : '#DDD8FF'}`,
  borderRadius: 5, padding: '4px 9px', fontSize: 11, fontWeight: 600,
  cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
  whiteSpace: 'nowrap' as const,
})

// ─── Inline edit cell ─────────────────────────────────────────────────────────
function EditCell({ value, onSave, placeholder = '…', width = 100 }: {
  value: string; onSave: (v: string) => void; placeholder?: string; width?: number
}) {
  const [e, setE] = useState(false)
  const [t, setT] = useState(value)
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { if (e) ref.current?.focus() }, [e])
  useEffect(() => { setT(value) }, [value])
  function commit() { onSave(t.trim() || value); setE(false) }
  if (e) return (
    <input ref={ref} value={t} onChange={ev => setT(ev.target.value)}
      onBlur={commit}
      onKeyDown={ev => { if (ev.key === 'Enter') commit(); if (ev.key === 'Escape') { setT(value); setE(false) } }}
      style={{ ...inp, width }}
    />
  )
  return (
    <span onClick={() => setE(true)} title="Click to edit"
      style={{ cursor: 'text', padding: '2px 3px', borderRadius: 3, display: 'inline-block', minWidth: 28, color: value ? '#111028' : '#C4C0DC' }}
      onMouseEnter={ev => (ev.currentTarget.style.background = '#EDE9FF')}
      onMouseLeave={ev => (ev.currentTarget.style.background = '')}
    >{value || placeholder}</span>
  )
}

// ─── Expandable settings ─────────────────────────────────────────────────────
function OptionalSettings({ sub, onChange }: { sub: Subject; onChange: (patch: Partial<Subject>) => void }) {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '7px 12px', background: '#FAFAFE', borderTop: '1px solid #EEE9FF', flexWrap: 'wrap', alignItems: 'flex-end' }}>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 10.5, color: '#6B6891', fontWeight: 600 }}>
        Category
        <select value={sub.category ?? 'Compulsory'} onChange={e => onChange({ category: e.target.value })} style={inp}>
          {CATS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 10.5, color: '#6B6891', fontWeight: 600 }}>
        Session (min)
        <input type="number" value={sub.sessionDuration} min={10} max={180} step={5}
          onChange={e => onChange({ sessionDuration: +e.target.value })}
          style={{ ...inp, width: 56 }}
        />
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 10.5, color: '#6B6891', fontWeight: 600 }}>
        Max/day
        <input type="number" value={sub.maxPeriodsPerDay} min={1} max={8}
          onChange={e => onChange({ maxPeriodsPerDay: +e.target.value })}
          style={{ ...inp, width: 46 }}
        />
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#555', fontWeight: 600, cursor: 'pointer', paddingBottom: 2 }}>
        <input type="checkbox" checked={!!sub.requiresLab} onChange={e => onChange({ requiresLab: e.target.checked })} style={{ accentColor: P }} />
        Lab required
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#555', fontWeight: 600, cursor: 'pointer', paddingBottom: 2 }}>
        <input type="checkbox" checked={!!sub.isOptional} onChange={e => onChange({ isOptional: e.target.checked })} style={{ accentColor: P }} />
        Optional
      </label>
    </div>
  )
}

// ─── Add row ──────────────────────────────────────────────────────────────────
function AddRow({ onAdd }: { onAdd: (s: Subject) => void }) {
  const [active, setActive] = useState(false)
  const [name, setName] = useState('')
  const [ppw, setPpw]   = useState(5)
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { if (active) ref.current?.focus() }, [active])

  function commit() {
    if (!name.trim()) { setActive(false); return }
    onAdd({
      id: makeId(), name: name.trim(),
      shortName: generateShortName(name.trim()),
      category: 'Compulsory', periodsPerWeek: ppw,
      sessionDuration: 45, maxPeriodsPerDay: 2,
      color: P, isOptional: false, requiresLab: false,
      sections: [], classConfigs: [],
    } as unknown as Subject)
    setName(''); setPpw(5); setActive(false)
  }

  if (!active) return (
    <tr>
      <td colSpan={5} style={{ ...TD, padding: '7px 8px' }}>
        <button onClick={() => setActive(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'none', border: '1px dashed #C8C2F0', borderRadius: 5, color: P, fontSize: 11.5, fontWeight: 600, padding: '3px 10px', cursor: 'pointer' }}>
          <Plus size={11} /> Add Subject
        </button>
      </td>
    </tr>
  )

  return (
    <tr style={{ background: '#FAFAFE' }}>
      <td style={TD}>
        <input ref={ref} value={name} onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setActive(false) }}
          placeholder="Subject name" style={{ ...inp, width: '100%', boxSizing: 'border-box' }}
        />
      </td>
      <td style={TD}>
        <span style={{ fontSize: 10.5, color: P_D, fontWeight: 700, background: P_L, padding: '1px 5px', borderRadius: 3 }}>
          {name.trim() ? generateShortName(name.trim()) : '—'}
        </span>
      </td>
      <td style={{ ...TD, textAlign: 'center' }}>
        <input type="number" value={ppw} onChange={e => setPpw(+e.target.value)} min={0} max={30}
          style={{ ...inp, width: 40, textAlign: 'center', fontWeight: 700, color: P }} />
      </td>
      <td style={TD}>
        <span style={{ fontSize: 10.5, color: '#C4C0DC', fontStyle: 'italic' }}>Assign after saving</span>
      </td>
      <td style={{ ...TD, whiteSpace: 'nowrap' }}>
        <button onClick={commit} style={{ background: P, color: '#fff', border: 'none', borderRadius: 5, padding: '4px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', marginRight: 3 }}>✓</button>
        <button onClick={() => setActive(false)} style={{ background: '#F0F0F0', color: '#888', border: 'none', borderRadius: 5, padding: '4px 8px', fontSize: 12, cursor: 'pointer' }}>✗</button>
      </td>
    </tr>
  )
}

// ─── Subject row ──────────────────────────────────────────────────────────────
function SubjectRow({ sub, classOptions, sections, onUpdate, onDelete }: {
  sub: Subject
  classOptions: ChipOption[]
  sections: Section[]
  onUpdate: (patch: Partial<Subject>) => void
  onDelete: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [hovered, setHovered]   = useState(false)
  const selected = sub.sections ?? []

  const aiSuggestion = useMemo(
    () => sections.length > 0 ? suggestClassesForSubject(sub.name, sections) : [],
    [sub.name, sections]
  )

  return (
    <>
      <tr
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ background: hovered ? '#F6F4FF' : '', transition: 'background 0.07s' }}
      >
        {/* Name */}
        <td style={TD}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: sub.color ?? P, flexShrink: 0, border: '1.5px solid rgba(0,0,0,0.08)' }} />
            <EditCell value={sub.name} onSave={v => onUpdate({ name: v })} placeholder="Subject name" width={150} />
          </div>
        </td>

        {/* Short — click to edit, auto-gen from name */}
        <td style={TD}>
          <EditCell value={sub.shortName ?? ''} onSave={v => onUpdate({ shortName: v })} placeholder="Short" width={58} />
        </td>

        {/* p/w — styled badge */}
        <td style={{ ...TD, textAlign: 'center' }}>
          <input
            type="number" value={sub.periodsPerWeek} min={0} max={30}
            onChange={e => onUpdate({ periodsPerWeek: +e.target.value })}
            style={{ width: 40, padding: '2px 3px', border: '1.5px solid #C4BDFF', borderRadius: 5, fontSize: 12.5, color: P_D, fontWeight: 800, outline: 'none', textAlign: 'center', background: P_L, fontFamily: 'inherit' }}
          />
        </td>

        {/* Applicable classes */}
        <td style={{ ...TD }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <InlineChipSelect
              selected={selected}
              options={classOptions}
              onChange={v => onUpdate({ sections: v })}
              placeholder="+ Assign Classes"
              maxChips={3}
            />
            {/* AI suggestion — show when row hovered and no classes assigned */}
            {hovered && selected.length === 0 && aiSuggestion.length > 0 && (
              <button
                title={`AI suggests ${aiSuggestion.length} classes based on curriculum`}
                onClick={() => onUpdate({ sections: aiSuggestion })}
                style={{ fontSize: 10, color: '#fff', background: P, border: 'none', borderRadius: 4, padding: '2px 8px', cursor: 'pointer', fontWeight: 700, flexShrink: 0, whiteSpace: 'nowrap' }}
                onMouseEnter={e => (e.currentTarget.style.background = P_D)}
                onMouseLeave={e => (e.currentTarget.style.background = P)}
              >
                ⚡ AI ({aiSuggestion.length})
              </button>
            )}
          </div>
        </td>

        {/* Actions */}
        <td style={{ ...TD, textAlign: 'right', paddingRight: 6 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
            {/* Settings expand */}
            <button
              onClick={() => setExpanded(o => !o)}
              title="Subject settings"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 3,
                background: expanded ? P_L : (hovered ? '#F0ECFE' : 'transparent'),
                border: `1px solid ${expanded ? P_B : 'transparent'}`,
                borderRadius: 5, padding: '3px 7px', cursor: 'pointer',
                color: expanded ? P : (hovered ? '#9896B5' : 'transparent'),
                fontSize: 10.5, fontWeight: 600, transition: 'all 0.1s', flexShrink: 0,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = P_L; e.currentTarget.style.color = P; e.currentTarget.style.borderColor = P_B }}
              onMouseLeave={e => {
                e.currentTarget.style.background = expanded ? P_L : (hovered ? '#F0ECFE' : 'transparent')
                e.currentTarget.style.color = expanded ? P : (hovered ? '#9896B5' : 'transparent')
                e.currentTarget.style.borderColor = expanded ? P_B : 'transparent'
              }}
            >
              <Settings size={11} />
              {expanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
            </button>
            {/* Delete */}
            <button
              onClick={onDelete}
              title="Delete subject"
              style={{
                background: 'transparent',
                border: `1px solid transparent`,
                borderRadius: 5, padding: '3px 7px', cursor: 'pointer',
                color: hovered ? '#EFA0A0' : 'transparent',
                lineHeight: 1, transition: 'all 0.1s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#FFF0F0'; e.currentTarget.style.color = '#e74c3c'; e.currentTarget.style.borderColor = '#FFCDD2' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = hovered ? '#EFA0A0' : 'transparent'; e.currentTarget.style.borderColor = 'transparent' }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </td>
      </tr>

      {expanded && (
        <tr>
          <td colSpan={5} style={{ padding: 0 }}>
            <OptionalSettings sub={sub} onChange={onUpdate} />
          </td>
        </tr>
      )}
    </>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function SubjectsPanel({ subjects, setSubjects, sections }: {
  subjects: Subject[]
  setSubjects: (s: Subject[]) => void
  sections: Section[]
}) {
  const [search, setSearch]     = useState('')
  const [pasteOpen, setPasteOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return subjects
    return subjects.filter(s => s.name.toLowerCase().includes(q) || (s.category ?? '').toLowerCase().includes(q))
  }, [subjects, search])

  const classOptions = useMemo<ChipOption[]>(() => {
    const map = new Map<string, string[]>()
    sections.forEach(s => {
      const g = getGrade(s.name)
      if (!map.has(g)) map.set(g, [])
      map.get(g)!.push(s.name)
    })
    const sorted = [...map.entries()].sort((a, b) => gradeKey(a[0]) - gradeKey(b[0]))
    const opts: ChipOption[] = []
    sorted.forEach(([grade, names]) => names.forEach(n => opts.push({ value: n, label: n, group: `Grade ${grade}` })))
    return opts
  }, [sections])

  function update(id: string, patch: Partial<Subject>) {
    setSubjects(subjects.map(s => s.id === id ? { ...s, ...patch } : s))
  }
  function remove(id: string) { setSubjects(subjects.filter(s => s.id !== id)) }
  function add(s: Subject) { setSubjects([...subjects, s]) }

  // AI assign — apply curriculum logic to all unassigned subjects
  function aiAssignAll() {
    if (!sections.length) return
    setSubjects(subjects.map(s => ({
      ...s,
      sections: (s.sections ?? []).length > 0
        ? s.sections  // don't override existing assignments
        : suggestClassesForSubject(s.name, sections),
    })))
  }

  // Paste import
  function handlePasteImport(rows: string[][]) {
    const newSubjects = rows
      .map(cells => ({
        id: makeId(),
        name: cells[0]?.trim() || '',
        shortName: cells[1]?.trim() || generateShortName(cells[0]?.trim() || ''),
        category: 'Compulsory' as any,
        periodsPerWeek: parseInt(cells[2]) || 5,
        sessionDuration: 45, maxPeriodsPerDay: 2,
        color: P, isOptional: false, requiresLab: false,
        sections: [], classConfigs: [],
      } as unknown as Subject))
      .filter(s => s.name)
    if (newSubjects.length) setSubjects([...subjects, ...newSubjects])
  }

  // File upload import
  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const text = (ev.target?.result as string) ?? ''
      const rows = text.trim().split('\n').filter(l => l.trim()).map(line => {
        const cells = line.includes('\t') ? line.split('\t') : line.split(',')
        return cells.map(c => c.trim().replace(/^"(.*)"$/, '$1'))
      }).filter(cells => cells.some(c => c.trim()))
      handlePasteImport(rows)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const assignedCount = useMemo(() => subjects.filter(s => (s.sections ?? []).length > 0).length, [subjects])

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 7, flexShrink: 0 }}>
        {/* Left: title + stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
          <BookOpen size={13} color={P} />
          <span style={{ fontSize: 12.5, fontWeight: 700, color: '#111028' }}>Subjects</span>
          <span style={{ fontSize: 10, color: P, background: P_L, borderRadius: 10, padding: '1px 7px 2px', fontWeight: 700, border: `1px solid ${P_B}` }}>
            {subjects.length}
          </span>
          {subjects.length > 0 && assignedCount < subjects.length && (
            <span style={{ fontSize: 10, color: '#D97706', fontWeight: 700, background: '#FFFBEB', padding: '1px 6px 2px', borderRadius: 4, border: '1px solid #FDE68A' }}>
              {subjects.length - assignedCount} unassigned
            </span>
          )}
        </div>
        <div style={{ width: 1, height: 14, background: '#EAE6FF', flexShrink: 0 }} />
        {/* Search */}
        <div style={{ position: 'relative', flex: 1 }}>
          <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#C0BBD8', pointerEvents: 'none', fontSize: 12 }}>⌕</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search subjects…"
            style={{ width: '100%', padding: '4px 8px 4px 24px', border: '1px solid #E4E0FF', borderRadius: 5, fontSize: 12, color: '#111028', outline: 'none', boxSizing: 'border-box', background: '#FAFAFE', fontFamily: 'inherit' }}
          />
        </div>
        {/* Actions */}
        <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
          <button
            onClick={() => setPasteOpen(true)}
            style={outlineBtn()}
            onMouseEnter={e => { e.currentTarget.style.background = P_L; e.currentTarget.style.borderColor = P_B; e.currentTarget.style.color = P_D }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#DDD8FF'; e.currentTarget.style.color = '#6B6891' }}
          >
            ⎘ Paste
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            style={outlineBtn()}
            onMouseEnter={e => { e.currentTarget.style.background = P_L; e.currentTarget.style.borderColor = P_B; e.currentTarget.style.color = P_D }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#DDD8FF'; e.currentTarget.style.color = '#6B6891' }}
          >
            ↑ Upload
          </button>
          <input ref={fileRef} type="file" style={{ display: 'none' }} accept=".csv,.txt,.tsv" onChange={handleFileUpload} />
          {sections.length > 0 && (
            <button
              onClick={aiAssignAll}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: P, color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 2px 6px rgba(124,111,224,0.28)', whiteSpace: 'nowrap', flexShrink: 0 }}
              onMouseEnter={e => (e.currentTarget.style.background = P_D)}
              onMouseLeave={e => (e.currentTarget.style.background = P)}
              title="Automatically assign subjects to relevant grade levels based on curriculum"
            >
              ⚡ AI Assign Classes
            </button>
          )}
        </div>
      </div>

      {/* Classes hint */}
      {sections.length === 0 && (
        <div style={{ margin: '0 0 6px', padding: '5px 10px', background: '#FFFBF0', border: '1px solid #FFE8A0', borderRadius: 5, fontSize: 11, color: '#7A5800' }}>
          💡 Add classes first — AI will automatically assign subjects to the right grade levels.
        </div>
      )}

      {/* Table */}
      <div style={TABLE_CARD}>
        {subjects.length === 0 && !search ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>📖</div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#9896B5', marginBottom: 3 }}>No subjects yet</div>
            <div style={{ fontSize: 11.5, color: '#C4C0DC' }}>Add or paste subjects below.</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead>
              <tr>
                <th style={TH}>Subject</th>
                <th style={{ ...TH, width: 78 }}>Short</th>
                <th style={{ ...TH, width: 46, textAlign: 'center' }}>p/w</th>
                <th style={{ ...TH, width: 250 }}>Applicable Classes</th>
                <th style={{ ...TH, width: 90 }} />
              </tr>
            </thead>
            <tbody>
              {filtered.map(sub => (
                <SubjectRow
                  key={sub.id}
                  sub={sub}
                  classOptions={classOptions}
                  sections={sections}
                  onUpdate={patch => update(sub.id, patch)}
                  onDelete={() => remove(sub.id)}
                />
              ))}
              {filtered.length === 0 && search && (
                <tr><td colSpan={5} style={{ ...TD, textAlign: 'center', color: '#C4C0DC', padding: '16px 10px' }}>No subjects match "{search}"</td></tr>
              )}
              <AddRow onAdd={add} />
            </tbody>
          </table>
        )}
      </div>

      {/* Paste Modal */}
      {pasteOpen && (
        <PasteModal
          title="Import Subjects"
          hint="Columns: Subject Name · Short (optional) · Periods/Week (optional)"
          onImport={handlePasteImport}
          onClose={() => setPasteOpen(false)}
        />
      )}
    </div>
  )
}
