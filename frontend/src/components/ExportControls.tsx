/**
 * Reusable export controls — a simple Export dropdown (Excel + PDF) plus a
 * prominent Print button. Paper size + orientation are chosen in the printer
 * dialog, so there are no size/orientation options here. Drop it on any page;
 * pass a lazy `sheets` builder for the data.
 */
import { useState, useRef, useEffect } from 'react'
import { exportSheetsToXLSX, printSheets, type ExportSheet } from '@/lib/exportData'

export function ExportControls({ filename, sheets, title = 'Report' }: {
  filename: string
  sheets: () => ExportSheet[]
  /** Document heading shown in the printed/PDF header (e.g. "Master Data"). */
  title?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const menuItem: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 14px',
    border: 'none', background: 'none', textAlign: 'left', fontSize: 12.5, color: '#374151', cursor: 'pointer',
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {/* Export dropdown — Excel + PDF */}
      <div ref={ref} style={{ position: 'relative' }}>
        <button onClick={() => setOpen(o => !o)}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px', border: '1px solid #E5EBF5', borderRadius: 8, background: '#fff', color: '#374151', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
          ↑ Export ▾
        </button>
        {open && (
          <div onClick={e => e.stopPropagation()}
            style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, zIndex: 300, background: '#fff', border: '1px solid #E5EBF5', borderRadius: 10, boxShadow: '0 8px 30px rgba(0,0,0,0.12)', minWidth: 200, padding: '6px 0' }}>
            <button style={menuItem}
              onClick={() => { exportSheetsToXLSX(filename, sheets()); setOpen(false) }}>
              <span style={{ fontSize: 15 }}>📊</span> Export to Excel
            </button>
            <button style={menuItem}
              onClick={() => { printSheets(sheets(), { title }); setOpen(false) }}>
              <span style={{ fontSize: 15 }}>📄</span> Export to PDF
            </button>
          </div>
        )}
      </div>

      {/* Prominent Print button — opens the browser print / Save-as-PDF dialog */}
      <button onClick={() => printSheets(sheets(), { title })}
        title="Print this page (choose paper size & orientation in the print dialog)"
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 20px', border: 'none', borderRadius: 8, background: '#7C6FE0', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(124,111,224,0.35)' }}>
        🖨️ Print
      </button>
    </div>
  )
}
