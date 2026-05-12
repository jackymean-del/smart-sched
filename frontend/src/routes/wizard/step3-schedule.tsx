import { useTimetableStore } from "@/store/timetableStore"

const ALL_DAYS = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"]
const DAY_SHORT: Record<string,string> = { MONDAY:"Mo",TUESDAY:"Tu",WEDNESDAY:"We",THURSDAY:"Th",FRIDAY:"Fr",SATURDAY:"Sa",SUNDAY:"Su" }

const btn = (active: boolean, onClick: ()=>void, children: React.ReactNode, extra?: React.CSSProperties) => (
  <button onClick={onClick} style={{
    padding:'12px', borderRadius:10, border: active?'2px solid #4f46e5':'1.5px solid #e8e5de',
    background: active?'#eaecf8':'#fff', cursor:'pointer', transition:'all 0.15s',
    textAlign:'center', ...extra,
  }}>{children}</button>
)

export function Step3Schedule() {
  const { config, setConfig, setStep } = useTimetableStore()

  const toggleDay = (day: string) => {
    const days = config.workDays.includes(day)
      ? config.workDays.filter(d => d !== day)
      : [...config.workDays, day]
    if (days.length > 0) setConfig({ workDays: days })
  }

  const label = (text: string) => (
    <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase' as const, letterSpacing:'0.06em', color:'#a8a59e', marginBottom:8 }}>
      {text}
    </div>
  )

  return (
    <div>
      <h1 style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:28, marginBottom:8 }}>Time format & working schedule</h1>
      <p style={{ color:'#6a6860', fontSize:13, marginBottom:24, lineHeight:1.65 }}>Configure how times are displayed and set your working week.</p>

      {/* Time format */}
      <div style={{ marginBottom:24 }}>
        {label("Time Format")}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, maxWidth:360 }}>
          {(['12h','24h'] as const).map(fmt => (
            <button key={fmt} onClick={() => setConfig({ timeFormat: fmt })}
              style={{
                padding:'14px', borderRadius:10, border: config.timeFormat===fmt?'2px solid #4f46e5':'1.5px solid #e8e5de',
                background: config.timeFormat===fmt?'#eaecf8':'#fff', cursor:'pointer', textAlign:'center',
              }}>
              <div style={{ fontFamily:"'DM Mono',monospace", fontSize:22, fontWeight:700, color: config.timeFormat===fmt?'#4f46e5':'#1c1b18' }}>
                {fmt==='12h'?'2:30 PM':'14:30'}
              </div>
              <div style={{ fontSize:11, color:'#6a6860', marginTop:4 }}>
                {fmt==='12h'?'AM/PM (12-hour)':'Military (24-hour)'}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Working days */}
      <div style={{ marginBottom:24 }}>
        {label("Working Days")}
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' as const }}>
          {ALL_DAYS.map(day => {
            const on = config.workDays.includes(day)
            return (
              <button key={day} onClick={() => toggleDay(day)}
                style={{
                  width:40, height:40, borderRadius:'50%', border: on?'none':'1.5px solid #d4d1c8',
                  background: on?'#4f46e5':'#fff', color: on?'#fff':'#6a6860',
                  fontSize:12, fontWeight:700, cursor:'pointer', transition:'all 0.15s',
                }}>
                {DAY_SHORT[day]}
              </button>
            )
          })}
        </div>
      </div>

      {/* Times */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, maxWidth:360, marginBottom:24 }}>
        <div>
          {label("Start Time")}
          <select value={config.startTime} onChange={e=>setConfig({startTime:e.target.value})}
            style={{ width:'100%', padding:'8px 12px', borderRadius:8, border:'1.5px solid #e8e5de', fontSize:13, background:'#fff', cursor:'pointer' }}>
            {["07:00","08:00","08:30","09:00","09:05","09:30"].map(t=><option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          {label("End Time")}
          <select value={config.endTime} onChange={e=>setConfig({endTime:e.target.value})}
            style={{ width:'100%', padding:'8px 12px', borderRadius:8, border:'1.5px solid #e8e5de', fontSize:13, background:'#fff', cursor:'pointer' }}>
            {["14:00","14:30","15:00","15:30","15:45","16:00","17:00","18:00"].map(t=><option key={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display:'flex', justifyContent:'space-between', paddingTop:16, borderTop:'1px solid #e8e5de' }}>
        <button onClick={()=>setStep(2)} style={{ padding:'9px 18px', borderRadius:8, border:'1.5px solid #e8e5de', background:'#fff', fontSize:13, fontWeight:500, cursor:'pointer' }}>← Back</button>
        <button onClick={()=>setStep(4)} style={{ padding:'9px 18px', borderRadius:8, border:'none', fontSize:13, fontWeight:600, cursor:'pointer', background:'#059669', color:'#fff' }}>Continue →</button>
      </div>
    </div>
  )
}
