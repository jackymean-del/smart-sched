/**
 * CalendarView — Timeline-based timetable visualizer for SmartSched / Schedu
 *
 * ┌────────────────────────────────────────────────────────────────────┐
 * │  Timeline view                                                     │
 * │  X-axis = actual clock time  (zoom: 15 min | 30 min | 60 min)     │
 * │  Y-axis = entities  (classes / teachers / rooms / subjects)        │
 * │                                                                    │
 * │  Each block is positioned and sized by real duration:              │
 * │    left  = (startMin − dayStart) × pxPerMin                        │
 * │    width = duration × pxPerMin                                     │
 * │                                                                    │
 * │  Handles heterogeneous schedules naturally — classes with          │
 * │  different break timings just render their blocks at the           │
 * │  correct absolute time without special-casing.                     │
 * └────────────────────────────────────────────────────────────────────┘
 *
 * Month view is kept as a compact calendar overview.
 * All period-header-based week / day table views have been removed.
 */

import { useState, useMemo } from "react"
import type { Period, Section, Staff } from "@/types"
import type { ClassTimetable, TeacherSchedule } from "@/types"
import { getSubjectColor } from "@/lib/orgData"
import type { BlockedSlot, DynamicLearningGroup } from "@/lib/schedulingEngine"
import { BlockedSlotIcon, buildBlockedMap } from "@/components/master/BlockedSlotIcon"
import { DLGCellIcon, buildDLGMap } from "@/components/master/DLGCellIcon"

// ─────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────
export type CalMode = "month" | "timeline"
export type ZoomLevel = "15min" | "30min" | "60min"

export interface CalendarViewProps {
  classTT: ClassTimetable
  teacherTT: Record<string, TeacherSchedule>
  periods: Period[]
  workDays: string[]           // e.g. ["MONDAY","TUESDAY",...]
  startTime: string            // e.g. "09:00"
  timeFormat?: "12h" | "24h"
  staff: Staff[]
  sections: Section[]
  subjects: { id: string; name: string; category?: string }[]
  substitutions: Record<string, string>
  viewMode: "class" | "teacher" | "subject" | "room"
  selectedEntity: string       // "ALL" or a specific name
  showTeacher: boolean
  showRoom: boolean
  onCellClick?: (section: string, day: string, periodId: string) => void
  onCellSwap?: (from: {section:string, day:string, periodId:string}, to: {section:string, day:string, periodId:string}) => void
  onCellFill?: (section: string, day: string, periodId: string, suggestedSubject: string) => void
  absentHighlights?: Array<{ teacher: string; day: string }>
  blockedSlots?: BlockedSlot[]
  dynamicLearningGroups?: DynamicLearningGroup[]
  rooms?: Array<{ actualName?: string; generatedName?: string; name?: string; capacity?: number }>
  classwiseBreaks?: Array<{id:string; name:string; type:string; classes:string[]; afterPeriod:number; duration:number}>
}

// ─────────────────────────────────────────────
// Layout constants
// ─────────────────────────────────────────────
const LABEL_W = 104  // px — sticky left entity-label column
const ROW_H   = 66   // px — per-entity row height
const RULER_H = 42   // px — time ruler / sticky header height

// Pixels per minute at each zoom level:
//   "15min" → 4 px/min  → each hour = 240 px   (most detailed)
//   "30min" → 2 px/min  → each hour = 120 px
//   "60min" → 1 px/min  → each hour =  60 px   (overview)
const PX_PER_MIN: Record<ZoomLevel, number> = { "15min": 4, "30min": 2, "60min": 1 }
// Primary grid-line (tick-label) interval in minutes
const TICK_INT:  Record<ZoomLevel, number>  = { "15min": 15, "30min": 30, "60min": 60 }
// Minor grid-line interval (half of primary)
const MINOR_INT: Record<ZoomLevel, number>  = { "15min": 5,  "30min": 15, "60min": 30 }

// ─────────────────────────────────────────────
// Calendar helpers (date math)
// ─────────────────────────────────────────────
const DOW_KEY: Record<number, string> = {
  0: "SUNDAY", 1: "MONDAY", 2: "TUESDAY", 3: "WEDNESDAY",
  4: "THURSDAY", 5: "FRIDAY", 6: "SATURDAY",
}
const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
]
const DAY_ABBR    = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]
const DAY_FULL: Record<string, string> = {
  MONDAY:"Monday", TUESDAY:"Tuesday", WEDNESDAY:"Wednesday",
  THURSDAY:"Thursday", FRIDAY:"Friday", SATURDAY:"Saturday", SUNDAY:"Sunday",
}
const DAY_SHORT: Record<string, string> = {
  MONDAY:"Mon", TUESDAY:"Tue", WEDNESDAY:"Wed",
  THURSDAY:"Thu", FRIDAY:"Fri", SATURDAY:"Sat", SUNDAY:"Sun",
}

function getMondayOfWeek(d: Date): Date {
  const copy = new Date(d)
  const dow  = copy.getDay()
  const diff = dow === 0 ? -6 : 1 - dow
  copy.setDate(copy.getDate() + diff)
  return copy
}
function getWeekDays(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday); d.setDate(monday.getDate() + i); return d
  })
}
function getMonthGrid(year: number, month: number): Date[][] {
  const firstDay  = new Date(year, month, 1)
  const startDow  = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1
  const start     = new Date(firstDay); start.setDate(firstDay.getDate() - startDow)
  const weeks: Date[][] = []
  const cur = new Date(start)
  for (let w = 0; w < 6; w++) {
    const week: Date[] = []
    for (let d = 0; d < 7; d++) { week.push(new Date(cur)); cur.setDate(cur.getDate() + 1) }
    weeks.push(week)
    if (cur.getMonth() > month && week[6].getMonth() > month) break
  }
  return weeks
}
function fmtDate(d: Date, fmt: "short"|"long" = "short"): string {
  return fmt === "long"
    ? d.toLocaleDateString("en-GB", { weekday:"long", day:"numeric", month:"long", year:"numeric" })
    : d.toLocaleDateString("en-GB", { day:"numeric", month:"short" })
}
function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate()
}
function isToday(d: Date): boolean { return isSameDay(d, new Date()) }

