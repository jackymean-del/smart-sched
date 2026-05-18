/**
 * Step 2 — Shifts & Timing
 *
 * Configure working days, period count, duration, start time, and breaks.
 * Live timeline preview updates in real-time on the right.
 */

import { useState, useMemo } from "react"
import { useTimetableStore } from "@/store/timetableStore"
import { Clock, Calendar, Coffee, ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react"

// ─── Types ────────────────────────────────────────────────────
interface BreakRow {
  id:          string
  name:        string
  afterPeriod: number   // 0 = before first period
  duration:    number   // minutes
  type:        "assembly" | "break" | "lunch" | "dispersal"
}

// ─── Constants ───────────────────────────────────────────────
const DAYS_ORDERED = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"]
const DAY_SHORT: Record<string,string> = {
  MONDAY:"Mon", TUESDAY:"Tue", WEDNESDAY:"Wed",
  THURSDAY:"Thu", FRIDAY:"Fri", SATURDAY:"Sat", SUNDAY:"Sun",
}
const BREAK_TYPES: BreakRow["type"][] = ["assembly","break","lunch","dispersal"]
const BREAK_ICON: Record<BreakRow["type"],string> = {
  assembly:"🔔", break:"☕", lunch:"🍱", dispersal:"🏃",
}
const BREAK_COLOR: Record<BreakRow["type"], { bg: string; fg: string; border: string }> = {
  assembly:  { bg: "#DCFCE7", fg: "#15803D", border: "#BBF7D0" },
  break:     { bg: "#F8F7FF", fg: "#4B5275", border: "#E8E4FF" },
  lunch:     { bg: "#FEF3C7", fg: "#92400E", border: "#FDE68A" },
  dispersal: { bg: "#EDE9FF", fg: "#7C3AED", border: "#C4B5FD" },
}

const DEFAULT_BREAKS: BreakRow[] = [
  { id: "a1", name: "Assembly",    afterPeriod: 0, duration: 20, type: "assembly"  },
  { id: "b1", name: "Short Break", afterPeriod: 3, duration: 10, type: "break"     },
  { id: "l1", name: "Lunch",       afterPeriod: 5, duration: 30, type: "lunch"     },
  { id: "d1", name: "Dispersal",   afterPeriod: 8, duration: 10, type: "dispersal" },
]

// ─── Helpers ─────────────────────────────────────────────────
function addMinutes(hhmm: string, mins: number): string {
  const [h, m] = hhmm.split(":").map(Number)
  const total = h * 60 + m + mins
  return `${String(Math.floor(total / 60) % 24).padStart(2,"0")}:${String(total % 60).padStart(2,"0")}`
}

function fmt12(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2,"0")} ${h < 12 ? "AM" : "PM"}`
}

function makeId() { return Math.random().toString(36).slice(2, 8) }

interface TimelineEntry {
  kind:     "period" | "break"
  label:    string
  start:    string
  end:      string
  duration: number
  type?:    BreakRow["type"]
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
  const breakMap = new Map<number, BreakRow[]>()
  for (const b of [...breaks].sort((a, b) => a.afterPeriod - b.afterPeriod)) {
    if (!breakMap.has(b.afterPeriod)) breakMap.set(b.afterPeriod, [])
    breakMap.get(b.afterPeriod)!.push(b)
  }
  for (const b of breakMap.get(0) ?? []) {
    const end = addMinutes(cursor, b.duration)
    entries.push({ kind: "break", label: b.name, start: cursor, end, duration: b.duration, type: b.type })
    cursor = end
  }
  for (let p = 1; p <= periodsPerDay; p++) {
    const end = addMinutes(cursor, periodDuration)
    entries.push({ kind: "period", label: `Period ${p}`, start: cursor, end, duration: periodDuration, periodNum: p })
    cursor = end
    for (const b of breakMap.get(p) ?? []) {
      const bend = addMinutes(cursor, b.duration)
      entries.push({ kind: "break", label: b.name, start: cursor, end: bend, duration: b.duration, type: b.type })
      cursor = bend
    }
  }
  return entries
}

// ─── Component ───────────────────────────────────────────────
export function StepBell() {
  const { config, setConfig, setStep, setBreaks } = useTimetableStore()

  const [workDays,   setWorkDays]   = useState<string[]>(config.workDays?.length ? config.workDays : ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"])
  const [startTime,  setStartTime]  = useState(config.startTime ?? "09:00")
  const [periodDur,  setPeriodDur]  = useState(config.defaultSessionDuration ?? 45)
  const [numPeriods, setNumPeriods] = useState(config.periodsPerDay ?? 8)
  const [breaks,     setBreaksLocal] = useState<BreakRow[]>(DEFAULT_BREAKS)

  const toggleDay = (d: string) =>
    setWorkDays(w => w.includes(d) ? w.filter(x => x !== d) : [...w, d])

  const addBreak = () =>
    setBreaksLocal(b => [...b, { id: makeId(), name: "Break", afterPeriod: 4, duration: 15, type: "break" }])

  const updateBreak = (id: string, patch: Partial<BreakRow>) =>
    setBreaksLocal(b => b.map(x => x.id === id ? { ...x, ...patch } : x))

  const removeBreak = (id: string) =>
    setBreaksLocal(b => b.filter(x => x.id !== id))

  const timeline = useMemo(
    () => buildTimeline(startTime, numPeriods, periodDur, breaks),
    [startTime, numPeriods, periodDur, breaks],
  )

  const endTime  = timeline.at(-1)?.end ?? startTime
  const totalMin = timeline.reduce((s, e) => s + e.duration, 0)
  const totalH   = Math.floor(totalMin / 60)
  const totalM   = totalMin % 60

  const handleContinue = () => {
    setConfig({
      workDays, startTime, endTime,
      periodsPerDay: numPeriods,
      numBreaks: breaks.length,
      defaultSessionDuration: periodDur,
    } as any)
    setBreaks(breaks.map(b => ({
      id: b.id, name: b.name, duration: b.duration,
      type: b.type as any, shiftable: b.type === "break",
    })))
    setStep(3)
  }

  return (
    <div style={{ padding: "20px 24px 24px", maxWidth: 1100, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: "#EDE9FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Clock size={20} color="#7C6FE0" />
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: "#13111E", margin: 0, lineHeight: 1.1 }}>
            Shifts & Timing
          </h2>
          <div style={{ fontSize: 12, color: "#4B5275", marginTop: 3 }}>
            Set working days, daily timing, and breaks. The live preview updates instantly.
          </div>
        </div>
        {/* Summary chips */}
        <div style={{ display: "flex", gap: 6 }}>
          {[
            { label: `${workDays.length} days/wk`, color: "#7C6FE0" },
            { label: `${numPeriods} periods/day`, color: "#9B8EF5" },
            { label: `${periodDur} min/period`, color: "#D4920E" },
          ].map(c => (
            <span key={c.label} style={{
              padding: "4px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700,
              background: `${c.color}14`, color: c.color, border: `1px solid ${c.color}33`,
            }}>{c.label}</span>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16, alignItems: "start" }}>

        {/* ── LEFT COLUMN ── */}
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 12 }}>

          {/* Working Days */}
          <BellCard title="Working Days" icon={<Calendar size={14} color="#7C6FE0" />}>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap" as const }}>
              {DAYS_ORDERED.map(d => {
                const on = workDays.includes(d)
                return (
                  <button key={d} onClick={() => toggleDay(d)}
                    style={{
                      padding: "7px 14px", borderRadius: 8, cursor: "pointer",
                      border: on ? "2px solid #7C6FE0" : "1px solid #E8E4FF",
                      background: on ? "#EDE9FF" : "#FAFAFE",
                      color: on ? "#7C3AED" : "#8B87AD",
                      fontSize: 12, fontWeight: on ? 700 : 500,
                      fontFamily: "inherit", transition: "all 0.12s",
                    }}>
                    {DAY_SHORT[d]}
                  </button>
                )
              })}
            </div>
          </BellCard>

          {/* Timing */}
          <BellCard title="Daily Timing" icon={<Clock size={14} color="#7C6FE0" />}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
              <div>
                <div style={labelStyle}>School Starts</div>
                <input type="time" value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  style={timeInputStyle(true)} />
              </div>
              <div>
                <div style={labelStyle}>Period Duration</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <input type="number" min={20} max={120} value={periodDur}
                    onChange={e => setPeriodDur(Math.max(20, +e.target.value))}
                    style={numInputStyle} />
                  <span style={{ fontSize: 11, color: "#4B5275" }}>min</span>
                </div>
              </div>
              <div>
                <div style={labelStyle}>Periods / Day</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <input type="number" min={1} max={16} value={numPeriods}
                    onChange={e => setNumPeriods(Math.max(1, +e.target.value))}
                    style={numInputStyle} />
                </div>
              </div>
            </div>
            {/* Times summary */}
            <div style={{
              marginTop: 12, padding: "8px 14px",
              background: "#F5F2FF", borderRadius: 8,
              border: "1px solid #E8E4FF",
              display: "flex", gap: 20, flexWrap: "wrap" as const,
              fontSize: 11, fontWeight: 600, color: "#4B5275",
            }}>
              <span>Starts <strong style={{ color: "#7C3AED", fontFamily: "'DM Mono', monospace" }}>{fmt12(startTime)}</strong></span>
              <span>Ends <strong style={{ color: "#7C3AED", fontFamily: "'DM Mono', monospace" }}>{fmt12(endTime)}</strong></span>
              <span>Duration <strong style={{ color: "#7C3AED", fontFamily: "'DM Mono', monospace" }}>{totalH}h{totalM > 0 ? ` ${totalM}m` : ""}</strong></span>
              <span>Periods/week <strong style={{ color: "#7C3AED", fontFamily: "'DM Mono', monospace" }}>{numPeriods * workDays.length}</strong></span>
            </div>
          </BellCard>

          {/* Breaks */}
          <BellCard title="Breaks, Lunch & Assembly" icon={<Coffee size={14} color="#7C6FE0" />}
            action={
              <button onClick={addBreak} style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "5px 12px", borderRadius: 7,
                border: "1px solid #D8D2FF", background: "#F0EDFF",
                color: "#7C3AED", fontSize: 11, fontWeight: 700, cursor: "pointer",
                fontFamily: "inherit",
              }}>
                <Plus size={11} /> Add Break
              </button>
            }>
            {breaks.length === 0 ? (
              <div style={{ padding: "20px", textAlign: "center" as const, color: "#B8B4D4", fontSize: 12 }}>
                No breaks. Click "Add Break" to add Assembly, Lunch etc.
              </div>
            ) : (
              <div>
                {/* Header */}
                <div style={{
                  display: "grid", gridTemplateColumns: "28px 1fr 70px 70px 110px 28px",
                  gap: 8, paddingBottom: 6, borderBottom: "1px solid #F0EDFF",
                  fontSize: 9, fontWeight: 800, color: "#B8B4D4",
                  textTransform: "uppercase" as const, letterSpacing: "0.06em",
                }}>
                  {["", "Name", "After P.", "Min", "Type", ""].map((h, i) => <div key={i}>{h}</div>)}
                </div>
                {breaks.map(b => {
                  const c = BREAK_COLOR[b.type]
                  return (
                    <div key={b.id} style={{
                      display: "grid", gridTemplateColumns: "28px 1fr 70px 70px 110px 28px",
                      gap: 8, alignItems: "center", marginTop: 6,
                    }}>
                      <span style={{ fontSize: 16, textAlign: "center" as const, lineHeight: 1 }}>{BREAK_ICON[b.type]}</span>
                      <input value={b.name} onChange={e => updateBreak(b.id, { name: e.target.value })}
                        style={{ ...smallInput, width: "100%" }} />
                      <input type="number" min={0} max={numPeriods} value={b.afterPeriod}
                        onChange={e => updateBreak(b.id, { afterPeriod: Math.max(0, +e.target.value) })}
                        style={{ ...smallInput, textAlign: "center" as const, fontFamily: "'DM Mono', monospace" }} />
                      <input type="number" min={5} max={120} value={b.duration}
                        onChange={e => updateBreak(b.id, { duration: Math.max(5, +e.target.value) })}
                        style={{ ...smallInput, textAlign: "center" as const, fontFamily: "'DM Mono', monospace" }} />
                      <select value={b.type} onChange={e => updateBreak(b.id, { type: e.target.value as any })}
                        style={{
                          ...smallInput,
                          background: c.bg, color: c.fg, border: `1px solid ${c.border}`,
                          fontWeight: 700,
                        }}>
                        {BREAK_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                      </select>
                      <button onClick={() => removeBreak(b.id)} style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: "#FCA5A5", fontSize: 16, lineHeight: 1, padding: 0,
                        display: "flex", alignItems: "center",
                      }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )
                })}
                <div style={{ fontSize: 10, color: "#B8B4D4", marginTop: 10 }}>
                  💡 After Period 0 = before Period 1 (e.g. Assembly before classes start)
                </div>
              </div>
            )}
          </BellCard>
        </div>

        {/* ── RIGHT COLUMN — Live Preview ── */}
        <div style={{ position: "sticky" as const, top: 0 }}>
          <div style={{
            background: "#fff", borderRadius: 12, border: "1px solid #E8E4FF",
            overflow: "hidden", maxHeight: "calc(100vh - 200px)",
          }}>
            <div style={{
              padding: "10px 14px", background: "#F8F7FF",
              borderBottom: "1px solid #E8E4FF",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <Clock size={13} color="#7C6FE0" />
              <span style={{ fontSize: 12, fontWeight: 700, color: "#13111E" }}>Live Bell Schedule</span>
              <span style={{ fontSize: 10, color: "#B8B4D4" }}>— updates as you type</span>
            </div>
            <div style={{ overflowY: "auto" as const, maxHeight: "calc(100vh - 280px)" }}>
              {timeline.map((entry, i) => {
                const isPeriod = entry.kind === "period"
                const bColor = isPeriod
                  ? { bg: entry.periodNum! % 2 === 0 ? "#FAFAFE" : "#fff", fg: "#13111E", border: "#F0EDFF" }
                  : BREAK_COLOR[entry.type!]
                return (
                  <div key={i} style={{
                    display: "grid", gridTemplateColumns: "20px 1fr auto",
                    gap: 8, alignItems: "center",
                    padding: "8px 12px",
                    background: bColor.bg,
                    borderBottom: "1px solid #F8F7FF",
                  }}>
                    <span style={{ fontSize: 11, textAlign: "center" as const }}>
                      {isPeriod ? "📘" : BREAK_ICON[entry.type!]}
                    </span>
                    <div>
                      <div style={{
                        fontSize: 11, fontWeight: 700,
                        color: isPeriod ? "#13111E" : bColor.fg,
                      }}>{entry.label}</div>
                      <div style={{ fontSize: 9, color: "#B8B4D4", marginTop: 1 }}>{entry.duration} min</div>
                    </div>
                    <div style={{ textAlign: "right" as const }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#4B5275", fontFamily: "'DM Mono', monospace" }}>{fmt12(entry.start)}</div>
                      <div style={{ fontSize: 9, color: "#B8B4D4", fontFamily: "'DM Mono', monospace" }}>→ {fmt12(entry.end)}</div>
                    </div>
                  </div>
                )
              })}
            </div>
            {/* Summary */}
            <div style={{
              padding: "10px 14px", borderTop: "1px solid #E8E4FF",
              background: "#F8F7FF",
              display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4,
              fontSize: 10, color: "#4B5275",
            }}>
              <span>📅 {workDays.length} days/week</span>
              <span>📘 {numPeriods} periods/day</span>
              <span>⏱ {periodDur} min/period</span>
              <span>📆 ~{numPeriods * workDays.length} periods/wk</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer nav */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginTop: 20, paddingTop: 16, borderTop: "1px solid #F0EDFF",
      }}>
        <button onClick={() => setStep(1)} style={btnSecondary}>
          <ChevronLeft size={14} /> Resources
        </button>
        <button onClick={handleContinue} disabled={workDays.length === 0} style={btnPrimary(workDays.length > 0)}>
          Allocation <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────

function BellCard({ title, icon, action, children }: {
  title: string; icon: React.ReactNode; action?: React.ReactNode; children: React.ReactNode
}) {
  return (
    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E8E4FF", overflow: "hidden" }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "10px 16px", background: "#FAFAFE", borderBottom: "1px solid #F0EDFF",
      }}>
        {icon}
        <span style={{ fontSize: 12, fontWeight: 700, color: "#13111E", flex: 1 }}>{title}</span>
        {action}
      </div>
      <div style={{ padding: "14px 16px" }}>{children}</div>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em",
  color: "#8B87AD", marginBottom: 6,
}

const numInputStyle: React.CSSProperties = {
  width: 64, padding: "6px 8px", border: "1px solid #E8E4FF", borderRadius: 8,
  fontSize: 18, fontWeight: 700, fontFamily: "'DM Mono', monospace",
  textAlign: "center" as const, outline: "none", color: "#13111E", background: "#FAFAFE",
}

const smallInput: React.CSSProperties = {
  padding: "5px 8px", border: "1px solid #E8E4FF", borderRadius: 7,
  fontSize: 12, outline: "none", background: "#FAFAFE", color: "#13111E",
  fontFamily: "inherit",
}

function timeInputStyle(active: boolean): React.CSSProperties {
  return {
    width: "100%", padding: "6px 10px",
    border: `1px solid ${active ? "#D8D2FF" : "#E8E4FF"}`,
    borderRadius: 8, fontSize: 13, outline: "none",
    background: active ? "#F5F2FF" : "#FAFAFE",
    color: "#13111E", fontFamily: "'DM Mono', monospace",
    fontWeight: 700,
  }
}

const btnSecondary: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6,
  padding: "9px 16px", borderRadius: 8, border: "1px solid #E8E4FF",
  background: "#fff", color: "#4B5275", fontSize: 12, fontWeight: 600,
  cursor: "pointer", fontFamily: "inherit",
}

function btnPrimary(enabled: boolean): React.CSSProperties {
  return {
    display: "inline-flex", alignItems: "center", gap: 7,
    padding: "9px 20px", borderRadius: 8, border: "none",
    background: enabled ? "linear-gradient(135deg, #7C6FE0, #9B8EF5)" : "#E8E4FF",
    color: enabled ? "#fff" : "#B8B4D4",
    fontSize: 12, fontWeight: 700, cursor: enabled ? "pointer" : "not-allowed",
    fontFamily: "inherit",
    boxShadow: enabled ? "0 2px 8px rgba(124,111,224,0.35)" : "none",
  }
}
