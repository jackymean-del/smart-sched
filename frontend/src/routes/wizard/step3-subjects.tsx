import { useEffect, useState } from "react"
import { useTimetableStore } from "@/store/timetableStore"
import { useTerminology } from "@/hooks/useTerminology"
import { generateSubjects, getCountry } from "@/lib/orgData"
import { durationToWeeklyPeriods } from "@/lib/schedulingEngine"

// Get unique base class names from sections
function getBaseClasses(sections: { name: string; grade?: string }[]): string[] {
  const bases = sections.map(s => {
    const m = s.name.match(/^(.+?)[-\s][A-E]$/i)
    return m ? m[1].trim() : (s.grade || s.name)
  })
  return [...new Set(bases)].filter(Boolean)
}

export function Step3Subjects() {
  const store = useTimetableStore()
  const { config, subjects, sections, setSubjects, setStep } = store
  const T = useTerminology()
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null)
  const workingWeeks = Math.round((store.workingDaysPerYear ?? 220) / config.workDays.length)
  const baseClasses = getBaseClasses(sections)

  useEffect(() => {
    if (!subjects.length) {
      setSubjects(generateSubjects(config.orgType ?? "school", config.countryCode ?? "IN", config.numSubjects))
    }
  }, [])

  const updateSubject = (i: number, updates: Partial<typeof subjects[0]> & { requiredHours?: number }) => {
    const n = [...subjects]
    n[i] = { ...n[i], ...updates }
    if (store.schedulingMode === 'duration-based') {
      const rh = (updates.requiredHours ?? (n[i] as any).requiredHours ?? 0)
      if (rh > 0) {
        n[i].periodsPerWeek = durationToWeeklyPeriods({
          subjectName: n[i].name, className: 'all', requiredHours: rh,
          periodDurationMins: n[i].sessionDuration ?? 40,
          workingDaysPerYear: store.workingDaysPerYear ?? 220,
          workingDaysPerWeek: config.workDays.length,
        })
      }
    }
    setSubjects(n)
  }

  // Get or create class-wise config for a subject
  const getCC = (subIdx: number, cls: string) => {
    const cc = subjects[subIdx].classConfigs?.find(c => c.sectionName === cls)
    return cc ?? {
      sectionName: cls,
      periodsPerWeek: subjects[subIdx].periodsPerWeek,
      maxPeriodsPerDay: subjects[subIdx].maxPeriodsPerDay ?? 2,
      sessionDuration: subjects[subIdx].sessionDuration ?? 40,
    }
  }

  const updateCC = (subIdx: number, cls: string, updates: Partial<{ periodsPerWeek: number; maxPeriodsPerDay: number; sessionDuration: number; requiredHours: number }>) => {
    const n = [...subjects]
    const configs = [...(n[subIdx].classConfigs ?? [])]
    const existing = configs.findIndex(c => c.sectionName === cls)
    const base = getCC(subIdx, cls)
    const updated = { ...base, ...updates }

    // If duration based, recalculate periods
    if (store.schedulingMode === 'duration-based' && updates.requiredHours) {
      updated.periodsPerWeek = durationToWeeklyPeriods({
        subjectName: n[subIdx].name, className: cls,
        requiredHours: updates.requiredHours,
        periodDurationMins: updated.sessionDuration,
        workingDaysPerYear: store.workingDaysPerYear ?? 220,
        workingDaysPerWeek: config.workDays.length,
      })
    }
    if (existing >= 0) configs[existing] = updated
    else configs.push(updated)
    n[subIdx] = { ...n[subIdx], classConfigs: configs }
    setSubjects(n)
  }

  const thS: React.CSSProperties = { padding:"8px 12px", background:"#f7f6f2", fontSize:10, fontWeight:700, textTransform:"uppercase" as const, letterSpacing:"0.06em", color:"#a8a59e", textAlign:"left" as const, borderBottom:"1px solid #e8e5de", whiteSpace:"nowrap" as const }
  const tdS: React.CSSProperties = { padding:"8px 12px", borderBottom:"1px solid #f0ede7", verticalAlign:"middle", fontSize:12 }
  const numInput = (val: number, onChange: (v: number) => void, w = 54): React.CSSProperties => ({ width:w, padding:"4px 6px", border:"1px solid #e8e5de", borderRadius:6, fontSize:12, fontFamily:"monospace", textAlign:"center" as const, outline:"none" })

  return (
    <div>
      <h1 style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:28, marginBottom:6 }}>
        {T.resources} Configuration
      </h1>
      <p style={{ color:"#6a6860", fontSize:13, marginBottom:24, lineHeight:1.65 }}>
        Configure {T.resources.toLowerCase()} and how many {T.sessions.toLowerCase()} each needs per week.
        Use <strong>⚙ Class-wise</strong> to set different values per class (e.g. Maths: 6/week for Class I, 10/week for Class VIII).
      </p>

      {/* Scheduling Mode */}
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase" as const, letterSpacing:"0.06em", color:"#a8a59e", marginBottom:10 }}>Scheduling Mode</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, maxWidth:560 }}>
          {([
            ['period-based', '📅', 'Mode 1 — Period Based', `Specify ${T.sessions.toLowerCase()}/week directly. Simple and fast.`, '#4f46e5', '#eaecf8', '#3730a3'],
            ['duration-based', '⏱', 'Mode 2 — Duration Based', `Specify total hours/year. Schedu calculates ${T.sessions.toLowerCase()}/week automatically.`, '#059669', '#f0fdf4', '#14532d'],
          ] as const).map(([mode, icon, title, desc, border, bg, textColor]) => {
            const active = store.schedulingMode === mode
            return (
              <button key={mode} onClick={() => store.setSchedulingMode(mode)}
                style={{ padding:"14px", borderRadius:10, textAlign:"left" as const, cursor:"pointer", border: active?`2px solid ${border}`:"1.5px solid #e8e5de", background: active?bg:"#fff" }}>
                <div style={{ fontSize:18, marginBottom:5 }}>{icon}</div>
                <div style={{ fontSize:13, fontWeight:700, color: active?textColor:"#1c1b18", marginBottom:3 }}>{title}</div>
                <div style={{ fontSize:11, color:"#6a6860", lineHeight:1.5 }}>{desc}</div>
              </button>
            )
          })}
        </div>

        {store.schedulingMode === 'duration-based' && (
          <div style={{ marginTop:12, display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background:"#f0fdf4", border:"1px solid #86efac", borderRadius:8, fontSize:12, color:"#14532d", flexWrap:"wrap" as const }}>
            <span>📆 Working days/year:</span>
            <input type="number" min={100} max={365} defaultValue={store.workingDaysPerYear ?? 220}
              onBlur={e => store.setWorkingDaysPerYear(Math.max(100, +e.target.value))}
              style={{ width:70, padding:"4px 8px", border:"1.5px solid #86efac", borderRadius:6, fontSize:13, fontFamily:"monospace", textAlign:"center" as const, outline:"none" }} />
            <span>÷ {config.workDays.length} days/week = <strong>{workingWeeks} weeks/year</strong></span>
            <span style={{ fontSize:11, color:"#6a6860" }}>· Formula: (hrs × 60) ÷ (min/session × {workingWeeks})</span>
          </div>
        )}
      </div>

      {/* Subjects table */}
      <div style={{ border:"1.5px solid #e8e5de", borderRadius:12, overflow:"hidden", marginBottom:12 }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr>
              <th style={{...thS, width:36}}>#</th>
              <th style={thS}>{T.resource} Name</th>
              {store.schedulingMode === 'period-based' ? <>
                <th style={{...thS, width:100}}>{T.sessions}/week</th>
                <th style={{...thS, width:80}}>/day avg</th>
                <th style={{...thS, width:90}}>Min/session</th>
                <th style={{...thS, width:80}}>Max/day</th>
              </> : <>
                <th style={{...thS, width:110}}>Req. hrs/year</th>
                <th style={{...thS, width:100}}>{T.sessions}/week <span style={{ color:"#059669", fontSize:9, fontWeight:400 }}>AUTO</span></th>
                <th style={{...thS, width:90}}>Min/session</th>
              </>}
              <th style={{...thS, width:110, color:"#4f46e5"}}>⚙ Class-wise</th>
              <th style={{...thS, width:32}}></th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((s, i) => {
              const perDay = Math.ceil(s.periodsPerWeek / config.workDays.length)
              const isExpanded = expandedSubject === s.id
              const hasClasswise = (s.classConfigs ?? []).length > 0
              return (
                <>
                  <tr key={s.id} style={{ background: i%2===0?"#fff":"#fafaf9" }}>
                    <td style={{...tdS, color:"#a8a59e", fontSize:10, fontFamily:"monospace"}}>{i+1}</td>
                    <td style={tdS}>
                      <input value={s.name} onChange={e => updateSubject(i, { name: e.target.value })}
                        style={{ width:"100%", padding:"4px 0", border:"none", borderBottom:"1px dashed transparent", borderRadius:0, fontSize:13, fontWeight:500, background:"transparent", outline:"none" }}
                        onFocus={e => (e.target as HTMLInputElement).style.borderBottomColor="#4f46e5"}
                        onBlur={e => (e.target as HTMLInputElement).style.borderBottomColor="transparent"} />
                    </td>

                    {store.schedulingMode === 'period-based' ? <>
                      <td style={tdS}>
                        <input type="number" min={1} max={30} value={s.periodsPerWeek}
                          onChange={e => updateSubject(i, { periodsPerWeek: Math.max(1,+e.target.value) })}
                          style={numInput(s.periodsPerWeek, ()=>{}, 54)} />
                      </td>
                      <td style={{...tdS, textAlign:"center" as const}}>
                        <span style={{ fontSize:12, fontWeight:600, color:"#4f46e5", background:"#eaecf8", padding:"2px 8px", borderRadius:4 }}>{perDay}</span>
                      </td>
                      <td style={tdS}>
                        <div style={{ display:"flex", alignItems:"center", gap:3 }}>
                          <input type="number" min={10} max={180} value={s.sessionDuration ?? 40}
                            onChange={e => updateSubject(i, { sessionDuration: Math.max(10,+e.target.value) })}
                            style={numInput(s.sessionDuration??40, ()=>{}, 50)} />
                          <span style={{ fontSize:10, color:"#a8a59e" }}>m</span>
                        </div>
                      </td>
                      <td style={tdS}>
                        <input type="number" min={1} max={6} value={s.maxPeriodsPerDay ?? 2}
                          onChange={e => updateSubject(i, { maxPeriodsPerDay: Math.max(1,+e.target.value) })}
                          style={numInput(s.maxPeriodsPerDay??2, ()=>{}, 44)} />
                      </td>
                    </> : <>
                      <td style={tdS}>
                        <div style={{ display:"flex", alignItems:"center", gap:3 }}>
                          <input type="number" min={0} defaultValue={(s as any).requiredHours ?? 0}
                            onBlur={e => updateSubject(i, { requiredHours: +e.target.value } as any)}
                            style={numInput(0, ()=>{}, 60)} />
                          <span style={{ fontSize:10, color:"#a8a59e" }}>hrs</span>
                        </div>
                      </td>
                      <td style={{...tdS, textAlign:"center" as const}}>
                        <span style={{ fontSize:12, fontWeight:600, color:"#059669", background:"#f0fdf4", padding:"2px 8px", borderRadius:4 }}>{s.periodsPerWeek}</span>
                      </td>
                      <td style={tdS}>
                        <div style={{ display:"flex", alignItems:"center", gap:3 }}>
                          <input type="number" min={10} max={180} value={s.sessionDuration ?? 40}
                            onChange={e => updateSubject(i, { sessionDuration: Math.max(10,+e.target.value) })}
                            style={numInput(s.sessionDuration??40, ()=>{}, 50)} />
                          <span style={{ fontSize:10, color:"#a8a59e" }}>m</span>
                        </div>
                      </td>
                    </>}

                    {/* Class-wise toggle */}
                    <td style={tdS}>
                      <button onClick={() => setExpandedSubject(isExpanded ? null : s.id)}
                        style={{ fontSize:11, padding:"3px 8px", borderRadius:5, border:`1px solid ${isExpanded?"#4f46e5":"#e8e5de"}`, background: isExpanded?"#eaecf8":hasClasswise?"#f0fdf4":"#fff", color: isExpanded?"#4f46e5":hasClasswise?"#059669":"#6a6860", cursor:"pointer", fontWeight:500, whiteSpace:"nowrap" as const }}>
                        {isExpanded ? "▲ Hide" : hasClasswise ? "✓ Class-wise" : "⚙ Set"}
                      </button>
                    </td>
                    <td style={tdS}>
                      <button onClick={() => setSubjects(subjects.filter((_,j)=>j!==i))}
                        style={{ width:22, height:22, borderRadius:4, border:"none", background:"transparent", cursor:"pointer", color:"#c8c5bc", fontSize:16 }}>×</button>
                    </td>
                  </tr>

                  {/* Class-wise expand panel */}
                  {isExpanded && (
                    <tr key={s.id+'-cw'}>
                      <td colSpan={store.schedulingMode === 'period-based' ? 9 : 8} style={{ padding:0, background:"#f5f3ff", borderBottom:"2px solid #4f46e5" }}>
                        <div style={{ padding:"12px 16px" }}>
                          <div style={{ fontSize:12, fontWeight:600, color:"#3730a3", marginBottom:10 }}>
                            ⚙ Class-wise settings for <strong>{s.name}</strong>
                            <span style={{ fontWeight:400, color:"#6a6860", marginLeft:8 }}>— override default values per class group</span>
                          </div>
                          {(() => {
                            const allCls = baseClasses.length > 0 ? baseClasses
                              : [...new Set((s.classConfigs ?? []).map((c: any) => c.sectionName))]
                            return (<div>
                            <div style={{ display:"flex", gap:8, marginBottom:10, alignItems:"center" }}>
                              <input placeholder="Add a class name (e.g. Class I, Grade 8) → press Enter"
                                style={{ flex:1, padding:"6px 10px", border:"1.5px dashed #c4b5fd", borderRadius:6, fontSize:12, outline:"none", background:"#faf5ff", color:"#3730a3" }}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') {
                                    const val = (e.target as HTMLInputElement).value.trim()
                                    if (val) { updateCC(i, val, {}); (e.target as HTMLInputElement).value = '' }
                                  }
                                }} />
                              <span style={{ fontSize:10, color:"#a8a59e", whiteSpace:"nowrap" as const }}>Press Enter</span>
                            </div>
                            {allCls.length === 0
                              ? <div style={{ fontSize:11, color:"#a8a59e", padding:"4px 0 8px" }}>No classes yet — type above or complete the Groups step first.</div>
                              : <table style={{ borderCollapse:"collapse", fontSize:11, width:"100%" }}>
                              <thead>
                                <tr>
                                  <th style={{ ...thS, background:"#ede9fe", minWidth:100 }}>Class</th>
                                  {store.schedulingMode === 'period-based' ? <>
                                    <th style={{ ...thS, background:"#ede9fe", width:110 }}>{T.sessions}/week</th>
                                    <th style={{ ...thS, background:"#ede9fe", width:100 }}>Min/session</th>
                                    <th style={{ ...thS, background:"#ede9fe", width:90 }}>Max/day</th>
                                  </> : <>
                                    <th style={{ ...thS, background:"#ede9fe", width:120 }}>Req. hrs/year</th>
                                    <th style={{ ...thS, background:"#ede9fe", width:110 }}>{T.sessions}/week <span style={{ color:"#059669", fontSize:9 }}>AUTO</span></th>
                                    <th style={{ ...thS, background:"#ede9fe", width:100 }}>Min/session</th>
                                  </>}
                                </tr>
                              </thead>
                              <tbody>
                                {baseClasses.map(cls => {
                                  const cc = getCC(i, cls)
                                  return (
                                    <tr key={cls}>
                                      <td style={{ ...tdS, fontWeight:600, color:"#4f46e5", background:"#faf5ff" }}>{cls}</td>
                                      {store.schedulingMode === 'period-based' ? <>
                                        <td style={{ ...tdS, background:"#faf5ff" }}>
                                          <input type="number" min={1} defaultValue={cc.periodsPerWeek} key={cc.periodsPerWeek}
                                            onBlur={e => updateCC(i, cls, { periodsPerWeek: Math.max(1,+e.target.value) })}
                                            style={{ width:54, padding:"3px 6px", border:"1px solid #c4b5fd", borderRadius:5, fontSize:12, fontFamily:"monospace", textAlign:"center" as const, outline:"none" }} />
                                        </td>
                                        <td style={{ ...tdS, background:"#faf5ff" }}>
                                          <div style={{ display:"flex", alignItems:"center", gap:3 }}>
                                            <input type="number" min={10} max={180} defaultValue={cc.sessionDuration} key={cc.sessionDuration}
                                              onBlur={e => updateCC(i, cls, { sessionDuration: Math.max(10,+e.target.value) })}
                                              style={{ width:50, padding:"3px 6px", border:"1px solid #c4b5fd", borderRadius:5, fontSize:12, fontFamily:"monospace", textAlign:"center" as const, outline:"none" }} />
                                            <span style={{ fontSize:10, color:"#a8a59e" }}>m</span>
                                          </div>
                                        </td>
                                        <td style={{ ...tdS, background:"#faf5ff" }}>
                                          <input type="number" min={1} max={6} defaultValue={cc.maxPeriodsPerDay} key={cc.maxPeriodsPerDay}
                                            onBlur={e => updateCC(i, cls, { maxPeriodsPerDay: Math.max(1,+e.target.value) })}
                                            style={{ width:44, padding:"3px 6px", border:"1px solid #c4b5fd", borderRadius:5, fontSize:12, fontFamily:"monospace", textAlign:"center" as const, outline:"none" }} />
                                        </td>
                                      </> : <>
                                        <td style={{ ...tdS, background:"#faf5ff" }}>
                                          <div style={{ display:"flex", alignItems:"center", gap:3 }}>
                                            <input type="number" min={0} defaultValue={(cc as any).requiredHours ?? 0}
                                              onBlur={e => updateCC(i, cls, { requiredHours: +e.target.value })}
                                              style={{ width:60, padding:"3px 6px", border:"1px solid #c4b5fd", borderRadius:5, fontSize:12, fontFamily:"monospace", textAlign:"center" as const, outline:"none" }} />
                                            <span style={{ fontSize:10, color:"#a8a59e" }}>hrs</span>
                                          </div>
                                        </td>
                                        <td style={{ ...tdS, background:"#faf5ff" }}>
                                          <span style={{ fontSize:12, fontWeight:600, color:"#059669", background:"#f0fdf4", padding:"2px 8px", borderRadius:4 }}>{cc.periodsPerWeek}</span>
                                        </td>
                                        <td style={{ ...tdS, background:"#faf5ff" }}>
                                          <div style={{ display:"flex", alignItems:"center", gap:3 }}>
                                            <input type="number" min={10} max={180} defaultValue={cc.sessionDuration} key={cc.sessionDuration}
                                              onBlur={e => updateCC(i, cls, { sessionDuration: Math.max(10,+e.target.value) })}
                                              style={{ width:50, padding:"3px 6px", border:"1px solid #c4b5fd", borderRadius:5, fontSize:12, fontFamily:"monospace", textAlign:"center" as const, outline:"none" }} />
                                            <span style={{ fontSize:10, color:"#a8a59e" }}>m</span>
                                          </div>
                                        </td>
                                      </>}
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                            )}
                            </div>
                            )
                          })()}
                          <div style={{ fontSize:10, color:"#7c3aed", marginTop:8 }}>
                            💡 Leave blank to use default values above. Only set values that differ per class.
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              )
            })}
          </tbody>
        </table>
        <button onClick={() => setSubjects([...subjects, {
            id:crypto.randomUUID(), name:`New ${T.resource}`,
            periodsPerWeek:2, sessionDuration:40, maxPeriodsPerDay:2,
            color:"bg-gray-100 text-gray-700", sections:[], classConfigs:[]
          }])}
          style={{ width:"100%", padding:"10px 12px", border:"none", borderTop:"1.5px dashed #e8e5de", background:"transparent", cursor:"pointer", fontSize:12, color:"#a8a59e", textAlign:"left" as const }}>
          ＋ Add {T.resource}
        </button>
      </div>

      <div style={{ fontSize:11, color:"#6a6860", marginBottom:16 }}>
        {store.schedulingMode === 'period-based'
          ? `💡 /day is auto-calculated · Use ⚙ Class-wise to set different ${T.sessions.toLowerCase()}/week per class (e.g. Maths: 6 for Class I, 10 for Class VIII)`
          : `💡 Formula: (hrs × 60) ÷ (min/session × ${workingWeeks} weeks) = ${T.sessions.toLowerCase()}/week`}
      </div>

      <div style={{ display:"flex", justifyContent:"space-between", paddingTop:20, borderTop:"1px solid #e8e5de" }}>
        <button onClick={() => setStep(2)} style={{ padding:"10px 20px", borderRadius:8, border:"1.5px solid #e8e5de", background:"#fff", fontSize:13, fontWeight:500, cursor:"pointer" }}>← Back</button>
        <button onClick={() => setStep(4)} style={{ padding:"10px 24px", borderRadius:8, border:"none", background:"#059669", color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer" }}>
          Save & Continue →
        </button>
      </div>
    </div>
  )
}
