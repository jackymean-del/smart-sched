import { useEffect, useState } from "react"
import { useTimetableStore } from "@/store/timetableStore"
import { generateSections, generateStaff, generateSubjects, generateBreaks, ORG_CONFIGS, getCountry } from "@/lib/orgData"

type Tab = "sections" | "subjects" | "staff" | "breaks"

const tdS: React.CSSProperties = { padding:"6px 8px", borderBottom:"1px solid #f0ede7", verticalAlign:"middle" }
const thS: React.CSSProperties = { padding:"8px 8px", background:"#f7f6f2", fontSize:10, fontWeight:700, textTransform:"uppercase" as const, letterSpacing:"0.06em", color:"#a8a59e", textAlign:"left" as const, borderBottom:"1px solid #e8e5de", whiteSpace:"nowrap" as const }
const inp = (extra?: React.CSSProperties): React.CSSProperties => ({ width:"100%", padding:"4px 6px", border:"1px solid transparent", borderRadius:5, fontSize:12, background:"transparent", outline:"none", ...extra })
const delBtn: React.CSSProperties = { width:24, height:24, borderRadius:4, border:"none", background:"transparent", cursor:"pointer", color:"#c8c5bc", fontSize:17 }
const addRow: React.CSSProperties = { width:"100%", padding:"8px 12px", border:"none", borderTop:"1.5px dashed #e8e5de", background:"transparent", cursor:"pointer", fontSize:12, color:"#a8a59e", textAlign:"left" as const }
const navBtn = (p: boolean): React.CSSProperties => ({ padding:"9px 18px", borderRadius:8, border: p?"none":"1.5px solid #e8e5de", background: p?"#059669":"#fff", color: p?"#fff":"#1c1b18", fontSize:13, fontWeight:600, cursor:"pointer" })

const SHIFT_COLORS = ['#4f46e5','#059669','#d97706','#dc2626','#7c3aed','#0891b2']

