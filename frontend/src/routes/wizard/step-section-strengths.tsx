/**
 * Step — Section Strengths Matrix
 *
 * The SIMPLE input model. Replaces the old "Optional Blocks" + "Combinations"
 * steps with ONE Excel-style grid:
 *
 *   Section | Stream    | Total | English | Maths | PE  | Art | ...
 *   XI-A    | Science   | 40    | 40      | 40    | 20  | 20  | ...
 *   XI-B    | Commerce  | 40    | 40      | 40    | 15  | 25  | ...
 *
 * From this matrix alone, the AI engine derives EVERYTHING:
 *   - core vs optional subjects per section
 *   - parallel optional blocks within a section
 *   - cross-section pooling opportunities
 *   - capacity allocation
 *
 * Excel-feel features:
 *   - Tab/Enter navigation between cells
 *   - Bulk paste from clipboard (TSV/CSV)
 *   - CSV import button
 *   - Export CSV template
 *   - Auto-inference badges per cell (CORE / OPT)
 */

import { useState, useMemo, useRef, useEffect } from 'react'
import { useTimetableStore } from '@/store/timetableStore'
import type { SectionStrength } from '@/types'
import { Sparkles, ClipboardPaste, Upload, Download, Plus, Trash2, Grid3x3, Info } from 'lucide-react'

const STREAMS = ['Science', 'Commerce', 'Humanities', 'General', 'Other']

// ─── style tokens ────────────────────────────────────────────
const cellBase: React.CSSProperties = {
  border: '1px solid #E8E4FF',
  padding: '6px 8px',
  fontSize: 12,
  background: '#fff',
  color: '#13111E',
  fontFamily: "'DM Mono', monospace",
  textAlign: 'right' as const,
  outline: 'none',
  width: '100%',
  minWidth: 0,
  borderRadius: 0,
}
const th: React.CSSProperties = {
  background: '#7C6FE0', color: '#fff',
  padding: '8px 10px', fontSize: 10, fontWeight: 800,
  letterSpacing: '0.06em', textTransform: 'uppercase',
  border: '1px solid #9B8EF5',
  textAlign: 'center' as const, whiteSpace: 'nowrap' as const,
}
const lbl: React.CSSProperties = {
  fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
  textTransform: 'uppercase', color: '#8B87AD',
}
const btnPri: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '7px 13px', borderRadius: 7, border: 'none',
  background: '#7C6FE0', color: '#fff', fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
}
const btnGhost: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '6px 11px', borderRadius: 7, border: '1px solid #E8E4FF',
  background: '#fff', color: '#4B5275', fontSize: 11, fontWeight: 600, cursor: 'pointer',
}

