import { useTimetableStore } from "@/store/timetableStore"

const ALL_DAYS = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"]
const DAY_SHORT: Record<string,string> = { MONDAY:"Mo",TUESDAY:"Tu",WEDNESDAY:"We",THURSDAY:"Th",FRIDAY:"Fr",SATURDAY:"Sa",SUNDAY:"Su" }

// Convert 24h "HH:MM" to display format
function toDisplay(time: string, format: '12h'|'24h'): string {
  const [h, m] = time.split(':').map(Number)
  if (format === '24h') return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${m.toString().padStart(2,'0')} ${ampm}`
}

// All time slots with labels in both formats
const TIME_SLOTS = [
  { value:"06:00" }, { value:"06:30" }, { value:"07:00" }, { value:"07:30" },
  { value:"08:00" }, { value:"08:30" }, { value:"09:00" }, { value:"09:30" },
  { value:"10:00" }, { value:"10:30" }, { value:"11:00" }, { value:"11:30" },
  { value:"12:00" }, { value:"12:30" }, { value:"13:00" }, { value:"13:30" },
  { value:"14:00" }, { value:"14:30" }, { value:"15:00" }, { value:"15:30" },
  { value:"16:00" }, { value:"16:30" }, { value:"17:00" }, { value:"17:30" },
  { value:"18:00" }, { value:"18:30" }, { value:"19:00" },
]

const lbl = (text: string) => (
  <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase' as const, letterSpacing:'0.06em', color:'#a8a59e', marginBottom:8 }}>
    {text}
  </div>
)

export function Step3Schedule() {
  const { config, setConfig, setStep } = useTimetableStore()

  const toggleDay = (day: string) => {
    const days = config.workDays.includes(day)
      ? config.workDays.filter(d => d !== day)
      : [...config.workDays, day]
    if (days.length > 0) setConfig({ workDays: days })
  }

  const fmt = config.timeFormat

  return (
    <div>
      <h1 style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:28, marginBottom:8 }}>
        Time format & working schedule
      </h1>
      <p style={{ color:'#6a6860', fontSize:13, marginBottom:24, lineHeight:1.65 }}>
        Configure how times are displayed and set your working week.
      </p>

      {/* Time format */}
      <div style={{ marginBottom:24 }}>
        {lbl("Time Format")}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, maxWidth:380 }}>
          {(['12h','24h'] as const).map(f => (
            <button key={f} onClick={() => setConfig({ timeFormat: f })}
              style={{
                padding:'16px', borderRadius:10, cursor:'pointer', textAlign:'center',
                border: fmt===f ? '2px solid #4f46e5' : '1.5px solid #e8e5de',
                background: fmt===f ? '#eaecf8' : '#fff',
                transition:'all 0.15s',
              }}>
              <div style={{ fontFamily:"'DM Mono',monospace", fontSize:22, fontWeight:700, color: fmt===f?'#4f46e5':'#1c1b18' }}>
                {f === '12h' ? '10:00 AM' : '10:00'}
              </div>
              <div style={{ fontSize:11, color:'#6a6860', marginTop:4 }}>
                {f === '12h' ? 'AM/PM (12-hour)' : 'Military (24-hour)'}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Working days */}
      <div style={{ marginBottom:24 }}>
        {lbl("Working Days")}
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' as const }}>
          {ALL_DAYS.map(day => {
            const on = config.workDays.includes(day)
            return (
              <button key={day} onClick={() => toggleDay(day)}
                style={{
                  width:40, height:40, borderRadius:'50%', cursor:'pointer', transition:'all 0.15s',
                  border: on ? 'none' : '1.5px solid #d4d1c8',
                  background: on ? '#4f46e5' : '#fff',
                  color: on ? '#fff' : '#6a6860',
                  fontSize:12, fontWeight:700,
                }}>
                {DAY_SHORT[day]}
              </button>
            )
          })}
        </div>
        <div style={{ fontSize:11, color:'#a8a59e', marginTop:8 }}>
          {config.workDays.length} working days selected
        </div>
      </div>

      {/* Start / End time */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, maxWidth:420, marginBottom:24 }}>
        <div>
          {lbl("Start Time")}
          <select value={config.startTime} onChange={e => setConfig({ startTime: e.target.value })}
            style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:'1.5px solid #e8e5de', fontSize:13, background:'#fff', cursor:'pointer', outline:'none' }}>
            {TIME_SLOTS.filter(t => t.value < (config.endTime || '18:00')).map(t => (
              <option key={t.value} value={t.value}>{toDisplay(t.value, fmt)}</option>
            ))}
          </select>
        </div>
        <div>
          {lbl("End Time")}
          <select value={config.endTime} onChange={e => setConfig({ endTime: e.target.value })}
            style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:'1.5px solid #e8e5de', fontSize:13, background:'#fff', cursor:'pointer', outline:'none' }}>
            {TIME_SLOTS.filter(t => t.value > (config.startTime || '06:00')).map(t => (
              <option key={t.value} value={t.value}>{toDisplay(t.value, fmt)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary */}
      <div style={{ background:'#f7f6f2', border:'1.5px solid #e8e5de', borderRadius:10, padding:'12px 16px', marginBottom:24, fontSize:12, color:'#374151' }}>
        🕐 School day: <strong>{toDisplay(config.startTime, fmt)}</strong> → <strong>{toDisplay(config.endTime, fmt)}</strong>
        &nbsp;·&nbsp; {config.workDays.length} days/week
        &nbsp;·&nbsp; {(() => {
          const [sh, sm] = config.startTime.split(':').map(Number)
          const [eh, em] = config.endTime.split(':').map(Number)
          const totalMins = (eh * 60 + em) - (sh * 60 + sm)
          const hrs = Math.floor(totalMins / 60)
          const mins = totalMins % 60
          return mins > 0 ? `${hrs}h ${mins}m/day` : `${hrs}h/day`
        })()}
      </div>

      <div style={{ display:'flex', justifyContent:'space-between', paddingTop:16, borderTop:'1px solid #e8e5de' }}>
        <button onClick={() => setStep(2)}
          style={{ padding:'9px 18px', borderRadius:8, border:'1.5px solid #e8e5de', background:'#fff', fontSize:13, fontWeight:500, cursor:'pointer' }}>
          ← Back
        </button>
        <button onClick={() => setStep(4)}
          style={{ padding:'9px 18px', borderRadius:8, border:'none', fontSize:13, fontWeight:600, cursor:'pointer', background:'#059669', color:'#fff' }}>
          Continue →
        </button>
      </div>
    </div>
  )
}
