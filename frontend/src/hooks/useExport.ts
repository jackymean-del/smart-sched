import { useTimetableStore } from "@/store/timetableStore"
import { ORG_CONFIGS } from "@/lib/orgData"

declare const XLSX: any

export function useExport() {
  const { config, sections, staff, periods, classTT, teacherTT, showTeacher, showRoom } = useTimetableStore()

  const exportXLSX = () => {
    if (!sections.length) return
    if (typeof XLSX === "undefined") {
      console.error("XLSX library not loaded")
      return
    }

    const wb = XLSX.utils.book_new()
    const org = ORG_CONFIGS[config.orgType ?? "school"]

    // Class sheets
    sections.forEach(sec => {
      const sd = classTT[sec.name]
      if (!sd) return
      const rows: string[][] = [["DAY", ...periods.map(p => p.name + (p.duration ? ` (${p.duration}m)` : ""))]]
      config.workDays.forEach(day => {
        if (!sd[day]) return
        const row = [day]
        periods.forEach(p => {
          if (p.type !== "class") { row.push(p.name); return }
          const cell = sd[day][p.id]
          let txt = cell?.subject ?? ""
          if (showTeacher && cell?.teacher) txt += "\n" + cell.teacher
          if (showRoom && cell?.room) txt += "\n" + cell.room
          row.push(txt)
        })
        rows.push(row)
      })
      const ws = XLSX.utils.aoa_to_sheet(rows)
      XLSX.utils.book_append_sheet(wb, ws, sec.name.replace(/[^\w]/g, "_").substring(0, 25))
    })

    // Teacher sheets with info header
    staff.forEach(st => {
      const tdata = teacherTT[st.name]
      if (!tdata) return
      const classes = (tdata.classes.length ? tdata.classes : st.classes ?? []).join(", ") || "—"
      const subjects = (tdata.subjects.length ? tdata.subjects : st.subjects ?? []).join(", ") || "—"
      const ctOf = st.isClassTeacher ? ` | Class Teacher: ${st.isClassTeacher}` : ""
      const rows: string[][] = [
        [`${st.name} | Classes: ${classes} | Subjects: ${subjects}${ctOf}`],
        ["DAY", ...periods.map(p => p.name)],
      ]
      config.workDays.forEach(day => {
        const row = [day]
        periods.forEach(p => {
          if (p.type !== "class") { row.push(p.name); return }
          const cell = tdata.schedule[day]?.[p.id]
          row.push(cell?.subject ?? "FREE")
        })
        rows.push(row)
      })
      const ws = XLSX.utils.aoa_to_sheet(rows)
      XLSX.utils.book_append_sheet(wb, ws, st.name.replace(/[^\w]/g, "_").substring(0, 25))
    })

    XLSX.writeFile(wb, `SmartSched_${config.orgType ?? "tt"}_${new Date().getFullYear()}.xlsx`)
  }

  return { exportXLSX }
}