export function StepSectionStrengths() {
  const {
    sections, subjects, sectionStrengths, setSectionStrengths,
  } = useTimetableStore() as any

  // Derive subject columns from the subjects already defined in earlier step
  const subjectCols: string[] = useMemo(() => subjects.map((s: any) => s.name), [subjects])

  // Initialize matrix on first mount if sections exist & strengths empty
  useEffect(() => {
    if (sectionStrengths.length === 0 && sections.length > 0 && subjectCols.length > 0) {
      const init: SectionStrength[] = sections.map((sec: any) => ({
        sectionName: sec.name,
        stream: guessStream(sec.name),
        subjectStrengths: Object.fromEntries(subjectCols.map(s => [s, 0])),
      }))
      setSectionStrengths(init)
    }
  }, [sections.length, subjectCols.length])

  // Resolve current rows: one row per section (use stored strengths or fresh skeleton)
  const rows: SectionStrength[] = useMemo(() => {
    return sections.map((sec: any) => {
      const existing = sectionStrengths.find((r: SectionStrength) => r.sectionName === sec.name)
      if (existing) return existing
      return {
        sectionName: sec.name,
        stream: guessStream(sec.name),
        subjectStrengths: Object.fromEntries(subjectCols.map(s => [s, 0])),
      }
    })
  }, [sections, sectionStrengths, subjectCols])

  // ─── Cell ops ───
  const updateRow = (sectionName: string, patch: Partial<SectionStrength>) => {
    const i = sectionStrengths.findIndex((r: SectionStrength) => r.sectionName === sectionName)
    const merged = i >= 0
      ? { ...sectionStrengths[i], ...patch, subjectStrengths: { ...sectionStrengths[i].subjectStrengths, ...(patch.subjectStrengths ?? {}) } }
      : { sectionName, stream: 'General', subjectStrengths: {}, ...patch }
    const next = i >= 0
      ? sectionStrengths.map((x: SectionStrength, idx: number) => idx === i ? merged : x)
      : [...sectionStrengths, merged]
    setSectionStrengths(next)
  }
  const updateCell = (sectionName: string, subjectName: string, value: number) => {
    updateRow(sectionName, { subjectStrengths: { [subjectName]: value } as any })
  }

  // ─── Bulk paste / import ───
  const [pasteOpen, setPasteOpen] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const [importNotice, setImportNotice] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Parse TSV/CSV. First row = headers (must include "Section" + subject names).
  // Optional headers: "Stream", "Total".
  const parseAndApply = (raw: string) => {
    const text = raw.trim()
    if (!text) return setImportNotice('Nothing to paste.')
    const delim = text.includes('\t') ? '\t' : ','
    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0)
    if (lines.length < 2) return setImportNotice('Need at least a header row + one data row.')
    const headers = lines[0].split(delim).map(h => h.trim())
    const lcHeaders = headers.map(h => h.toLowerCase())
    const sectionIdx = lcHeaders.findIndex(h => h === 'section' || h === 'section name')
    if (sectionIdx < 0) return setImportNotice('No "Section" column found in headers.')
    const streamIdx = lcHeaders.findIndex(h => h === 'stream')
    const totalIdx  = lcHeaders.findIndex(h => h === 'total' || h === 'total students')

    const next: SectionStrength[] = [...sectionStrengths]
    let imported = 0
    lines.slice(1).forEach(line => {
      const cells = line.split(delim).map(c => c.trim())
      const secName = cells[sectionIdx]
      if (!secName) return
      const subjectStrengths: Record<string, number> = {}
      headers.forEach((h, i) => {
        if (i === sectionIdx || i === streamIdx || i === totalIdx) return
        const v = parseInt(cells[i] ?? '')
        if (!isNaN(v) && v >= 0) subjectStrengths[h] = v
      })
      const row: SectionStrength = {
        sectionName: secName,
        stream: streamIdx >= 0 ? cells[streamIdx] : guessStream(secName),
        totalStudents: totalIdx >= 0 ? (parseInt(cells[totalIdx] ?? '') || undefined) : undefined,
        subjectStrengths,
      }
      const existing = next.findIndex(r => r.sectionName === secName)
      if (existing >= 0) {
        next[existing] = { ...next[existing], ...row, subjectStrengths: { ...next[existing].subjectStrengths, ...subjectStrengths } }
      } else {
        next.push(row)
      }
      imported++
    })
    setSectionStrengths(next)
    setImportNotice(`Imported ${imported} row${imported !== 1 ? 's' : ''}.`)
    setPasteText('')
    setPasteOpen(false)
  }

  const pasteFromClipboard = async () => {
    try {
      const txt = await navigator.clipboard.readText()
      setPasteText(txt)
      setPasteOpen(true)
    } catch {
      setPasteOpen(true)  // user can paste manually
    }
  }

  const handleFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => parseAndApply(String(reader.result ?? ''))
    reader.readAsText(file)
  }

  const downloadTemplate = () => {
    const headers = ['Section', 'Stream', 'Total', ...subjectCols]
    const sample = sections.map((sec: any) => {
      const tot = ''
      return [sec.name, guessStream(sec.name), tot, ...subjectCols.map(() => '')].join(',')
    })
    const csv = [headers.join(','), ...sample].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'section-strengths-template.csv'
    a.click()
  }

  // ─── Cell-level keyboard nav (Tab/Shift+Tab/Enter handled by browser; Up/Down) ───
  const cellRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const onCellKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, rowIdx: number, colIdx: number) => {
    const totalRows = rows.length
    const totalCols = subjectCols.length
    let r = rowIdx, c = colIdx
    if (e.key === 'ArrowDown' || (e.key === 'Enter' && !e.shiftKey)) { r = Math.min(totalRows - 1, r + 1); e.preventDefault() }
    else if (e.key === 'ArrowUp' || (e.key === 'Enter' && e.shiftKey))   { r = Math.max(0, r - 1); e.preventDefault() }
    else if (e.key === 'ArrowRight') { c = Math.min(totalCols - 1, c + 1); e.preventDefault() }
    else if (e.key === 'ArrowLeft')  { c = Math.max(0, c - 1); e.preventDefault() }
    else return
    const key = `r${r}c${c}`
    cellRefs.current[key]?.focus()
    cellRefs.current[key]?.select()
  }

  // Row max + inference helper
  const rowAnalysis = (row: SectionStrength) => {
    const vals = Object.values(row.subjectStrengths ?? {}).filter(v => typeof v === 'number' && v > 0)
    const max = vals.length > 0 ? Math.max(...vals) : 0
    const sum = vals.reduce((s, v) => s + v, 0)
    return { max, sum, sectionTotal: row.totalStudents ?? max }
  }

  // ─── Empty state ───
  if (sections.length === 0 || subjects.length === 0) {
    return (
      <div style={{ padding: 24, maxWidth: 980, margin: '0 auto' }}>
        <Header />
        <div style={{
          background: '#FAFAFE', border: '1px dashed #D8D2FF', borderRadius: 12,
          padding: '40px 20px', textAlign: 'center',
        }}>
          <Grid3x3 size={36} color="#D8D2FF" style={{ margin: '0 auto 10px', display: 'block' }} />
          <div style={{ fontSize: 14, fontWeight: 700, color: '#13111E' }}>
            Add sections and subjects first
          </div>
          <div style={{ fontSize: 12, color: '#8B87AD', marginTop: 6, maxWidth: 460, margin: '6px auto 0' }}>
            The strength matrix is per section × subject. Define them in the
            <strong style={{ color: '#7C6FE0' }}> Resources</strong> step, then come back here.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: 24, maxWidth: 1280, margin: '0 auto' }}>
      <Header />

      {/* Toolbar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14, alignItems: 'center' }}>
        <button style={btnPri} onClick={pasteFromClipboard}>
          <ClipboardPaste size={13} /> Paste from clipboard
        </button>
        <input type="file" ref={fileRef} accept=".csv,.tsv,text/csv,text/tab-separated-values" style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }} />
        <button style={btnGhost} onClick={() => fileRef.current?.click()}>
          <Upload size={13} /> Import CSV
        </button>
        <button style={btnGhost} onClick={downloadTemplate}>
          <Download size={13} /> Download template
        </button>
        <div style={{ flex: 1 }} />
        {importNotice && (
          <div style={{ fontSize: 11, color: '#7C6FE0', display: 'flex', alignItems: 'center', gap: 5 }}>
            <Info size={11} /> {importNotice}
          </div>
        )}
      </div>

      {/* Paste modal */}
      {pasteOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(19,17,30,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20, backdropFilter: 'blur(4px)' }}
             onClick={() => setPasteOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 720, padding: 18, boxShadow: '0 24px 60px rgba(19,17,30,0.35)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <ClipboardPaste size={18} color="#7C6FE0" />
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#13111E' }}>Paste tabular data</div>
                <div style={{ fontSize: 11, color: '#8B87AD' }}>
                  TSV (from Excel/Sheets) or CSV. First row must include <code style={{ background: '#F5F2FF', padding: '0 4px', borderRadius: 3, color: '#7C6FE0' }}>Section</code> + subject column headers.
                </div>
              </div>
            </div>
            <textarea
              value={pasteText}
              onChange={e => setPasteText(e.target.value)}
              placeholder={'Section\tStream\tEnglish\tMaths\tPE\tArt\nXI-A\tScience\t40\t40\t20\t20\nXI-B\tCommerce\t40\t40\t15\t25'}
              style={{
                width: '100%', minHeight: 200, fontFamily: "'DM Mono', monospace",
                fontSize: 12, padding: 10, border: '1px solid #E8E4FF', borderRadius: 8,
                background: '#FAFAFE', color: '#13111E', outline: 'none', resize: 'vertical',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <button style={btnGhost} onClick={() => setPasteOpen(false)}>Cancel</button>
              <button style={btnPri} onClick={() => parseAndApply(pasteText)}>Apply</button>
            </div>
          </div>
        </div>
      )}

      {/* The Excel-feel grid */}
      <div style={{ overflowX: 'auto', border: '1px solid #E8E4FF', borderRadius: 10, background: '#fff' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 'fit-content' }}>
          <thead>
            <tr>
              <th style={{ ...th, position: 'sticky', left: 0, zIndex: 3, minWidth: 100 }}>Section</th>
              <th style={{ ...th, minWidth: 110 }}>Stream</th>
              <th style={{ ...th, minWidth: 70 }}>Total</th>
              {subjectCols.map(s => (
                <th key={s} style={{ ...th, minWidth: 96 }}>{s}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => {
              const ana = rowAnalysis(row)
              const totalGuess = ana.max
              return (
                <tr key={row.sectionName} style={{ background: ri % 2 === 0 ? '#FAFAFE' : '#fff' }}>
                  {/* Section name (sticky) */}
                  <td style={{
                    border: '1px solid #E8E4FF', padding: '6px 10px', fontSize: 12, fontWeight: 800,
                    color: '#13111E', background: '#EDE9FF',
                    position: 'sticky' as const, left: 0, zIndex: 1, whiteSpace: 'nowrap' as const,
                  }}>
                    {row.sectionName}
                  </td>
                  {/* Stream */}
                  <td style={{ border: '1px solid #E8E4FF', padding: 0 }}>
                    <select value={row.stream ?? 'General'}
                      onChange={e => updateRow(row.sectionName, { stream: e.target.value })}
                      style={{ ...cellBase, textAlign: 'left' as const, fontFamily: "'Inter', sans-serif", fontWeight: 600, background: 'transparent', border: 'none', padding: '6px 10px', cursor: 'pointer' }}>
                      {STREAMS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  {/* Total */}
                  <td style={{ border: '1px solid #E8E4FF', padding: 0, background: '#F5F2FF' }}>
                    <input type="number" min={0} value={row.totalStudents ?? ''} placeholder={String(totalGuess || '—')}
                      onChange={e => updateRow(row.sectionName, { totalStudents: e.target.value === '' ? undefined : parseInt(e.target.value) })}
                      style={{ ...cellBase, background: 'transparent', border: 'none', fontWeight: 700 }} />
                  </td>
                  {/* Subject cells */}
                  {subjectCols.map((sub, ci) => {
                    const v = row.subjectStrengths[sub] ?? 0
                    const isCore = v > 0 && ana.max > 0 && v === ana.max
                    const isOpt  = v > 0 && ana.max > 0 && v < ana.max
                    return (
                      <td key={sub} style={{
                        border: '1px solid #E8E4FF', padding: 0, position: 'relative' as const,
                        background: v === 0 ? undefined : isCore ? '#F0FDF4' : isOpt ? '#FEF3C7' : undefined,
                      }}>
                        <input
                          ref={el => { cellRefs.current[`r${ri}c${ci}`] = el }}
                          type="number" min={0} value={v === 0 ? '' : v}
                          onChange={e => updateCell(row.sectionName, sub, e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value) || 0))}
                          onKeyDown={e => onCellKeyDown(e, ri, ci)}
                          onFocus={e => e.target.select()}
                          placeholder="—"
                          style={{ ...cellBase, background: 'transparent', border: 'none' }} />
                        {v > 0 && (
                          <span style={{
                            position: 'absolute' as const, top: 2, right: 4, fontSize: 7, fontWeight: 800,
                            letterSpacing: '0.05em', color: isCore ? '#15803D' : '#92400E',
                            pointerEvents: 'none' as const,
                          }}>
                            {isCore ? 'CORE' : 'OPT'}
                          </span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Footer legend + AI explainer */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14 }}>
        <div style={{ background: '#fff', border: '1px solid #E8E4FF', borderRadius: 10, padding: 14 }}>
          <div style={lbl}>Cell badges</div>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6, marginTop: 8 }}>
            <Legend color="#F0FDF4" textColor="#15803D" label="CORE" desc="All students take this — strength equals section total" />
            <Legend color="#FEF3C7" textColor="#92400E" label="OPT" desc="Subset of students — auto-grouped into optional blocks" />
            <Legend color="#fff" textColor="#9CA3AF" label="—" desc="Not offered for this section" />
          </div>
        </div>
        <div style={{ background: 'linear-gradient(135deg, #EDE9FF 0%, #F5F2FF 100%)', border: '1px solid #D8D2FF', borderRadius: 10, padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Sparkles size={13} color="#7C6FE0" />
            <span style={lbl}>What our AI infers from this matrix</span>
          </div>
          <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11.5, color: '#4B5275', lineHeight: 1.65 }}>
            <li>Optional vs Core subjects per section</li>
            <li>Which optionals run in PARALLEL within a section (when they sum to section total)</li>
            <li>Cross-section pooling candidates (same optional offered in multiple sections)</li>
            <li>Block capacity sizing per option (sum of strengths across pooled sections)</li>
            <li>Teacher & room demand forecasting</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

// ─── helpers ────────────────────────────────────────────────
function Header() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: '#EDE9FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Grid3x3 size={20} color="#7C6FE0" />
      </div>
      <div style={{ flex: 1 }}>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: '#13111E', margin: 0, lineHeight: 1.1 }}>
          Section Strengths
        </h2>
        <div style={{ fontSize: 12, color: '#4B5275', marginTop: 3 }}>
          How many students take each subject, per section. <em style={{ color: '#7C6FE0' }}>That's it.</em> The AI does the rest.
        </div>
      </div>
    </div>
  )
}

function Legend({ color, textColor, label, desc }: { color: string; textColor: string; label: string; desc: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
      <span style={{ minWidth: 38, textAlign: 'center', background: color, color: textColor, fontSize: 8, fontWeight: 800, padding: '2px 6px', borderRadius: 4, letterSpacing: '0.05em', border: '1px solid #E8E4FF' }}>
        {label}
      </span>
      <span style={{ fontSize: 11, color: '#4B5275' }}>{desc}</span>
    </div>
  )
}

function guessStream(secName: string): string {
  const u = secName.toUpperCase()
  if (u.includes('SCIENCE') || u.includes('SCI') || u.includes('PCM') || u.includes('PCB')) return 'Science'
  if (u.includes('COMMERCE') || u.includes('COM')) return 'Commerce'
  if (u.includes('HUM') || u.includes('ARTS') || u.includes('LIB')) return 'Humanities'
  return 'General'
}
