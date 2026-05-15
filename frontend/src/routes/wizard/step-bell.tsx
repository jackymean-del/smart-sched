import { useState, useMemo } from "react"
import { useTimetableStore } from "@/store/timetableStore"

// ─── Types ────────────────────────────────────────────────────
interface BreakRow {
  id: string
  name: string
  afterPeriod: number   // after period N (1-based)
  duration: number      // minutes
  type: "assembly" | "break" | "lunch" | "dispersal"
}

// ─── Helpers ─────────────────────────────────────────────────
const DAYS_ORDERED = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"]
const DAY_LABEL: Record<string,string> = {
  MONDAY:"Mon", TUESDAY:"Tue", WEDNESDAY:"Wed",
  THURSDAY:"Thu", FRIDAY:"Fri", SATURDAY:"Sat", SUNDAY:"Sun",
}
const BREAK_TYPES: BreakRow["type"][] = ["assembly","break","lunch","dispersal"]
const BREAK_ICON: Record<BreakRow["type"],string> = {
  assembly:"🔔", break:"☕", lunch:"🍱", dispersal:"🏃",
}

function addMinutes(hhmm: string, mins: number): string {
  const [h, m] = hhmm.split(":").map(Number)
  const total = h * 60 + m + mins
  const hh = Math.floor(total / 60) % 24
  const mm = total % 60
  return `${String(hh).padStart(2,"0")}:${String(mm).padStart(2,"0")}`
}

function fmt12(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number)
  const ampm = h < 12 ? "AM" : "PM"
  const hh = h % 12 || 12
  return `${hh}:${String(m).padStart(2,"0")} ${ampm}`
}

// Build ordered timeline entries from config
interface TimelineEntry {
  kind: "period" | "break"
  label: string
  start: string
  end: string
  duration: number
  type?: BreakRow["type"]
  periodNum?: number
}

function buildTimeline(
  startTime: string,
  periodsPerDay: number,
  periodDuration: number,
  breaks: BreakRow[],
): TimelineEntry[] {
  const entries: TimelineEntry[] = []
  let cursor = startTime

  // Sort breaks by afterPeriod
  const sortedBreaks = [...breaks].sort((a, b) => a.afterPeriod - b.afterPeriod)
  const breakMap = new Map<number, BreakRow[]>()
  for (const b of sortedBreaks) {
    if (!breakMap.has(b.afterPeriod)) breakMap.set(b.afterPeriod, [])
    breakMap.get(b.afterPeriod)!.push(b)
  }

  for (let p = 1; p <= periodsPerDay; p++) {
    const end = addMinutes(cursor, periodDuration)
    entries.push({ kind: "period", label: `Period ${p}`, start: cursor, end, duration: periodDuration, periodNum: p })
    cursor = end

    const bAfter = breakMap.get(p) ?? []
    for (const b of bAfter) {
      const bend = addMinutes(cursor, b.duration)
      entries.push({ kind: "break", label: b.name, start: cursor, end: bend, duration: b.duration, type: b.type })
      cursor = bend
    }
  }
  return entries
}

function makeId() { return Math.random().toString(36).slice(2, 8) }

// ─── Default break sets ───────────────────────────────────────
const DEFAULT_BREAKS_8: BreakRow[] = [
  { id: "a1", name: "Assembly",   afterPeriod: 0,  duration: 20, type: "assembly" },
  { id: "b1", name: "Short Break",afterPeriod: 3,  duration: 10, type: "break"    },
  { id: "l1", name: "Lunch",      afterPeriod: 5,  duration: 30, type: "lunch"    },
  { id: "d1", name: "Dispersal",  afterPeriod: 8,  duration: 10, type: "dispersal" },
]

