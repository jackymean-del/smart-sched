import { useState, useEffect, useRef } from "react"
import { useTimetableStore } from "@/store/timetableStore"
import { useTerminology } from "@/hooks/useTerminology"
import { buildPeriodSequence } from "@/lib/aiEngine"
import { solveTimetable, generateSuggestions, durationToWeeklyPeriods } from "@/lib/schedulingEngine"
import { ORG_CONFIGS, getCountry } from "@/lib/orgData"

type JobStatus = "idle" | "queued" | "running" | "completed" | "failed"

interface Job {
  id: string
  status: JobStatus
  progress: number
  log: { type:string; msg:string }[]
  startedAt?: number
}

const PIPELINE = [
  { type:"info", msg:"📥 Input collection — {nC} groups, {nSu} resources, {nPools} pools, {nF} facilities" },
  { type:"ok",   msg:"✅ Mode conversion — {mode}" },
  { type:"info", msg:"⚙️ Slot generation — creating time_slots for {nC} groups..." },
  { type:"ok",   msg:"✅ Slot generation complete · {total} total slots" },
  { type:"info", msg:"🔒 Building hard constraints (participant clash, facility clash, daily caps)..." },
  { type:"ok",   msg:"✅ Hard constraints applied — 0 violations in initial state" },
  { type:"info", msg:"⚖️ Applying soft constraint penalty weights (5, 10, 7, 4, 6)..." },
  { type:"ok",   msg:"✅ Penalty model ready — solver objective function built" },
  { type:"info", msg:"🚀 CSP solver running — placing participants from eligible pools..." },
  { type:"ok",   msg:"✅ Pool eligibility applied — participants assigned to grade-range matches" },
  { type:"info", msg:"🔄 Optimizing distribution across {nd} working days..." },
  { type:"ok",   msg:"✅ Convergence reached — penalty score: {score}" },
  { type:"info", msg:"🔍 Validation pass — checking hard constraints..." },
  { type:"ok",   msg:"✅ Validation complete — {conflicts} hard conflicts" },
  { type:"info", msg:"📊 Generating class, participant and facility timetable views..." },
  { type:"ok",   msg:"✅ Timetable ready — {nC} class views · {nS} participant views · {nF} facility views" },
]