// Parse "09:00" → minutes since midnight
function parseTime(t: string): number {
  const [h, m] = t.split(":").map(Number); return h * 60 + m
}
// Format minutes-since-midnight → "9:00 AM" or "09:00"
function fmtTime(mins: number, fmt: "12h"|"24h" = "12h"): string {
  const h = Math.floor(mins / 60), m = mins % 60
  if (fmt === "24h") return `${h.toString().padStart(2,"0")}:${m.toString().padStart(2,"0")}`
  const ap = h >= 12 ? "PM" : "AM", h12 = h % 12 || 12
  return `${h12}${m === 0 ? "" : `:${m.toString().padStart(2,"0")}`} ${ap}`
}
// Short time label — drop ":00" and AM/PM for clean ruler
function fmtTimeShort(mins: number, fmt: "12h"|"24h" = "12h"): string {
  const h = Math.floor(mins / 60), m = mins % 60
  if (fmt === "24h") return m === 0
    ? `${h}`
    : `${h}:${m.toString().padStart(2,"0")}`
  const ap = h >= 12 ? "p" : "a", h12 = h % 12 || 12
  return m === 0 ? `${h12}${ap}` : `${h12}:${m.toString().padStart(2,"0")}`
}

// ── Per-section period builder (mirrors timetable.tsx logic) ──────────
function getSectionClassKeyLocal(sn: string): string {
  const norm = sn.toLowerCase().replace(/[\s-]/g, "")
  const m = norm.match(/^([a-z]+)/)
  return m ? m[1] : norm.slice(0, 6)
}
type CwBreak = {id:string; name:string; type:string; classes:string[]; afterPeriod:number; duration:number}

function buildSectionPeriodsLocal(sn: string, allPeriods: Period[], cwBreaks?: CwBreak[]): Period[] {
  if (!cwBreaks?.length) return allPeriods
  const key = getSectionClassKeyLocal(sn)
  const sb  = cwBreaks.filter(b => b.classes.length === 0 || b.classes.includes(key))
  if (!sb.length) return allPeriods
  const mk = (b: CwBreak): Period => ({
    id: b.id, name: b.name, duration: b.duration,
    type: (b.type === "lunch" ? "lunch" : "break") as Period["type"], shiftable: false,
  })
  const cp  = allPeriods.filter(p => p.type === "class")
  const out: Period[] = [...allPeriods.filter(p => p.type === "fixed-start")]
  sb.filter(b => b.afterPeriod === 0).forEach(b => out.push(mk(b)))
  cp.forEach((p, i) => {
    out.push(p)
    sb.filter(b => b.afterPeriod === i + 1).forEach(b => out.push(mk(b)))
  })
  out.push(...allPeriods.filter(p => p.type === "fixed-end"))
  return out
}

// ── Cumulative times for a period list starting at a given minute ──────
function calcPeriodTimes(
  ps: Period[], startMins: number
): Map<string, { start: number; end: number }> {
  const map = new Map<string, { start: number; end: number }>()
  let cur = startMins
  for (const p of ps) {
    map.set(p.id, { start: cur, end: cur + p.duration })
    cur += p.duration
  }
  return map
}

// ─────────────────────────────────────────────────────────
// Internal block data for the timeline renderer
// ─────────────────────────────────────────────────────────
interface TimeBlock {
  key: string
  periodId: string
  periodName: string
  periodType: Period["type"]
  startMin: number
  endMin: number
  sectionName: string
  subject: string
  teacher: string
  room: string
  isSub: boolean
  isClassTeacher: boolean
  absent: boolean
}

// ─────────────────────────────────────────────────────────
// Compact month event hook (reused by month view)
// ─────────────────────────────────────────────────────────
function useSlotEvents(
  classTT: ClassTimetable,
  sections: Section[],
  substitutions: Record<string, string>,
  viewMode: CalendarViewProps["viewMode"],
  selectedEntity: string,
) {
  return useMemo(() => (day: string, periodId: string) => {
    return sections.flatMap(sec => {
      const cell = classTT[sec.name]?.[day]?.[periodId]
      if (!cell?.subject) return []
      if (viewMode === "class"   && selectedEntity !== "ALL" && sec.name !== selectedEntity) return []
      if (viewMode === "teacher" && selectedEntity !== "ALL" && cell.teacher !== selectedEntity) return []
      if (viewMode === "subject" && selectedEntity !== "ALL" && cell.subject !== selectedEntity) return []
      if (viewMode === "room"    && selectedEntity !== "ALL" && cell.room !== selectedEntity) return []
      const subKey = `${sec.name}|${day}|${periodId}`
      const isSub  = !!substitutions[subKey]
      return [{
        section: sec.name, subject: cell.subject,
        teacher: isSub ? substitutions[subKey] : (cell.teacher ?? ""),
        room: cell.room ?? "", isSub,
        isClassTeacher: !!cell.isClassTeacher,
        options: (cell as any).options,
      }]
    })
  }, [classTT, sections, substitutions, viewMode, selectedEntity])
}