// ─── Component ───────────────────────────────────────────────
export function StepBell() {
  const { config, setConfig, setStep, setBreaks } = useTimetableStore()

  // Local state
  const [workDays, setWorkDays]     = useState<string[]>(config.workDays?.length ? config.workDays : ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"])
  const [startTime, setStartTime]   = useState(config.startTime ?? "09:00")
  const [periodDur, setPeriodDur]   = useState(config.defaultSessionDuration ?? 45)
  const [numPeriods, setNumPeriods] = useState(config.periodsPerDay ?? 8)
  const [breaks, setBreaksLocal]    = useState<BreakRow[]>(DEFAULT_BREAKS_8)

  const toggleDay = (d: string) =>
    setWorkDays(w => w.includes(d) ? w.filter(x => x !== d) : [...w, d])

  const addBreak = () =>
    setBreaksLocal(b => [...b, { id: makeId(), name: "Break", afterPeriod: 4, duration: 15, type: "break" }])

  const updateBreak = (id: string, patch: Partial<BreakRow>) =>
    setBreaksLocal(b => b.map(x => x.id === id ? { ...x, ...patch } : x))

  const removeBreak = (id: string) =>
    setBreaksLocal(b => b.filter(x => x.id !== id))

  // Timeline (recomputed on every change)
  const timeline = useMemo(
    () => buildTimeline(startTime, numPeriods, periodDur, breaks),
    [startTime, numPeriods, periodDur, breaks],
  )

  const endTime  = timeline.at(-1)?.end ?? startTime
  const totalMin = timeline.reduce((s, e) => s + e.duration, 0)
  const totalH   = Math.floor(totalMin / 60)
  const totalM   = totalMin % 60

  const handleContinue = () => {
    // Save config
    setConfig({
      workDays,
      startTime,
      endTime,
      periodsPerDay: numPeriods,
      numBreaks: breaks.length,
      defaultSessionDuration: periodDur,
    } as any)

    // Save breaks to store as Period[]
    setBreaks(breaks.map(b => ({
      id: b.id,
      name: b.name,
      duration: b.duration,
      type: b.type as any,
      shiftable: b.type === "break",
    })))

    setStep(3)
  }

  // ── Styles ──
  const lbl: React.CSSProperties = { display:"block", fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", color:"#a8a59e", marginBottom:7 }
  const card: React.CSSProperties = { border:"1.5px solid #e8e5de", borderRadius:12, padding:"18px 20px", background:"#fff", marginBottom:20 }
  const numInp: React.CSSProperties = { width:70, padding:"6px 8px", border:"1.5px solid #e8e5de", borderRadius:8, fontSize:18, fontWeight:700, fontFamily:"'DM Mono',monospace", textAlign:"center", outline:"none" }
  const smallInp: React.CSSProperties = { padding:"5px 8px", border:"1.5px solid #e8e5de", borderRadius:7, fontSize:12, outline:"none", background:"#fff" }

  return (
    <div>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:6 }}>
        <div style={{ width:40, height:40, borderRadius:12, background:"linear-gradient(135deg,#0891b2,#0e7490)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>🔔</div>
        <div>
          <h1 style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:28, margin:0 }}>Bell Schedule</h1>
          <p style={{ color:"#6a6860", fontSize:12, margin:0 }}>Step 2 of 6 — Working Days, Periods & Breaks</p>
        </div>
      </div>
      <p style={{ color:"#6a6860", fontSize:13, marginBottom:24, lineHeight:1.7 }}>
        Configure your school's daily structure. Schedu will calculate exact start and end times for every period and break, and use this to enforce the bell schedule across all timetable views.
      </p>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
        {/* ── LEFT COLUMN ── */}
        <div>

          {/* Working Days */}
          <div style={card}>
            <label style={lbl}>Working Days *</label>
            <div style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
              {DAYS_ORDERED.map(d => {
                const on = workDays.includes(d)
                return (
                  <button key={d} onClick={() => toggleDay(d)}
                    style={{ padding:"8px 12px", borderRadius:8, border: on?"2px solid #0891b2":"1.5px solid #e8e5de", background: on?"#ecfeff":"#fff", cursor:"pointer", fontSize:12, fontWeight: on?700:400, color: on?"#0e7490":"#4a4844" }}>
                    {DAY_LABEL[d]}
                  </button>
                )
              })}
            </div>
            <div style={{ marginTop:10, fontSize:11, color:"#6a6860" }}>
              {workDays.length} day{workDays.length !== 1 ? "s" : ""} / week selected
            </div>
          </div>

          {/* Timing */}
          <div style={card}>
            <label style={lbl}>Daily Timing</label>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14 }}>
              <div>
                <div style={{ fontSize:11, color:"#a8a59e", marginBottom:6, fontWeight:600 }}>School Starts</div>
                <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                  style={{ ...smallInp, width:"100%", fontSize:14, padding:"8px 10px" }} />
              </div>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:11, color:"#a8a59e", marginBottom:6, fontWeight:600 }}>Period Duration</div>
                <div style={{ display:"flex", alignItems:"center", gap:6, justifyContent:"center" }}>
                  <input type="number" min={20} max={120} value={periodDur}
                    onChange={e => setPeriodDur(Math.max(20, +e.target.value))}
                    style={numInp} />
                  <span style={{ fontSize:11, color:"#6a6860" }}>min</span>
                </div>
              </div>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:11, color:"#a8a59e", marginBottom:6, fontWeight:600 }}>Periods / Day</div>
                <div style={{ display:"flex", alignItems:"center", gap:6, justifyContent:"center" }}>
                  <input type="number" min={1} max={16} value={numPeriods}
                    onChange={e => setNumPeriods(Math.max(1, +e.target.value))}
                    style={numInp} />
                </div>
              </div>
            </div>
            <div style={{ marginTop:14, padding:"8px 12px", background:"#f0f9ff", borderRadius:8, fontSize:11, color:"#0369a1", display:"flex", gap:16 }}>
              <span>🕐 Starts: <strong>{fmt12(startTime)}</strong></span>
              <span>🕔 Ends: <strong>{fmt12(endTime)}</strong></span>
              <span>⏱ Total: <strong>{totalH}h {totalM > 0 ? `${totalM}m` : ""}</strong></span>
            </div>
          </div>

          {/* Breaks */}
          <div style={card}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
              <label style={{ ...lbl, marginBottom:0 }}>Breaks, Lunch & Assembly</label>
              <button onClick={addBreak}
                style={{ padding:"5px 12px", borderRadius:7, border:"1.5px solid #4f46e5", background:"#eaecf8", color:"#3730a3", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                + Add Break
              </button>
            </div>
            {breaks.length === 0 ? (
              <div style={{ textAlign:"center", padding:"20px", color:"#a8a59e", fontSize:12 }}>
                No breaks configured. Add Assembly, Breaks, and Lunch.
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {/* Header row */}
                <div style={{ display:"grid", gridTemplateColumns:"28px 1fr 80px 70px 100px 28px", gap:8, alignItems:"center", paddingBottom:6, borderBottom:"1px solid #e8e5de" }}>
                  {["","Name","After P.","Min","Type",""].map((h,i) => (
                    <div key={i} style={{ fontSize:9, fontWeight:700, textTransform:"uppercase", color:"#a8a59e", letterSpacing:"0.06em" }}>{h}</div>
                  ))}
                </div>
                {breaks.map(b => (
                  <div key={b.id} style={{ display:"grid", gridTemplateColumns:"28px 1fr 80px 70px 100px 28px", gap:8, alignItems:"center" }}>
                    <span style={{ fontSize:16, textAlign:"center" }}>{BREAK_ICON[b.type]}</span>
                    <input value={b.name} onChange={e => updateBreak(b.id, { name: e.target.value })}
                      style={{ ...smallInp, width:"100%" }} />
                    <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                      <input type="number" min={0} max={numPeriods} value={b.afterPeriod}
                        onChange={e => updateBreak(b.id, { afterPeriod: Math.max(0, +e.target.value) })}
                        style={{ ...smallInp, width:"100%", textAlign:"center" as const, fontFamily:"monospace" }} />
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                      <input type="number" min={5} max={120} value={b.duration}
                        onChange={e => updateBreak(b.id, { duration: Math.max(5, +e.target.value) })}
                        style={{ ...smallInp, width:"100%", textAlign:"center" as const, fontFamily:"monospace" }} />
                    </div>
                    <select value={b.type} onChange={e => updateBreak(b.id, { type: e.target.value as any })}
                      style={{ ...smallInp, width:"100%" }}>
                      {BREAK_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
                    </select>
                    <button onClick={() => removeBreak(b.id)}
                      style={{ background:"none", border:"none", cursor:"pointer", color:"#ef4444", fontSize:16, lineHeight:1, padding:0 }}>×</button>
                  </div>
                ))}
              </div>
            )}
            <div style={{ marginTop:10, fontSize:11, color:"#6a6860" }}>
              💡 <strong>After Period 0</strong> = before Period 1 (e.g., Assembly before classes start)
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN — Live Preview ── */}
        <div style={{ position:"sticky", top:0 }}>
          <div style={{ ...card, maxHeight:"calc(100vh - 200px)", overflowY:"auto" }}>
            <div style={{ fontSize:12, fontWeight:700, color:"#1c1b18", marginBottom:14, display:"flex", alignItems:"center", gap:6 }}>
              📋 Live Bell Schedule Preview
              <span style={{ fontSize:10, fontWeight:400, color:"#a8a59e" }}>— updates as you type</span>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
              {timeline.map((entry, i) => {
                const isPeriod = entry.kind === "period"
                const isLunch  = entry.type === "lunch"
                const isAssembly = entry.type === "assembly"
                const isDispersal = entry.type === "dispersal"

                const bg = isPeriod
                  ? (entry.periodNum! % 2 === 0 ? "#f8faff" : "#fff")
                  : isLunch ? "#fefce8" : isAssembly ? "#f0fdf4" : isDispersal ? "#fdf4ff" : "#fafaf9"
                const borderColor = isPeriod
                  ? "#e0e7ff"
                  : isLunch ? "#fde68a" : isAssembly ? "#86efac" : isDispersal ? "#d8b4fe" : "#e8e5de"
                const labelColor = isPeriod ? "#3730a3" : isLunch ? "#92400e" : isAssembly ? "#14532d" : isDispersal ? "#6b21a8" : "#374151"

                return (
                  <div key={i} style={{
                    display:"grid", gridTemplateColumns:"16px 1fr auto", gap:10, alignItems:"center",
                    padding:"8px 12px", background:bg, border:`1px solid ${borderColor}`,
                    borderRadius: i===0?"8px 8px 0 0":i===timeline.length-1?"0 0 8px 8px":"0",
                    borderTop: i === 0 ? undefined : "none",
                  }}>
                    <span style={{ fontSize:12 }}>
                      {isPeriod ? "📘" : BREAK_ICON[entry.type!]}
                    </span>
                    <div>
                      <div style={{ fontSize:12, fontWeight:700, color:labelColor }}>{entry.label}</div>
                      <div style={{ fontSize:10, color:"#a8a59e", marginTop:1 }}>{entry.duration} min</div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:11, fontWeight:600, color:"#1c1b18", fontFamily:"monospace" }}>{fmt12(entry.start)}</div>
                      <div style={{ fontSize:10, color:"#a8a59e", fontFamily:"monospace" }}>→ {fmt12(entry.end)}</div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Summary */}
            <div style={{ marginTop:12, padding:"10px 12px", background:"#f5f3ff", border:"1px solid #ddd6fe", borderRadius:8, fontSize:11, color:"#4c1d95" }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                <span>📅 {workDays.length} days/week</span>
                <span>📘 {numPeriods} periods/day</span>
                <span>☕ {breaks.length} breaks/day</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                <span>⏱ {periodDur} min/period</span>
                <span>📆 ~{numPeriods * workDays.length} periods/week</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ display:"flex", justifyContent:"space-between", paddingTop:16, borderTop:"1px solid #e8e5de" }}>
        <button onClick={() => setStep(1)}
          style={{ padding:"9px 18px", borderRadius:8, border:"1.5px solid #e8e5de", background:"#fff", fontSize:13, fontWeight:500, cursor:"pointer" }}>
          ← Back
        </button>
        <button onClick={handleContinue} disabled={workDays.length === 0}
          style={{ padding:"11px 28px", borderRadius:9, border:"none", fontSize:14, fontWeight:600, cursor:workDays.length>0?"pointer":"not-allowed", background:workDays.length>0?"#059669":"#d4d1c8", color:"#fff" }}>
          Continue → Resources
        </button>
      </div>
    </div>
  )
}