export function Step5Data() {
  const { config, sections, staff, subjects, breaks,
          setSections, setStaff, setSubjects, setBreaks, setStep } = useTimetableStore()
  const [tab, setTab] = useState<Tab>("sections")
  const [showClassWise, setShowClassWise] = useState<string|null>(null) // subject id for class-wise panel
  const org     = ORG_CONFIGS[config.orgType ?? "school"]
  const country = getCountry(config.countryCode ?? "IN")
  const hasShifts = config.shifts.length > 0

  // Get unique base classes
  const baseClasses = [...new Set(sections.map(s => {
    const m = s.name.match(/^(.+?)[-\s][A-E]$/i)
    return m ? m[1].trim() : s.name
  }))]

  useEffect(() => {
    if (!sections.length) {
      setSections(generateSections(config.orgType ?? "school", config.countryCode ?? "IN", config.numSections))
      setStaff(generateStaff(config.orgType ?? "school", config.countryCode ?? "IN", config.numStaff))
      setSubjects(generateSubjects(config.orgType ?? "school", config.countryCode ?? "IN", config.numSubjects))
      setBreaks(generateBreaks(config.orgType ?? "school", config.numBreaks))
    }
  }, [])

  const nextRoomNumber = () => {
    const used = sections.map(s => { const m = s.room?.match(/\d+/); return m ? parseInt(m[0]) : 0 })
    return (used.length ? Math.max(...used) : country.roomStart - 1) + 1
  }

  // Get class-wise config for a subject
  const getClassConfig = (subId: string, baseClass: string) => {
    const sub = subjects.find(s => s.id === subId)
    const cc = (sub as any)?.classConfigs?.find((c: any) => c.sectionName === baseClass)
    return cc ?? { periodsPerWeek: sub?.periodsPerWeek ?? 2, maxPeriodsPerDay: 2, sessionDuration: (sub as any)?.sessionDuration ?? 40 }
  }

  const updateClassConfig = (subIdx: number, baseClass: string, updates: any) => {
    const updated = [...subjects]
    const configs = (updated[subIdx] as any).classConfigs ?? []
    const existingIdx = configs.findIndex((c: any) => c.sectionName === baseClass)
    if (existingIdx >= 0) {
      configs[existingIdx] = { ...configs[existingIdx], ...updates }
    } else {
      configs.push({ sectionName: baseClass, periodsPerWeek: updated[subIdx].periodsPerWeek, maxPeriodsPerDay: 2, sessionDuration: (updated[subIdx] as any).sessionDuration ?? 40, ...updates })
    }
    ;(updated[subIdx] as any).classConfigs = configs
    setSubjects(updated)
  }

  const TABS: { key: Tab; label: string }[] = [
    { key:"sections", label:`📚 ${org.sectionsLabel}` },
    { key:"subjects", label:`📖 ${org.subjectsLabel}` },
    { key:"staff",    label:`👤 ${org.staffsLabel}` },
    { key:"breaks",   label:"⏱ Breaks" },
  ]

  return (
    <div>
      <h1 style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:28, marginBottom:8 }}>Review & edit generated data</h1>
      <p style={{ color:"#6a6860", fontSize:13, marginBottom:14, lineHeight:1.65 }}>
        AI generated {sections.length} {org.sectionsLabel.toLowerCase()}, {staff.length} {org.staffsLabel.toLowerCase()}, {subjects.length} {org.subjectsLabel.toLowerCase()}. Edit anything inline.
      </p>
      <div style={{ background:"#eaecf8", borderLeft:"4px solid #4f46e5", borderRadius:"0 8px 8px 0", padding:"8px 14px", marginBottom:18, fontSize:12, color:"#3730a3" }}>
        🪄 Click any field to edit. New rows auto-fill room numbers. Add or delete as needed.
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", borderBottom:"2px solid #e8e5de", marginBottom:16 }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ padding:"8px 16px", border:"none", borderBottom: tab===t.key?"2px solid #4f46e5":"2px solid transparent", marginBottom:-2, background:"transparent", fontSize:12, fontWeight: tab===t.key?700:500, color: tab===t.key?"#4f46e5":"#6a6860", cursor:"pointer", whiteSpace:"nowrap" as const }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── CLASSES TAB ── */}
      {tab === "sections" && (
        <div style={{ border:"1.5px solid #e8e5de", borderRadius:12, overflow:"hidden" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr>
              <th style={{...thS, width:36}}>#</th>
              <th style={thS}>{org.sectionLabel}</th>
              <th style={{...thS, width:110}}>{org.roomLabel}</th>
              <th style={{...thS, width:90}}>Grade</th>
              {hasShifts && <th style={{...thS, width:140}}>Shift</th>}
              <th style={thS}>Class Teacher</th>
              <th style={{...thS, width:32}}></th>
            </tr></thead>
            <tbody>
              {sections.map((s, i) => (
                <tr key={s.id} style={{ background: i%2===0?"#fff":"#fafaf9" }}>
                  <td style={{...tdS, color:"#a8a59e", fontSize:10, fontFamily:"monospace"}}>{i+1}</td>
                  <td style={tdS}>
                    <input style={inp()} value={s.name}
                      onChange={e=>{
                        const name = e.target.value
                        const m = name.match(/^([IVXivx\d]+(?:\s+\d+)?)[-\s]/i) ?? name.match(/^([A-Za-z]+(?:\s+\d+)?)[-\s]/i)
                        const autoGrade = m ? m[1].trim() : s.grade
                        const n=[...sections]; n[i]={...n[i],name,grade:autoGrade}; setSections(n)
                      }} />
                  </td>
                  <td style={tdS}><input style={inp()} value={s.room??""} onChange={e=>{const n=[...sections];n[i]={...n[i],room:e.target.value};setSections(n)}} /></td>
                  <td style={tdS}><input style={inp()} value={s.grade??""} onChange={e=>{const n=[...sections];n[i]={...n[i],grade:e.target.value};setSections(n)}} /></td>
                  {hasShifts && (
                    <td style={tdS}>
                      <select style={{ fontSize:11, border:"1px solid #e8e5de", borderRadius:6, padding:"4px 6px", width:"100%", background:"#fff" }}
                        value={(s as any).shiftId??""} onChange={e=>{const n=[...sections];(n[i] as any).shiftId=e.target.value;setSections(n)}}>
                        <option value="">— No shift —</option>
                        {config.shifts.map((sh,si) => (
                          <option key={sh.id} value={sh.id}>
                            {sh.name} ({sh.startTime}–{sh.endTime})
                          </option>
                        ))}
                      </select>
                    </td>
                  )}
                  <td style={tdS}>
                    <select style={{ fontSize:11, border:"1px solid #e8e5de", borderRadius:6, padding:"4px 6px", width:"100%", background:"#fff" }}
                      value={s.classTeacher??""} onChange={e=>{const n=[...sections];n[i]={...n[i],classTeacher:e.target.value};setSections(n)}}>
                      <option value="">— None —</option>
                      {staff.map(st=><option key={st.id} value={st.name}>{st.name}</option>)}
                    </select>
                  </td>
                  <td style={tdS}><button style={delBtn} onClick={()=>setSections(sections.filter((_,j)=>j!==i))}>×</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {hasShifts && (
            <div style={{ padding:"8px 12px", background:"#f7f6f2", borderTop:"1px solid #e8e5de", fontSize:11, color:"#6a6860" }}>
              🕐 Shifts defined: {config.shifts.map((s,i) => (
                <span key={s.id} style={{ marginRight:8, color:SHIFT_COLORS[i%SHIFT_COLORS.length], fontWeight:600 }}>
                  {s.name} ({s.startTime}–{s.endTime})
                </span>
              ))}
            </div>
          )}
          <button style={addRow} onClick={() => {
            setSections([...sections, { id:crypto.randomUUID(), name:`New ${org.sectionLabel}`, room:`${country.roomPrefix} ${nextRoomNumber()}`, grade:"", classTeacher:"" }])
          }}>
            ＋ Add {org.sectionLabel} (auto room: {country.roomPrefix} {nextRoomNumber()})
          </button>
        </div>
      )}

      {/* ── SUBJECTS TAB ── */}
      {tab === "subjects" && (
        <div>
          {/* Global session duration setter */}
          <div style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", background:"#f7f6f2", border:"1.5px solid #e8e5de", borderRadius:10, marginBottom:12 }}>
            <span style={{ fontSize:12, color:"#374151", fontWeight:500 }}>Set all session durations to:</span>
            <input type="number" min={10} max={120} defaultValue={config.defaultSessionDuration}
              onBlur={e => {
                const dur = Math.max(10, +e.target.value)
                setConfig({ defaultSessionDuration: dur })
                setSubjects(subjects.map(s => ({ ...s, sessionDuration: dur } as any)))
              }}
              style={{ width:60, padding:"5px 8px", border:"1.5px solid #4f46e5", borderRadius:6, fontSize:13, fontFamily:"monospace", textAlign:"center" as const, outline:"none" }}
            />
            <span style={{ fontSize:12, color:"#6a6860" }}>min &nbsp;·&nbsp; Apply to all subjects at once</span>
          </div>

          <div style={{ border:"1.5px solid #e8e5de", borderRadius:12, overflow:"hidden" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead><tr>
                <th style={{...thS, width:36}}>#</th>
                <th style={thS}>Name</th>
                <th style={{...thS, width:80}}>Total hrs/week</th>
                <th style={{...thS, width:80}}>Per./week</th>
                <th style={{...thS, width:80}}>Per./day</th>
                <th style={{...thS, width:90}}>Min./session</th>
                <th style={{...thS, width:90}}>Max/day</th>
                <th style={{...thS, width:110, color:"#4f46e5"}}>Class-wise ⚙</th>
                <th style={{...thS, width:32}}></th>
              </tr></thead>
              <tbody>
                {subjects.map((s, i) => {
                  const dur = (s as any).sessionDuration ?? 40
                  const perDay = Math.ceil(s.periodsPerWeek / config.workDays.length)
                  const totalHrs = Math.round(s.periodsPerWeek * dur / 60 * 10) / 10
                  const isExpanded = showClassWise === s.id
                  return (
                    <>
                      <tr key={s.id} style={{ background: i%2===0?"#fff":"#fafaf9" }}>
                        <td style={{...tdS, color:"#a8a59e", fontSize:10, fontFamily:"monospace"}}>{i+1}</td>
                        <td style={tdS}><input style={inp()} value={s.name} onChange={e=>{const n=[...subjects];n[i]={...n[i],name:e.target.value};setSubjects(n)}} /></td>
                        <td style={{...tdS, textAlign:"center" as const}}>
                          <span style={{ fontSize:12, fontFamily:"monospace", fontWeight:600, color:"#059669" }}>{totalHrs}h</span>
                        </td>
                        <td style={tdS}>
                          <input type="number" min={1} max={30} style={inp({ fontFamily:"monospace", width:50, textAlign:"center" as const })}
                            value={s.periodsPerWeek} onChange={e=>{const n=[...subjects];n[i]={...n[i],periodsPerWeek:Math.max(1,+e.target.value)};setSubjects(n)}} />
                        </td>
                        <td style={{...tdS, textAlign:"center" as const}}>
                          <span style={{ fontSize:12, fontFamily:"monospace", fontWeight:600, color:"#4f46e5", background:"#eaecf8", padding:"2px 6px", borderRadius:4 }}>{perDay}</span>
                          <span style={{ fontSize:9, color:"#a8a59e", marginLeft:3 }}>avg</span>
                        </td>
                        <td style={tdS}>
                          <div style={{ display:"flex", alignItems:"center", gap:3 }}>
                            <input type="number" min={10} max={180} style={{ width:48, padding:"3px 5px", border:"1px solid #e8e5de", borderRadius:5, fontSize:12, fontFamily:"monospace", textAlign:"center" as const, outline:"none" }}
                              value={dur} onChange={e=>{const n=[...subjects] as any[];n[i].sessionDuration=Math.max(10,+e.target.value);setSubjects(n)}} />
                            <span style={{ fontSize:10, color:"#a8a59e" }}>m</span>
                          </div>
                        </td>
                        <td style={tdS}>
                          <input type="number" min={1} max={6} style={{ width:44, padding:"3px 5px", border:"1px solid #e8e5de", borderRadius:5, fontSize:12, fontFamily:"monospace", textAlign:"center" as const, outline:"none" }}
                            value={(s as any).maxPeriodsPerDay ?? 2} onChange={e=>{const n=[...subjects] as any[];n[i].maxPeriodsPerDay=Math.max(1,+e.target.value);setSubjects(n)}} />
                        </td>
                        <td style={tdS}>
                          <button onClick={() => setShowClassWise(isExpanded ? null : s.id)}
                            style={{ fontSize:11, padding:"3px 8px", borderRadius:5, border:`1px solid ${isExpanded?"#4f46e5":"#e8e5de"}`, background: isExpanded?"#eaecf8":"#fff", color: isExpanded?"#4f46e5":"#6a6860", cursor:"pointer", fontWeight:500 }}>
                            {isExpanded ? "▲ Hide" : "⚙ Class-wise"}
                          </button>
                        </td>
                        <td style={tdS}><button style={delBtn} onClick={()=>setSubjects(subjects.filter((_,j)=>j!==i))}>×</button></td>
                      </tr>
                      {/* Class-wise config panel */}
                      {isExpanded && (
                        <tr key={s.id+'-cw'}>
                          <td colSpan={9} style={{ padding:0 }}>
                            <div style={{ background:"#f5f3ff", borderBottom:"2px solid #4f46e5", padding:"12px 16px" }}>
                              <div style={{ fontSize:12, fontWeight:600, color:"#3730a3", marginBottom:10 }}>
                                ⚙ Class-wise settings for <strong>{s.name}</strong> — override defaults per class group
                              </div>
                              <table style={{ borderCollapse:"collapse", fontSize:11, width:"100%" }}>
                                <thead>
                                  <tr>
                                    <th style={{ ...thS, background:"#ede9fe", minWidth:100 }}>Class</th>
                                    <th style={{ ...thS, background:"#ede9fe", width:100 }}>Per./week</th>
                                    <th style={{ ...thS, background:"#ede9fe", width:100 }}>Min./session</th>
                                    <th style={{ ...thS, background:"#ede9fe", width:90 }}>Max/day</th>
                                    <th style={{ ...thS, background:"#ede9fe", width:80 }}>Total hrs</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {baseClasses.map(cls => {
                                    const cc = getClassConfig(s.id, cls)
                                    return (
                                      <tr key={cls}>
                                        <td style={{ ...tdS, fontWeight:600, color:"#4f46e5", background:"#faf5ff" }}>{cls}</td>
                                        <td style={{ ...tdS, background:"#faf5ff" }}>
                                          <input type="number" min={1} defaultValue={cc.periodsPerWeek} key={cc.periodsPerWeek}
                                            onBlur={e => updateClassConfig(i, cls, { periodsPerWeek: Math.max(1,+e.target.value) })}
                                            style={{ width:50, padding:"3px 5px", border:"1px solid #c4b5fd", borderRadius:5, fontSize:12, fontFamily:"monospace", textAlign:"center" as const, outline:"none" }} />
                                        </td>
                                        <td style={{ ...tdS, background:"#faf5ff" }}>
                                          <div style={{ display:"flex", alignItems:"center", gap:3 }}>
                                            <input type="number" min={10} max={180} defaultValue={cc.sessionDuration} key={cc.sessionDuration}
                                              onBlur={e => updateClassConfig(i, cls, { sessionDuration: Math.max(10,+e.target.value) })}
                                              style={{ width:50, padding:"3px 5px", border:"1px solid #c4b5fd", borderRadius:5, fontSize:12, fontFamily:"monospace", textAlign:"center" as const, outline:"none" }} />
                                            <span style={{ fontSize:10, color:"#a8a59e" }}>min</span>
                                          </div>
                                        </td>
                                        <td style={{ ...tdS, background:"#faf5ff" }}>
                                          <input type="number" min={1} max={6} defaultValue={cc.maxPeriodsPerDay} key={cc.maxPeriodsPerDay}
                                            onBlur={e => updateClassConfig(i, cls, { maxPeriodsPerDay: Math.max(1,+e.target.value) })}
                                            style={{ width:44, padding:"3px 5px", border:"1px solid #c4b5fd", borderRadius:5, fontSize:12, fontFamily:"monospace", textAlign:"center" as const, outline:"none" }} />
                                        </td>
                                        <td style={{ ...tdS, background:"#faf5ff" }}>
                                          <span style={{ fontSize:12, fontFamily:"monospace", color:"#059669", fontWeight:600 }}>
                                            {Math.round(cc.periodsPerWeek * cc.sessionDuration / 60 * 10) / 10}h
                                          </span>
                                        </td>
                                      </tr>
                                    )
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
            <div style={{ padding:"6px 12px 4px", background:"#f7f6f2", borderTop:"1px solid #e8e5de", fontSize:11, color:"#6a6860" }}>
              💡 Total hrs/week = Per./week × Min./session ÷ 60 · Click <strong>⚙ Class-wise</strong> to set different durations per class
            </div>
            <button style={addRow} onClick={() => setSubjects([...subjects, { id:crypto.randomUUID(), name:`New ${org.subjectLabel}`, periodsPerWeek:2, color:"bg-gray-100 text-gray-700", sections:[], sessionDuration:40, maxPeriodsPerDay:2, classConfigs:[] } as any])}>
              ＋ Add {org.subjectLabel}
            </button>
          </div>
        </div>
      )}

      {/* ── STAFF TAB ── */}
      {tab === "staff" && (
        <div style={{ border:"1.5px solid #e8e5de", borderRadius:12, overflow:"hidden" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr>
              <th style={{...thS, width:36}}>#</th>
              <th style={thS}>Name</th>
              <th style={{...thS, width:80}}>Max/week</th>
              <th style={{...thS, width:110}}>Role</th>
              <th style={{...thS, width:32}}></th>
            </tr></thead>
            <tbody>
              {staff.map((s, i) => (
                <tr key={s.id} style={{ background: i%2===0?"#fff":"#fafaf9" }}>
                  <td style={{...tdS, color:"#a8a59e", fontSize:10, fontFamily:"monospace"}}>{i+1}</td>
                  <td style={tdS}>
                    <input style={inp()} value={s.name} onChange={e=>{const n=[...staff];n[i]={...n[i],name:e.target.value};setStaff(n)}} />
                    {s.isClassTeacher && <span style={{ fontSize:10, color:"#059669", marginLeft:4 }}>★ CT: {s.isClassTeacher}</span>}
                  </td>
                  <td style={tdS}><input type="number" style={inp({ fontFamily:"monospace", width:60 })} value={s.maxPeriodsPerWeek} onChange={e=>{const n=[...staff];n[i]={...n[i],maxPeriodsPerWeek:+e.target.value};setStaff(n)}} /></td>
                  <td style={tdS}><input style={inp()} value={s.role} onChange={e=>{const n=[...staff];n[i]={...n[i],role:e.target.value};setStaff(n)}} /></td>
                  <td style={tdS}><button style={delBtn} onClick={()=>setStaff(staff.filter((_,j)=>j!==i))}>×</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <button style={addRow} onClick={() => {
            const num = staff.length + 1
            setStaff([...staff, { id:crypto.randomUUID(), name:`${org.staffLabel} ${num}`, role:org.staffLabel, subjects:[], classes:[], isClassTeacher:"", maxPeriodsPerWeek:country.maxPeriodsWeek }])
          }}>
            ＋ Add {org.staffLabel} (auto-named "{org.staffLabel} {staff.length + 1}")
          </button>
        </div>
      )}

      {/* ── BREAKS TAB ── */}
      {tab === "breaks" && (
        <div style={{ border:"1.5px solid #e8e5de", borderRadius:12, overflow:"hidden" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr>
              <th style={{...thS, width:36}}>#</th>
              <th style={thS}>Name</th>
              <th style={{...thS, width:90}}>Duration</th>
              <th style={{...thS, width:110}}>Type</th>
              <th style={{...thS, width:80}}>Shiftable</th>
              <th style={{...thS, width:32}}></th>
            </tr></thead>
            <tbody>
              {breaks.map((b, i) => (
                <tr key={b.id} style={{ background: i%2===0?"#fff":"#fafaf9" }}>
                  <td style={{...tdS, color:"#a8a59e", fontSize:10, fontFamily:"monospace"}}>{i+1}</td>
                  <td style={tdS}><input style={inp()} value={b.name} onChange={e=>{const n=[...breaks];n[i]={...n[i],name:e.target.value};setBreaks(n)}} /></td>
                  <td style={tdS}>
                    <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                      <input type="number" style={inp({ fontFamily:"monospace", width:50 })} value={b.duration} onChange={e=>{const n=[...breaks];n[i]={...n[i],duration:+e.target.value};setBreaks(n)}} />
                      <span style={{ fontSize:10, color:"#a8a59e" }}>min</span>
                    </div>
                  </td>
                  <td style={tdS}>
                    <select style={{ fontSize:11, border:"1px solid #e8e5de", borderRadius:6, padding:"4px 6px", background:"#fff" }}
                      value={b.type} onChange={e=>{const n=[...breaks];n[i]={...n[i],type:e.target.value as any};setBreaks(n)}}>
                      {["fixed-start","break","lunch","fixed-end"].map(t=><option key={t}>{t}</option>)}
                    </select>
                  </td>
                  <td style={{...tdS, textAlign:"center" as const}}>
                    <input type="checkbox" checked={b.shiftable} onChange={e=>{const n=[...breaks];n[i]={...n[i],shiftable:e.target.checked};setBreaks(n)}} style={{ width:14, height:14, accentColor:"#059669", cursor:"pointer" }} />
                  </td>
                  <td style={tdS}><button style={delBtn} onClick={()=>setBreaks(breaks.filter((_,j)=>j!==i))}>×</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <button style={addRow} onClick={() => setBreaks([...breaks, { id:`br_${Date.now()}`, name:"New Break", duration:15, type:"break" as const, shiftable:true }])}>
            ＋ Add break / special slot
          </button>
        </div>
      )}

      <div style={{ display:"flex", justifyContent:"space-between", paddingTop:16, borderTop:"1px solid #e8e5de", marginTop:16 }}>
        <button style={navBtn(false)} onClick={()=>setStep(4)}>← Back</button>
        <button style={navBtn(true)} onClick={()=>setStep(6)}>Save & Continue →</button>
      </div>
    </div>
  )
}
