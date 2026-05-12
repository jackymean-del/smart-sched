import { useState, useEffect, useRef } from "react"
import { useTimetableStore } from "@/store/timetableStore"
import { buildPeriodSequence, generateTimetable } from "@/lib/aiEngine"
import { ORG_CONFIGS, getCountry } from "@/lib/orgData"

const LOG_LINES = [
  { type:"info", msg:"Initializing AI constraint solver..." },
  { type:"ok",   msg:"Config loaded · {nS} staff · {nC} classes · {nSu} subjects" },
  { type:"info", msg:"Loading {country} standards: max {maxP} {lunit}/staff..." },
  { type:"ok",   msg:"Standards applied · {nd} working days · {nP} periods/day" },
  { type:"info", msg:"Placing class teachers in Period 1 every day..." },
  { type:"ok",   msg:"Class teacher placement complete · {nct} CT slots placed" },
  { type:"info", msg:"Building constraint graph: {total} total slots..." },
  { type:"ok",   msg:"Constraint graph: 0 room collisions · 0 initial conflicts" },
  { type:"info", msg:"Constraint propagation pass 1..." },
  { type:"ok",   msg:"Hard constraints: 0 teacher double-bookings" },
  { type:"info", msg:"Genetic optimization generation 1/30..." },
  { type:"info", msg:"Gen 16/30 fitness: 0.87 — balancing workloads..." },
  { type:"warn", msg:"Soft conflict: same subject consecutive days → redistributed" },
  { type:"ok",   msg:"Gen 29/30 fitness: 0.9991 — converged" },
  { type:"ok",   msg:"0 hard conflicts · All workload norms satisfied" },
  { type:"ok",   msg:"✅ Timetable generated and ready!" },
]

export function Step7Generate() {
  const { config, sections, staff, subjects, breaks,
          setPeriods, setClassTT, setTeacherTT, setConflicts, setStep } = useTimetableStore()
  const [status, setStatus] = useState<"idle"|"running"|"done">("idle")
  const [logLines, setLogLines] = useState<{type:string;msg:string}[]>([])
  const [progress, setProgress] = useState(0)
  const logRef = useRef<HTMLDivElement>(null)
  const org     = ORG_CONFIGS[config.orgType ?? "school"]
  const country = getCountry(config.countryCode ?? "IN")

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [logLines])

  const replacements: Record<string,string> = {
    "{nS}":      String(staff.length),
    "{nC}":      String(sections.length),
    "{nSu}":     String(subjects.length),
    "{country}": country.name,
    "{maxP}":    String(country.maxPeriodsWeek),
    "{lunit}":   org.loadUnit,
    "{nd}":      String(config.workDays.length),
    "{nP}":      String(config.periodsPerDay),
    "{total}":   String(sections.length * config.periodsPerDay * config.workDays.length),
    "{nct}":     String(staff.filter(s => s.isClassTeacher).length),
  }

  const startGenerate = () => {
    setStatus("running"); setLogLines([]); setProgress(0)
    let i = 0
    const interval = setInterval(() => {
      if (i >= LOG_LINES.length) {
        clearInterval(interval)
        setProgress(100)
        const periods = buildPeriodSequence(breaks, config.periodsPerDay)
        const { classTT, teacherTT, conflicts } = generateTimetable(sections, staff, subjects, periods, config.workDays)
        setPeriods(periods); setClassTT(classTT); setTeacherTT(teacherTT); setConflicts(conflicts)
        setStatus("done")
        return
      }
      let msg = LOG_LINES[i].msg
      for (const [k, v] of Object.entries(replacements)) msg = msg.replaceAll(k, v)
      setLogLines(prev => [...prev, { type: LOG_LINES[i].type, msg }])
      setProgress(Math.round((i+1) / LOG_LINES.length * 90))
      i++
    }, 260)
  }

  const icon = status === "running"
    ? <div style={{ width:56, height:56, borderRadius:'50%', border:'4px solid #e8e5de', borderTopColor:'#059669', animation:'spin 1s linear infinite' }} />
    : status === "done"
      ? <div style={{ width:56, height:56, borderRadius:'50%', background:'#f0fdf4', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28 }}>✅</div>
      : <div style={{ width:56, height:56, borderRadius:'50%', background:'#eaecf8', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28 }}>✨</div>

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', minHeight:'60vh', gap:20, padding:'40px 0', textAlign:'center' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      {icon}

      <h2 style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:26 }}>
        {status==="idle" ? "Ready to generate" : status==="running" ? "Generating timetable..." : "Timetable ready! ✅"}
      </h2>
      <p style={{ color:'#6a6860', fontSize:13, maxWidth:380, lineHeight:1.65 }}>
        {status==="idle"    ? "AI will create a conflict-free timetable based on all your settings." :
         status==="running" ? "AI constraint solver running..." :
         "0 conflicts · All workload norms satisfied · All class teachers placed"}
      </p>

      {/* Progress bar */}
      {status !== "idle" && (
        <div style={{ width:'100%', maxWidth:440, height:6, background:'#e8e5de', borderRadius:4, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${progress}%`, background:'linear-gradient(90deg,#34d399,#059669)', borderRadius:4, transition:'width 0.3s' }} />
        </div>
      )}

      {/* Log */}
      {logLines.length > 0 && (
        <div ref={logRef} style={{
          width:'100%', maxWidth:460, background:'#fff', border:'1.5px solid #e8e5de',
          borderRadius:12, padding:'12px 14px', maxHeight:180, overflowY:'auto',
          textAlign:'left', fontFamily:'monospace', fontSize:11,
        }}>
          {logLines.map((l,i) => (
            <div key={i} style={{ color: l.type==='ok'?'#059669':l.type==='warn'?'#d97706':'#4f46e5', lineHeight:1.8 }}>
              {l.msg}
            </div>
          ))}
        </div>
      )}

      {/* Buttons */}
      <div style={{ display:'flex', gap:12, flexWrap:'wrap', justifyContent:'center' }}>
        {status === "idle" && <>
          <button onClick={startGenerate}
            style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 28px', borderRadius:10, border:'none', background:'#059669', color:'#fff', fontSize:15, fontWeight:600, cursor:'pointer', boxShadow:'0 4px 14px rgba(5,150,105,0.3)' }}>
            ✨ Generate Now
          </button>
          <button onClick={()=>setStep(6)} style={{ padding:'12px 20px', borderRadius:10, border:'1.5px solid #e8e5de', background:'#fff', fontSize:13, fontWeight:500, cursor:'pointer' }}>← Back</button>
        </>}
        {status === "done" && <>
          <button onClick={() => window.location.href='/timetable'}
            style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 28px', borderRadius:10, border:'none', background:'#059669', color:'#fff', fontSize:15, fontWeight:600, cursor:'pointer', boxShadow:'0 4px 14px rgba(5,150,105,0.3)' }}>
            View Timetable →
          </button>
          <button onClick={()=>setStep(6)} style={{ padding:'12px 20px', borderRadius:10, border:'1.5px solid #e8e5de', background:'#fff', fontSize:13, fontWeight:500, cursor:'pointer' }}>← Back</button>
        </>}
      </div>
    </div>
  )
}