// ─────────────────────────────────────────────────────────
// EventChip — compact chip used inside month calendar cells
// ─────────────────────────────────────────────────────────
function EventChip({
  subject, section, teacher, room, isSub, isClassTeacher,
  showTeacher, showRoom, compact, absent, hideSection, options, onClick,
}: {
  subject: string; section: string; teacher: string; room: string;
  isSub: boolean; isClassTeacher: boolean;
  showTeacher: boolean; showRoom: boolean;
  compact?: boolean; absent?: boolean; hideSection?: boolean;
  options?: Array<{ subject:string; teacher:string; room:string; capacity?:number; allocatedStrength?:number }>;
  onClick?: () => void;
}) {
  const cc = getSubjectColor(subject)
  if (options && options.length > 1) {
    return (
      <div onClick={onClick}
        title="Optional Block — multiple parallel subjects"
        style={{
          borderRadius:6, padding: compact ? "3px 5px" : "5px 7px",
          cursor: onClick ? "pointer" : "default",
          background:"linear-gradient(135deg,#F5F2FF 0%,#FAFAFE 100%)",
          border:"1.5px solid #D8D2FF", borderLeft:"4px solid #7C6FE0",
          marginBottom:2, position:"relative" as const, minWidth:0, overflow:"hidden",
        }}>
        {!compact && section && !hideSection && (
          <div style={{ fontSize:9, fontWeight:800, opacity:0.85, letterSpacing:"0.05em", lineHeight:1.2, marginBottom:2, color:"#13111E", textTransform:"uppercase" as const }}>
            {section} · OPTIONAL BLOCK
          </div>
        )}
        {options.map((opt, i) => (
          <div key={i} className={getSubjectColor(opt.subject)}
            style={{ display:"flex", alignItems:"center", gap:4, fontSize: compact?8:9.5, fontWeight:600,
              padding: compact?"1px 4px":"2px 5px", borderRadius:3, marginBottom: i<options.length-1?2:0,
              lineHeight:1.2, overflow:"hidden", textOverflow:"ellipsis" as const, whiteSpace:"nowrap" as const }}
            title={`${opt.subject} → ${opt.room}${opt.teacher?" · "+opt.teacher:""}${opt.capacity?" · cap "+opt.capacity:""}`}>
            <span style={{ fontWeight:800 }}>{opt.subject}</span>
            {opt.room && <span style={{ opacity:0.65 }}>→ {opt.room}</span>}
            {opt.allocatedStrength != null && opt.capacity && (
              <span style={{ marginLeft:"auto", fontSize:8, opacity:0.6, fontFamily:"'DM Mono',monospace" }}>
                {opt.allocatedStrength}/{opt.capacity}
              </span>
            )}
          </div>
        ))}
      </div>
    )
  }
  return (
    <div className={cc} onClick={onClick}
      style={{
        borderRadius:5, padding: compact ? "2px 5px" : "4px 7px",
        cursor: onClick ? "pointer" : "default",
        outline: absent ? "2px solid #f59e0b" : isSub ? "1.5px dashed #f59e0b" : "none",
        marginBottom:2, position:"relative" as const, minWidth:0, overflow:"hidden",
      }}>
      {isSub && (
        <span style={{ position:"absolute" as const, top:2, right:3, width:5, height:5, borderRadius:"50%", background:"#f59e0b" }} />
      )}
      {!compact && section && !hideSection && (
        <div style={{ fontSize:9, fontWeight:800, opacity:0.9, letterSpacing:"0.05em", lineHeight:1.2,
          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" as const, marginBottom:2, textTransform:"uppercase" as const }}>
          {section}
        </div>
      )}
      <div style={{ fontSize: compact?9:11, fontWeight:700, lineHeight:1.2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" as const }}>
        {subject}
      </div>
      {showTeacher && teacher && !compact && (
        <div style={{ fontSize:8.5, opacity:0.7, lineHeight:1.25, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" as const, marginTop:2 }}>
          {isClassTeacher && <span style={{ color:"#7C6FE0" }}>★ </span>}
          {isSub ? `🔄 ${teacher}` : teacher}
        </div>
      )}
      {showRoom && room && !compact && (
        <div style={{ fontSize:7.5, opacity:0.55, fontFamily:"'DM Mono',monospace", marginTop:1 }}>{room}</div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// TimelineBlock — a single block on the Gantt row
// ─────────────────────────────────────────────────────────
function TimelineBlock({
  block, pxPerMin, globalStart, timeFormat, showTeacher, showRoom,
  viewMode, onClick,
}: {
  block: TimeBlock
  pxPerMin: number
  globalStart: number
  timeFormat: "12h"|"24h"
  showTeacher: boolean
  showRoom: boolean
  viewMode: CalendarViewProps["viewMode"]
  onClick?: () => void
}) {
  const left  = (block.startMin - globalStart) * pxPerMin
  const width = (block.endMin - block.startMin) * pxPerMin

  // ── Break / assembly / fixed block ───────────────────────────────────
  if (block.periodType !== "class") {
    const isLunch    = block.periodType === "lunch"
    const isAssembly = block.periodType === "fixed-start" || block.periodType === "fixed-end"
    const bg    = isLunch ? "#FEF3C7" : isAssembly ? "#EDE9FF" : "#FEFCE8"
    const color = isLunch ? "#92400E" : isAssembly ? "#4F3FC0" : "#854D0E"
    const border= isLunch ? "#F6D860" : isAssembly ? "#C4B5FD" : "#FDE68A"
    return (
      <div style={{
        position:"absolute" as const, left, width: Math.max(width - 1, 1),
        top:0, bottom:0, background:bg,
        borderLeft:`2px solid ${border}`,
        borderRight:`1px solid ${border}50`,
        display:"flex", flexDirection:"column" as const,
        alignItems:"center", justifyContent:"center",
        overflow:"hidden", userSelect:"none" as const,
      }}>
        {width >= 22 && (
          <div style={{
            fontSize: Math.min(9, Math.max(7, width / 6)),
            fontWeight:700, color, textAlign:"center" as const,
            padding:"0 3px", lineHeight:1.25,
            whiteSpace:"nowrap" as const, overflow:"hidden", textOverflow:"ellipsis" as const,
          }}>
            {block.periodName}
          </div>
        )}
        {width >= 56 && (
          <div style={{ fontSize:7.5, color, opacity:0.65, fontFamily:"monospace", marginTop:1 }}>
            {block.endMin - block.startMin}m
          </div>
        )}
      </div>
    )
  }

  // ── Empty / free period ───────────────────────────────────────────────
  if (!block.subject) {
    return (
      <div style={{
        position:"absolute" as const, left: left + 1, width: Math.max(width - 2, 1),
        top:4, bottom:4,
        background:"#F9FAFB", borderLeft:"1px dashed #E0DBFF",
        borderRadius:4, overflow:"hidden",
        display:"flex", alignItems:"center", justifyContent:"center",
      }}>
        {width >= 36 && <span style={{ fontSize:9, color:"#C4BFEA" }}>—</span>}
      </div>
    )
  }

  // ── Subject period block ──────────────────────────────────────────────
  const cc = getSubjectColor(block.subject)
  // Adaptive font sizes based on available width
  const fs  = width >= 100 ? 10.5 : width >= 60 ? 9.5 : 8.5
  const fs2 = width >= 100 ? 8.5  : 7.5

  return (
    <div
      className={cc}
      onClick={onClick}
      title={[
        block.subject,
        block.sectionName && viewMode !== "class" ? block.sectionName : "",
        block.teacher ? `👤 ${block.teacher}` : "",
        block.room ? `🚪 ${block.room}` : "",
        `${fmtTime(block.startMin, timeFormat)} – ${fmtTime(block.endMin, timeFormat)}`,
      ].filter(Boolean).join("  ·  ")}
      style={{
        position:"absolute" as const, left: left + 1, width: Math.max(width - 2, 2),
        top:4, bottom:4,
        borderRadius:6, overflow:"hidden",
        cursor: onClick ? "pointer" : "default",
        padding: width >= 40 ? "3px 6px" : "2px 3px",
        outline: block.absent  ? "2px solid #f59e0b" :
                 block.isSub   ? "1.5px dashed #f59e0b" : "none",
        display:"flex", flexDirection:"column" as const, justifyContent:"center",
        transition:"filter 0.1s",
      }}
    >
      {/* Subject name */}
      {width >= 24 && (
        <div style={{
          fontSize:fs, fontWeight:700, lineHeight:1.2,
          overflow:"hidden", textOverflow:"ellipsis" as const, whiteSpace:"nowrap" as const,
        }}>
          {block.subject}
        </div>
      )}
      {/* Section name (for teacher/room views) */}
      {viewMode !== "class" && width >= 70 && block.sectionName && (
        <div style={{
          fontSize:fs2, fontWeight:800, opacity:0.85,
          textTransform:"uppercase" as const, letterSpacing:"0.04em",
          overflow:"hidden", textOverflow:"ellipsis" as const, whiteSpace:"nowrap" as const,
          marginTop:1,
        }}>
          {block.sectionName}
        </div>
      )}
      {/* Teacher */}
      {showTeacher && block.teacher && width >= 90 && (
        <div style={{
          fontSize:fs2, opacity:0.72, marginTop:1,
          overflow:"hidden", textOverflow:"ellipsis" as const, whiteSpace:"nowrap" as const,
        }}>
          {block.isClassTeacher && <span style={{ color:"#7C6FE0" }}>★ </span>}
          {block.isSub ? `🔄 ${block.teacher}` : block.teacher}
        </div>
      )}
      {/* Room */}
      {showRoom && block.room && viewMode !== "room" && width >= 90 && (
        <div style={{
          fontSize: Math.min(fs2, 7.5), opacity:0.55,
          fontFamily:"'DM Mono',monospace", marginTop:1,
          overflow:"hidden", textOverflow:"ellipsis" as const, whiteSpace:"nowrap" as const,
        }}>
          {block.room}
        </div>
      )}
      {/* Time range — shown when there's room */}
      {width >= 70 && (
        <div style={{
          fontSize:7.5, opacity:0.5, marginTop:2,
          fontFamily:"monospace", whiteSpace:"nowrap" as const,
        }}>
          {fmtTimeShort(block.startMin, timeFormat)}–{fmtTimeShort(block.endMin, timeFormat)}
        </div>
      )}
      {/* Sub / absent indicator dot */}
      {block.isSub && (
        <span style={{ position:"absolute" as const, top:3, right:4, width:5, height:5, borderRadius:"50%", background:"#f59e0b" }} />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Main CalendarView component
// ─────────────────────────────────────────────────────────
export function CalendarView({
  classTT, teacherTT, periods, workDays, startTime, timeFormat = "12h",
  staff, sections, subjects, substitutions,
  viewMode, selectedEntity,
  showTeacher, showRoom,
  onCellClick, absentHighlights, blockedSlots, dynamicLearningGroups, rooms,
  classwiseBreaks,
}: CalendarViewProps) {

  // ── Lookup maps ───────────────────────────────────────
  const blockedMap = useMemo(() => buildBlockedMap(blockedSlots ?? []), [blockedSlots])
  const dlgMap     = useMemo(() => buildDLGMap(dynamicLearningGroups ?? []), [dynamicLearningGroups])

  // ── View state ─────────────────────────────────────────
  const [calMode,     setCalMode]     = useState<CalMode>("timeline")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [zoom,        setZoom]        = useState<ZoomLevel>("30min")
  const [selectedDay, setSelectedDay] = useState<string>(() => {
    const dk = DOW_KEY[new Date().getDay()]
    return workDays.includes(dk) ? dk : (workDays[0] ?? "MONDAY")
  })

  const today       = new Date()
  const classPeriods = periods.filter(p => p.type === "class")
  const getEvents    = useSlotEvents(classTT, sections, substitutions, viewMode, selectedEntity)

  // ── Day-start in minutes ──────────────────────────────
  const dayStartMin = useMemo(() => parseTime(startTime), [startTime])

  // ── All rooms (for room view) ─────────────────────────
  const allRooms = useMemo(() => {
    const roomSet = new Set<string>()
    sections.forEach(s => { if (s.room) roomSet.add(s.room) })
    Object.values(classTT).forEach(sd =>
      Object.values(sd).forEach(dd =>
        Object.values(dd).forEach((cell: any) => { if (cell?.room) roomSet.add(cell.room) })
      )
    )
    return [...roomSet].sort()
  }, [sections, classTT])

  // ── Navigation helpers ────────────────────────────────
  const navigate = (dir: -1 | 1) => {
    const d = new Date(currentDate)
    d.setMonth(d.getMonth() + dir)
    setCurrentDate(d)
  }
  const goToday = () => setCurrentDate(new Date())

  const headerLabel = useMemo(() => {
    if (calMode === "month") {
      return `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`
    }
    return DAY_FULL[selectedDay] ?? selectedDay
  }, [calMode, currentDate, selectedDay])

  // ══════════════════════════════════════════════════════
  // RENDER — Month view (unchanged compact calendar)
  // ══════════════════════════════════════════════════════
  const renderMonth = () => {
    const grid  = getMonthGrid(currentDate.getFullYear(), currentDate.getMonth())
    const month = currentDate.getMonth()
    return (
      <div style={{ flex:1, overflowY:"auto" }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", borderBottom:"1px solid #e2e8f0" }}>
          {DAY_ABBR.map(d => (
            <div key={d} style={{ padding:"6px 0", textAlign:"center" as const, fontSize:11, fontWeight:700, color:"#64748b", borderRight:"1px solid #f1f5f9" }}>{d}</div>
          ))}
        </div>
        {grid.map((week, wi) => (
          <div key={wi} style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", borderBottom:"1px solid #e2e8f0", minHeight:110 }}>
            {week.map((day, di) => {
              const dayKey = DOW_KEY[day.getDay()]
              const isWork = workDays.includes(dayKey)
              const isCurM = day.getMonth() === month
              const todayF = isToday(day)
              const isSel  = isSameDay(day, currentDate)
              const absent = absentHighlights?.some(h => h.day === dayKey)
              const events: any[] = []
              if (isWork && isCurM) {
                classPeriods.slice(0, 4).forEach(p => {
                  getEvents(dayKey, p.id).slice(0, 2).forEach(ev => events.push({ pid:p.id, ...ev }))
                })
              }
              return (
                <div key={di}
                  onClick={() => { setCurrentDate(day); setSelectedDay(dayKey); setCalMode("timeline") }}
                  style={{
                    borderRight:"1px solid #f1f5f9", padding:"4px 5px",
                    background: !isCurM?"#f8fafc":todayF?"#F5F2FF":absent?"#fffbeb":"#fff",
                    cursor:"pointer", opacity: isCurM?1:0.4,
                    outline: isSel?"2px solid #7C6FE0":"none", outlineOffset:-2,
                    transition:"background 0.12s",
                  }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:3 }}>
                    <span style={{
                      width:22, height:22, borderRadius:"50%",
                      display:"inline-flex", alignItems:"center", justifyContent:"center",
                      fontSize:11, fontWeight:700,
                      background:todayF?"#7C6FE0":"transparent",
                      color:todayF?"#fff":!isCurM?"#c0c0c0":"#7C6FE0",
                    }}>{day.getDate()}</span>
                    {absent && <span style={{ fontSize:8, color:"#D4920E", fontWeight:600 }}>⚠ absent</span>}
                    {!isWork && isCurM && <span style={{ fontSize:8, color:"#c0c0c0" }}>off</span>}
                  </div>
                  <div style={{ display:"flex", flexDirection:"column" as const, gap:1 }}>
                    {events.slice(0,3).map((ev,ei) => (
                      <EventChip key={ei} {...ev} showTeacher={false} showRoom={false} compact
                        absent={!!(absent && absentHighlights?.some(h => h.day===dayKey && h.teacher===ev.teacher))} />
                    ))}
                    {events.length > 3 && (
                      <div style={{ fontSize:8, color:"#8B87AD", paddingLeft:4 }}>+{events.length-3} more</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    )
  }

  // ══════════════════════════════════════════════════════
  // RENDER — Timeline view  (the main new view)
  // ══════════════════════════════════════════════════════
  const renderTimeline = (dayKey: string) => {
    const pxPerMin  = PX_PER_MIN[zoom]
    const tickInt   = TICK_INT[zoom]
    const minorInt  = MINOR_INT[zoom]
    const isWorkDay = workDays.includes(dayKey)
    const absentHL  = absentHighlights?.filter(h => h.day === dayKey) ?? []

    if (!isWorkDay) {
      return (
        <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column" as const, gap:12, color:"#8B87AD" }}>
          <div style={{ fontSize:36 }}>🏖️</div>
          <div style={{ fontSize:15, fontWeight:700 }}>{DAY_FULL[dayKey] ?? dayKey} is not a school day</div>
          <div style={{ fontSize:12 }}>Select a workday from the buttons above.</div>
        </div>
      )
    }

    // ── 1. Build entity list ─────────────────────────────────────────────
    type EntityRow = {
      id: string
      label: string
      sublabel: string
      blocks: TimeBlock[]
      totalEnd: number
    }

    const buildClassBlocks = (secName: string): TimeBlock[] => {
      const ps = buildSectionPeriodsLocal(secName, periods, classwiseBreaks)
      const tm = calcPeriodTimes(ps, dayStartMin)
      return ps.map(p => {
        const t = tm.get(p.id)!
        const cell = classTT[secName]?.[dayKey]?.[p.id]
        const subKey = `${secName}|${dayKey}|${p.id}`
        const isSub  = !!substitutions[subKey]
        const absent = !!(absentHL.length && cell?.teacher && absentHL.some(h => h.teacher === cell.teacher))
        return {
          key: `${secName}|${p.id}`,
          periodId: p.id, periodName: p.name, periodType: p.type,
          startMin: t.start, endMin: t.end,
          sectionName: secName,
          subject:       p.type !== "class" ? "" : (cell?.subject ?? ""),
          teacher:       p.type !== "class" ? "" : (isSub ? substitutions[subKey] : (cell?.teacher ?? "")),
          room:          p.type !== "class" ? "" : (cell?.room ?? ""),
          isSub, isClassTeacher: !!(cell?.isClassTeacher), absent,
        }
      })
    }

    // For teacher/room views: gather blocks from sections, positioned by section's own timing
    const buildTeacherBlocks = (teacherName: string): TimeBlock[] => {
      const blocks: TimeBlock[] = []
      sections.forEach(sec => {
        const ps = buildSectionPeriodsLocal(sec.name, periods, classwiseBreaks)
        const tm = calcPeriodTimes(ps, dayStartMin)
        ps.forEach(p => {
          if (p.type !== "class") return
          const cell = classTT[sec.name]?.[dayKey]?.[p.id]
          if (cell?.teacher !== teacherName) return
          const t = tm.get(p.id)!
          const subKey = `${sec.name}|${dayKey}|${p.id}`
          const isSub  = !!substitutions[subKey]
          const absent = !!(absentHL.some(h => h.teacher === teacherName))
          blocks.push({
            key: `${sec.name}|${p.id}`,
            periodId: p.id, periodName: p.name, periodType: p.type,
            startMin: t.start, endMin: t.end,
            sectionName: sec.name,
            subject: cell.subject ?? "",
            teacher: isSub ? substitutions[subKey] : (cell.teacher ?? ""),
            room: cell.room ?? "",
            isSub, isClassTeacher: !!(cell.isClassTeacher), absent,
          })
        })
      })
      return blocks
    }

    const buildRoomBlocks = (roomName: string): TimeBlock[] => {
      const blocks: TimeBlock[] = []
      sections.forEach(sec => {
        const ps = buildSectionPeriodsLocal(sec.name, periods, classwiseBreaks)
        const tm = calcPeriodTimes(ps, dayStartMin)
        ps.forEach(p => {
          if (p.type !== "class") return
          const cell = classTT[sec.name]?.[dayKey]?.[p.id]
          if (!cell?.subject || cell.room !== roomName) return
          const t = tm.get(p.id)!
          const subKey = `${sec.name}|${dayKey}|${p.id}`
          const isSub  = !!substitutions[subKey]
          blocks.push({
            key: `${sec.name}|${p.id}`,
            periodId: p.id, periodName: p.name, periodType: p.type,
            startMin: t.start, endMin: t.end,
            sectionName: sec.name,
            subject: cell.subject ?? "",
            teacher: isSub ? substitutions[subKey] : (cell.teacher ?? ""),
            room: roomName,
            isSub, isClassTeacher: !!(cell.isClassTeacher), absent: false,
          })
        })
      })
      return blocks
    }

    const entityRows: EntityRow[] = []

    if (viewMode === "class") {
      const vc = selectedEntity !== "ALL"
        ? sections.filter(s => s.name === selectedEntity)
        : sections
      vc.forEach(sec => {
        const blocks = buildClassBlocks(sec.name)
        const totalEnd = blocks.length ? Math.max(...blocks.map(b => b.endMin)) : dayStartMin
        entityRows.push({ id: sec.name, label: sec.name, sublabel: "Class", blocks, totalEnd })
      })
    } else if (viewMode === "teacher") {
      const vt = selectedEntity !== "ALL"
        ? staff.filter(s => s.name === selectedEntity)
        : staff
      vt.forEach(t => {
        const blocks   = buildTeacherBlocks(t.name)
        const totalEnd = blocks.length ? Math.max(...blocks.map(b => b.endMin)) : dayStartMin
        // Also add global breaks so teacher row shows when breaks occur
        const globalTm = calcPeriodTimes(periods, dayStartMin)
        periods.forEach(p => {
          if (p.type === "class") return
          const t2 = globalTm.get(p.id)!
          blocks.push({
            key: `__brk|${p.id}`, periodId: p.id, periodName: p.name, periodType: p.type,
            startMin: t2.start, endMin: t2.end, sectionName: "",
            subject: "", teacher: "", room: "", isSub: false, isClassTeacher: false, absent: false,
          })
        })
        blocks.sort((a, b) => a.startMin - b.startMin)
        entityRows.push({ id: t.name, label: t.name, sublabel: "Teacher", blocks, totalEnd })
      })
    } else if (viewMode === "room") {
      const vr = selectedEntity !== "ALL"
        ? allRooms.filter(r => r === selectedEntity)
        : allRooms
      vr.forEach(room => {
        const blocks   = buildRoomBlocks(room)
        const totalEnd = blocks.length ? Math.max(...blocks.map(b => b.endMin)) : dayStartMin
        const globalTm = calcPeriodTimes(periods, dayStartMin)
        periods.forEach(p => {
          if (p.type === "class") return
          const t2 = globalTm.get(p.id)!
          blocks.push({
            key: `__brk|${p.id}`, periodId: p.id, periodName: p.name, periodType: p.type,
            startMin: t2.start, endMin: t2.end, sectionName: "",
            subject: "", teacher: "", room: "", isSub: false, isClassTeacher: false, absent: false,
          })
        })
        blocks.sort((a, b) => a.startMin - b.startMin)
        entityRows.push({ id: room, label: room, sublabel: "Room", blocks, totalEnd })
      })
    } else {
      // subject view — rows are sections that have this subject
      const vc = selectedEntity !== "ALL"
        ? sections.filter(sec => Object.values(classTT[sec.name] ?? {}).some(dd =>
            Object.values(dd).some((c: any) => c?.subject === selectedEntity)
          ))
        : sections
      vc.forEach(sec => {
        const blocks = buildClassBlocks(sec.name).map(b => ({
          ...b,
          // Dim blocks that aren't for this subject (keep them for context, just fade)
          subject: b.periodType !== "class" ? b.subject :
                   b.subject === selectedEntity ? b.subject : "",
        }))
        const totalEnd = blocks.length ? Math.max(...blocks.map(b => b.endMin)) : dayStartMin
        entityRows.push({ id: sec.name, label: sec.name, sublabel: "Class", blocks, totalEnd })
      })
    }

    if (!entityRows.length) {
      return (
        <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", color:"#8B87AD", fontSize:14 }}>
          No entities to display.
        </div>
      )
    }

    // ── 2. Global time range ────────────────────────────────────────────
    const globalStart = dayStartMin
    const globalEnd   = Math.max(
      dayStartMin + 60,
      ...entityRows.map(r => r.totalEnd),
      ...entityRows.flatMap(r => r.blocks.map(b => b.endMin))
    )
    const totalWidth = (globalEnd - globalStart) * pxPerMin

    // ── 3. Time ruler ticks ─────────────────────────────────────────────
    const ticks: number[]      = []
    const minorTicks: number[] = []
    for (let t = globalStart; t <= globalEnd; t += tickInt)   ticks.push(t)
    for (let t = globalStart; t <= globalEnd; t += minorInt) {
      if (t % tickInt !== 0) minorTicks.push(t)
    }

    // ── 4. Render ───────────────────────────────────────────────────────
    const labelBg = "linear-gradient(90deg,#EDE9FF 0%,#F5F2FF 100%)"

    return (
      <div style={{ flex:1, overflow:"auto", position:"relative" as const }}>
        {/* Minimum layout width = label + timeline */}
        <div style={{ minWidth: LABEL_W + totalWidth + 16 }}>

          {/* ── Time ruler (sticky top) ─────────────────────────────── */}
          <div style={{
            display:"flex", position:"sticky" as const, top:0, zIndex:15,
            height:RULER_H, background:"#fff",
            borderBottom:"2px solid #7C6FE0",
            boxShadow:"0 2px 8px rgba(124,111,224,0.10)",
          }}>
            {/* Corner cell */}
            <div style={{
              width:LABEL_W, flexShrink:0,
              position:"sticky" as const, left:0, zIndex:20,
              background:labelBg, borderRight:"2px solid #D8D2FF",
              display:"flex", flexDirection:"column" as const,
              alignItems:"center", justifyContent:"center", padding:"0 6px",
            }}>
              <div style={{ fontSize:11, fontWeight:800, color:"#7C6FE0" }}>
                {DAY_SHORT[dayKey] ?? dayKey.slice(0,3)}
              </div>
              <div style={{ fontSize:8, color:"#8B87AD", fontWeight:600 }}>timeline</div>
            </div>

            {/* Tick marks */}
            <div style={{ position:"relative" as const, width:totalWidth, flexShrink:0 }}>
              {/* Minor grid lines */}
              {minorTicks.map(t => (
                <div key={t} style={{
                  position:"absolute" as const,
                  left: (t - globalStart) * pxPerMin,
                  top:"60%", bottom:0,
                  borderLeft:"1px solid #F0EDFF",
                  pointerEvents:"none" as const,
                }} />
              ))}
              {/* Major ticks with labels */}
              {ticks.map(t => (
                <div key={t} style={{
                  position:"absolute" as const,
                  left: (t - globalStart) * pxPerMin,
                  top:0, bottom:0,
                  display:"flex", alignItems:"flex-end", paddingBottom:7, paddingLeft:4,
                  borderLeft:"1px solid #D8D2FF",
                }}>
                  <span style={{
                    fontSize:10, fontWeight:700, color:"#7C6FE0",
                    fontFamily:"'DM Mono',monospace", whiteSpace:"nowrap" as const,
                    userSelect:"none" as const,
                  }}>
                    {fmtTimeShort(t, timeFormat)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Entity rows ─────────────────────────────────────────── */}
          {entityRows.map((row, ri) => {
            const isAbsent = absentHL.some(h => h.teacher === row.id)
            return (
              <div key={row.id} style={{
                display:"flex", height:ROW_H,
                borderBottom:"1px solid #E8E4FF",
                background: isAbsent ? "#FFFBEB" :
                            ri % 2 === 0 ? "#FAFAFE" : "#FFFFFF",
              }}>
                {/* ── Sticky entity label ─────────────────────── */}
                <div style={{
                  width:LABEL_W, flexShrink:0,
                  position:"sticky" as const, left:0, zIndex:10,
                  background:labelBg,
                  borderRight:"2px solid #D8D2FF",
                  display:"flex", flexDirection:"column" as const,
                  alignItems:"center", justifyContent:"center",
                  padding:"0 8px",
                  boxShadow:"2px 0 4px rgba(124,111,224,0.06)",
                }}>
                  <div style={{
                    fontSize:12, fontWeight:900, color:"#13111E",
                    textAlign:"center" as const, letterSpacing:"0.03em",
                    overflow:"hidden", textOverflow:"ellipsis" as const,
                    whiteSpace:"nowrap" as const, maxWidth:"100%",
                  }}>
                    {row.label}
                  </div>
                  <div style={{
                    fontSize:8, fontWeight:600, color:"#7C6FE0",
                    textTransform:"uppercase" as const, letterSpacing:"0.08em", marginTop:2,
                  }}>
                    {row.sublabel}
                  </div>
                  {isAbsent && (
                    <div style={{ fontSize:8, color:"#D4920E", fontWeight:700, marginTop:2 }}>⚠ absent</div>
                  )}
                </div>

                {/* ── Timeline track ──────────────────────────── */}
                <div style={{
                  position:"relative" as const, width:totalWidth, flexShrink:0, overflow:"hidden",
                }}>
                  {/* Minor grid lines */}
                  {minorTicks.map(t => (
                    <div key={t} style={{
                      position:"absolute" as const,
                      left: (t - globalStart) * pxPerMin,
                      top:0, bottom:0,
                      borderLeft:"1px solid #F8F7FF",
                      pointerEvents:"none" as const,
                    }} />
                  ))}
                  {/* Major grid lines */}
                  {ticks.map(t => (
                    <div key={t} style={{
                      position:"absolute" as const,
                      left: (t - globalStart) * pxPerMin,
                      top:0, bottom:0,
                      borderLeft:"1px solid #F0EDFF",
                      pointerEvents:"none" as const,
                    }} />
                  ))}

                  {/* ── Period blocks ─────────────────────────── */}
                  {row.blocks.map(block => (
                    <TimelineBlock
                      key={block.key}
                      block={block}
                      pxPerMin={pxPerMin}
                      globalStart={globalStart}
                      timeFormat={timeFormat}
                      showTeacher={showTeacher}
                      showRoom={showRoom}
                      viewMode={viewMode}
                      onClick={block.subject && block.sectionName
                        ? () => onCellClick?.(block.sectionName, dayKey, block.periodId)
                        : undefined}
                    />
                  ))}
                </div>
              </div>
            )
          })}

          {/* Bottom padding */}
          <div style={{ height:16 }} />
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════
  // TOOLBAR + SHELL
  // ══════════════════════════════════════════════════════
  return (
    <div style={{
      display:"flex", flexDirection:"column" as const, flex:1, overflow:"hidden",
      background:"#fff", borderRadius:12, boxShadow:"0 1px 3px rgba(0,0,0,0.08)",
    }}>
      {/* ── Toolbar ─────────────────────────────────────────────────── */}
      <div style={{
        display:"flex", alignItems:"center", gap:8, padding:"10px 14px",
        borderBottom:"1px solid #E8E4FF", flexShrink:0, flexWrap:"wrap" as const,
        background:"#FAFAFE",
      }}>

        {/* Mode: Month | Timeline */}
        <div style={{ display:"flex", border:"1px solid #E8E4FF", borderRadius:7, overflow:"hidden" }}>
          {(["month","timeline"] as CalMode[]).map(m => (
            <button key={m} onClick={() => setCalMode(m)}
              style={{
                padding:"5px 14px", border:"none",
                background: calMode===m ? "#7C6FE0" : "#fff",
                color:      calMode===m ? "#fff" : "#64748b",
                fontSize:11, fontWeight:500, cursor:"pointer",
                textTransform:"capitalize" as const,
              }}>
              {m === "month" ? "📅 Month" : "⏱ Timeline"}
            </button>
          ))}
        </div>

        {/* Month navigation — only for month view */}
        {calMode === "month" && (
          <>
            <div style={{ display:"flex", alignItems:"center", gap:4 }}>
              <button onClick={() => navigate(-1)}
                style={{ width:28, height:28, border:"1px solid #E8E4FF", borderRadius:6, background:"#fff", cursor:"pointer", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center", color:"#9B8EF5" }}>
                ‹
              </button>
              <button onClick={goToday}
                style={{ padding:"4px 12px", border:"1px solid #E8E4FF", borderRadius:6, background:"#fff", cursor:"pointer", fontSize:11, color:"#9B8EF5", fontWeight:500 }}>
                Today
              </button>
              <button onClick={() => navigate(1)}
                style={{ width:28, height:28, border:"1px solid #E8E4FF", borderRadius:6, background:"#fff", cursor:"pointer", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center", color:"#9B8EF5" }}>
                ›
              </button>
            </div>
            <div style={{ fontSize:14, fontWeight:700, color:"#7C6FE0", minWidth:160 }}>{headerLabel}</div>
          </>
        )}

        {/* Day selector — only for timeline view */}
        {calMode === "timeline" && (
          <div style={{ display:"flex", gap:4, alignItems:"center" }}>
            {workDays.map(day => {
              const isToday2 = DOW_KEY[new Date().getDay()] === day
              const isActive = selectedDay === day
              return (
                <button key={day} onClick={() => setSelectedDay(day)}
                  style={{
                    padding:"4px 11px", border:"none", borderRadius:6, cursor:"pointer",
                    fontSize:11, fontWeight:isActive?700:500,
                    background: isActive ? "#7C6FE0" : isToday2 ? "#EDE9FF" : "#fff",
                    color:      isActive ? "#fff"    : isToday2 ? "#7C6FE0" : "#64748b",
                    outline:    isToday2 && !isActive ? "1.5px solid #C4B5FD" : "none",
                  }}>
                  {DAY_SHORT[day] ?? day.slice(0,3)}
                </button>
              )
            })}
          </div>
        )}

        {/* Header label for timeline */}
        {calMode === "timeline" && (
          <div style={{ fontSize:13, fontWeight:700, color:"#7C6FE0" }}>{headerLabel}</div>
        )}

        <div style={{ flex:1 }} />

        {/* Absent warning badge */}
        {calMode === "timeline" && absentHighlights?.some(h => h.day === selectedDay) && (
          <div style={{
            background:"#FFFBEB", border:"1px solid #F6D860", borderRadius:6,
            padding:"4px 10px", fontSize:11, color:"#92400E", fontWeight:600,
            display:"flex", alignItems:"center", gap:5,
          }}>
            ⚠ {absentHighlights.filter(h=>h.day===selectedDay).map(h=>h.teacher).join(", ")} absent
          </div>
        )}

        {/* Zoom selector — only for timeline view */}
        {calMode === "timeline" && (
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ fontSize:10, color:"#8B87AD", fontWeight:600 }}>Zoom</span>
            <div style={{ display:"flex", border:"1px solid #E8E4FF", borderRadius:7, overflow:"hidden" }}>
              {(["60min","30min","15min"] as ZoomLevel[]).map(z => (
                <button key={z} onClick={() => setZoom(z)}
                  style={{
                    padding:"4px 10px", border:"none", cursor:"pointer",
                    background: zoom===z ? "#7C6FE0" : "#fff",
                    color:      zoom===z ? "#fff"    : "#64748b",
                    fontSize:10, fontWeight:zoom===z?700:400,
                  }}>
                  {z}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Body ─────────────────────────────────────────────────────── */}
      <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" as const }}>
        {calMode === "month"    && renderMonth()}
        {calMode === "timeline" && renderTimeline(selectedDay)}
      </div>
    </div>
  )
}
