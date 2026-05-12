import { useTimetableStore } from "@/store/timetableStore"
import { getCountry, ORG_CONFIGS } from "@/lib/orgData"

export function Step4Numbers() {
  const { config, setConfig, setStep } = useTimetableStore()
  const country = getCountry(config.countryCode ?? "IN")
  const org = ORG_CONFIGS[config.orgType ?? "school"]

  const totalSlots = config.numSections * config.periodsPerDay * config.workDays.length
  const capacity   = config.numStaff * country.maxPeriodsWeek
  const pct        = Math.round((totalSlots / capacity) * 100)
  const needed     = Math.ceil(totalSlots / country.maxPeriodsWeek)
  const status     = pct > 110 ? "danger" : pct > 90 ? "warning" : "ok"

  const fields = [
    { label: org.staffsLabel,   sub: `Max ${country.maxPeriodsWeek}/week`, key: "numStaff" as const },
    { label: org.sectionsLabel, sub: "Sections / Batches",                 key: "numSections" as const },
    { label: org.subjectsLabel, sub: "Courses / Duties",                   key: "numSubjects" as const },
    { label: "Periods/day",     sub: "Excl. breaks",                       key: "periodsPerDay" as const },
    { label: "Breaks",          sub: "Incl. Assembly",                     key: "numBreaks" as const },
  ]

  const lbl = (t: string) => <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase' as const, letterSpacing:'0.06em', color:'#a8a59e', marginBottom:8 }}>{t}</div>

  return (
    <div>
      <h1 style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:28, marginBottom:8 }}>{org.name} — How many of each?</h1>
      <p style={{ color:'#6a6860', fontSize:13, marginBottom:16, lineHeight:1.65 }}>
        Enter numbers only — AI generates all names, rooms, subjects and breaks automatically.
      </p>
      <div style={{ background:'#eaecf8', borderLeft:'4px solid #4f46e5', borderRadius:'0 8px 8px 0', padding:'10px 14px', marginBottom:20, fontSize:12, color:'#3730a3', lineHeight:1.6 }}>
        ✨ AI will generate realistic data based on <strong>{country.name}</strong> norms. Everything is editable in the next step.
      </div>

      {/* Number inputs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10, marginBottom:20 }}>
        {fields.map(f => (
          <div key={f.key} style={{ background:'#fff', border:'1.5px solid #e8e5de', borderRadius:12, padding:'14px 10px', textAlign:'center' }}>
            <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase' as const, letterSpacing:'0.06em', color:'#a8a59e', marginBottom:8 }}>{f.label}</div>
            <input type="number" min={1} max={500} value={config[f.key]}
              onChange={e => setConfig({ [f.key]: Math.max(1, +e.target.value) } as any)}
              style={{ width:'100%', textAlign:'center', fontSize:28, fontWeight:700, fontFamily:"'DM Mono',monospace", background:'transparent', border:'none', outline:'none', color:'#1c1b18' }}
            />
            <div style={{ fontSize:10, color:'#a8a59e', marginTop:6, lineHeight:1.3 }}>{f.sub}</div>
          </div>
        ))}
      </div>

      {/* Capacity */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:14 }}>
        {[
          { v: config.numStaff,    l: org.staffsLabel },
          { v: config.numSections, l: org.sectionsLabel },
          { v: config.numSubjects, l: org.subjectsLabel },
          { v: pct,                l: "Capacity %", suffix: "%" },
        ].map(({ v, l, suffix }) => (
          <div key={l} style={{ background:'#fff', border:'1.5px solid #e8e5de', borderRadius:10, padding:'12px', textAlign:'center' }}>
            <div style={{ fontSize:22, fontWeight:700, fontFamily:"'DM Mono',monospace", color:'#1c1b18' }}>{v}{suffix??""}</div>
            <div style={{ fontSize:10, color:'#a8a59e', marginTop:4 }}>{l}</div>
          </div>
        ))}
      </div>

      {status === "danger" && (
        <div style={{ background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:8, padding:'10px 14px', fontSize:12, color:'#991b1b', marginBottom:12 }}>
          ⚠️ <strong>Staff overloaded ({pct}%)!</strong> Need at least <strong>{needed}</strong> {org.staffsLabel.toLowerCase()}.
          <button onClick={() => setConfig({ numStaff: needed })} style={{ marginLeft:8, textDecoration:'underline', background:'none', border:'none', cursor:'pointer', fontSize:12, color:'#991b1b', fontWeight:600 }}>
            Auto-fix → {needed}
          </button>
        </div>
      )}
      {status === "warning" && (
        <div style={{ background:'#fffbeb', border:'1px solid #fcd34d', borderRadius:8, padding:'10px 14px', fontSize:12, color:'#92400e', marginBottom:12 }}>
          ⚠️ <strong>High workload ({pct}%)</strong> — Some staff near national max of {country.maxPeriodsWeek}/week.
        </div>
      )}
      {status === "ok" && (
        <div style={{ background:'#f0fdf4', border:'1px solid #86efac', borderRadius:8, padding:'10px 14px', fontSize:12, color:'#14532d', marginBottom:12 }}>
          ✅ <strong>Well balanced ({pct}%)</strong> — Staff count is sufficient.
        </div>
      )}

      <div style={{ display:'flex', justifyContent:'space-between', paddingTop:16, borderTop:'1px solid #e8e5de' }}>
        <button onClick={()=>setStep(3)} style={{ padding:'9px 18px', borderRadius:8, border:'1.5px solid #e8e5de', background:'#fff', fontSize:13, fontWeight:500, cursor:'pointer' }}>← Back</button>
        <button onClick={()=>setStep(5)} style={{ padding:'9px 18px', borderRadius:8, border:'none', fontSize:13, fontWeight:600, cursor:'pointer', background:'#059669', color:'#fff' }}>Generate data & continue →</button>
      </div>
    </div>
  )
}
