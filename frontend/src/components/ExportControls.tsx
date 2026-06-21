/**
 * Reusable Export control — a dropdown offering Excel export and Print/PDF with
 * orientation + paper-size options. Drop it on any page; pass a lazy `sheets`
 * builder for the Excel data.
 */
import { useState, useRef, useEffect } from 'react'
import {
  exportSheetsToXLSX, printWithProperties,
  type ExportSheet, type Orientation, type PaperSize,
} from '@/lib/exportData'

export function ExportControls({ filename, sheets }: {
  filename: string
  sheets: () => ExportSheet[]
}) {
  const [open, setOpen] = useState(false)
  const [orientation, setOrientation] = useState<Orientation>('portrait')
  const [paper, setPaper] = useState<PaperSize>('A4')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const sel: React.CSSProperties = {
    width: '100%', marginTop: 3, padding: '4px 6px', borderRadius: 6,
    border: '1px solid #E5EBF5', fontSize: 11.5, color: '#374151', background: '#fff',
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', border: '1px solid #E5EBF5', borderRadius: 7, background: '#fff', color: '#374151', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
        ↑ Export ▾
      </button>
      {open && (
        <div onClick={e => e.stopPropagation()}
          style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, zIndex: 300, background: '#fff', border: '1px solid #E5EBF5', borderRadius: 10, boxShadow: '0 8px 30px rgba(0,0,0,0.12)', minWidth: 230, padding: '6px 0' }}>
          <button
            onClick={() => { exportSheetsToXLSX(filename, sheets()); setOpen(false) }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 14px', border: 'none', background: 'none', textAlign: 'left', fontSize: 12, color: '#374151', cursor: 'pointer' }}>
            <span style={{ fontSize: 14 }}>📊</span> Export to Excel
          </button>
          <div style={{ height: 1, background: '#E5EBF5', margin: '6px 0' }} />
          <div style={{ padding: '2px 14px 4px', fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Print / PDF
          </div>
          <div style={{ display: 'flex', gap: 8, padding: '2px 14px 8px' }}>
            <label style={{ flex: 1, fontSize: 10, color: '#94A3B8', fontWeight: 600 }}>
              Orientation
              <select value={orientation} onChange={e => setOrientation(e.target.value as Orientation)} style={sel}>
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </label>
            <label style={{ flex: 1, fontSize: 10, color: '#94A3B8', fontWeight: 600 }}>
              Paper
              <select value={paper} onChange={e => setPaper(e.target.value as PaperSize)} style={sel}>
                <option value="A4">A4</option>
                <option value="A3">A3</option>
                <option value="Letter">Letter</option>
                <option value="Legal">Legal</option>
              </select>
            </label>
          </div>
          <button
            onClick={() => { printWithProperties(orientation, paper); setOpen(false) }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 14px', border: 'none', background: 'none', textAlign: 'left', fontSize: 12, color: '#374151', cursor: 'pointer' }}>
            <span style={{ fontSize: 14 }}>🖨️</span> Print…
          </button>
        </div>
      )}
    </div>
  )
}
