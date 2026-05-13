import { useEffect } from "react"
import { useTimetableStore } from "@/store/timetableStore"
import { useTerminology } from "@/hooks/useTerminology"
import { generateSubjects, getCountry } from "@/lib/orgData"
import { durationToWeeklyPeriods } from "@/lib/schedulingEngine"

export function Step3Subjects() {
  const store = useTimetableStore()
  const { config, subjects, setSubjects, setStep } = store
  const T = useTerminology()
  const country = getCountry(config.countryCode ?? "IN")

  // Auto-generate subjects if empty
  useEffect(() => {
    if (!subjects.length) {
      setSubjects(generateSubjects(config.orgType ?? "school", config.countryCode ?? "IN", config.numSubjects))
    }
  }, [])

  const workingWeeks = Math.round((store.workingDaysPerYear ?? 220) / config.workDays.length)

  const updateSubject = (i: number, updates: Partial<typeof subjects[0]>) => {
    const n = [...subjects]
    n[i] = { ...n[i], ...updates }
    // If duration changes in mode 2, recalculate periodsPerWeek
    if (store.schedulingMode === 'duration-based' && 'requiredHours' in updates) {
      const rh = (updates as any).requiredHours ?? (n[i] as any).requiredHours ?? 0
      if (rh > 0) {
        n[i].periodsPerWeek = durationToWeeklyPeriods({
          subjectName: n[i].name, className: 'all',
          requiredHours: rh,
          periodDurationMins: n[i].sessionDuration ?? 40,
          workingDaysPerYear: store.workingDaysPerYear ?? 220,
          workingDaysPerWeek: config.workDays.length,
        })
      }
    }
    setSubjects(n)
  }

  const thS: React.CSSProperties = { padding:"8px 12px", background:"#f7f6f2", fontSize:10, fontWeight:700, textTransform:"uppercase" as const, letterSpacing:"0.06em", color:"#a8a59e", textAlign:"left" as const, borderBottom:"1px solid #e8e5de", whiteSpace:"nowrap" as const }
  const tdS: React.CSSProperties = { padding:"8px 12px", borderBottom:"1px solid #f0ede7", verticalAlign:"middle", fontSize:12 }

  return (
    <div>
      <h1 style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:28, marginBottom:6 }}>
        {T.resources} Configuration
      </h1>
      <p style={{ color:"#6a6860", fontSize:13, marginBottom:24, lineHeight:1.65 }}>
        Configure {T.resources.toLowerCase()} for your {T.organization.toLowerCase()}. Set how many {T.sessions.toLowerCase()} each {T.resource.toLowerCase()} needs per week.
      </p>

      {/* Scheduling Mode */}
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase" as const, letterSpacing:"0.06em", color:"#a8a59e", marginBottom:10 }}>
          Scheduling Mode
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, maxWidth:560 }}>
          {[
            { mode:'period-based' as const, title:"Mode 1 — Period Based", desc:`Specify ${T.sessions.toLowerCase()} per week directly for each ${T.resource.toLowerCase()}. Simple and fast.`, icon:"📅" },
            { mode:'duration-based' as const, title:"Mode 2 — Duration Based", desc:`Specify total hours needed per year. Schedu calculates ${T.sessions.toLowerCase()}/week automatically.`, icon:"⏱" },
          ].map(({ mode, title, desc, icon }) => {
            const active = store.schedulingMode === mode
            return (
              <button key={mode} onClick={() => store.setSchedulingMode(mode)}
                style={{ padding:"14px", borderRadius:10, textAlign:"left" as const, cursor:"pointer", border: active?`2px solid ${mode==='period-based'?'#4f46e5':'#059669'}`:"1.5px solid #e8e5de", background: active?(mode==='period-based'?"#eaecf8":"#f0fdf4"):"#fff" }}>
                <div style={{ fontSize:20, marginBottom:6 }}>{icon}</div>
                <div style={{ fontSize:13, fontWeight:700, color: active?(mode==='period-based'?"#3730a3":"#14532d"):"#1c1b18", marginBottom:4 }}>{title}</div>
                <div style={{ fontSize:11, color:"#6a6860", lineHeight:1.5 }}>{desc}</div>
              </button>
            )
          })}
        </div>

        {store.schedulingMode === 'duration-based' && (
          <div style={{ marginTop:12, display:"flex", alignItems:"center", gap:12, padding:"10px 14px", background:"#f0fdf4", border:"1px solid #86efac", borderRadius:8, fontSize:12, color:"#14532d" }}>
            <span>📆 Working days/year:</span>
            <input type="number" min={100} max={365}
              defaultValue={store.workingDaysPerYear ?? 220}
              onBlur={e => store.setWorkingDaysPerYear(Math.max(100, +e.target.value))}
              style={{ width:70, padding:"4px 8px", border:"1.5px solid #86efac", borderRadius:6, fontSize:13, fontFamily:"monospace", textAlign:"center" as const, outline:"none" }} />
            <span>÷ {config.workDays.length} days/week = <strong>{workingWeeks} weeks/year</strong></span>
          </div>
        )}
      </div>

      {/* Subjects table */}
      <div style={{ border:"1.5px solid #e8e5de", borderRadius:12, overflow:"hidden", marginBottom:16 }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr>
              <th style={{...thS, width:36}}>#</th>
              <th style={thS}>{T.resource} Name</th>
              {store.schedulingMode === 'period-based' ? (
                <>
                  <th style={{...thS, width:110}}>{T.sessions}/week</th>
                  <th style={{...thS, width:90}}>{T.sessions}/day</th>
                  <th style={{...thS, width:100}}>Min/session</th>
                  <th style={{...thS, width:90}}>Max/day</th>
                </>
              ) : (
                <>
                  <th style={{...thS, width:120}}>Required hrs/year</th>
                  <th style={{...thS, width:110}}>{T.sessions}/week <span style={{ color:"#059669", fontSize:9 }}>AUTO</span></th>
                  <th style={{...thS, width:100}}>Min/session</th>
                </>
              )}
              <th style={{...thS, width:32}}></th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((s, i) => {
              const perDay = Math.ceil(s.periodsPerWeek / config.workDays.length)
              return (
                <tr key={s.id} style={{ background: i%2===0?"#fff":"#fafaf9" }}>
                  <td style={{...tdS, color:"#a8a59e", fontSize:10, fontFamily:"monospace"}}>{i+1}</td>
                  <td style={tdS}>
                    <input value={s.name} onChange={e => updateSubject(i, { name: e.target.value })}
                      style={{ width:"100%", padding:"4px 6px", border:"1px solid transparent", borderRadius:5, fontSize:12, background:"transparent", outline:"none" }} />
                  </td>

                  {store.schedulingMode === 'period-based' ? (
                    <>
                      <td style={tdS}>
                        <input type="number" min={1} max={30} value={s.periodsPerWeek}
                          onChange={e => updateSubject(i, { periodsPerWeek: Math.max(1,+e.target.value) })}
                          style={{ width:60, padding:"4px 8px", border:"1px solid #e8e5de", borderRadius:6, fontSize:12, fontFamily:"monospace", textAlign:"center" as const, outline:"none" }} />
                      </td>
                      <td style={{...tdS, textAlign:"center" as const}}>
                        <span style={{ fontSize:12, fontWeight:600, color:"#4f46e5", background:"#eaecf8", padding:"2px 8px", borderRadius:4, fontFamily:"monospace" }}>{perDay}</span>
                      </td>
                      <td style={tdS}>
                        <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                          <input type="number" min={10} max={180} value={s.sessionDuration ?? 40}
                            onChange={e => updateSubject(i, { sessionDuration: Math.max(10,+e.target.value) })}
                            style={{ width:52, padding:"4px 6px", border:"1px solid #e8e5de", borderRadius:6, fontSize:12, fontFamily:"monospace", textAlign:"center" as const, outline:"none" }} />
                          <span style={{ fontSize:10, color:"#a8a59e" }}>min</span>
                        </div>
                      </td>
                      <td style={tdS}>
                        <input type="number" min={1} max={6} value={s.maxPeriodsPerDay ?? 2}
                          onChange={e => updateSubject(i, { maxPeriodsPerDay: Math.max(1,+e.target.value) })}
                          style={{ width:44, padding:"4px 6px", border:"1px solid #e8e5de", borderRadius:6, fontSize:12, fontFamily:"monospace", textAlign:"center" as const, outline:"none" }} />
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={tdS}>
                        <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                          <input type="number" min={1}
                            defaultValue={(s as any).requiredHours ?? 0}
                            onBlur={e => updateSubject(i, { requiredHours: +e.target.value } as any)}
                            style={{ width:60, padding:"4px 8px", border:"1px solid #e8e5de", borderRadius:6, fontSize:12, fontFamily:"monospace", textAlign:"center" as const, outline:"none" }} />
                          <span style={{ fontSize:10, color:"#a8a59e" }}>hrs</span>
                        </div>
                      </td>
                      <td style={{...tdS, textAlign:"center" as const}}>
                        <span style={{ fontSize:12, fontWeight:600, color:"#059669", background:"#f0fdf4", padding:"2px 8px", borderRadius:4, fontFamily:"monospace" }}>{s.periodsPerWeek}</span>
                      </td>
                      <td style={tdS}>
                        <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                          <input type="number" min={10} max={180} value={s.sessionDuration ?? 40}
                            onChange={e => updateSubject(i, { sessionDuration: Math.max(10,+e.target.value) })}
                            style={{ width:52, padding:"4px 6px", border:"1px solid #e8e5de", borderRadius:6, fontSize:12, fontFamily:"monospace", textAlign:"center" as const, outline:"none" }} />
                          <span style={{ fontSize:10, color:"#a8a59e" }}>min</span>
                        </div>
                      </td>
                    </>
                  )}

                  <td style={tdS}>
                    <button onClick={() => setSubjects(subjects.filter((_,j)=>j!==i))}
                      style={{ width:22, height:22, borderRadius:4, border:"none", background:"transparent", cursor:"pointer", color:"#c8c5bc", fontSize:16 }}>×</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <button
          onClick={() => setSubjects([...subjects, {
            id: crypto.randomUUID(), name:`New ${T.resource}`,
            periodsPerWeek: 2, sessionDuration: 40, maxPeriodsPerDay: 2,
            color:"bg-gray-100 text-gray-700", sections: [], classConfigs: []
          }])}
          style={{ width:"100%", padding:"10px 12px", border:"none", borderTop:"1.5px dashed #e8e5de", background:"transparent", cursor:"pointer", fontSize:12, color:"#a8a59e", textAlign:"left" as const }}>
          ＋ Add {T.resource}
        </button>
      </div>

      {store.schedulingMode === 'period-based' && (
        <div style={{ fontSize:11, color:"#6a6860", padding:"6px 0", marginBottom:8 }}>
          💡 {T.sessions}/day is calculated automatically · Min/session = duration per class period · Max/day = max times this {T.resource.toLowerCase()} can appear in one day
        </div>
      )}
      {store.schedulingMode === 'duration-based' && (
        <div style={{ fontSize:11, color:"#059669", padding:"6px 0", marginBottom:8 }}>
          💡 Formula: (Required hrs × 60) ÷ (Min/session × {workingWeeks} weeks) = {T.sessions}/week
        </div>
      )}

      <div style={{ display:"flex", justifyContent:"space-between", paddingTop:20, borderTop:"1px solid #e8e5de" }}>
        <button onClick={() => setStep(2)} style={{ padding:"10px 20px", borderRadius:8, border:"1.5px solid #e8e5de", background:"#fff", fontSize:13, fontWeight:500, cursor:"pointer" }}>← Back</button>
        <button onClick={() => setStep(4)} style={{ padding:"10px 24px", borderRadius:8, border:"none", background:"#059669", color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer" }}>
          Save & Continue →
        </button>
      </div>
    </div>
  )
}
