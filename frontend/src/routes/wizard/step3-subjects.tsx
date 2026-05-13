import { useEffect, useState } from "react"
import { useTimetableStore } from "@/store/timetableStore"
import { useTerminology } from "@/hooks/useTerminology"
import { generateSubjects } from "@/lib/orgData"
import { durationToWeeklyPeriods } from "@/lib/schedulingEngine"

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
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const workingWeeks = Math.round((store.workingDaysPerYear ?? 220) / config.workDays.length)
  const baseClasses = getBaseClasses(sections)

  useEffect(() => {
    if (!subjects.length) {
      setSubjects(generateSubjects(config.orgType ?? "school", config.countryCode ?? "IN", config.numSubjects))
    }
  }, [])

  const updateSubject = (i: number, key: string, val: number | string) => {
    const n = [...subjects] as any[]
    n[i] = { ...n[i], [key]: val }
    if (store.schedulingMode === 'duration-based' && key === 'requiredHours' && +val > 0) {
      n[i].periodsPerWeek = durationToWeeklyPeriods({
        subjectName: n[i].name, className: 'all',
        requiredHours: +val,
        periodDurationMins: n[i].sessionDuration ?? 40,
        workingDaysPerYear: store.workingDaysPerYear ?? 220,
        workingDaysPerWeek: config.workDays.length,
      })
    }
    setSubjects(n)
  }

  const getCC = (si: number, cls: string) => {
    const cc = (subjects[si].classConfigs ?? []).find(c => c.sectionName === cls)
    return cc ?? {
      sectionName: cls,
      periodsPerWeek: subjects[si].periodsPerWeek,
      maxPeriodsPerDay: subjects[si].maxPeriodsPerDay ?? 2,
      sessionDuration: subjects[si].sessionDuration ?? 40,
    }
  }

  const updateCC = (si: number, cls: string, key: string, val: number) => {
    const n = [...subjects] as any[]
    const configs = [...(n[si].classConfigs ?? [])]
    const idx = configs.findIndex((c: any) => c.sectionName === cls)
    const base = getCC(si, cls)
    const updated: any = { ...base, [key]: val }
    if (store.schedulingMode === 'duration-based' && key === 'requiredHours' && val > 0) {
      updated.periodsPerWeek = durationToWeeklyPeriods({
        subjectName: n[si].name, className: cls,
        requiredHours: val,
        periodDurationMins: updated.sessionDuration,
        workingDaysPerYear: store.workingDaysPerYear ?? 220,
        workingDaysPerWeek: config.workDays.length,
      })
    }
    if (idx >= 0) configs[idx] = updated
    else configs.push(updated)
    n[si] = { ...n[si], classConfigs: configs }
    setSubjects(n)
  }

  const addClassRow = (si: number, cls: string) => {
    if (!cls.trim()) return
    const n = [...subjects] as any[]
    const configs = [...(n[si].classConfigs ?? [])]
    if (!configs.find((c: any) => c.sectionName === cls)) {
      configs.push({ sectionName: cls, periodsPerWeek: n[si].periodsPerWeek, maxPeriodsPerDay: n[si].maxPeriodsPerDay ?? 2, sessionDuration: n[si].sessionDuration ?? 40 })
    }
    n[si] = { ...n[si], classConfigs: configs }
    setSubjects(n)
  }

  const thS: React.CSSProperties = { padding:"8px 12px", background:"#f7f6f2", fontSize:10, fontWeight:700, textTransform:"uppercase" as const, letterSpacing:"0.06em", color:"#a8a59e", textAlign:"left" as const, borderBottom:"1px solid #e8e5de", whiteSpace:"nowrap" as const }
  const tdS: React.CSSProperties = { padding:"8px 12px", borderBottom:"1px solid #f0ede7", verticalAlign:"middle", fontSize:12 }
  const numSty: React.CSSProperties = { padding:"4px 6px", border:"1px solid #e8e5de", borderRadius:6, fontSize:12, fontFamily:"monospace", textAlign:"center" as const, outline:"none" }
  const ccNumSty: React.CSSProperties = { padding:"3px 6px", border:"1px solid #c4b5fd", borderRadius:5, fontSize:12, fontFamily:"monospace", textAlign:"center" as const, outline:"none" }

  return (
    <div>
      <h1 style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:28, marginBottom:6 }}>
        {T.resources} Configuration
      </h1>
      <p style={{ color:"#6a6860", fontSize:13, marginBottom:24, lineHeight:1.65 }}>
        Configure {T.resources.toLowerCase()} and {T.sessions.toLowerCase()}s per week.
        Use <strong>⚙ Class-wise</strong> to set different values per class — e.g. Maths: 6/week for Class I, 10/week for Class VIII.
      </p>

      {/* Mode selector */}
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase" as const, letterSpacing:"0.06em", color:"#a8a59e", marginBottom:10 }}>Scheduling Mode</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, maxWidth:560 }}>
          {([
            ['period-based', '📅', 'Mode 1 — Period Based', `Specify ${T.sessions.toLowerCase()}s/week directly. Simple and fast.`, '#4f46e5', '#eaecf8', '#3730a3'],
            ['duration-based', '⏱', 'Mode 2 — Duration Based', `Specify total hours/year. Schedu calculates ${T.sessions.toLowerCase()}s/week automatically.`, '#059669', '#f0fdf4', '#14532d'],
          ] as const).map(([mode, icon, title, desc, bdr, bg, tc]) => {
            const active = store.schedulingMode === mode
            return (
              <button key={mode} onClick={() => store.setSchedulingMode(mode)}
                style={{ padding:"14px", borderRadius:10, textAlign:"left" as const, cursor:"pointer", border: active?`2px solid ${bdr}`:"1.5px solid #e8e5de", background: active?bg:"#fff" }}>
                <div style={{ fontSize:18, marginBottom:5 }}>{icon}</div>
                <div style={{ fontSize:13, fontWeight:700, color: active?tc:"#1c1b18", marginBottom:3 }}>{title}</div>
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
                <th style={{...thS, width:70}}>/day</th>
                <th style={{...thS, width:90}}>Min/session</th>
                <th style={{...thS, width:80}}>Max/day</th>
              </> : <>
                <th style={{...thS, width:110}}>Req hrs/year</th>
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
              const isExpanded = expandedId === s.id
              const hasCC = (s.classConfigs ?? []).length > 0

              // Classes to show in class-wise panel
              const ccClasses = baseClasses.length > 0
                ? baseClasses
                : [...new Set((s.classConfigs ?? []).map(c => c.sectionName))]

              return (
                <tbody key={s.id}>
                  {/* Main row */}
                  <tr style={{ background: i%2===0?"#fff":"#fafaf9" }}>
                    <td style={{...tdS, color:"#a8a59e", fontSize:10, fontFamily:"monospace"}}>{i+1}</td>
                    <td style={tdS}>
                      <input value={s.name} onChange={e => updateSubject(i, 'name', e.target.value)}
                        style={{ width:"100%", padding:"4px 0", border:"none", fontSize:13, fontWeight:500, background:"transparent", outline:"none", borderBottom:"1px dashed transparent" }}
                        onFocus={e => { (e.target as HTMLInputElement).style.borderBottomColor = "#4f46e5" }}
                        onBlur={e => { (e.target as HTMLInputElement).style.borderBottomColor = "transparent" }} />
                    </td>

                    {store.schedulingMode === 'period-based' ? <>
                      <td style={tdS}>
                        <input type="number" min={1} max={30} value={s.periodsPerWeek}
                          onChange={e => updateSubject(i, 'periodsPerWeek', Math.max(1,+e.target.value))}
                          style={{...numSty, width:54}} />
                      </td>
                      <td style={{...tdS, textAlign:"center" as const}}>
                        <span style={{ fontSize:12, fontWeight:600, color:"#4f46e5", background:"#eaecf8", padding:"2px 8px", borderRadius:4 }}>{perDay}</span>
                      </td>
                      <td style={tdS}>
                        <div style={{ display:"flex", alignItems:"center", gap:3 }}>
                          <input type="number" min={10} max={180} value={s.sessionDuration ?? 40}
                            onChange={e => updateSubject(i, 'sessionDuration', Math.max(10,+e.target.value))}
                            style={{...numSty, width:50}} />
                          <span style={{ fontSize:10, color:"#a8a59e" }}>m</span>
                        </div>
                      </td>
                      <td style={tdS}>
                        <input type="number" min={1} max={6} value={s.maxPeriodsPerDay ?? 2}
                          onChange={e => updateSubject(i, 'maxPeriodsPerDay', Math.max(1,+e.target.value))}
                          style={{...numSty, width:44}} />
                      </td>
                    </> : <>
                      <td style={tdS}>
                        <div style={{ display:"flex", alignItems:"center", gap:3 }}>
                          <input type="number" min={0} defaultValue={(s as any).requiredHours ?? 0}
                            key={s.id + '-rh'}
                            onBlur={e => updateSubject(i, 'requiredHours', +e.target.value)}
                            style={{...numSty, width:60}} />
                          <span style={{ fontSize:10, color:"#a8a59e" }}>hrs</span>
                        </div>
                      </td>
                      <td style={{...tdS, textAlign:"center" as const}}>
                        <span style={{ fontSize:12, fontWeight:600, color:"#059669", background:"#f0fdf4", padding:"2px 8px", borderRadius:4 }}>{s.periodsPerWeek}</span>
                      </td>
                      <td style={tdS}>
                        <div style={{ display:"flex", alignItems:"center", gap:3 }}>
                          <input type="number" min={10} max={180} value={s.sessionDuration ?? 40}
                            onChange={e => updateSubject(i, 'sessionDuration', Math.max(10,+e.target.value))}
                            style={{...numSty, width:50}} />
                          <span style={{ fontSize:10, color:"#a8a59e" }}>m</span>
                        </div>
                      </td>
                    </>}

                    <td style={tdS}>
                      <button onClick={() => setExpandedId(isExpanded ? null : s.id)}
                        style={{ fontSize:11, padding:"3px 8px", borderRadius:5, border:`1px solid ${isExpanded?"#4f46e5":"#e8e5de"}`, background: isExpanded?"#eaecf8":hasCC?"#f0fdf4":"#fff", color: isExpanded?"#4f46e5":hasCC?"#059669":"#6a6860", cursor:"pointer", fontWeight:500, whiteSpace:"nowrap" as const }}>
                        {isExpanded ? "▲ Hide" : hasCC ? "✓ Set" : "⚙ Set"}
                      </button>
                    </td>
                    <td style={tdS}>
                      <button onClick={() => setSubjects(subjects.filter((_,j) => j!==i))}
                        style={{ width:22, height:22, borderRadius:4, border:"none", background:"transparent", cursor:"pointer", color:"#c8c5bc", fontSize:16 }}>×</button>
                    </td>
                  </tr>

                  {/* Class-wise expand panel */}
                  {isExpanded && (
                    <tr>
                      <td colSpan={store.schedulingMode === 'period-based' ? 9 : 8} style={{ padding:0 }}>
                        <div style={{ background:"#f5f3ff", borderBottom:"2px solid #4f46e5", padding:"12px 16px" }}>
                          <div style={{ fontSize:12, fontWeight:600, color:"#3730a3", marginBottom:10 }}>
                            ⚙ Class-wise settings for <strong>{s.name}</strong>
                            <span style={{ fontWeight:400, color:"#6a6860", marginLeft:8 }}>— different values per class group</span>
                          </div>

                          {/* Add class row input */}
                          <div style={{ display:"flex", gap:8, marginBottom:12, alignItems:"center" }}>
                            <input
                              placeholder="Type class name and press Enter (e.g. Class I, Grade 8, Nursery)"
                              style={{ flex:1, padding:"7px 10px", border:"1.5px dashed #c4b5fd", borderRadius:6, fontSize:12, outline:"none", background:"#faf5ff", color:"#3730a3" }}
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  const val = (e.target as HTMLInputElement).value.trim()
                                  if (val) { addClassRow(i, val); (e.target as HTMLInputElement).value = '' }
                                }
                              }}
                            />
                            <span style={{ fontSize:10, color:"#a8a59e", whiteSpace:"nowrap" as const }}>Press Enter to add</span>
                          </div>

                          {ccClasses.length === 0 ? (
                            <div style={{ fontSize:11, color:"#a8a59e", padding:"4px 0" }}>
                              Type class names above to configure per-class settings.
                            </div>
                          ) : (
                            <table style={{ borderCollapse:"collapse", fontSize:11, width:"100%" }}>
                              <thead>
                                <tr>
                                  <th style={{...thS, background:"#ede9fe", minWidth:100}}>Class</th>
                                  {store.schedulingMode === 'period-based' ? <>
                                    <th style={{...thS, background:"#ede9fe", width:110}}>{T.sessions}/week</th>
                                    <th style={{...thS, background:"#ede9fe", width:100}}>Min/session</th>
                                    <th style={{...thS, background:"#ede9fe", width:90}}>Max/day</th>
                                  </> : <>
                                    <th style={{...thS, background:"#ede9fe", width:120}}>Req hrs/year</th>
                                    <th style={{...thS, background:"#ede9fe", width:110}}>{T.sessions}/week <span style={{ color:"#059669", fontSize:9 }}>AUTO</span></th>
                                    <th style={{...thS, background:"#ede9fe", width:100}}>Min/session</th>
                                  </>}
                                  <th style={{...thS, background:"#ede9fe", width:32}}></th>
                                </tr>
                              </thead>
                              <tbody>
                                {ccClasses.map(cls => {
                                  const cc = getCC(i, cls)
                                  return (
                                    <tr key={cls}>
                                      <td style={{...tdS, fontWeight:600, color:"#4f46e5", background:"#faf5ff"}}>{cls}</td>
                                      {store.schedulingMode === 'period-based' ? <>
                                        <td style={{...tdS, background:"#faf5ff"}}>
                                          <input type="number" min={1} defaultValue={cc.periodsPerWeek} key={cls+'-pw'}
                                            onBlur={e => updateCC(i, cls, 'periodsPerWeek', Math.max(1,+e.target.value))}
                                            style={{...ccNumSty, width:54}} />
                                        </td>
                                        <td style={{...tdS, background:"#faf5ff"}}>
                                          <div style={{ display:"flex", alignItems:"center", gap:3 }}>
                                            <input type="number" min={10} max={180} defaultValue={cc.sessionDuration} key={cls+'-sd'}
                                              onBlur={e => updateCC(i, cls, 'sessionDuration', Math.max(10,+e.target.value))}
                                              style={{...ccNumSty, width:50}} />
                                            <span style={{ fontSize:10, color:"#a8a59e" }}>m</span>
                                          </div>
                                        </td>
                                        <td style={{...tdS, background:"#faf5ff"}}>
                                          <input type="number" min={1} max={6} defaultValue={cc.maxPeriodsPerDay} key={cls+'-mpd'}
                                            onBlur={e => updateCC(i, cls, 'maxPeriodsPerDay', Math.max(1,+e.target.value))}
                                            style={{...ccNumSty, width:44}} />
                                        </td>
                                      </> : <>
                                        <td style={{...tdS, background:"#faf5ff"}}>
                                          <div style={{ display:"flex", alignItems:"center", gap:3 }}>
                                            <input type="number" min={0} defaultValue={(cc as any).requiredHours ?? 0} key={cls+'-rh'}
                                              onBlur={e => updateCC(i, cls, 'requiredHours', +e.target.value)}
                                              style={{...ccNumSty, width:60}} />
                                            <span style={{ fontSize:10, color:"#a8a59e" }}>hrs</span>
                                          </div>
                                        </td>
                                        <td style={{...tdS, background:"#faf5ff"}}>
                                          <span style={{ fontSize:12, fontWeight:600, color:"#059669", background:"#f0fdf4", padding:"2px 8px", borderRadius:4 }}>{cc.periodsPerWeek}</span>
                                        </td>
                                        <td style={{...tdS, background:"#faf5ff"}}>
                                          <div style={{ display:"flex", alignItems:"center", gap:3 }}>
                                            <input type="number" min={10} max={180} defaultValue={cc.sessionDuration} key={cls+'-sd'}
                                              onBlur={e => updateCC(i, cls, 'sessionDuration', Math.max(10,+e.target.value))}
                                              style={{...ccNumSty, width:50}} />
                                            <span style={{ fontSize:10, color:"#a8a59e" }}>m</span>
                                          </div>
                                        </td>
                                      </>}
                                      <td style={{...tdS, background:"#faf5ff"}}>
                                        <button onClick={() => {
                                          const n = [...subjects] as any[]
                                          n[i] = { ...n[i], classConfigs: (n[i].classConfigs ?? []).filter((c: any) => c.sectionName !== cls) }
                                          setSubjects(n)
                                        }} style={{ width:18, height:18, borderRadius:3, border:"none", background:"transparent", cursor:"pointer", color:"#c8c5bc", fontSize:14 }}>×</button>
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          )}
                          <div style={{ fontSize:10, color:"#7c3aed", marginTop:8 }}>
                            💡 Default values (from main row) apply to all other classes not listed here.
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
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
          ? `💡 /day auto-calculated · ⚙ Class-wise overrides default values per class group`
          : `💡 Formula: (hrs × 60) ÷ (min/session × ${workingWeeks} weeks) = ${T.sessions.toLowerCase()}s/week`}
      </div>

      <div style={{ display:"flex", justifyContent:"space-between", paddingTop:20, borderTop:"1px solid #e8e5de" }}>
        <button onClick={() => setStep(2)} style={{ padding:"10px 20px", borderRadius:8, border:"1.5px solid #e8e5de", background:"#fff", fontSize:13, fontWeight:500, cursor:"pointer" }}>← Back</button>
        <button onClick={() => setStep(4)} style={{ padding:"10px 24px", borderRadius:8, border:"none", background:"#059669", color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer" }}>Save & Continue →</button>
      </div>
    </div>
  )
}
