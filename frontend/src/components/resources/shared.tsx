/**
 * Shared UI primitives — design system for all four resource panels.
 * InlineChipSelect — multi/single select with portal dropdown + grouped options
 */

import { useState, useRef, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'

// ─── Design tokens ─────────────────────────────────────────────────────────────
export const P   = '#7C6FE0'                    // brand purple
export const P_D = '#6358C4'                    // darker — hover / active
export const P_L = '#EDE9FF'                    // light bg — chips, ghost buttons
export const P_B = 'rgba(124,111,224,0.22)'     // border

// ─── Table style constants ─────────────────────────────────────────────────────
export const TH: React.CSSProperties = {
  padding: '4px 8px', textAlign: 'left', fontWeight: 700,
  fontSize: 10, letterSpacing: '0.07em', textTransform: 'uppercase',
  color: '#9896B5', borderBottom: '1.5px solid #EAE6FF',
  background: '#F7F5FF', whiteSpace: 'nowrap',
  position: 'sticky', top: 0, zIndex: 2,
}

export const TD: React.CSSProperties = {
  padding: '3px 8px', fontSize: 12, color: '#111028',
  borderBottom: '1px solid #F0ECFE', verticalAlign: 'middle',
}

// ─── Chip ─────────────────────────────────────────────────────────────────────
export const chipStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 2,
  background: '#EDE9FF', color: '#5B52C4',
  borderRadius: 4, padding: '0 5px 1px',
  fontSize: 10.5, fontWeight: 600, lineHeight: '14px',
  border: '1px solid rgba(124,111,224,0.3)', whiteSpace: 'nowrap',
  maxWidth: 100, overflow: 'hidden',
}

// ─── Buttons ──────────────────────────────────────────────────────────────────
export const ghostBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 5,
  background: P_L, color: P_D, border: `1px solid ${P_B}`,
  borderRadius: 5, padding: '4px 10px', fontSize: 11.5,
  fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
}

export const primaryBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 5,
  background: P, color: '#fff', border: 'none',
  borderRadius: 5, padding: '4px 12px', fontSize: 11.5,
  fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
}

// ─── Table card container ──────────────────────────────────────────────────────
export const TABLE_CARD: React.CSSProperties = {
  flex: 1, overflowY: 'auto', marginTop: 4,
  border: '1px solid #E4E0FF', borderRadius: 7, background: '#fff',
  boxShadow: '0 1px 4px rgba(124,111,224,0.06)',
}

// ─── useClickOutside (two elements) ───────────────────────────────────────────
export function useClickOutsideTwo(
  a: React.RefObject<HTMLElement | null>,
  b: React.RefObject<HTMLElement | null>,
  fn: () => void,
  active: boolean,
) {
  useEffect(() => {
    if (!active) return
    const h = (e: MouseEvent) => {
      const t = e.target as Node
      if (
        (!a.current || !a.current.contains(t)) &&
        (!b.current || !b.current.contains(t))
      ) fn()
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [a, b, active, fn])
}

// ─── InlineEdit — click-to-edit text ──────────────────────────────────────────
export function InlineEdit({
  value, onSave, placeholder = 'Click to edit',
  style: extraStyle,
}: {
  value: string
  onSave: (v: string) => void
  placeholder?: string
  style?: React.CSSProperties
}) {
  const [editing, setEditing] = useState(false)
  const [tmp, setTmp] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (editing) inputRef.current?.focus() }, [editing])
  useEffect(() => { setTmp(value) }, [value])

  function commit() { onSave(tmp.trim()); setEditing(false) }
  function cancel()  { setTmp(value); setEditing(false) }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={tmp}
        onChange={e => setTmp(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') cancel() }}
        style={{
          border: `1.5px solid ${P}`, borderRadius: 4, padding: '2px 6px',
          fontSize: 12, color: '#111028', outline: 'none',
          background: '#FAFAFE', fontFamily: 'inherit', ...extraStyle,
        }}
      />
    )
  }
  return (
    <span
      onClick={() => setEditing(true)}
      title="Click to edit"
      style={{
        cursor: 'text', borderRadius: 3, padding: '2px 4px',
        color: value ? '#111028' : '#C4C0DC',
        display: 'inline-block', minWidth: 50,
        transition: 'background 0.08s', ...extraStyle,
      }}
      onMouseEnter={e => (e.currentTarget.style.background = '#F0ECFE')}
      onMouseLeave={e => (e.currentTarget.style.background = '')}
    >
      {value || placeholder}
    </span>
  )
}

