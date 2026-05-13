import { useState } from "react"
import { useTimetableStore } from "@/store/timetableStore"
import { SubstitutionModal } from "@/components/modals/SubstitutionModal"
import { EditCellModal } from "@/components/modals/EditCellModal"
import { ORG_CONFIGS, getCountry, getSubjectColor } from "@/lib/orgData"
import { shiftPeriod, rebuildTeacherTT } from "@/lib/aiEngine"
import { useExport } from "@/hooks/useExport"
import type { Period } from "@/types"

// ── Time calculator ──────────────────────────────────────
function calcTimes(periods: any[], config: any): Map<string,{start:string;end:string}> {
  const map = new Map<string,{start:string;end:string}>()
  const [sh, sm] = (config.startTime ?? '09:00').split(':').map(Number)
  let mins = sh*60+sm
  const fmt = (h: number, m: number) => {
    if ((config.timeFormat ?? '12h') === '24h') return h.toString().padStart(2,'0')+':'+m.toString().padStart(2,'0')
    const ap = h>=12?'PM':'AM', h12 = h%12||12
    return h12+':'+(m.toString().padStart(2,'0'))+' '+ap
  }
  periods.forEach((p: any) => {
    const h=Math.floor(mins/60), m=mins%60
    const start=fmt(h,m); mins+=p.duration
    const eh=Math.floor(mins/60), em=mins%60
    map.set(p.id,{start,end:fmt(eh,em)})
  })
  return map
}

// ── Period header cell ──────────────────────────────────
function PeriodCol({ p, times }: { p: Period; times?: {start:string;end:string} }) {
  const isBreak = p.type !== "class"
  const bg = p.type === "fixed-start" ? "#dbeafe"
    : p.type === "lunch" ? "#fef3c7"
    : p.type === "break" ? "#fef9c3"
    : p.type === "fixed-end" ? "#d1fae5"
    : "#f1f5f9"
  const color = p.type === "fixed-start" ? "#1e40af"
    : p.type === "lunch" ? "#92400e"
    : p.type === "break" ? "#854d0e"
    : p.type === "fixed-end" ? "#065f46"
    : "#64748b"
  return (
    <th style={{ background:bg, color, fontSize:10, fontWeight:700, padding:"6px 4px", border:"1px solid #e2e8f0", textAlign:"center", minWidth: isBreak?60:80, whiteSpace:"nowrap" }}>
      <div>{p.name}</div>
      <div style={{ fontSize:8, fontWeight:600, opacity:0.95 }}>{times?.start}</div><div style={{ fontSize:8, fontWeight:400, opacity:0.7 }}>→ {times?.end}</div>
    </th>
  )
}

// ── Break cell ──────────────────────────────────────────
function BreakCell({ p }: { p: Period }) {
  const bg = p.type === "fixed-start" ? "#eff6ff"
    : p.type === "lunch" ? "#fffbeb"
    : p.type === "break" ? "#fefce8"
    : p.type === "fixed-end" ? "#f0fdf4"
    : "#f8fafc"
  const color = p.type === "fixed-start" ? "#3b82f6"
    : p.type === "lunch" ? "#d97706"
    : p.type === "break" ? "#ca8a04"
    : "#10b981"
  return (
    <td style={{ background:bg, color, fontSize:9, fontWeight:600, textAlign:"center", padding:"4px 2px", border:"1px solid #e2e8f0", fontStyle:"italic" }}>
      {p.name}
    </td>
  )
}