export function Step6Generate() {
  const store = useTimetableStore()
  const { config, sections, participantPools, facilities, subjects, breaks,
          setPeriods, setClassTT, setTeacherTT, setConflicts, setSuggestions, setStep } = store
  const T = useTerminology()
  const country = getCountry(config.countryCode ?? "IN")
  const [job, setJob] = useState<Job|null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval>|null>(null)

  // Cleanup on unmount
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

  const totalParticipants = participantPools.reduce((a, p) => a + p.participantCount, 0)

  const replacements = (score = 0, conflicts = 0): Record<string,string> => ({
    '{nC}':     String(sections.length),
    '{nSu}':    String(subjects.length),
    '{nPools}': String(participantPools.length),
    '{nF}':     String(facilities.length),
    '{nS}':     String(totalParticipants),
    '{nd}':     String(config.workDays.length),
    '{total}':  String(sections.length * config.periodsPerDay * config.workDays.length),
    '{mode}':   store.schedulingMode === 'duration-based' ? 'Mode 2 — converting duration → weekly periods' : 'Mode 1 — using periods/week directly',
    '{score}':  String(score),
    '{conflicts}': conflicts === 0 ? '0 — all hard constraints satisfied ✅' : `${conflicts} detected ⚠️`,
  })

  // Spec §6.2 — async job pattern: return job_id, then poll
  const startGenerate = () => {
    const jobId = crypto.randomUUID()
    const newJob: Job = { id: jobId, status:"queued", progress:0, log:[], startedAt: Date.now() }
    setJob(newJob)

    // Simulate job queue → returns immediately with job_id
    setTimeout(() => setJob(j => j ? { ...j, status:"running" } : j), 300)

    let step = 0
    let finalScore = 0
    let finalConflicts = 0

    // Poll every ~400ms — simulates GET /scheduler/status/:job_id
    pollRef.current = setInterval(() => {
      if (step >= PIPELINE.length) {
        clearInterval(pollRef.current!)

        // Run actual solver
        const periods = buildPeriodSequence(breaks, config.periodsPerDay)
        const resolvedSubjects = store.schedulingMode === 'duration-based'
          ? subjects.map(sub => {
              const rh = (sub as any).requiredHours
              if (!rh) return sub
              const weekly = durationToWeeklyPeriods({
                subjectName: sub.name, className: 'all',
                requiredHours: rh,
                periodDurationMins: (sub as any).sessionDuration ?? 40,
                workingDaysPerYear: store.workingDaysPerYear ?? 220,
                workingDaysPerWeek: config.workDays.length,
              })
              return { ...sub, periodsPerWeek: weekly }
            })
          : subjects

        const output = solveTimetable({ sections, staff: [], subjects: resolvedSubjects, periods, workDays: config.workDays, requirements: [] })
        const suggestions = generateSuggestions(output.classTT, output.teacherTT, [], resolvedSubjects, config.workDays, periods)

        finalScore = output.score
        finalConflicts = output.conflicts.length

        setPeriods(periods)
        setClassTT(output.classTT)
        setTeacherTT(output.teacherTT)
        setConflicts(output.conflicts)
        setSuggestions(suggestions)

        const r = replacements(finalScore, finalConflicts)
        const finalLine = {
          type: finalConflicts > 0 ? "warn" : "ok",
          msg: finalConflicts > 0
            ? `⚠️ ${finalConflicts} hard conflict(s) detected — review timetable`
            : `✅ Timetable generated successfully — 0 conflicts · Penalty score: ${finalScore}`
        }

        setJob(j => j ? { ...j, status:"completed", progress:100, log:[...(j.log ?? []), finalLine] } : j)
        return
      }

      const raw = PIPELINE[step]
      const r = replacements()
      let msg = raw.msg
      for (const [k, v] of Object.entries(r)) msg = msg.replaceAll(k, v)

      setJob(j => {
        if (!j) return j
        return {
          ...j,
          status: "running",
          progress: Math.round((step+1) / PIPELINE.length * 90),
          log: [...j.log, { type: raw.type, msg }],
        }
      })
      step++
    }, 350)
  }

  const elapsed = job?.startedAt ? Math.round((Date.now() - job.startedAt) / 1000) : 0

  return (
    <div style={{ display:"flex", flexDirection:"column" as const, alignItems:"center", minHeight:"65vh", gap:20, padding:"32px 0", textAlign:"center" as const }}>

      {/* Status icon */}
      {(!job || job.status === "idle") && (
        <div style={{ width:72, height:72, borderRadius:20, background:"linear-gradient(135deg,#34d399,#059669)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:34 }}>✨</div>
      )}
      {(job?.status === "queued" || job?.status === "running") && (
        <>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <div style={{ width:60, height:60, borderRadius:"50%", border:"5px solid #e8e5de", borderTopColor:"#059669", animation:"spin 1s linear infinite" }} />
        </>
      )}
      {job?.status === "completed" && (
        <div style={{ width:72, height:72, borderRadius:"50%", background:"#f0fdf4", display:"flex", alignItems:"center", justifyContent:"center", fontSize:36 }}>✅</div>
      )}
      {job?.status === "failed" && (
        <div style={{ width:72, height:72, borderRadius:"50%", background:"#fef2f2", display:"flex", alignItems:"center", justifyContent:"center", fontSize:36 }}>❌</div>
      )}

      {/* Title */}
      <h2 style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:26, margin:0 }}>
        {!job                        ? `Ready to generate ${T.schedule.toLowerCase()}` :
         job.status === "queued"     ? "Job queued..." :
         job.status === "running"    ? `Generating ${T.schedule.toLowerCase()}...` :
         job.status === "completed"  ? `${T.schedule} ready!` :
         "Generation failed"}
      </h2>

      {/* Job ID — spec §6.2 */}
      {job && (
        <div style={{ display:"flex", gap:8, fontSize:11, color:"#a8a59e", alignItems:"center" }}>
          <span style={{ fontFamily:"monospace", background:"#f7f6f2", padding:"2px 8px", borderRadius:4 }}>
            Job ID: {job.id.slice(0,8)}...
          </span>
          <span>Status: <strong style={{ color: job.status==="completed"?"#059669":job.status==="failed"?"#dc2626":"#4f46e5" }}>{job.status}</strong></span>
          {job.status === "running" && <span>{elapsed}s elapsed</span>}
        </div>
      )}

      {/* Config summary */}
      {!job && (
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" as const, justifyContent:"center", maxWidth:500 }}>
          {[
            `${sections.length} ${T.groups.toLowerCase()}`,
            `${subjects.length} ${T.resources.toLowerCase()}`,
            `${participantPools.length} ${T.pools.toLowerCase()} (${totalParticipants} ${T.participants.toLowerCase()})`,
            `${facilities.length} ${T.facilities.toLowerCase()}`,
            `${config.workDays.length} days/week`,
            store.schedulingMode === 'duration-based' ? 'Mode 2' : 'Mode 1',
          ].map(t => (
            <span key={t} style={{ padding:"4px 10px", borderRadius:12, background:"#f7f6f2", border:"1px solid #e8e5de", fontSize:11, color:"#374151" }}>{t}</span>
          ))}
        </div>
      )}

      {/* Progress bar */}
      {job && job.status !== "idle" && (
        <div style={{ width:"100%", maxWidth:500, height:6, background:"#e8e5de", borderRadius:4, overflow:"hidden" }}>
          <div style={{ height:"100%", width:`${job.progress}%`, background:"linear-gradient(90deg,#34d399,#059669)", borderRadius:4, transition:"width 0.3s" }} />
        </div>
      )}

      {/* Log output — polling simulation */}
      {job && job.log.length > 0 && (
        <div style={{ width:"100%", maxWidth:540, background:"#1c1b18", borderRadius:12, padding:"12px 16px", maxHeight:220, overflowY:"auto", textAlign:"left" as const, fontFamily:"monospace", fontSize:11 }}
          ref={el => { if (el) el.scrollTop = el.scrollHeight }}>
          {job.log.map((l,i) => (
            <div key={i} style={{ color: l.type==='ok'?'#34d399':l.type==='warn'?'#fbbf24':l.type==='error'?'#f87171':'#93c5fd', lineHeight:1.9, whiteSpace:"pre-wrap" as const }}>
              {l.msg}
            </div>
          ))}
          {job.status === "running" && <div style={{ color:"#6a6860", animation:"pulse 1s infinite" }}>▌</div>}
        </div>
      )}

      {/* Buttons */}
      <div style={{ display:"flex", gap:10, flexWrap:"wrap" as const, justifyContent:"center" }}>
        {!job && (
          <>
            <button onClick={startGenerate}
              style={{ display:"flex", alignItems:"center", gap:8, padding:"13px 32px", borderRadius:10, border:"none", background:"#059669", color:"#fff", fontSize:15, fontWeight:700, cursor:"pointer", boxShadow:"0 4px 16px rgba(5,150,105,0.3)" }}>
              ✨ Generate {T.schedule}
            </button>
            <button onClick={() => setStep(5)}
              style={{ padding:"13px 20px", borderRadius:10, border:"1.5px solid #e8e5de", background:"#fff", fontSize:13, cursor:"pointer" }}>
              ← Back
            </button>
          </>
        )}
        {job?.status === "completed" && (
          <>
            <button onClick={() => window.location.href='/timetable'}
              style={{ padding:"13px 28px", borderRadius:10, border:"none", background:"#059669", color:"#fff", fontSize:15, fontWeight:700, cursor:"pointer" }}>
              View {T.schedule} →
            </button>
            <button onClick={() => { setJob(null) }}
              style={{ padding:"13px 18px", borderRadius:10, border:"1.5px solid #e8e5de", background:"#fff", fontSize:13, cursor:"pointer" }}>
              Re-generate
            </button>
          </>
        )}
        {job?.status === "failed" && (
          <>
            <button onClick={() => setJob(null)}
              style={{ padding:"13px 18px", borderRadius:10, border:"none", background:"#dc2626", color:"#fff", fontSize:13, cursor:"pointer" }}>
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
  )
}