// ─── InlineChipSelect ─────────────────────────────────────────────────────────
export interface ChipOption {
  value: string
  label?: string
  group?: string
}

interface InlineChipSelectProps {
  selected: string[]
  options: ChipOption[]
  onChange: (v: string[]) => void
  singleSelect?: boolean
  placeholder?: string
  maxChips?: number
  disabled?: boolean
  minDropdownWidth?: number
}

export function InlineChipSelect({
  selected, options, onChange,
  singleSelect = false,
  placeholder = '+ Add',
  maxChips = 2,
  disabled = false,
  minDropdownWidth = 240,
}: InlineChipSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [pos, setPos] = useState({ top: 0, left: 0, width: minDropdownWidth })
  const triggerRef = useRef<HTMLDivElement>(null)
  const dropRef    = useRef<HTMLDivElement>(null)
  const searchRef  = useRef<HTMLInputElement>(null)

  useClickOutsideTwo(triggerRef, dropRef, () => { setOpen(false); setSearch('') }, open)

  useEffect(() => {
    if (!open) return
    function reposition() {
      const rect = triggerRef.current?.getBoundingClientRect()
      if (!rect) return
      const w = Math.max(rect.width + 50, minDropdownWidth)
      const spaceBelow = window.innerHeight - rect.bottom
      setPos({
        left: Math.min(rect.left, window.innerWidth - w - 8),
        width: w,
        top: spaceBelow > 250 ? rect.bottom + 4 : rect.top - 280,
      })
    }
    document.addEventListener('scroll', reposition, true)
    return () => document.removeEventListener('scroll', reposition, true)
  }, [open, minDropdownWidth]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 30)
  }, [open])

  function openDropdown() {
    if (disabled) return
    const rect = triggerRef.current?.getBoundingClientRect()
    if (!rect) return
    const w = Math.max(rect.width + 50, minDropdownWidth)
    const spaceBelow = window.innerHeight - rect.bottom
    setPos({
      left: Math.min(rect.left, window.innerWidth - w - 8),
      width: w,
      top: spaceBelow > 250 ? rect.bottom + 4 : rect.top - 280,
    })
    setOpen(o => !o)
  }

  function toggle(value: string) {
    if (singleSelect) {
      onChange(selected[0] === value ? [] : [value])
      setOpen(false); setSearch('')
    } else {
      onChange(selected.includes(value)
        ? selected.filter(v => v !== value)
        : [...selected, value])
    }
  }

  const hasGroups = options.some(o => o.group)
  const grouped = useMemo(() => {
    const q = search.toLowerCase()
    const map = new Map<string, ChipOption[]>()
    for (const opt of options) {
      const lbl = opt.label ?? opt.value
      if (q && !lbl.toLowerCase().includes(q) && !opt.value.toLowerCase().includes(q)) continue
      const g = opt.group ?? ''
      if (!map.has(g)) map.set(g, [])
      map.get(g)!.push(opt)
    }
    return map
  }, [options, search])

  const visible  = selected.slice(0, maxChips)
  const overflow = selected.length - visible.length

  return (
    <>
      <div
        ref={triggerRef}
        onClick={openDropdown}
        style={{
          display: 'inline-flex', flexWrap: 'wrap', gap: 3, alignItems: 'center',
          cursor: disabled ? 'default' : 'pointer',
          border: `1px solid ${open ? P : 'transparent'}`,
          borderRadius: 4, padding: '1px 2px', transition: 'border-color 0.12s',
          minHeight: 22,
        }}
      >
        {visible.map(v => {
          const lbl = options.find(o => o.value === v)?.label ?? v
          return (
            <span key={v} style={chipStyle}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{lbl}</span>
              {!disabled && (
                <button
                  onMouseDown={e => { e.stopPropagation(); e.preventDefault(); toggle(v) }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 0 1px', color: P_D, lineHeight: 1, flexShrink: 0, fontSize: 11, opacity: 0.75 }}
                >×</button>
              )}
            </span>
          )
        })}
        {overflow > 0 && (
          <span style={{
            background: '#F0EDFF', color: '#7C6FE0', borderRadius: 4,
            padding: '1px 5px 2px', fontSize: 10.5, fontWeight: 700,
            border: '1px solid rgba(124,111,224,0.22)',
          }}>+{overflow}</span>
        )}
        {/* Placeholder — button-style when empty, subtle edit icon when populated */}
        {!disabled && selected.length === 0 && (
          <span style={{
            fontSize: 11, fontWeight: 600, color: P,
            padding: '3px 10px',
            background: '#fff', border: `1.5px solid #DDD8FF`,
            borderRadius: 5, lineHeight: '14px', whiteSpace: 'nowrap',
          }}>
            {placeholder}
          </span>
        )}
        {!disabled && selected.length > 0 && (
          <span style={{ fontSize: 10, color: '#C4C0DC', padding: '0 2px', lineHeight: 1, userSelect: 'none' }}>✎</span>
        )}
      </div>

      {open && createPortal(
        <div
          ref={dropRef}
          style={{
            position: 'fixed', top: pos.top, left: pos.left, width: pos.width,
            background: '#fff', border: '1px solid #DDD8FF',
            borderRadius: 8, boxShadow: '0 8px 28px rgba(90,80,180,0.16), 0 2px 8px rgba(90,80,180,0.08)',
            zIndex: 9999, overflow: 'hidden',
          }}
        >
          {/* Search */}
          <div style={{ padding: '6px 10px', borderBottom: '1px solid #EEE9FF', display: 'flex', alignItems: 'center', gap: 6, background: '#FAFAFE' }}>
            <span style={{ fontSize: 12, color: '#C0BBD8', flexShrink: 0 }}>⌕</span>
            <input
              ref={searchRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search…"
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 12, background: 'transparent', color: '#111028', fontFamily: 'inherit' }}
            />
            {search && (
              <button onMouseDown={e => { e.preventDefault(); setSearch('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C0BBD8', padding: 0, fontSize: 13, lineHeight: 1 }}>×</button>
            )}
          </div>

          {/* Bulk actions */}
          {!singleSelect && (
            <div style={{ padding: '4px 8px', display: 'flex', gap: 4, flexWrap: 'wrap', borderBottom: '1px solid #EEE9FF', background: '#F9F7FF' }}>
              <button
                onMouseDown={e => { e.preventDefault(); onChange(options.map(o => o.value)) }}
                style={{ fontSize: 10, color: '#5B52C4', background: '#EDE9FF', border: '1px solid rgba(124,111,224,0.22)', borderRadius: 3, padding: '2px 7px', cursor: 'pointer', fontWeight: 700 }}
              >All</button>
              <button
                onMouseDown={e => { e.preventDefault(); onChange([]) }}
                style={{ fontSize: 10, color: '#888', background: '#F0F0F0', border: '1px solid #E4E4E4', borderRadius: 3, padding: '2px 7px', cursor: 'pointer' }}
              >None</button>
              {hasGroups && Array.from(grouped.keys()).filter(g => g).map(g => {
                const vals = (grouped.get(g) ?? []).map(o => o.value)
                const allIn = vals.every(v => selected.includes(v))
                return (
                  <button key={g}
                    onMouseDown={e => {
                      e.preventDefault()
                      if (allIn) onChange(selected.filter(v => !vals.includes(v)))
                      else { const next = new Set(selected); vals.forEach(v => next.add(v)); onChange(Array.from(next)) }
                    }}
                    style={{
                      fontSize: 10, color: allIn ? '#5B52C4' : '#555',
                      background: allIn ? '#EDE9FF' : '#F0F0F0',
                      border: allIn ? '1px solid rgba(124,111,224,0.22)' : '1px solid #E4E4E4',
                      borderRadius: 3, padding: '2px 7px', cursor: 'pointer', fontWeight: allIn ? 700 : 400,
                    }}
                  >{g}</button>
                )
              })}
            </div>
          )}

          {/* Options */}
          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            {Array.from(grouped.entries()).map(([grp, opts]) => (
              <div key={grp}>
                {grp && (
                  <div style={{
                    padding: '5px 10px 3px', fontSize: 9, fontWeight: 700,
                    color: '#B0ABCC', textTransform: 'uppercase', letterSpacing: '0.08em',
                    background: '#F9F7FF', borderTop: '1px solid #EEEBFF',
                  }}>{grp}</div>
                )}
                {opts.map(opt => {
                  const lbl = opt.label ?? opt.value
                  const checked = selected.includes(opt.value)
                  return (
                    <label key={opt.value}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '4px 10px', cursor: 'pointer',
                        background: checked ? '#F0EDFF' : 'transparent',
                        fontSize: 12, color: checked ? '#4A43A0' : '#111028',
                        fontWeight: checked ? 600 : 400,
                        transition: 'background 0.07s',
                      }}
                      onMouseEnter={e => { if (!checked) (e.currentTarget as HTMLElement).style.background = '#F9F8FF' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = checked ? '#F0EDFF' : '' }}
                    >
                      <input
                        type={singleSelect ? 'radio' : 'checkbox'}
                        checked={checked}
                        onChange={() => toggle(opt.value)}
                        style={{ accentColor: P, margin: 0, flexShrink: 0 }}
                      />
                      {lbl}
                    </label>
                  )
                })}
              </div>
            ))}
            {grouped.size === 0 && (
              <div style={{ padding: '14px 10px', textAlign: 'center', fontSize: 12, color: '#C0BBD8' }}>
                {search ? `No matches for "${search}"` : 'No options available'}
              </div>
            )}
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}

// ─── ImportModal ─────────────────────────────────────────────────────────────────
// Unified 3-tab import flow: Download Sample | Upload File | Paste Data
export function ImportModal({
  title,
  sampleHeaders,
  sampleRows,
  onImport,
  onClose,
}: {
  title: string
  sampleHeaders: string[]
  sampleRows: string[][]
  onImport: (rows: string[][]) => void
  onClose: () => void
}) {
  const [tab, setTab] = useState<'sample' | 'upload' | 'paste'>('sample')
  const [raw, setRaw] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const taRef   = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (tab === 'paste') setTimeout(() => taRef.current?.focus(), 50)
  }, [tab])

  const rows = useMemo<string[][]>(() =>
    raw.trim().split('\n')
      .filter(l => l.trim())
      .map(line => {
        const cells = line.includes('\t') ? line.split('\t') : line.split(',')
        return cells.map(c => c.trim().replace(/^"(.*)"$/, '$1'))
      })
      .filter(cells => cells.some(c => c.trim())),
    [raw])

  function downloadSample() {
    const lines = [sampleHeaders, ...sampleRows].map(row =>
      row.map(c => (c.includes(',') || c.includes('"')) ? `"${c.replace(/"/g, '""')}"` : c).join(',')
    )
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `${title.toLowerCase().replace(/\s+/g, '_')}_template.csv`
    document.body.appendChild(a); a.click()
    setTimeout(() => { URL.revokeObjectURL(url); document.body.removeChild(a) }, 100)
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const text = (ev.target?.result as string) ?? ''
      const parsed = text.trim().split('\n')
        .filter(l => l.trim())
        .map(line => {
          const cells = line.includes('\t') ? line.split('\t') : line.split(',')
          return cells.map(c => c.trim().replace(/^"(.*)"$/, '$1'))
        })
        .filter(r => r.some(c => c.trim()))
      if (parsed.length) { onImport(parsed); onClose() }
    }
    reader.readAsText(file); e.target.value = ''
  }

  const TABS: { id: 'sample' | 'upload' | 'paste'; label: string }[] = [
    { id: 'sample', label: '↓ Download Sample' },
    { id: 'upload', label: '↑ Upload File' },
    { id: 'paste',  label: '⎘ Paste Data' },
  ]

  return createPortal(
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,14,26,0.5)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: '#fff', borderRadius: 12, width: 540, maxHeight: '90vh', boxShadow: '0 24px 60px rgba(0,0,0,0.26)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {/* Header + Tabs */}
        <div style={{ background: '#FAFAFE', borderBottom: '1px solid #EEE9FF', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px 0' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#111028' }}>Import {title}</div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C0BBD8', fontSize: 20, lineHeight: 1, padding: '0 0 0 12px' }}>×</button>
          </div>
          <div style={{ display: 'flex', gap: 0, padding: '0 6px' }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                padding: '8px 12px', fontSize: 11.5, fontWeight: tab === t.id ? 700 : 500,
                color: tab === t.id ? P : '#9896B5',
                background: 'none', border: 'none', cursor: 'pointer',
                borderBottom: `2.5px solid ${tab === t.id ? P : 'transparent'}`,
                fontFamily: 'inherit', marginBottom: -1, transition: 'color 0.1s',
              }}>{t.label}</button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '18px 18px 4px', overflowY: 'auto', flex: 1 }}>

          {tab === 'sample' && (
            <div>
              <p style={{ margin: '0 0 12px', fontSize: 12, color: '#6B6891', lineHeight: 1.5 }}>
                Download this CSV template, fill it in Excel or Google Sheets, then upload or paste it back.
              </p>
              <div style={{ overflowX: 'auto', borderRadius: 7, border: '1px solid #E4E0FF', marginBottom: 16 }}>
                <table style={{ borderCollapse: 'collapse', fontSize: 11.5, width: '100%' }}>
                  <thead>
                    <tr>
                      {sampleHeaders.map((h, i) => (
                        <th key={i} style={{ padding: '6px 12px', textAlign: 'left', fontWeight: 700, fontSize: 10, color: '#9896B5', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#F7F5FF', borderBottom: '1px solid #E4E0FF', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sampleRows.map((row, ri) => (
                      <tr key={ri}>
                        {sampleHeaders.map((_, ci) => (
                          <td key={ci} style={{ padding: '6px 12px', color: '#444', fontSize: 12, borderBottom: ri < sampleRows.length - 1 ? '1px solid #F0ECFE' : 'none' }}>{row[ci] ?? ''}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button onClick={downloadSample}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 16px', background: P, color: '#fff', border: 'none', borderRadius: 7, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(124,111,224,0.28)' }}
                onMouseEnter={e => (e.currentTarget.style.background = P_D)}
                onMouseLeave={e => (e.currentTarget.style.background = P)}
              >↓ Download CSV Template</button>
            </div>
          )}

          {tab === 'upload' && (
            <div>
              <p style={{ margin: '0 0 14px', fontSize: 12, color: '#6B6891', lineHeight: 1.5 }}>
                Upload a <strong>.csv</strong>, <strong>.tsv</strong>, or plain text file — one row per line, columns separated by commas or tabs.
              </p>
              <div
                onClick={() => fileRef.current?.click()}
                style={{ border: '2px dashed #DDD8FF', borderRadius: 10, padding: '36px 20px', textAlign: 'center', cursor: 'pointer', background: '#FAFAFE', transition: 'all 0.12s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = P; e.currentTarget.style.background = P_L }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#DDD8FF'; e.currentTarget.style.background = '#FAFAFE' }}
              >
                <div style={{ fontSize: 30, marginBottom: 8, lineHeight: 1 }}>📂</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#555', marginBottom: 4 }}>Click to browse or drag & drop</div>
                <div style={{ fontSize: 11, color: '#9896B5' }}>Supports CSV, TSV, or plain text</div>
              </div>
              <input ref={fileRef} type="file" accept=".csv,.tsv,.txt" style={{ display: 'none' }} onChange={handleFile} />
            </div>
          )}

          {tab === 'paste' && (
            <div>
              <p style={{ margin: '0 0 10px', fontSize: 12, color: '#6B6891', lineHeight: 1.5 }}>
                Paste directly from Excel or Google Sheets (Ctrl+V) — tab or comma separated.
              </p>
              <textarea
                ref={taRef}
                value={raw}
                onChange={e => setRaw(e.target.value)}
                placeholder="Paste here (Ctrl+V)…"
                style={{ width: '100%', boxSizing: 'border-box', height: 148, border: `1.5px solid ${raw ? (rows.length > 0 ? '#86EFAC' : '#FECACA') : '#DDD8FF'}`, outline: 'none', resize: 'none', padding: '10px 12px', fontSize: 12, fontFamily: '"ui-monospace","Cascadia Code",monospace', color: '#111028', background: '#fff', borderRadius: 7, lineHeight: 1.6, transition: 'border-color 0.15s' }}
              />
              <div style={{ marginTop: 5, fontSize: 11, color: rows.length > 0 ? '#16A34A' : (raw ? '#DC2626' : '#9896B5'), fontWeight: rows.length > 0 ? 600 : 400 }}>
                {rows.length > 0
                  ? `✓ ${rows.length} row${rows.length !== 1 ? 's' : ''} ready to import`
                  : raw ? 'No valid rows detected — check your data format' : 'Paste rows above'}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div style={{ padding: '12px 18px', borderTop: '1px solid #EEE9FF', background: '#FAFAFE', display: 'flex', justifyContent: 'flex-end', gap: 8, flexShrink: 0 }}>
          <button onClick={onClose} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #E4E0FF', background: '#fff', color: '#666', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
            Cancel
          </button>
          {tab === 'paste' && (
            <button
              onClick={() => { if (rows.length > 0) { onImport(rows); onClose() } }}
              disabled={rows.length === 0}
              style={{ padding: '6px 16px', borderRadius: 6, border: 'none', background: rows.length > 0 ? P : '#E8E4FF', color: rows.length > 0 ? '#fff' : '#B4ADDD', fontSize: 12, fontWeight: 700, cursor: rows.length > 0 ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}
              onMouseEnter={e => { if (rows.length > 0) (e.currentTarget as HTMLButtonElement).style.background = P_D }}
              onMouseLeave={e => { if (rows.length > 0) (e.currentTarget as HTMLButtonElement).style.background = P }}
            >
              Import {rows.length > 0 ? `${rows.length} rows` : ''}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}

// ─── PasteModal (legacy alias) ────────────────────────────────────────────────
export function PasteModal({ title, hint, onImport, onClose }: {
  title?: string; hint: string; onImport: (rows: string[][]) => void; onClose: () => void
}) {
  return (
    <ImportModal
      title={title ?? 'Data'}
      sampleHeaders={['Column 1', 'Column 2', 'Column 3']}
      sampleRows={[['value1', 'value2', 'value3']]}
      onImport={onImport}
      onClose={onClose}
    />
  )
}