export function TimetablePage() {
  const store = useTimetableStore()
  const {
    config, sections, staff, subjects, periods,
    classTT, teacherTT, substitutions, conflicts,
    viewTab, transposed, showTeacher, showRoom, editMode,
    setViewTab, setTransposed, setShowTeacher, setShowRoom, setEditMode,
    setPeriods, setTeacherTT,
  } = store

  const [subModalOpen, setSubModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<{ section: string; day: string; periodId: string } | null>(null)
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

  const DAY_SHORT: Record<string, string> = {
    MONDAY:"Mon", TUESDAY:"Tue", WEDNESDAY:"Wed", THURSDAY:"Thu",
    FRIDAY:"Fri", SATURDAY:"Sat", SUNDAY:"Sun"
  }

  // ── Render Class Timetable ──────────────────────────────
  const periodTimes = calcTimes(periods, config)

  const renderClassTT = (sn: string) => {
    const sd = classTT[sn]
    if (!sd) return <div style={{ padding:40, textAlign:"center", color:"#94a3b8" }}>No data for {sn}</div>
    const section = sections.find(s => s.name === sn)
    const ct = section?.classTeacher ?? ""
    const usedDays = config.workDays.filter(d => sd[d])

    return (
      <div>
        {/* Section header — spec §8.1 */}
        <div style={{ display:"flex", alignItems:"center", gap:16, padding:"12px 16px", background:"#f8fafc", borderBottom:"1px solid #e2e8f0", marginBottom:0 }}>
          <div>
            <div style={{ fontSize:16, fontWeight:700, color:"#1e293b", fontFamily:"'DM Serif Display',Georgia,serif" }}>
              {sn}
            </div>
            {ct && <div style={{ fontSize:11, color:"#64748b", marginTop:2 }}>Class Teacher: <strong>{ct}</strong></div>}
          </div>
          <div style={{ marginLeft:"auto", fontSize:11, color:"#94a3b8" }}>
            {config.workDays.length} days/week · {periods.filter(p=>p.type==="class").length} periods/day
          </div>
        </div>

        <div style={{ overflowX:"auto" }}>
          <table style={{ borderCollapse:"collapse", width:"100%", fontSize:11 }}>
            <thead>
              <tr>
                <th style={{ background:"#1e293b", color:"#fff", padding:"8px 12px", textAlign:"left", minWidth:70, fontSize:11, fontWeight:700, border:"1px solid #1e293b" }}>Day</th>
                {periods.map((p, pi) => (
                  <th key={p.id} style={{ position:"relative" as const }}>
                    <PeriodCol p={p} times={periodTimes.get(p.id)} />
                      <div style={{ display:"flex", justifyContent:"center", gap:3, padding:"2px 0", background:"#f1f5f9", borderTop:"1px solid #e2e8f0" }}>
                        <button onClick={() => handleShift(pi, -1)} title="Shift column left"
                          style={{ fontSize:9, border:"1px solid #e2e8f0", borderRadius:3, background:"#fff", cursor:"pointer", color:"#64748b", padding:"0 5px", lineHeight:"16px" }}>◀</button>
                        <button onClick={() => handleShift(pi, 1)} title="Shift column right"
                          style={{ fontSize:9, border:"1px solid #e2e8f0", borderRadius:3, background:"#fff", cursor:"pointer", color:"#64748b", padding:"0 5px", lineHeight:"16px" }}>▶</button>
                      </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {usedDays.map((day, di) => (
                <tr key={day} style={{ background: di%2===0?"#fff":"#f8fafc" }}>
                  <td style={{ padding:"6px 12px", fontWeight:700, fontSize:11, color:"#1e293b", border:"1px solid #e2e8f0", whiteSpace:"nowrap" as const }}>
                    {DAY_SHORT[day] ?? day.substring(0,3)}
                  </td>
                  {periods.map(p => {
                    if (p.type !== "class") return <BreakCell key={p.id} p={p} />
                    const cell = sd[day]?.[p.id]
                    const isSub = !!substitutions[`${sn}|${day}|${p.id}`]
                    const subTeacher = substitutions[`${sn}|${day}|${p.id}`]
                    if (!cell?.subject) return (
                      <td key={p.id} style={{ border:"1px solid #e2e8f0", padding:2 }}>
                        <div style={{ height:40, background:"#f8fafc", borderRadius:4, display:"flex", alignItems:"center", justifyContent:"center", color:"#cbd5e1", fontSize:10 }}>—</div>
                      </td>
                    )
                    const colorClass = getSubjectColor(cell.subject)
                    // Spec §8.1: class TT shows ONLY subject name — no teacher
                    return (
                      <td key={p.id} style={{ border:"1px solid #e2e8f0", padding:2 }}>
                        <div
                          className={colorClass}
                          onClick={() => editMode && setEditTarget({ section:sn, day, periodId:p.id })}
                          style={{
                            borderRadius:5, padding:"4px 6px", minHeight:40,
                            cursor: editMode?"pointer":"default",
                            outline: isSub?"2px dashed #f59e0b":"none",
                            position:"relative" as const,
                          }}>
                          {isSub && <span style={{ position:"absolute" as const, top:2, right:2, width:6, height:6, borderRadius:"50%", background:"#f59e0b" }} />}
                          {/* Spec: show ONLY subject name in class timetable */}
                          <div style={{ fontSize:10, fontWeight:700, lineHeight:1.3 }}>{cell.subject}</div>
                          {showTeacher && (cell.isClassTeacher || isSub) && (
                            <div style={{ fontSize:8, opacity:0.7, marginTop:2 }}>
                              {isSub ? `🔄 ${subTeacher}` : cell.isClassTeacher ? "★ CT" : ""}
                            </div>
                          )}
                          {showRoom && cell.room && (
                            <div style={{ fontSize:8, opacity:0.6, marginTop:1 }}>{cell.room}</div>
                          )}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  // ── Render Teacher Timetable ────────────────────────────
  const renderTeacherTT = (tn: string) => {
    const tdata = teacherTT[tn]
    if (!tdata) return <div style={{ padding:40, textAlign:"center", color:"#94a3b8" }}>No data for {tn}</div>
    const sch = tdata.schedule
    const usedDays = config.workDays.filter(d => sch[d])
    const st = staff.find(s => s.name === tn)
    const totalPeriods = Object.values(sch).reduce((a,d) => a + Object.values(d).filter(x=>x?.subject).length, 0)
    const maxP = st?.maxPeriodsPerWeek ?? country.maxPeriodsWeek
    const pct = Math.min(150, Math.round(totalPeriods / maxP * 100))
    const loadColor = pct > 100 ? "#dc2626" : pct > 85 ? "#d97706" : "#059669"

    // Spec §8.2: "VIII-A: Maths | IX-B: Maths" format
    const assignedStr = (st?.subjects ?? [])
      .filter(s => s.includes("::"))
      .map(s => { const [cls, sub] = s.split("::"); return `${cls}: ${sub}` })
      .join(" | ") || (st?.subjects ?? []).join(", ") || "—"

    return (
      <div>
        {/* Teacher metadata header — spec §8.2 */}
        <div style={{ padding:"12px 16px", background:"#f8fafc", borderBottom:"1px solid #e2e8f0" }}>
          <div style={{ display:"grid", gridTemplateColumns:"auto 1fr auto", gap:16, alignItems:"start" }}>
            <div style={{ width:40, height:40, borderRadius:"50%", background:"#4f46e5", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:700 }}>
              {tn[0]}
            </div>
            <div>
              <div style={{ fontSize:16, fontWeight:700, color:"#1e293b", fontFamily:"'DM Serif Display',Georgia,serif" }}>{tn}</div>
              {st?.isClassTeacher && (
                <div style={{ fontSize:11, color:"#059669", marginTop:2 }}>★ Class Teacher of: <strong>{st.isClassTeacher}</strong></div>
              )}
              {assignedStr !== "—" && (
                <div style={{ fontSize:11, color:"#64748b", marginTop:2 }}>
                  <span style={{ fontWeight:600 }}>Subjects: </span>{assignedStr}
                </div>
              )}
            </div>
            <div style={{ textAlign:"right" as const }}>
              <div style={{ fontSize:13, fontWeight:700, fontFamily:"monospace", color:loadColor }}>{totalPeriods}/{maxP}</div>
              <div style={{ fontSize:10, color:loadColor }}>{pct}% loaded</div>
              <div style={{ width:80, height:4, background:"#e2e8f0", borderRadius:2, marginTop:4, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${Math.min(100,pct)}%`, background:loadColor, borderRadius:2 }} />
              </div>
            </div>
          </div>
        </div>

        <div style={{ overflowX:"auto" }}>
          <table style={{ borderCollapse:"collapse", width:"100%", fontSize:11 }}>
            <thead>
              <tr>
                <th style={{ background:"#1e293b", color:"#fff", padding:"8px 12px", textAlign:"left", minWidth:70, fontSize:11, fontWeight:700, border:"1px solid #1e293b" }}>Day</th>
                {periods.map(p => <PeriodCol key={p.id} p={p} times={periodTimes.get(p.id)} />)}
              </tr>
            </thead>
            <tbody>
              {usedDays.map((day, di) => (
                <tr key={day} style={{ background: di%2===0?"#fff":"#f8fafc" }}>
                  <td style={{ padding:"6px 12px", fontWeight:700, fontSize:11, color:"#1e293b", border:"1px solid #e2e8f0" }}>
                    {DAY_SHORT[day] ?? day.substring(0,3)}
                  </td>
                  {periods.map(p => {
                    if (p.type !== "class") return <BreakCell key={p.id} p={p} />
                    const cell = sch[day]?.[p.id]
                    if (!cell?.subject) return (
                      <td key={p.id} style={{ border:"1px solid #e2e8f0", padding:2 }}>
                        <div style={{ height:40, background:"#f8fafc", borderRadius:4, display:"flex", alignItems:"center", justifyContent:"center", color:"#cbd5e1", fontSize:10, fontStyle:"italic" }}>FREE</div>
                      </td>
                    )
                    return (
                      <td key={p.id} style={{ border:"1px solid #e2e8f0", padding:2 }}>
                        <div style={{ background: cell.conflict?"#fee2e2":"#f1f5f9", borderRadius:5, padding:"4px 6px", minHeight:40, border: cell.conflict?"1px solid #fca5a5":"none" }}>
                          {/* Spec §8.2: "ClassName Subject" format */}
                          <div style={{ fontSize:10, fontWeight:700, color: cell.conflict?"#dc2626":"#1e293b" }}>{cell.subject}</div>
                          <div style={{ fontSize:9, color:"#64748b", marginTop:2 }}>{cell.sectionName}</div>
                          {cell.isClassTeacher && <div style={{ fontSize:8, color:"#059669", marginTop:1 }}>★ CT</div>}
                          {cell.conflict && <div style={{ fontSize:8, color:"#dc2626" }}>⚠ Clash</div>}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  // ── No timetable ────────────────────────────────────────
  if (!periods.length) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"calc(100vh - 52px)", flexDirection:"column" as const, gap:16 }}>
      <div style={{ fontSize:48 }}>📅</div>
      <div style={{ fontSize:18, color:"#64748b", fontFamily:"'DM Serif Display',Georgia,serif" }}>No timetable generated yet</div>
      <button onClick={() => window.location.href='/wizard'}
        style={{ padding:"10px 24px", borderRadius:8, border:"none", background:"#4f46e5", color:"#fff", fontSize:14, fontWeight:600, cursor:"pointer" }}>
        ✨ Go to Wizard
      </button>
    </div>
  )

  // ── Main layout ─────────────────────────────────────────
  const TB_BTN = (active: boolean, onClick: ()=>void, label: string, icon?: string): React.ReactNode => (
    <button onClick={onClick}
      style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 12px", borderRadius:6, border:`1px solid ${active?"#4f46e5":"#e2e8f0"}`, background: active?"#eaecf8":"#fff", color: active?"#4f46e5":"#64748b", fontSize:11, fontWeight:500, cursor:"pointer", whiteSpace:"nowrap" as const }}>
      {icon && <span>{icon}</span>}{label}
    </button>
  )

  return (
    <div style={{ display:"flex", height:"calc(100vh - 52px)", background:"#f1f5f9" }}>

      {/* Left sidebar — legend */}
      <div style={{ width:180, background:"#fff", borderRight:"1px solid #e2e8f0", padding:"12px", overflowY:"auto", flexShrink:0 }}>
        <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase" as const, letterSpacing:"0.08em", color:"#94a3b8", marginBottom:10 }}>Subject Colors</div>
        {subjects.map(s => {
          const colorClass = getSubjectColor(s.name)
          return (
            <div key={s.id} className={colorClass} style={{ display:"flex", alignItems:"center", gap:6, padding:"4px 8px", borderRadius:5, marginBottom:4, fontSize:11 }}>
              <span style={{ fontWeight:600 }}>{s.name}</span>
            </div>
          )
        })}
        <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase" as const, letterSpacing:"0.08em", color:"#94a3b8", margin:"14px 0 8px" }}>Special Slots</div>
        {[
          { label:"Assembly/Start", bg:"#dbeafe", color:"#1e40af" },
          { label:"Short Break", bg:"#fef9c3", color:"#854d0e" },
          { label:"Lunch/Meal", bg:"#fef3c7", color:"#92400e" },
          { label:"Dispersal/End", bg:"#d1fae5", color:"#065f46" },
          { label:"Substituted", bg:"#fff7ed", color:"#c2410c", border:"2px dashed #f59e0b" },
        ].map(s => (
          <div key={s.label} style={{ display:"flex", alignItems:"center", gap:6, padding:"4px 8px", borderRadius:5, marginBottom:4, background:s.bg, color:s.color, fontSize:10, border:s.border }}>
            {s.label}
          </div>
        ))}
        <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase" as const, letterSpacing:"0.08em", color:"#94a3b8", margin:"14px 0 8px" }}>Staff Workload</div>
        {staff.slice(0,8).map(st => {
          const total = Object.values(teacherTT[st.name]?.schedule ?? {}).reduce((a,d) => a + Object.values(d).filter(x=>x?.subject).length, 0)
          const max = st.maxPeriodsPerWeek ?? country.maxPeriodsWeek
          const pct = Math.min(100, Math.round(total/max*100))
          const color = pct>90?"#dc2626":pct>75?"#d97706":"#059669"
          return (
            <div key={st.id} style={{ marginBottom:6 }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, marginBottom:2 }}>
                <span style={{ color:"#475569" }}>{st.name}</span>
                <span style={{ color, fontFamily:"monospace", fontWeight:600 }}>{total}/{max}</span>
              </div>
              <div style={{ height:3, background:"#e2e8f0", borderRadius:2 }}>
                <div style={{ height:"100%", width:`${pct}%`, background:color, borderRadius:2 }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Main area */}
      <div style={{ flex:1, display:"flex", flexDirection:"column" as const, overflow:"hidden" }}>

        {/* Toolbar */}
        <div style={{ background:"#fff", borderBottom:"1px solid #e2e8f0", padding:"8px 16px", display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" as const }}>
          {/* Transpose toggle */}
          <div style={{ display:"flex", border:"1px solid #e2e8f0", borderRadius:7, overflow:"hidden" }}>
            <button onClick={() => setTransposed(false)}
              style={{ padding:"5px 12px", border:"none", background: !transposed?"#4f46e5":"#fff", color: !transposed?"#fff":"#64748b", fontSize:11, fontWeight:500, cursor:"pointer" }}>
              ☰ Normal
            </button>
            <button onClick={() => setTransposed(true)}
              style={{ padding:"5px 12px", border:"none", background: transposed?"#4f46e5":"#fff", color: transposed?"#fff":"#64748b", fontSize:11, fontWeight:500, cursor:"pointer" }}>
              ⊞ Transposed
            </button>
          </div>

          <div style={{ width:1, height:20, background:"#e2e8f0" }} />

          {/* View toggle */}
          <div style={{ display:"flex", border:"1px solid #e2e8f0", borderRadius:7, overflow:"hidden" }}>
            {([["class","📚",org.sectionLabel],["teacher","👤",org.staffLabel]] as const).map(([t,icon,lbl]) => (
              <button key={t} onClick={() => { setViewTab(t); setSelectedEntity(t==="class" ? sections[0]?.name : staff[0]?.name ?? "") }}
                style={{ padding:"5px 12px", border:"none", background: viewTab===t?"#4f46e5":"#fff", color: viewTab===t?"#fff":"#64748b", fontSize:11, fontWeight:500, cursor:"pointer", display:"flex", alignItems:"center", gap:4 }}>
                {icon} {lbl}
              </button>
            ))}
          </div>

          {/* Entity selector */}
          <select value={selectedEntity} onChange={e => setSelectedEntity(e.target.value)}
            style={{ padding:"5px 10px", border:"1px solid #e2e8f0", borderRadius:6, fontSize:11, background:"#fff", cursor:"pointer", outline:"none" }}>
            {entities.map(e => <option key={e} value={e}>{e}</option>)}
          </select>

          <div style={{ width:1, height:20, background:"#e2e8f0" }} />

          {/* Visibility */}
          {TB_BTN(showTeacher, () => setShowTeacher(!showTeacher), "Teacher", "👤")}
          {TB_BTN(showRoom, () => setShowRoom(!showRoom), "Room", "🚪")}

          <div style={{ width:1, height:20, background:"#e2e8f0" }} />

          {/* Edit */}
          {TB_BTN(editMode, () => setEditMode(!editMode), editMode?"Editing":"Edit", "✏️")}
          {TB_BTN(false, () => setSubModalOpen(true), "Substitution", "🔄")}

          <div style={{ flex:1 }} />

          {/* Export */}
          <button onClick={exportXLSX}
            style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 12px", borderRadius:6, border:"1px solid #e2e8f0", background:"#fff", color:"#64748b", fontSize:11, cursor:"pointer" }}>
            📊 Excel
          </button>
          <button onClick={() => window.print()}
            style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 12px", borderRadius:6, border:"1px solid #e2e8f0", background:"#fff", color:"#64748b", fontSize:11, cursor:"pointer" }}>
            🖨️ Print/PDF
          </button>
          <button onClick={() => window.location.href="/wizard"}
            style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 12px", borderRadius:6, border:"1px solid #e2e8f0", background:"#fff", color:"#64748b", fontSize:11, cursor:"pointer" }}>
            ← Wizard
          </button>

          {/* Conflicts badge */}
          <span style={{ padding:"4px 10px", borderRadius:20, fontSize:10, fontWeight:600, background: conflicts.length===0?"#f0fdf4":"#fff7ed", color: conflicts.length===0?"#059669":"#c2410c", border:`1px solid ${conflicts.length===0?"#86efac":"#fed7aa"}` }}>
            {conflicts.length === 0 ? "✅ 0 conflicts" : `⚠️ ${conflicts.length} conflict${conflicts.length>1?"s":""}`}
          </span>
        </div>

        {/* Timetable content */}
        <div style={{ flex:1, overflowY:"auto", padding:20 }}>
          <div style={{ background:"#fff", borderRadius:12, boxShadow:"0 1px 3px rgba(0,0,0,0.08)", overflow:"hidden" }}>
            {viewTab === "class" ? renderClassTT(selectedEntity) : renderTeacherTT(selectedEntity)}
          </div>

          {/* Conflicts list */}
          {conflicts.length > 0 && (
            <div style={{ marginTop:16, background:"#fff7ed", border:"1px solid #fed7aa", borderRadius:10, padding:"12px 16px" }}>
              <div style={{ fontSize:12, fontWeight:600, color:"#c2410c", marginBottom:8 }}>⚠️ {conflicts.length} Hard Conflicts Detected</div>
              {conflicts.map((c, i) => (
                <div key={i} style={{ fontSize:11, color:"#9a3412", padding:"4px 0", borderBottom:"1px solid #fed7aa" }}>
                  {c.message}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <SubstitutionModal open={subModalOpen} onClose={() => setSubModalOpen(false)} />
      {editTarget && <EditCellModal target={editTarget} onClose={() => setEditTarget(null)} />}
    </div>
  )
}
