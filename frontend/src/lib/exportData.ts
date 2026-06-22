/**
 * Reusable export helpers — Excel (SheetJS, loaded globally via index.html) and
 * browser Print/PDF with configurable orientation + paper size. Shared so any
 * page can offer the same export options.
 */
declare const XLSX: any

export interface ExportSheet {
  name: string
  /** Array-of-arrays: first row is the header. */
  rows: (string | number)[][]
}

export type PaperSize = 'A4' | 'A3' | 'Letter' | 'Legal'
export type Orientation = 'landscape' | 'portrait'

/** Download one or more sheets as a single .xlsx workbook. */
export function exportSheetsToXLSX(filename: string, sheets: ExportSheet[]): void {
  if (typeof XLSX === 'undefined') {
    alert('Excel export library is still loading — please try again in a moment.')
    return
  }
  const wb = XLSX.utils.book_new()
  for (const s of sheets) {
    const ws = XLSX.utils.aoa_to_sheet(s.rows.length ? s.rows : [['(no data)']])
    XLSX.utils.book_append_sheet(wb, ws, (s.name || 'Sheet').slice(0, 31))
  }
  XLSX.writeFile(wb, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`)
}

/**
 * Print the current page with a chosen paper size + orientation. If the page
 * marks a printable region with [data-print-content], only that region is
 * printed (app chrome hidden); otherwise the whole page prints.
 */
export function printWithProperties(orientation: Orientation, paper: PaperSize): void {
  let el = document.getElementById('app-print-page') as HTMLStyleElement | null
  if (!el) {
    el = document.createElement('style')
    el.id = 'app-print-page'
    document.head.appendChild(el)
  }
  el.textContent = `@page { size: ${paper} ${orientation}; margin: 10mm; }`

  const hasArea = !!document.querySelector('[data-print-content]')
  if (hasArea) {
    document.body.setAttribute('data-print-area', '')
    const cleanup = () => {
      document.body.removeAttribute('data-print-area')
      window.removeEventListener('afterprint', cleanup)
    }
    window.addEventListener('afterprint', cleanup)
  }
  window.print()
}
