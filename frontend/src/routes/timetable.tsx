import { useState } from "react"
import { useTimetableStore } from "@/store/timetableStore"
import { Toolbar } from "@/components/timetable/Toolbar"
import { PeriodHeader } from "@/components/timetable/PeriodHeader"
import { TimetableCell } from "@/components/timetable/TimetableCell"
import { TimetableSidebar } from "@/components/timetable/TimetableSidebar"
import { SubstitutionModal } from "@/components/modals/SubstitutionModal"
import { EditCellModal } from "@/components/modals/EditCellModal"
import { ORG_CONFIGS, getCountry } from "@/lib/orgData"
import { shiftPeriod, rebuildTeacherTT } from "@/lib/aiEngine"
import { useExport } from "@/hooks/useExport"
import { cn } from "@/lib/utils"
import type { Period } from "@/types"

export function TimetablePage() {
  const store = useTimetableStore()
  const {
    config, sections, staff, subjects, periods,
    classTT, teacherTT, substitutions, conflicts,
    viewTab, transposed, showTeacher, showRoom, editMode, sidebarTab,
    setViewTab, setTransposed, setShowTeacher, setShowRoom,
    setEditMode, setSidebarTab, setPeriods, setTeacherTT,
  } = store

  const [subModalOpen, setSubModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<{section:string;day:string;periodId:string}|null>(null)
  const { exportXLSX } = useExport()

  const org = ORG_CONFIGS[config.orgType ?? "school"]
  const country = getCountry(config.countryCode ?? "IN")
  const entities = viewTab === "class" ? sections.map(s => s.name) : staff.map(s => s.name)
  const [selectedEntity, setSelectedEntity] = useState(entities[0] ?? "")

  const handleShift = (idx: number, dir: -1 | 1) => {
    const newPeriods = shiftPeriod(periods, classTT, idx, dir)
    setPeriods(newPeriods)
    const newTT = { ...teacherTT }
    rebuildTeacherTT(classTT, newTT, config.workDays)
    setTeacherTT(newTT)
  }

  function getMergedCellClass(p: Period): string {
    const n = p.name.toUpperCase()
    const base = "border border-gray-200 text-center text-[9.5px] px-2 py-1 font-medium"
    if (p.type === "fixed-start") return cn(base, "bg-blue-100 text-blue-800 font-bold")
    if (p.type === "lunch" || n.includes("LUNCH") || n.includes("MEAL")) return cn(base, "bg-amber-100 text-amber-800 italic")
    if (p.type === "break") return cn(base, "bg-yellow-100 text-yellow-700 italic")
    if (n.includes("DIARY")) return cn(base, "bg-slate-100 text-slate-600")
    if (n.includes("SNACK")) return cn(base, "bg-yellow-50 text-yellow-700")
    if (p.type === "fixed-end") return cn(base, "bg-emerald-100 text-emerald-800 font-bold")
    return cn(base, "bg-gray-50 text-gray-500")
  }

  const renderClassTT = (sn: string) => {
    const sd = classTT[sn]
    if (!sd) return null
    const usedDays = config.workDays.filter(d => sd[d])
    return (
      <table className="border-collapse w-full text-[10.5px]">
        <thead>
          <tr>
            <th className="bg-indigo-700 text-white border border-indigo-800 px-2 py-1.5 font-serif text-left min-w-[80px]">DAY</th>
            {periods.map((p, pi) => (
              <PeriodHeader key={p.id} period={p} index={pi} totalPeriods={periods.length}
                transposed={false} allowShift={true} onShift={handleShift} allPeriods={periods} />
            ))}
          </tr>
        </thead>
        <tbody>
          {usedDays.map(day => (
            <tr key={day}>
              <td className="bg-gray-50 border border-gray-200 px-2 py-1.5 font-semibold text-[11px] whitespace-nowrap">
                {day.substring(0,3)}
              </td>
              {periods.map(p => (
                p.type !== "class"
                  ? <td key={p.id} className={getMergedCellClass(p)}>{p.name}</td>
                  : <td key={p.id} className="border border-gray-200 p-0.5">
                      <TimetableCell
                        cell={sd[day]?.[p.id]} periodId={p.id} day={day} sectionName={sn}
                        showTeacher={showTeacher} showRoom={showRoom} editMode={editMode}
                        isSubstituted={!!substitutions[`${sn}|${day}|${p.id}`]}
                        substituteTeacher={substitutions[`${sn}|${day}|${p.id}`]}
                        onClick={() => setEditTarget({ section: sn, day, periodId: p.id })}
                      />
                    </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  const renderTeacherTT = (tn: string) => {
    const tdata = teacherTT[tn]
    if (!tdata) return null
    const sch = tdata.schedule
    const usedDays = config.workDays.filter(d => sch[d])
    const st = staff.find(s => s.name === tn)
    const count = Object.values(sch).reduce((a, d) => a + Object.values(d).filter(x => x?.subject).length, 0)
    const maxP = st?.maxPeriodsPerWeek ?? country.maxPeriodsWeek
    const pct = Math.min(150, Math.round(count / maxP * 100))
    const loadCls = pct > 100 ? "bg-red-50 text-red-700" : pct > 85 ? "bg-amber-50 text-amber-700" : "bg-indigo-50 text-indigo-700"
    const tClasses = (tdata.classes.length ? tdata.classes : st?.classes ?? []).join(", ") || "None"
    const tSubjects = (tdata.subjects.length ? tdata.subjects : st?.subjects ?? []).join(", ") || "None"
    return (
      <div>
        <div className={cn("text-[10px] px-3 py-2 rounded-md mb-2 inline-block", loadCls)}>
          <strong>Classes assigned:</strong> {tClasses} &nbsp;|&nbsp;
          <strong>Subjects:</strong> {tSubjects} &nbsp;|&nbsp;
          <strong>Load:</strong> {count}/{maxP} {org.loadUnit} ({pct}%)
          {st?.isClassTeacher ? <> &nbsp;|&nbsp; <strong>Class Teacher of:</strong> {st.isClassTeacher}</> : null}
        </div>
        <p className="text-[10px] text-gray-400 mb-2">Shifts applied from Class view automatically. No manual shifts here.</p>
        <table className="border-collapse w-full text-[10.5px]">
          <thead>
            <tr>
              <th className="bg-indigo-700 text-white border border-indigo-800 px-2 py-1.5 font-serif text-left min-w-[80px]">DAY</th>
              {periods.map(p => (
                <PeriodHeader key={p.id} period={p} index={0} totalPeriods={periods.length}
                  transposed={false} allowShift={false} onShift={() => {}} allPeriods={periods} />
              ))}
            </tr>
          </thead>
          <tbody>
            {usedDays.map(day => (
              <tr key={day}>
                <td className="bg-gray-50 border border-gray-200 px-2 py-1.5 font-semibold text-[11px]">{day.substring(0,3)}</td>
                {periods.map(p => {
                  if (p.type !== "class") return <td key={p.id} className={getMergedCellClass(p)}>{p.name}</td>
                  const cell = sch[day]?.[p.id]
                  if (!cell?.subject) return (
                    <td key={p.id} className="border border-gray-200 p-0.5">
                      <div className="bg-gray-50 text-gray-400 rounded text-[9px] px-1.5 py-1 text-center italic">FREE</div>
                    </td>
                  )
                  return (
                    <td key={p.id} className="border border-gray-200 p-0.5">
                      <div className={cn("rounded px-1.5 py-1 min-h-[28px] flex flex-col justify-center bg-gray-100 text-gray-700", cell.conflict ? "outline-2 outline-dashed outline-red-400" : "")}>
                        <span className="text-[9.5px] font-bold">{cell.subject}</span>
                        {cell.isClassTeacher && <span className="text-[7px] bg-black/10 px-1 py-0.5 rounded mt-1">★ CT</span>}
                        {cell.conflict && <span className="text-[8px] text-red-600">⚠ Double-booked</span>}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (!periods.length) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-52px)] flex-col gap-4">
        <p className="text-gray-500 text-lg">No timetable generated yet.</p>
        <button onClick={() => window.location.href='/wizard'}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          Go to Wizard
        </button>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-52px)]">
      <TimetableSidebar
        tab={sidebarTab} onTabChange={setSidebarTab}
        subjects={subjects} staff={staff} periods={periods}
        teacherTT={teacherTT} config={config}
        onToggleShift={(id) => store.togglePeriodShiftable(id)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Toolbar
          orgType={config.orgType ?? "school"}
          entities={entities} selectedEntity={selectedEntity} onSelectEntity={setSelectedEntity}
          viewTab={viewTab} onViewTab={setViewTab}
          transposed={transposed} onTranspose={setTransposed}
          showTeacher={showTeacher} onShowTeacher={() => setShowTeacher(!showTeacher)}
          showRoom={showRoom} onShowRoom={() => setShowRoom(!showRoom)}
          editMode={editMode} onEditMode={() => setEditMode(!editMode)}
          conflictCount={conflicts.length}
          onSubstitution={() => setSubModalOpen(true)}
          onExportExcel={exportXLSX}
          onPrint={() => window.print()}
          onBack={() => window.location.href = '/wizard'}
        />
        <div className="flex-1 overflow-auto p-4">
          <div className="tt-box bg-white rounded-xl shadow-md overflow-hidden mb-4">
            <div className="px-4 py-3 border-b border-gray-100 flex items-start justify-between flex-wrap gap-2">
              <div>
                <h2 className="font-serif text-[17px]">
                  {viewTab === "class" ? org.sectionLabel.toUpperCase() : org.staffLabel.toUpperCase()} — {selectedEntity}
                </h2>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {viewTab === "class" ? org.classTTLabel : org.teacherTTLabel}
                </p>
              </div>
            </div>
            <div className="overflow-x-auto p-1">
              {viewTab === "class" ? renderClassTT(selectedEntity) : renderTeacherTT(selectedEntity)}
            </div>
          </div>
        </div>
      </div>
      <SubstitutionModal open={subModalOpen} onClose={() => setSubModalOpen(false)} />
      {editTarget && <EditCellModal target={editTarget} onClose={() => setEditTarget(null)} />}
    </div>
  )
}
