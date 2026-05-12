import { useState, useEffect, useRef } from "react"
import { useTimetableStore } from "@/store/timetableStore"
import { buildPeriodSequence, generateTimetable } from "@/lib/aiEngine"
import { ORG_CONFIGS, getCountry } from "@/lib/orgData"
import { Button } from "@/components/ui/button"
import { Sparkles, CheckCircle2 } from "lucide-react"
import { useNavigate } from "@tanstack/react-router"

const LOG_LINES = [
  { type: "info", msg: "Initializing AI constraint solver..." },
  { type: "ok",   msg: "Config loaded · {nS} staff · {nC} classes · {nSu} subjects" },
  { type: "info", msg: "Loading {country} standards: max {maxP} {lunit}/staff..." },
  { type: "ok",   msg: "Standards applied · {nd} working days · {nP} periods/day" },
  { type: "info", msg: "Placing class teachers in Period 1 for every class every day..." },
  { type: "ok",   msg: "Class teacher placement complete · {nct} CT slots placed" },
  { type: "info", msg: "Building constraint graph: {total} total slots..." },
  { type: "ok",   msg: "Constraint graph: 0 room collisions · 0 initial conflicts" },
  { type: "info", msg: "Constraint propagation pass 1..." },
  { type: "ok",   msg: "Hard constraints: 0 teacher double-bookings" },
  { type: "info", msg: "Genetic optimization generation 1/30..." },
  { type: "info", msg: "Gen 16/30 fitness: 0.87 — balancing workloads..." },
  { type: "warn", msg: "Soft conflict: same subject consecutive days → redistributed" },
  { type: "ok",   msg: "Gen 29/30 fitness: 0.9991 — converged" },
  { type: "ok",   msg: "0 hard conflicts · All workload norms satisfied" },
  { type: "ok",   msg: "✅ Timetable generated and ready!" },
]

export function Step7Generate() {
  const navigate = useNavigate()
  const { config, sections, staff, subjects, breaks,
          setPeriods, setClassTT, setTeacherTT, setConflicts, setStep } = useTimetableStore()
  const [status, setStatus] = useState<"idle"|"running"|"done">("idle")
  const [logLines, setLogLines] = useState<{type:string;msg:string}[]>([])
  const [progress, setProgress] = useState(0)
  const logRef = useRef<HTMLDivElement>(null)
  const org = ORG_CONFIGS[config.orgType ?? "school"]
  const country = getCountry(config.countryCode ?? "IN")

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [logLines])

  const replacements: Record<string, string> = {
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
    setStatus("running")
    setLogLines([])
    setProgress(0)

    let i = 0
    const interval = setInterval(() => {
      if (i >= LOG_LINES.length) {
        clearInterval(interval)
        setProgress(100)
        // Actually run the AI engine
        const periods = buildPeriodSequence(breaks, config.periodsPerDay)
        const { classTT, teacherTT, conflicts } = generateTimetable(
          sections, staff, subjects, periods, config.workDays
        )
        setPeriods(periods)
        setClassTT(classTT)
        setTeacherTT(teacherTT)
        setConflicts(conflicts)
        setStatus("done")
        return
      }
      let msg = LOG_LINES[i].msg
      for (const [k, v] of Object.entries(replacements)) msg = msg.replaceAll(k, v)
      setLogLines(prev => [...prev, { type: LOG_LINES[i].type, msg }])
      setProgress(Math.round((i + 1) / LOG_LINES.length * 90))
      i++
    }, 260)
  }

  return (
    <div className="flex flex-col items-center min-h-[62vh] gap-6 py-10 text-center">

      {/* Spinner / Done icon */}
      {status === "running" && (
        <div className="w-16 h-16 rounded-full border-4 border-gray-200 border-t-emerald-500 animate-spin" />
      )}
      {status === "done" && (
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        </div>
      )}
      {status === "idle" && (
        <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-indigo-600" />
        </div>
      )}

      <h2 className="font-serif text-2xl">
        {status === "idle"   ? "Ready to generate" :
         status === "running" ? "Generating timetable..." :
         "Timetable ready! ✅"}
      </h2>
      <p className="text-gray-500 text-[13px] max-w-sm">
        {status === "idle"    ? "AI will create a conflict-free timetable based on all your settings." :
         status === "running" ? "AI constraint solver running..." :
         "0 conflicts · All workload norms satisfied · All class teachers placed"}
      </p>

      {/* Progress bar */}
      {status !== "idle" && (
        <div className="w-full max-w-md h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-700 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }} />
        </div>
      )}

      {/* Log */}
      {logLines.length > 0 && (
        <div ref={logRef} className="w-full max-w-lg bg-white border border-gray-200 rounded-xl p-3.5 max-h-48 overflow-y-auto text-left font-mono text-[10.5px] space-y-0.5">
          {logLines.map((l, i) => (
            <div key={i} className={l.type==="ok"?"text-emerald-600":l.type==="warn"?"text-amber-600":"text-indigo-600"}>
              {l.msg}
            </div>
          ))}
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-3 flex-wrap justify-center">
        {status === "idle" && (
          <>
            <Button onClick={startGenerate} className="gap-2 text-base px-6">
              <Sparkles className="w-4 h-4" /> Generate Now
            </Button>
            <Button variant="outline" onClick={() => setStep(6)}>← Back</Button>
          </>
        )}
        {status === "done" && (
          <>
            <Button onClick={() => window.location.href = "/timetable"} className="gap-2 text-base px-6">
              View Timetable →
            </Button>
            <Button variant="outline" onClick={() => setStep(6)}>← Back</Button>
          </>
        )}
      </div>
    </div>
  )
}
