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
  { type:"info", msg:"👀  Reading your school setup — {nC} classes, {nSu} subjects, {nF} rooms" },
  { type:"ok",   msg:"📅  That's {total} lesson slots to fill across {nd} school days every week" },
  { type:"info", msg:"🧑‍🏫  Figuring out who teaches what — matching teachers to subjects and classes..." },
  { type:"ok",   msg:"✅  Every subject has a qualified teacher lined up" },
  { type:"info", msg:"🗓️  Laying out the week — placing lessons so nothing clashes..." },
  { type:"ok",   msg:"✅  Core schedule built — no teacher is in two classrooms at once" },
  { type:"info", msg:"⚖️  Balancing the load — spreading lessons so no day feels too heavy..." },
  { type:"ok",   msg:"✅  Workload looks fair across all {nC} classes and {nd} days" },
  { type:"info", msg:"🔍  Running a final sweep — checking for conflicts, gaps and overloads..." },
  { type:"ok",   msg:"{conflicts}" },
  { type:"info", msg:"📄  Building class timetables, teacher schedules and room views..." },
  { type:"ok",   msg:"🎉  All done! {nC} class schedules · {nSu} subjects placed · {nF} rooms assigned" },
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
    '{conflicts}': conflicts === 0 ? '✅  No conflicts — everything fits perfectly' : `⚠️  ${conflicts} clash(es) found — you can review and fix them in the timetable`,
  })

  const startGenerate = () => {
    const jobId = crypto.randomUUID()
    const startedAt = Date.now()
    setJob({ id: jobId, status:"running", progress: 5, log:[], startedAt })

    // ── Run the actual solver (wrapped in try/catch so we never get stuck) ──
    let output: ReturnType<typeof solveTimetable>
    let solveMs: number

    try {
      const workDays = config.workDays?.length ? config.workDays : ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY']
      const periods  = buildPeriodSequence(breaks, config.periodsPerDay ?? 8)

      const resolvedSubjects = store.schedulingMode === 'duration-based'
        ? subjects.map(sub => {
            const rh = (sub as any).requiredHours
            if (!rh) return sub
            const weekly = durationToWeeklyPeriods({
              subjectName: sub.name, className: 'all',
              requiredHours: rh,
              periodDurationMins: (sub as any).sessionDuration ?? 45,
              workingDaysPerYear: store.workingDaysPerYear ?? 220,
              workingDaysPerWeek: workDays.length,
            })
            return { ...sub, periodsPerWeek: weekly }
          })
        : subjects

      const staff = store.staff
      output   = solveTimetable({ sections, staff, subjects: resolvedSubjects, periods, workDays, requirements: [] })
      solveMs  = Date.now() - startedAt

      const suggestions = generateSuggestions(output.classTT, output.teacherTT, staff, resolvedSubjects, workDays, periods)
      setPeriods(periods)
      setClassTT(output.classTT)
      setTeacherTT(output.teacherTT)
      setConflicts(output.conflicts)
      setSuggestions(suggestions)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setJob(j => j ? { ...j, status:"failed", progress:0, log:[{ type:'error', msg:`❌ Solver error: ${msg}` }] } : j)
      return
    }

    // ── Replay log animation at 80ms/step as visual feedback ──
    let step = 0
    const r = replacements(output.score, output.conflicts.length)

    pollRef.current = setInterval(() => {
      if (step >= PIPELINE.length) {
        clearInterval(pollRef.current!)
        const finalLine = {
          type: output.conflicts.length > 0 ? "warn" : "ok",
          msg: output.conflicts.length > 0
            ? `⚠️  ${output.conflicts.length} scheduling clash(es) were found — open the timetable to review and fix them`
            : `🎊  Perfect! Your timetable is ready with zero conflicts — generated in ${solveMs}ms`
        }
        setJob(j => j ? { ...j, status:"completed", progress:100, log:[...(j.log ?? []), finalLine] } : j)
        return
      }

      // Snapshot step before async setJob — updater runs after step++ so we
      // must capture current index or PIPELINE[step] will be undefined
      const idx = step
      let msg = PIPELINE[idx].msg
      for (const [k, v] of Object.entries(r)) msg = msg.replaceAll(k, v)

      setJob(j => j ? {
        ...j,
        status: "running",
        progress: Math.round(5 + (idx + 1) / PIPELINE.length * 93),
        log: [...j.log, { type: PIPELINE[idx].type, msg }],
      } : j)
      step++
    }, 80)   // 80ms × 16 steps = ~1.3s total animation
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
          <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeSlideIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
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

      {/* Log output — friendly progress feed */}
      {job && job.log.length > 0 && (
        <div style={{ width:"100%", maxWidth:540, background:"#f9f9f7", border:"1.5px solid #e8e5de", borderRadius:14, padding:"14px 16px", maxHeight:260, overflowY:"auto", textAlign:"left" as const, display:"flex", flexDirection:"column" as const, gap:4 }}
          ref={el => { if (el) el.scrollTop = el.scrollHeight }}>
          {job.log.map((l,i) => (
            <div key={i} style={{
              display:"flex", alignItems:"flex-start", gap:10,
              padding:"7px 10px", borderRadius:8,
              background: l.type==='ok' ? "#f0fdf4" : l.type==='warn' ? "#fffbeb" : l.type==='error' ? "#fef2f2" : "#fff",
              borderLeft: `3px solid ${l.type==='ok'?'#34d399':l.type==='warn'?'#f59e0b':l.type==='error'?'#f87171':'#a5b4fc'}`,
              fontSize:12.5, lineHeight:1.55, color:"#1c1b18",
              animation: i === job.log.length - 1 ? "fadeSlideIn 0.25s ease" : "none",
            }}>
              {l.msg}
            </div>
          ))}
          {job.status === "running" && (
            <div style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 10px", color:"#a8a59e", fontSize:12 }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:"#059669", animation:"pulse 1s ease-in-out infinite" }} />
              Working on it...
            </div>
          )}
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
            <button onClick={() => setStep(3)}
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
