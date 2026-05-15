import { useState, useMemo } from "react"
import { useTimetableStore } from "@/store/timetableStore"
import { ORG_CONFIGS } from "@/lib/orgData"

interface Props { open: boolean; onClose: () => void }

const DAY_LABEL: Record<string,string> = {
  MONDAY:"Monday",TUESDAY:"Tuesday",WEDNESDAY:"Wednesday",THURSDAY:"Thursday",
  FRIDAY:"Friday",SATURDAY:"Saturday",SUNDAY:"Sunday",
}

export function SubstitutionModal({ open, onClose }: Props) {
  const { config, staff, classTT, periods, substitutions, setSubstitutions } = useTimetableStore()
  const org = ORG_CONFIGS[config.orgType ?? "school"]

  const [tab, setTab] = useState<"assign"|"active">("assign")
  const [selectedDay, setSelectedDay]   = useState(config.workDays[0] ?? "MONDAY")
  const [absentName, setAbsentName]     = useState<string>("")
  const [reason, setReason]             = useState("")
  // Per-period assignment: periodId → substituteStaffName
  const [assignments, setAssignments]   = useState<Record<string, string>>({})

  const classPeriods = periods.filter(p => p.type === "class")

  // Slots the absent teacher is covering on selectedDay
  const absentSlots = useMemo(() => {
    if (!absentName) return []
    const slots: { sectionName:string; periodId:string; periodName:string; subject:string; time?:string }[] = []
    Object.entries(classTT).forEach(([secName, secData]) => {
      Object.entries(secData[selectedDay] ?? {}).forEach(([pid, cell]) => {
        if (cell?.teacher === absentName) {
          const p = periods.find(x => x.id === pid)
          slots.push({ sectionName: secName, periodId: pid, periodName: p?.name ?? pid, subject: cell.subject ?? "" })
        }
      })
    })
    return slots
  }, [absentName, selectedDay, classTT, periods])

  // For a given slot, find teachers who are free at that period+day and can teach that subject
  const getAvailableSubs = (periodId: string, subject: string) => {
    const busy = new Set<string>()
    // Mark all teachers teaching in this period on this day
    Object.values(classTT).forEach(secData => {
      const cell = secData[selectedDay]?.[periodId]
      if (cell?.teacher && cell.teacher !== absentName) busy.add(cell.teacher)
    })
    // Already assigned as sub in other slots today
    Object.entries(assignments).forEach(([pid, subName]) => {
      if (pid !== periodId) busy.add(subName)
    })

    return staff.filter(st => {
      if (st.name === absentName) return false
      if (busy.has(st.name)) return false
      return true
    }).map(st => {
      const teachesSubject = (st.subjects ?? []).some((s: string) =>
        s === subject || s.endsWith(`::${subject}`)
      )
      return { name: st.name, role: st.role, match: teachesSubject }
    }).sort((a, b) => (b.match ? 1 : 0) - (a.match ? 1 : 0))
  }

  // Auto-fill best available sub for all slots
  const autoFill = () => {
    const newAssign: Record<string, string> = {}
    const usedInPeriod: Record<string, Set<string>> = {}
    absentSlots.forEach(slot => {
      const avail = getAvailableSubs(slot.periodId, slot.subject)
      // Prefer subject match, then least-assigned today
      const best = avail.find(a => a.match && !(usedInPeriod[slot.periodId]?.has(a.name))) ??
                   avail.find(a => !(usedInPeriod[slot.periodId]?.has(a.name))) ?? null
      if (best) {
        const key = `${slot.sectionName}|${selectedDay}|${slot.periodId}`
        newAssign[key] = best.name
        usedInPeriod[slot.periodId] = usedInPeriod[slot.periodId] ?? new Set()
        usedInPeriod[slot.periodId].add(best.name)
      }
    })
    setAssignments(prev => ({ ...prev, ...Object.fromEntries(Object.entries(newAssign).map(([k,v]) => [k.split("|")[2], v])) }))
  }

  // Apply assignments to the substitutions store
  const apply = () => {
    const newSubs = { ...substitutions }
    absentSlots.forEach(slot => {
      const key = `${slot.sectionName}|${selectedDay}|${slot.periodId}`
      const sub = assignments[slot.periodId]
      if (sub) newSubs[key] = sub
    })
    setSubstitutions(newSubs)
    setAssignments({})
    setAbsentName("")
    setReason("")
  }

  // Remove a single active substitution
  const removeSub = (key: string) => {
    const newSubs = { ...substitutions }
    delete newSubs[key]
    setSubstitutions(newSubs)
  }

  const activeList = Object.entries(substitutions)

  if (!open) return null

  return (
    <div style={{ position:"fixed" as const, inset:0, background:"rgba(0,0,0,0.45)", display:"flex", alignItems:"flex-start", justifyContent:"flex-end", zIndex:1000, padding:12 }}>
      <div style={{ width:520, background:"#fff", borderRadius:14, boxShadow:"0 20px 60px rgba(0,0,0,0.25)", display:"flex", flexDirection:"column" as const, maxHeight:"calc(100vh - 24px)", overflow:"hidden", animation:"slideIn 0.2s ease" }}>
        <style>{`@keyframes slideIn { from { opacity:0; transform:translateX(20px) } to { opacity:1; transform:translateX(0) } }`}</style>

        {/* Header */}
        <div style={{ padding:"16px 20px", borderBottom:"1px solid #e2e8f0", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
          <div>
            <div style={{ fontSize:16, fontWeight:700, color:"#1e293b", display:"flex", alignItems:"center", gap:8 }}>🔄 Substitution Manager</div>
            <div style={{ fontSize:11, color:"#64748b", marginTop:2 }}>Manage cover arrangements when a {org.staffLabel.toLowerCase()} is absent</div>
          </div>
          <button onClick={onClose} style={{ width:28, height:28, borderRadius:"50%", border:"1px solid #e2e8f0", background:"#f8fafc", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, color:"#64748b" }}>✕</button>
        </div>

        {/* Tab bar */}
        <div style={{ display:"flex", borderBottom:"1px solid #e2e8f0", flexShrink:0 }}>
          {(["assign","active"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ flex:1, padding:"10px", border:"none", borderBottom: tab===t?"2px solid #4f46e5":"2px solid transparent", background:"transparent", fontSize:12, fontWeight:tab===t?600:400, color:tab===t?"#4f46e5":"#64748b", cursor:"pointer" }}>
              {t === "assign" ? "📋 Assign Cover" : `📂 Active (${activeList.length})`}
            </button>
          ))}
        </div>

        <div style={{ flex:1, overflowY:"auto", padding:"16px 20px" }}>

          {/* ══ ASSIGN COVER TAB ═══════════════════════════════ */}
          {tab === "assign" && (
            <div style={{ display:"flex", flexDirection:"column" as const, gap:14 }}>

              {/* Day picker */}
              <div>
                <label style={{ fontSize:10, fontWeight:700, textTransform:"uppercase" as const, letterSpacing:"0.08em", color:"#94a3b8", display:"block", marginBottom:6 }}>Absence Day</label>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" as const }}>
                  {config.workDays.map(d => (
                    <button key={d} onClick={() => { setSelectedDay(d); setAssignments({}) }}
                      style={{ padding:"5px 12px", borderRadius:6, border:`1.5px solid ${selectedDay===d?"#4f46e5":"#e2e8f0"}`, background:selectedDay===d?"#eef2ff":"#fff", color:selectedDay===d?"#4f46e5":"#64748b", fontSize:11, fontWeight:selectedDay===d?600:400, cursor:"pointer" }}>
                      {DAY_LABEL[d]?.slice(0,3) ?? d.slice(0,3)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Absent teacher picker */}
              <div>
                <label style={{ fontSize:10, fontWeight:700, textTransform:"uppercase" as const, letterSpacing:"0.08em", color:"#94a3b8", display:"block", marginBottom:6 }}>
                  Absent {org.staffLabel}
                </label>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, maxHeight:160, overflowY:"auto" }}>
                  {staff.map(st => {
                    const isSelected = absentName === st.name
                    const periodCount = Object.values(classTT).reduce((a, sd) => {
                      return a + Object.values(sd[selectedDay] ?? {}).filter(c => c?.teacher === st.name).length
                    }, 0)
                    return (
                      <button key={st.id} onClick={() => { setAbsentName(st.name); setAssignments({}) }}
                        style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 10px", borderRadius:8, border:`1.5px solid ${isSelected?"#f59e0b":"#e2e8f0"}`, background:isSelected?"#fffbeb":"#fff", cursor:"pointer", textAlign:"left" as const, transition:"all 0.12s" }}>
                        <div style={{ width:30, height:30, borderRadius:"50%", background:isSelected?"#f59e0b":"#e2e8f0", color:isSelected?"#fff":"#6b7280", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, flexShrink:0 }}>{st.name[0]}</div>
                        <div style={{ minWidth:0 }}>
                          <div style={{ fontSize:11, fontWeight:600, color:"#1e293b", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" as const }}>{st.name}</div>
                          <div style={{ fontSize:9, color: periodCount>0?"#d97706":"#94a3b8" }}>{periodCount > 0 ? `${periodCount} period${periodCount>1?"s":""} today` : "No periods today"}</div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Reason */}
              <div>
                <label style={{ fontSize:10, fontWeight:700, textTransform:"uppercase" as const, letterSpacing:"0.08em", color:"#94a3b8", display:"block", marginBottom:6 }}>Reason (optional)</label>
                <input value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Sick leave, official duty, training..."
                  style={{ width:"100%", padding:"8px 12px", border:"1.5px solid #e2e8f0", borderRadius:7, fontSize:12, outline:"none", boxSizing:"border-box" as const }} />
              </div>

              {/* Period-by-period assignments */}
              {absentName && (
                <div>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                    <label style={{ fontSize:10, fontWeight:700, textTransform:"uppercase" as const, letterSpacing:"0.08em", color:"#94a3b8" }}>
                      Cover Assignments — {DAY_LABEL[selectedDay]}
                    </label>
                    {absentSlots.length > 0 && (
                      <button onClick={autoFill} style={{ padding:"3px 10px", borderRadius:5, border:"1px solid #c7d2fe", background:"#e0e7ff", color:"#3730a3", fontSize:10, fontWeight:600, cursor:"pointer" }}>
                        ⚡ Auto-fill best
                      </button>
                    )}
                  </div>

                  {absentSlots.length === 0 ? (
                    <div style={{ padding:"12px", background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:8, fontSize:12, color:"#166534", textAlign:"center" as const }}>
                      ✅ {absentName} has no classes on {DAY_LABEL[selectedDay]}. No cover needed.
                    </div>
                  ) : (
                    <div style={{ display:"flex", flexDirection:"column" as const, gap:8 }}>
                      {absentSlots.map(slot => {
                        const avail = getAvailableSubs(slot.periodId, slot.subject)
                        const assigned = assignments[slot.periodId] ?? ""
                        const alreadySub = substitutions[`${slot.sectionName}|${selectedDay}|${slot.periodId}`]
                        return (
                          <div key={slot.periodId} style={{ border:"1.5px solid #e2e8f0", borderRadius:9, padding:"10px 12px", background: assigned?"#f0fdf4":alreadySub?"#fffbeb":"#fff" }}>
                            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
                              <div>
                                <span style={{ fontSize:11, fontWeight:700, color:"#1e293b" }}>{slot.periodName}</span>
                                <span style={{ fontSize:11, color:"#64748b", marginLeft:8 }}>{slot.sectionName}</span>
                                <span style={{ fontSize:10, color:"#94a3b8", marginLeft:6 }}>— {slot.subject}</span>
                              </div>
                              {alreadySub && !assigned && (
                                <span style={{ fontSize:9, background:"#fff7ed", border:"1px solid #fcd34d", color:"#d97706", padding:"1px 6px", borderRadius:4 }}>Covered: {alreadySub}</span>
                              )}
                            </div>
                            <select value={assigned} onChange={e => setAssignments(a => ({ ...a, [slot.periodId]: e.target.value }))}
                              style={{ width:"100%", padding:"6px 10px", border:`1.5px solid ${assigned?"#86efac":"#e2e8f0"}`, borderRadius:6, fontSize:11, background:"#fff", outline:"none", cursor:"pointer" }}>
                              <option value="">— Select substitute —</option>
                              {avail.map(t => (
                                <option key={t.name} value={t.name}>
                                  {t.match ? "★ " : "   "}{t.name} ({t.role}){t.match ? " — teaches this subject" : ""}
                                </option>
                              ))}
                              {avail.length === 0 && <option disabled>No teachers available</option>}
                            </select>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ══ ACTIVE SUBSTITUTIONS TAB ══════════════════════ */}
          {tab === "active" && (
            <div>
              {activeList.length === 0 ? (
                <div style={{ padding:"40px 20px", textAlign:"center" as const, color:"#94a3b8" }}>
                  <div style={{ fontSize:32, marginBottom:8 }}>📂</div>
                  <div>No active substitutions</div>
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column" as const, gap:8 }}>
                  {activeList.map(([key, subName]) => {
                    const [section, day, periodId] = key.split("|")
                    const p = periods.find(x => x.id === periodId)
                    const cell = classTT[section]?.[day]?.[periodId]
                    return (
                      <div key={key} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 12px", border:"1.5px solid #fde68a", borderRadius:9, background:"#fffbeb" }}>
                        <div style={{ width:36, height:36, borderRadius:8, background:"#f59e0b", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>🔄</div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:12, fontWeight:700, color:"#1e293b" }}>{section} · {p?.name ?? periodId}</div>
                          <div style={{ fontSize:11, color:"#64748b" }}>{DAY_LABEL[day] ?? day} · {cell?.subject ?? "—"}</div>
                          <div style={{ fontSize:11, color:"#92400e", marginTop:2 }}>
                            <span style={{ color:"#94a3b8" }}>Original: {cell?.teacher ?? "—"} → </span>
                            <strong>{subName}</strong>
                          </div>
                        </div>
                        <button onClick={() => removeSub(key)}
                          style={{ padding:"4px 10px", borderRadius:6, border:"1px solid #fca5a5", background:"#fef2f2", color:"#dc2626", fontSize:10, fontWeight:600, cursor:"pointer", flexShrink:0 }}>
                          Remove
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {tab === "assign" && (
          <div style={{ padding:"12px 20px", borderTop:"1px solid #e2e8f0", display:"flex", gap:8, justifyContent:"flex-end", flexShrink:0 }}>
            <button onClick={onClose} style={{ padding:"8px 18px", borderRadius:7, border:"1px solid #e2e8f0", background:"#fff", fontSize:12, color:"#64748b", cursor:"pointer" }}>Cancel</button>
            <button onClick={apply} disabled={!absentName || Object.keys(assignments).length === 0}
              style={{ padding:"8px 22px", borderRadius:7, border:"none", background: (!absentName || Object.keys(assignments).length===0)?"#e2e8f0":"#059669", color:(!absentName || Object.keys(assignments).length===0)?"#94a3b8":"#fff", fontSize:12, fontWeight:700, cursor: (!absentName || Object.keys(assignments).length===0)?"not-allowed":"pointer" }}>
              ✅ Apply {Object.keys(assignments).length > 0 ? `(${Object.keys(assignments).length})` : ""} Cover{Object.keys(assignments).length !== 1 ? "s" : ""}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
