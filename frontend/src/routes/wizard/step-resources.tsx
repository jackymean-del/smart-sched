import { useState, useEffect } from "react"
import { useTimetableStore } from "@/store/timetableStore"
import { generateSections, generateStaff, generateSubjects, generateBreaks, GRADE_GROUP_GRADES } from "@/lib/orgData"
import type { Subject } from "@/types"
import { RefreshCw, Plus, Trash2 } from "lucide-react"

// ─── Shared styles ────────────────────────────────────────────
const th: React.CSSProperties = {
  padding:"8px 12px", background:"#f9fafb", fontSize:10, fontWeight:700,
  textTransform:"uppercase", letterSpacing:"0.06em", color:"#9ca3af",
  textAlign:"left", borderBottom:"1.5px solid #e5e7eb", whiteSpace:"nowrap",
  position:"sticky", top:0, zIndex:2,
}
const td: React.CSSProperties = {
  padding:"6px 10px", borderBottom:"1px solid #f3f4f6", verticalAlign:"middle",
}
const inp = (x?: React.CSSProperties): React.CSSProperties => ({
  width:"100%", padding:"5px 7px", border:"1px solid transparent",
  borderRadius:5, fontSize:12, background:"transparent", outline:"none", color:"#111827", ...x,
})
const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
  (e.target as HTMLElement).style.borderColor = "#7C6FE0"
  ;(e.target as HTMLElement).style.background  = "#fff"
}
const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
  (e.target as HTMLElement).style.borderColor  = "transparent"
  ;(e.target as HTMLElement).style.background  = "transparent"
}

const CBSE_PW: Record<string,number> = {
  "Mathematics":6,"English":5,"Hindi":5,"Science":6,"Social Studies":5,
  "Computer":3,"Physical Education":3,"Art & Craft":2,"Music":2,"Dance":2,"EVS":4,"G.K.":1,"CCA":2,"Odia":4,
}
const suggestPW = (name: string) => CBSE_PW[name] ?? 4

function makeId() { return Math.random().toString(36).slice(2,8) }

// ─── Toggle component ─────────────────────────────────────────
function Toggle({ on, onChange, color="#059669" }: { on:boolean; onChange:(v:boolean)=>void; color?:string }) {
  return (
    <button onClick={() => onChange(!on)}
      style={{ width:32, height:18, borderRadius:9, border:"none", cursor:"pointer", position:"relative",
        background: on ? color : "#e5e7eb", transition:"background 0.15s", flexShrink:0 }}>
      <span style={{ position:"absolute", top:2, left: on?16:2, width:14, height:14,
        borderRadius:"50%", background:"#fff", transition:"left 0.15s", boxShadow:"0 1px 2px rgba(0,0,0,0.2)" }} />
    </button>
  )
}

// ─── Tab type ─────────────────────────────────────────────────
type Tab = "classes" | "subjects" | "teachers" | "rooms"

interface RoomRow { id:string; name:string; type:string; capacity:number; building:string; floor:string }

const SUBJECT_CATS = ["Core","Language","Elective","Optional","Lab","CCA","Activity","Other"]
const ROOM_TYPES   = ["Classroom","Lab","Computer Lab","Library","Hall","Gym","Staff Room","Other"]
const ROLES        = ["Teacher","HoD","Coordinator","Principal","Vice Principal","Counsellor","Lab Incharge","Librarian"]

// ─── Main component ───────────────────────────────────────────
export function StepResources() {
  const store = useTimetableStore()
  const { config, sections, staff, subjects, breaks,
          setSections, setStaff, setSubjects, setBreaks, setStep } = store

  const [tab, setTab] = useState<Tab>("classes")
  const [rooms, setRooms] = useState<RoomRow[]>(() =>
    // Initialize from existing sections; useEffect will regenerate if counts mismatch
    (sections.length > 0 ? sections : []).map((s: any, i: number) => ({
      id: makeId(), name: s.room ?? `Room ${101 + i}`,
      type: "Classroom", capacity: 40, building: "Main Block", floor: "Ground"
    }))
  )
  // Class-wise overrides: subjectId → sectionId → periodsPerWeek
  const [classOverrides, setClassOverrides] = useState<Record<string, Record<string, number>>>({})
  // Teacher assignment matrix: sectionId → subjectId → staffId
  const [teacherMatrix, setTeacherMatrix] = useState<Record<string, Record<string, string>>>({})

  // Generate all data fresh using current config counts
  const regen = () => {
    const o = config.orgType ?? "school", c = config.countryCode ?? "IN"
    const gradeGroups = config.gradeGroups?.length ? config.gradeGroups : undefined
    const newSections = generateSections(o, c, config.numSections, gradeGroups)
    setSections(newSections)
    setStaff(generateStaff(o, c, config.numStaff))
    setSubjects(generateSubjects(o, c, config.numSubjects, gradeGroups) as Subject[])
    setBreaks(generateBreaks(o, config.numBreaks))
    // Reset rooms to match new sections
    setRooms(newSections.map((s: any, i: number) => ({
      id: makeId(), name: s.room ?? `Room ${101 + i}`,
      type: "Classroom", capacity: 40, building: "Main Block", floor: "Ground"
    })))
  }

  // Auto-generate on first load if store is empty, counts don't match, OR
  // existing sections belong to wrong grade groups (e.g. Nursery when Primary selected)
  useEffect(() => {
    const countsMismatch =
      sections.length !== config.numSections ||
      staff.length    !== config.numStaff    ||
      subjects.length !== config.numSubjects

    // Build the set of valid grades for the selected groups
    const gradeGroups = config.gradeGroups?.length ? config.gradeGroups : null
    const validGrades = gradeGroups
      ? new Set(gradeGroups.flatMap(g => GRADE_GROUP_GRADES[g] ?? []))
      : null

    // If any stored section has a grade outside the selected groups → stale data
    const gradesMismatch = validGrades !== null && sections.some(
      s => (s as any).grade && !validGrades.has((s as any).grade)
    )

    // If any staff name doesn't match "Teacher N" pattern → stale data (e.g. old realistic names)
    const staffNamesStale = staff.length > 0 && staff.some(s => !/^.+\s\d+$/.test(s.name))

    if (sections.length === 0 || countsMismatch || gradesMismatch || staffNamesStale) {
      regen()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persist class-wise overrides + teacher assignments then advance
  const handleContinue = () => {
    // 1. Persist period-count overrides into subjects
    setSubjects(subjects.map(s => {
      const ov = classOverrides[s.id]
      if (!ov || Object.keys(ov).length === 0) return s
      const classConfigs = Object.entries(ov).map(([sectionId, pw]) => ({
        classId: sectionId,
        sectionName: sections.find((sec: any) => sec.id === sectionId)?.name ?? sectionId,
        periodsPerWeek: pw,
        sessionDuration: s.sessionDuration ?? 45,
        maxPeriodsPerDay: s.maxPeriodsPerDay ?? 2,
      }))
      return { ...s, classConfigs }
    }))

    // 2. Persist teacher-class-subject assignments from matrix into staff.subjects
    const hasMatrixData = Object.keys(teacherMatrix).length > 0 &&
      Object.values(teacherMatrix).some(m => Object.values(m).some(v => v))

    if (hasMatrixData) {
      setStaff(staff.map(s => {
        const assignments: string[] = []
        Object.entries(teacherMatrix).forEach(([sectionId, subMap]) => {
          const sec = sections.find((x: any) => x.id === sectionId)
          if (!sec) return
          Object.entries(subMap).forEach(([subjectId, staffId]) => {
            if (staffId === s.id) {
              const sub = subjects.find((x: any) => x.id === subjectId)
              if (sub) assignments.push(`${sec.name}::${sub.name}`)
            }
          })
        })
        return assignments.length > 0 ? { ...s, subjects: assignments } : s
      }))
    }

    setStep(4)
  }

  const TABS: { key:Tab; label:string; count:number }[] = [
    { key:"classes",  label:"Classes",  count:sections.length },
    { key:"subjects", label:"Subjects", count:subjects.length },
    { key:"teachers", label:"Teachers", count:staff.length },
    { key:"rooms",    label:"Rooms",    count:rooms.length },
  ]

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:0, height:"100%" }}>

      {/* Tab bar + actions */}
      <div style={{
        display:"flex", alignItems:"center", background:"#fff",
        borderBottom:"1.5px solid #e5e7eb", padding:"0 0 0 0", gap:0,
      }}>
        <div style={{ display:"flex", flex:1 }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{
                padding:"10px 20px", border:"none", borderBottom: tab===t.key?"2px solid #7C6FE0":"2px solid transparent",
                marginBottom:-1.5, background:"transparent", fontSize:13,
                fontWeight: tab===t.key?600:400, color: tab===t.key?"#7C6FE0":"#6b7280",
                cursor:"pointer", display:"flex", alignItems:"center", gap:6, whiteSpace:"nowrap",
              }}>
              {t.label}
              <span style={{ fontSize:10, padding:"1px 7px", borderRadius:10, background: tab===t.key?"#eff6ff":"#f3f4f6", color: tab===t.key?"#7C6FE0":"#9ca3af", fontWeight:500 }}>
                {t.count}
              </span>
            </button>
          ))}
        </div>
        <div style={{ padding:"0 16px" }}>
          <button onClick={regen}
            style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 12px", borderRadius:6, border:"1px solid #e5e7eb", background:"#fff", fontSize:12, color:"#6b7280", cursor:"pointer" }}>
            <RefreshCw size={13} /> Regenerate all
          </button>
        </div>
      </div>

      {/* Table area */}
      <div style={{ flex:1, overflow:"auto", background:"#fff" }}>

        {/* ══ CLASSES ══════════════════════════════════════════ */}
        {tab === "classes" && (
          <ClassesTable sections={sections} setSections={setSections} staff={staff} />
        )}

        {/* ══ SUBJECTS ═════════════════════════════════════════ */}
        {tab === "subjects" && (
          <SubjectsTable
            subjects={subjects} setSubjects={setSubjects}
            sections={sections}
            classOverrides={classOverrides} setClassOverrides={setClassOverrides}
            periodsPerDay={config.periodsPerDay ?? 8}
            workDaysCount={config.workDays?.length ?? 6}
          />
        )}

        {/* ══ TEACHERS ═════════════════════════════════════════ */}
        {tab === "teachers" && (
          <TeachersTable
            staff={staff} setStaff={setStaff}
            subjects={subjects} sections={sections}
            teacherMatrix={teacherMatrix} setTeacherMatrix={setTeacherMatrix}
          />
        )}

        {/* ══ ROOMS ════════════════════════════════════════════ */}
        {tab === "rooms" && (
          <RoomsTable rooms={rooms} setRooms={setRooms} />
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding:"12px 16px", borderTop:"1px solid #e5e7eb", background:"#fff",
        display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0,
      }}>
        <button onClick={() => setStep(2)}
          style={{ padding:"8px 16px", borderRadius:7, border:"1px solid #e5e7eb", background:"#fff", fontSize:13, fontWeight:500, cursor:"pointer", color:"#374151" }}>
          ← Back
        </button>
        <div style={{ fontSize:11, color:"#9ca3af" }}>
          {sections.length} classes · {staff.length} teachers · {subjects.length} subjects
        </div>
        <button onClick={handleContinue}
          style={{ padding:"9px 22px", borderRadius:7, border:"none", fontSize:13, fontWeight:600, cursor:"pointer", background:"#7C6FE0", color:"#fff" }}>
          Continue → Generate ✨
        </button>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// CLASSES TABLE
// ════════════════════════════════════════════════════════════════
function ClassesTable({ sections, setSections, staff }: { sections:any[]; setSections:(s:any[])=>void; staff:any[] }) {
  const upd = (id:string, k:string, v:any) => setSections(sections.map(s => s.id===id ? {...s,[k]:v} : s))
  const add = () => setSections([...sections, { id:makeId(), name:`Class ${sections.length+1}`, room:`Room ${101+sections.length}`, grade:"", strength:40, stream:"", classTeacher:"" }])
  const del = (id:string) => setSections(sections.filter(s => s.id!==id))

  return (
    <table style={{ width:"100%", borderCollapse:"collapse" }}>
      <thead><tr>
        <th style={{...th,width:36,textAlign:"center"}}>#</th>
        <th style={th}>Class / Section</th>
        <th style={{...th,width:90}}>Grade</th>
        <th style={{...th,width:130}}>Stream</th>
        <th style={{...th,width:80}}>Strength</th>
        <th style={{...th,width:120}}>Room</th>
        <th style={th}>Class Teacher</th>
        <th style={{...th,width:36}}></th>
      </tr></thead>
      <tbody>
        {sections.map((s,i) => (
          <tr key={s.id}
            style={{ background:i%2===0?"#fff":"#fafafa" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background="#f0fdf4"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background=i%2===0?"#fff":"#fafafa"}>
            <td style={{...td,textAlign:"center",color:"#d1d5db",fontSize:10,fontFamily:"monospace"}}>{i+1}</td>
            <td style={td}><input style={inp({fontWeight:600})} value={s.name} onChange={e=>upd(s.id,"name",e.target.value)} onFocus={onFocus} onBlur={onBlur} /></td>
            <td style={td}><input style={inp()} value={s.grade??""} onChange={e=>upd(s.id,"grade",e.target.value)} placeholder="VI" onFocus={onFocus} onBlur={onBlur} /></td>
            <td style={td}><input style={inp()} value={s.stream??""} onChange={e=>upd(s.id,"stream",e.target.value)} placeholder="Science / Arts" onFocus={onFocus} onBlur={onBlur} /></td>
            <td style={td}><input type="number" min={1} max={100} style={inp({textAlign:"center",fontFamily:"monospace"})} value={s.strength??40} onChange={e=>upd(s.id,"strength",+e.target.value)} onFocus={onFocus} onBlur={onBlur} /></td>
            <td style={td}><input style={inp({fontSize:11,fontFamily:"monospace"})} value={s.room??""} onChange={e=>upd(s.id,"room",e.target.value)} onFocus={onFocus} onBlur={onBlur} /></td>
            <td style={td}>
              <select style={inp({fontSize:11})} value={s.classTeacher??""} onChange={e=>upd(s.id,"classTeacher",e.target.value)} onFocus={onFocus} onBlur={onBlur}>
                <option value="">— None —</option>
                {staff.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </td>
            <td style={td}><button onClick={()=>del(s.id)} style={{ background:"none",border:"none",cursor:"pointer",color:"#d1d5db",padding:0,display:"flex",alignItems:"center" }}><Trash2 size={14}/></button></td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <td colSpan={8} style={{ padding:0 }}>
            <button onClick={add} style={{ width:"100%",padding:"9px 16px",border:"none",borderTop:"1.5px dashed #e5e7eb",background:"transparent",cursor:"pointer",fontSize:12,color:"#9ca3af",textAlign:"left",display:"flex",alignItems:"center",gap:6 }}>
              <Plus size={14}/> Add class / section
            </button>
          </td>
        </tr>
      </tfoot>
    </table>
  )
}

// ════════════════════════════════════════════════════════════════
// SUBJECTS TABLE — Excel-style allocation matrix
// Rows = subjects · Fixed left cols = properties · Scrollable cols = class sections
// ════════════════════════════════════════════════════════════════
function SubjectsTable({
  subjects, setSubjects, sections,
  classOverrides, setClassOverrides,
  periodsPerDay, workDaysCount,
}: {
  subjects: any[]; setSubjects:(s:any[])=>void;
  sections: any[];
  classOverrides: Record<string,Record<string,number>>;
  setClassOverrides: (o:Record<string,Record<string,number>>)=>void;
  periodsPerDay: number; workDaysCount: number;
}) {
  const [activeCell, setActiveCell] = useState<{r:number;c:number}|null>(null)
  const [transposed, setTransposed] = useState(false)

  const updSub = (id:string, k:string, v:any) =>
    setSubjects(subjects.map(s => s.id===id ? {...s,[k]:v} : s))

  const getVal = (subId:string, secId:string, globalPW:number) =>
    classOverrides[subId]?.[secId] ?? globalPW

  const isOverridden = (subId:string, secId:string, globalPW:number) =>
    classOverrides[subId]?.[secId] !== undefined &&
    classOverrides[subId][secId] !== globalPW

  const setVal = (subId:string, secId:string, val:number) =>
    setClassOverrides({ ...classOverrides, [subId]: { ...(classOverrides[subId]??{}), [secId]: val } })

  const clearVal = (subId:string, secId:string) => {
    const next = { ...classOverrides }
    if (next[subId]) { next[subId] = {...next[subId]}; delete next[subId][secId] }
    setClassOverrides(next)
  }

  const handleKey = (e:React.KeyboardEvent, r:number, c:number) => {
    const maxR = subjects.length - 1, maxC = sections.length - 1
    if (e.key==='Tab')        { e.preventDefault(); setActiveCell({r, c: c<maxC ? c+1 : c}) }
    else if (e.key==='Enter') { e.preventDefault(); setActiveCell({r: r<maxR ? r+1 : r, c}) }
    else if (e.key==='Escape') setActiveCell(null)
    else if (e.key==='ArrowRight') { e.preventDefault(); setActiveCell({r, c:Math.min(c+1,maxC)}) }
    else if (e.key==='ArrowLeft')  { e.preventDefault(); setActiveCell({r, c:Math.max(c-1,0)}) }
    else if (e.key==='ArrowDown')  { e.preventDefault(); setActiveCell({r:Math.min(r+1,maxR),c}) }
    else if (e.key==='ArrowUp')    { e.preventDefault(); setActiveCell({r:Math.max(r-1,0),c}) }
  }

  const slotsPerWeek = periodsPerDay * workDaysCount
  const totalGlobal  = subjects.reduce((s,x) => s + (x.periodsPerWeek ?? suggestPW(x.name)), 0)

  // Fixed column definitions
  const FCOLS = [
    { label:'#',        w:36,  align:'center' as const },
    { label:'SUBJECT',  w:172, align:'left'   as const },
    { label:'SHORT',    w:58,  align:'center' as const },
    { label:'CATEGORY', w:100, align:'left'   as const },
    { label:'PER/WK',   w:66,  align:'center' as const, title:'Global periods/week — default for all classes' },
    { label:'SESS.MIN', w:64,  align:'center' as const },
    { label:'MAX/DAY',  w:64,  align:'center' as const },
    { label:'OPT',      w:44,  align:'center' as const },
    { label:'LAB',      w:44,  align:'center' as const },
    { label:'',         w:32,  align:'center' as const },
  ]
  const leftOf = FCOLS.reduce((acc,col,i) => { acc.push(i===0?0:acc[i-1]+FCOLS[i-1].w); return acc }, [] as number[])
  const totalFixed = FCOLS.reduce((s,c) => s+c.w, 0)
  const CELL_W = 62

  const stickyTh = (i:number): React.CSSProperties => ({
    ...th, position:'sticky' as const, left:leftOf[i], zIndex:3,
    background:'#f9fafb', width:FCOLS[i].w, minWidth:FCOLS[i].w, maxWidth:FCOLS[i].w,
    textAlign: FCOLS[i].align,
    boxShadow: i===FCOLS.length-1 ? '3px 0 6px -2px rgba(0,0,0,0.08)' : 'none',
  })

  const stickyTd = (i:number, bg:string): React.CSSProperties => ({
    ...td, position:'sticky' as const, left:leftOf[i], zIndex:1,
    background:bg, width:FCOLS[i].w, minWidth:FCOLS[i].w, maxWidth:FCOLS[i].w,
    boxShadow: i===FCOLS.length-1 ? '3px 0 6px -2px rgba(0,0,0,0.08)' : 'none',
  })

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>

      {/* ── Info bar ── */}
      <div style={{ padding:'8px 16px', background:'#eff6ff', borderBottom:'1px solid #dbeafe', fontSize:11, color:'#3730a3', display:'flex', gap:20, alignItems:'center', flexShrink:0 }}>
        <span>🗓 {workDaysCount} days/week · {periodsPerDay} periods/day · <strong>{slotsPerWeek} total slots/class/week</strong></span>
        <span style={{ color: totalGlobal > slotsPerWeek ? '#dc2626' : '#059669' }}>
          Σ global: <strong>{totalGlobal}/{slotsPerWeek}</strong> {totalGlobal > slotsPerWeek ? '⚠ over' : '✓'}
        </span>
        <span style={{ color:'#6b7280', fontSize:10 }}>💡 Click cell to override · ⌨ Arrow / Tab / Enter · Double-click to reset</span>
        <div style={{ marginLeft:'auto', display:'flex', gap:8, alignItems:'center' }}>
          <button onClick={() => { setTransposed(t => !t); setActiveCell(null) }}
            title="Transpose: swap rows and columns"
            style={{ padding:'4px 10px', borderRadius:5, border:'1px solid #d1d5db', background: transposed?'#f0fdf4':'#fff', color: transposed?'#059669':'#374151', fontSize:11, fontWeight:600, cursor:'pointer' }}>
            ⇄ {transposed ? 'Classes as rows' : 'Subjects as rows'}
          </button>
          <button onClick={() => setSubjects(subjects.map(s => ({...s, periodsPerWeek: suggestPW(s.name)})))}
            style={{ padding:'4px 10px', borderRadius:5, border:'1px solid #D8D2FF', background:'#EDE9FF', color:'#3730a3', fontSize:11, fontWeight:600, cursor:'pointer' }}>
            🏫 Auto-fill CBSE norms
          </button>
        </div>
      </div>

      {/* ── Excel grid ── */}
      <div style={{ overflowX:'auto', overflowY:'auto', flex:1 }}>
      {transposed ? (
        /* ══ TRANSPOSED: rows = sections, columns = subjects ══ */
        <table style={{ borderCollapse:'collapse', minWidth: 220 + subjects.length * CELL_W, tableLayout:'fixed' }}>
          <colgroup>
            <col style={{ width:36 }} />
            <col style={{ width:180 }} />
            {subjects.map(s => <col key={s.id} style={{ width:CELL_W }} />)}
          </colgroup>
          <thead>
            <tr>
              <th style={{ ...th, position:'sticky' as const, left:0,  zIndex:3, background:'#f9fafb', width:36,  textAlign:'center' }}>#</th>
              <th style={{ ...th, position:'sticky' as const, left:36, zIndex:3, background:'#f9fafb', width:180, boxShadow:'3px 0 6px -2px rgba(0,0,0,0.08)' }}>CLASS / SECTION</th>
              {subjects.map(sub => (
                <th key={sub.id} style={{ ...th, textAlign:'center', background:'#fdf4ff', color:'#9B8EF5', borderLeft:'1px solid #ede9fe', fontSize:10, padding:'6px 4px', maxWidth:CELL_W }}>
                  <div style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{sub.shortName || sub.name}</div>
                  <div style={{ fontSize:8, fontWeight:400, color:'#9B8EF5', marginTop:1 }}>{sub.periodsPerWeek ?? suggestPW(sub.name)}/wk</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sections.map((sec, r) => {
              const rowBg = r % 2 === 0 ? '#fff' : '#fafafa'
              return (
                <tr key={sec.id}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background='#f8faff'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background=rowBg}>
                  <td style={{ ...td, position:'sticky' as const, left:0,  zIndex:1, background:rowBg, textAlign:'center', color:'#d1d5db', fontSize:10, fontFamily:'monospace' }}>{r+1}</td>
                  <td style={{ ...td, position:'sticky' as const, left:36, zIndex:1, background:rowBg, fontWeight:600, boxShadow:'3px 0 6px -2px rgba(0,0,0,0.08)' }}>{sec.name}</td>
                  {subjects.map((sub, c) => {
                    const gPW = sub.periodsPerWeek ?? suggestPW(sub.name)
                    const val = getVal(sub.id, sec.id, gPW)
                    const overridden = isOverridden(sub.id, sec.id, gPW)
                    const isActive = activeCell?.r === r && activeCell?.c === c
                    return (
                      <td key={sub.id}
                        onClick={() => setActiveCell({r, c})}
                        onDoubleClick={() => clearVal(sub.id, sec.id)}
                        title={overridden ? `Override: ${val} (global: ${gPW}) — double-click to reset` : `${val}/week (inherited) — click to override`}
                        style={{ ...td, textAlign:'center', cursor:'pointer', background: isActive?'#EDE9FF': overridden?'#eff6ff':rowBg, borderLeft:'1px solid #f0f0f0', outline: isActive?'2px solid #7C6FE0':'none', outlineOffset:-2, padding:'3px 4px' }}>
                        {isActive ? (
                          <input type="number" min={0} max={14} autoFocus value={val}
                            onChange={e => setVal(sub.id, sec.id, Math.max(0, +e.target.value))}
                            onKeyDown={e => handleKey(e, r, c)}
                            onBlur={() => setActiveCell(null)}
                            style={{ width:'100%', border:'none', outline:'none', textAlign:'center', fontSize:13, fontWeight:700, fontFamily:'monospace', background:'transparent', color:'#7C6FE0' }} />
                        ) : (
                          <span style={{ fontSize:12, fontWeight:overridden?700:400, fontFamily:'monospace', color:overridden?'#1d4ed8':'#9ca3af' }}>{val}</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr style={{ background:'#f9fafb' }}>
              <td colSpan={2} style={{ ...td, position:'sticky' as const, left:0, zIndex:1, background:'#f9fafb', fontSize:10, fontWeight:700, color:'#6b7280', textAlign:'right', paddingRight:10, borderTop:'1.5px solid #e5e7eb', boxShadow:'3px 0 6px -2px rgba(0,0,0,0.08)' }}>Σ / week →</td>
              {subjects.map(sub => {
                const gPW = sub.periodsPerWeek ?? suggestPW(sub.name)
                const total = sections.reduce((sum, sec) => sum + getVal(sub.id, sec.id, gPW), 0)
                return (
                  <td key={sub.id} style={{ ...td, textAlign:'center', background:'#f9fafb', borderLeft:'1px solid #e5e7eb', borderTop:'1.5px solid #e5e7eb', fontFamily:'monospace', fontWeight:700, fontSize:11, color:'#374151', padding:'5px 4px' }}>
                    {total}
                  </td>
                )
              })}
            </tr>
          </tfoot>
        </table>
      ) : (
        <table style={{ borderCollapse:'collapse', minWidth: totalFixed + sections.length * CELL_W, tableLayout:'fixed' }}>

          {/* ── Column widths ── */}
          <colgroup>
            {FCOLS.map((c,i) => <col key={i} style={{ width:c.w }} />)}
            {sections.map(s => <col key={s.id} style={{ width:CELL_W }} />)}
          </colgroup>

          {/* ── Header ── */}
          <thead>
            <tr>
              {FCOLS.map((col,i) => (
                <th key={i} title={col.title} style={stickyTh(i)}>{col.label}</th>
              ))}
              {sections.map(sec => (
                <th key={sec.id} style={{
                  ...th, textAlign:'center', background:'#f0f9ff', color:'#0369a1',
                  borderLeft:'1px solid #e0f2fe', fontSize:10, padding:'6px 4px',
                }}>
                  {sec.name}
                </th>
              ))}
            </tr>
          </thead>

          {/* ── Body ── */}
          <tbody>
            {subjects.map((sub, r) => {
              const gPW  = sub.periodsPerWeek ?? suggestPW(sub.name)
              const rowBg = r % 2 === 0 ? '#fff' : '#fafafa'
              return (
                <tr key={sub.id}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background='#f8faff'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background=rowBg}
                >
                  {/* # */}
                  <td style={{...stickyTd(0,rowBg), textAlign:'center', color:'#d1d5db', fontSize:10, fontFamily:'monospace'}}>{r+1}</td>

                  {/* Subject name */}
                  <td style={stickyTd(1,rowBg)}>
                    <input style={inp({fontWeight:600})} value={sub.name}
                      onChange={e=>updSub(sub.id,'name',e.target.value)} onFocus={onFocus} onBlur={onBlur} />
                  </td>

                  {/* Short */}
                  <td style={{...stickyTd(2,rowBg), textAlign:'center'}}>
                    <input style={inp({textTransform:'uppercase',fontFamily:'monospace',fontSize:11,textAlign:'center'})}
                      value={sub.shortName??''} maxLength={6}
                      onChange={e=>updSub(sub.id,'shortName',e.target.value.toUpperCase())} onFocus={onFocus} onBlur={onBlur} />
                  </td>

                  {/* Category */}
                  <td style={stickyTd(3,rowBg)}>
                    <select style={inp({fontSize:11})} value={sub.category??'Core'}
                      onChange={e=>updSub(sub.id,'category',e.target.value)} onFocus={onFocus} onBlur={onBlur}>
                      {SUBJECT_CATS.map(c=><option key={c}>{c}</option>)}
                    </select>
                  </td>

                  {/* Per/Wk global */}
                  <td style={{...stickyTd(4,rowBg), textAlign:'center'}}>
                    <input type="number" min={0} max={14}
                      style={inp({textAlign:'center',fontFamily:'monospace',fontWeight:700,color:'#111827'})}
                      value={gPW} onChange={e=>updSub(sub.id,'periodsPerWeek',Math.max(0,+e.target.value))}
                      onFocus={onFocus} onBlur={onBlur} />
                  </td>

                  {/* Sess.min */}
                  <td style={{...stickyTd(5,rowBg), textAlign:'center'}}>
                    <input type="number" min={20} max={120}
                      style={inp({textAlign:'center',fontFamily:'monospace'})}
                      value={sub.sessionDuration??45} onChange={e=>updSub(sub.id,'sessionDuration',+e.target.value)}
                      onFocus={onFocus} onBlur={onBlur} />
                  </td>

                  {/* Max/day */}
                  <td style={{...stickyTd(6,rowBg), textAlign:'center'}}>
                    <input type="number" min={1} max={6}
                      style={inp({textAlign:'center',fontFamily:'monospace'})}
                      value={sub.maxPeriodsPerDay??2} onChange={e=>updSub(sub.id,'maxPeriodsPerDay',+e.target.value)}
                      onFocus={onFocus} onBlur={onBlur} />
                  </td>

                  {/* Optional */}
                  <td style={{...stickyTd(7,rowBg), textAlign:'center'}}>
                    <Toggle on={sub.isOptional??false} onChange={v=>updSub(sub.id,'isOptional',v)} color="#9B8EF5"/>
                  </td>

                  {/* Lab */}
                  <td style={{...stickyTd(8,rowBg), textAlign:'center'}}>
                    <Toggle on={sub.requiresLab??false} onChange={v=>updSub(sub.id,'requiresLab',v)} color="#7C6FE0"/>
                  </td>

                  {/* Delete */}
                  <td style={{...stickyTd(9,rowBg), textAlign:'center'}}>
                    <button onClick={()=>setSubjects(subjects.filter(s=>s.id!==sub.id))}
                      style={{ background:'none',border:'none',cursor:'pointer',color:'#d1d5db',padding:0,display:'flex',alignItems:'center',justifyContent:'center' }}>
                      <Trash2 size={13}/>
                    </button>
                  </td>

                  {/* ── Class-section cells ── */}
                  {sections.map((sec, c) => {
                    const val       = getVal(sub.id, sec.id, gPW)
                    const overridden = isOverridden(sub.id, sec.id, gPW)
                    const isActive  = activeCell?.r===r && activeCell?.c===c
                    const cellBg    = isActive ? '#EDE9FF' : overridden ? '#eff6ff' : rowBg

                    return (
                      <td key={sec.id}
                        onClick={() => setActiveCell({r,c})}
                        onDoubleClick={() => clearVal(sub.id, sec.id)}
                        title={overridden
                          ? `${sec.name}: ${val} periods/week (global: ${gPW}) — double-click to reset`
                          : `${sec.name}: ${val} periods/week (inherited from global) — click to override`}
                        style={{
                          ...td,
                          textAlign:'center', cursor:'pointer',
                          background: cellBg,
                          borderLeft:'1px solid #f0f0f0',
                          outline: isActive ? '2px solid #7C6FE0' : 'none',
                          outlineOffset: -2,
                          padding:'3px 4px',
                        }}>
                        {isActive ? (
                          <input type="number" min={0} max={14} autoFocus value={val}
                            onChange={e => setVal(sub.id, sec.id, Math.max(0,+e.target.value))}
                            onKeyDown={e => handleKey(e, r, c)}
                            onBlur={() => setActiveCell(null)}
                            style={{ width:'100%', border:'none', outline:'none', textAlign:'center', fontSize:13, fontWeight:700, fontFamily:'monospace', background:'transparent', color:'#7C6FE0' }}
                          />
                        ) : (
                          <span style={{ fontSize:12, fontWeight: overridden?700:400, fontFamily:'monospace', color: overridden?'#1d4ed8':'#9ca3af' }}>
                            {val}
                          </span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>

          {/* ── Footer: Σ per class ── */}
          <tfoot>
            <tr style={{ background:'#f9fafb' }}>
              <td colSpan={FCOLS.length} style={{ ...td, position:'sticky' as const, left:0, zIndex:1, background:'#f9fafb', fontSize:10, fontWeight:700, color:'#6b7280', textAlign:'right', paddingRight:10, borderTop:'1.5px solid #e5e7eb', boxShadow:'3px 0 6px -2px rgba(0,0,0,0.08)' }}>
                Σ per class / week →
              </td>
              {sections.map(sec => {
                const total = subjects.reduce((sum,sub) => sum + getVal(sub.id, sec.id, sub.periodsPerWeek ?? suggestPW(sub.name)), 0)
                const over  = total > slotsPerWeek
                return (
                  <td key={sec.id} style={{ ...td, textAlign:'center', background:'#f9fafb', borderLeft:'1px solid #e5e7eb', borderTop:'1.5px solid #e5e7eb', fontFamily:'monospace', fontWeight:700, fontSize:12, color: over?'#dc2626':'#059669', padding:'6px 4px' }}>
                    {total}
                    {over && <div style={{ fontSize:8, color:'#dc2626', fontWeight:600 }}>OVER</div>}
                  </td>
                )
              })}
            </tr>
            <tr>
              <td colSpan={FCOLS.length + sections.length} style={{ padding:0 }}>
                <button
                  onClick={() => setSubjects([...subjects, { id:makeId(), name:`Subject ${subjects.length+1}`, shortName:`S${subjects.length+1}`, category:'Core', periodsPerWeek:4, sessionDuration:45, maxPeriodsPerDay:2, isOptional:false, requiresLab:false, color:'#7C6FE0', sections:[], classConfigs:[] }])}
                  style={{ width:'100%', padding:'9px 16px', border:'none', borderTop:'1.5px dashed #e5e7eb', background:'transparent', cursor:'pointer', fontSize:12, color:'#9ca3af', textAlign:'left' as const, display:'flex', alignItems:'center', gap:6 }}>
                  <Plus size={14}/> Add subject
                </button>
              </td>
            </tr>
          </tfoot>
        </table>
      )}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// TEACHERS TABLE — List view + Class-wise Assignment Matrix
// ════════════════════════════════════════════════════════════════
function TeachersTable({ staff, setStaff, subjects, sections, teacherMatrix, setTeacherMatrix }: {
  staff: any[]; setStaff: (s: any[]) => void
  subjects: any[]; sections: any[]
  teacherMatrix: Record<string, Record<string, string>>
  setTeacherMatrix: (m: Record<string, Record<string, string>>) => void
}) {
  const [view, setView] = useState<'list' | 'matrix'>('list')
  const [transposed, setTransposed] = useState(false)
  const [activeCell, setActiveCell] = useState<{r:number; c:number}|null>(null)

  // ── List helpers ──────────────────────────────────────────────
  const upd = (id:string, k:string, v:any) => setStaff(staff.map(t => t.id===id ? {...t,[k]:v} : t))
  const add = () => setStaff([...staff, { id:makeId(), name:`Teacher ${staff.length+1}`, role:"Teacher", subjects:[], classes:[], isClassTeacher:"", maxPeriodsPerWeek:30 }])
  const del = (id:string) => setStaff(staff.filter(t=>t.id!==id))
  const toggleSub = (tid:string, sname:string) => {
    const t = staff.find(x=>x.id===tid); if (!t) return
    const cur:string[] = t.subjects??[]
    upd(tid,"subjects", cur.includes(sname) ? cur.filter((x:string)=>x!==sname) : [...cur,sname])
  }

  // ── Matrix helpers ────────────────────────────────────────────
  const getAssigned = (secId: string, subId: string) => teacherMatrix[secId]?.[subId] ?? ''
  const setAssigned = (secId: string, subId: string, staffId: string) =>
    setTeacherMatrix({ ...teacherMatrix, [secId]: { ...(teacherMatrix[secId] ?? {}), [subId]: staffId } })

  // Per-teacher colour palette (cycles by staff index)
  const PALETTES = [
    { bg:'#dbeafe', text:'#1d4ed8', border:'#93c5fd' },
    { bg:'#d1fae5', text:'#065f46', border:'#6ee7b7' },
    { bg:'#fef3c7', text:'#92400e', border:'#fcd34d' },
    { bg:'#fce7f3', text:'#9d174d', border:'#f9a8d4' },
    { bg:'#ede9fe', text:'#5b21b6', border:'#c4b5fd' },
    { bg:'#ffedd5', text:'#9a3412', border:'#fdba74' },
    { bg:'#cffafe', text:'#164e63', border:'#67e8f9' },
    { bg:'#dcfce7', text:'#166534', border:'#86efac' },
  ]
  const tPal = (staffId: string) => {
    if (!staffId) return { bg:'#f3f4f6', text:'#9ca3af', border:'#e5e7eb' }
    const idx = staff.findIndex(s => s.id === staffId)
    return PALETTES[Math.max(0,idx) % PALETTES.length]
  }

  // Auto-assign: fills every cell with the least-loaded eligible teacher
  const autoAssign = () => {
    const matrix: Record<string, Record<string, string>> = {}
    const load: Record<string, number> = {}
    staff.forEach(s => { load[s.id] = 0 })
    sections.forEach(sec => {
      matrix[sec.id] = {}
      subjects.forEach(sub => {
        let eligible = staff.filter(t =>
          (t.subjects ?? []).some((s: string) => s === sub.name || s.endsWith(`::${sub.name}`))
        )
        if (!eligible.length) eligible = [...staff]
        if (!eligible.length) return
        const picked = eligible.reduce((a, b) => (load[a.id]??0) <= (load[b.id]??0) ? a : b)
        matrix[sec.id][sub.id] = picked.id
        load[picked.id]++
      })
    })
    setTeacherMatrix(matrix)
  }

  const totalSlots    = sections.length * subjects.length
  const totalAssigned = Object.values(teacherMatrix).reduce((a, m) => a + Object.values(m).filter(v=>v).length, 0)
  const unassigned    = totalSlots - totalAssigned

  // Keyboard navigation for matrix cells
  const handleKey = (e: React.KeyboardEvent, r: number, c: number) => {
    const maxR = (transposed ? sections.length : subjects.length) - 1
    const maxC = (transposed ? subjects.length : sections.length) - 1
    if      (e.key==='Tab')        { e.preventDefault(); setActiveCell({r, c: c<maxC?c+1:c}) }
    else if (e.key==='Enter')      { e.preventDefault(); setActiveCell({r: r<maxR?r+1:r, c}) }
    else if (e.key==='Escape')     { setActiveCell(null) }
    else if (e.key==='ArrowRight') { e.preventDefault(); setActiveCell({r, c:Math.min(c+1,maxC)}) }
    else if (e.key==='ArrowLeft')  { e.preventDefault(); setActiveCell({r, c:Math.max(c-1,0)}) }
    else if (e.key==='ArrowDown')  { e.preventDefault(); setActiveCell({r:Math.min(r+1,maxR),c}) }
    else if (e.key==='ArrowUp')    { e.preventDefault(); setActiveCell({r:Math.max(r-1,0),c}) }
  }

  // Fixed sticky col layout for matrix (normal: rows=subjects)
  const M_FCOLS = [
    { label:'#',       w:36  },
    { label:'SUBJECT', w:152 },
    { label:'SHORT',   w:54  },
  ]
  const mLeft = M_FCOLS.reduce((acc,col,i) => { acc.push(i===0?0:acc[i-1]+M_FCOLS[i-1].w); return acc }, [] as number[])
  const CELL_W = 94

  const mTh = (i:number): React.CSSProperties => ({
    ...th, position:'sticky' as const, left:mLeft[i], zIndex:3, background:'#f9fafb',
    width:M_FCOLS[i].w, minWidth:M_FCOLS[i].w,
    boxShadow: i===M_FCOLS.length-1 ? '3px 0 6px -2px rgba(0,0,0,0.08)' : 'none',
  })
  const mTd = (i:number, bg:string): React.CSSProperties => ({
    ...td, position:'sticky' as const, left:mLeft[i], zIndex:1, background:bg,
    width:M_FCOLS[i].w, minWidth:M_FCOLS[i].w,
    boxShadow: i===M_FCOLS.length-1 ? '3px 0 6px -2px rgba(0,0,0,0.08)' : 'none',
  })

  // Shared cell renderer for both orientations
  const MatrixCell = ({ secId, subId, r, c, rowBg }: { secId:string; subId:string; r:number; c:number; rowBg:string }) => {
    const assignedId    = getAssigned(secId, subId)
    const assignedStaff = staff.find(s => s.id === assignedId)
    const isActive      = activeCell?.r === r && activeCell?.c === c
    const pal           = tPal(assignedId)
    return (
      <td
        onClick={() => setActiveCell({r, c})}
        title={assignedStaff ? `${assignedStaff.name} — click to change` : 'Click to assign a teacher'}
        style={{
          ...td, textAlign:'center', cursor:'pointer', padding:'4px 5px',
          background: isActive ? '#EDE9FF' : assignedId ? pal.bg : rowBg,
          borderLeft:'1px solid #f0f0f0',
          outline: isActive ? '2px solid #7C6FE0' : 'none', outlineOffset:-2,
          minWidth: CELL_W,
        }}>
        {isActive ? (
          <select autoFocus value={assignedId}
            onChange={e => { setAssigned(secId, subId, e.target.value); setActiveCell(null) }}
            onKeyDown={e => handleKey(e, r, c)}
            onBlur={() => setActiveCell(null)}
            style={{ width:'100%', fontSize:11, border:'1px solid #7C6FE0', borderRadius:5, padding:'3px 4px', background:'#fff', color:'#111827', outline:'none', cursor:'pointer' }}>
            <option value="">— None —</option>
            {staff.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        ) : assignedStaff ? (
          <span style={{ fontSize:11, fontWeight:600, color:pal.text, padding:'2px 7px', borderRadius:5, background:pal.bg, border:`1px solid ${pal.border}`, whiteSpace:'nowrap', display:'inline-block', maxWidth:'100%', overflow:'hidden', textOverflow:'ellipsis' }}>
            {assignedStaff.shortName || assignedStaff.name.replace(/\s+\d+$/,'') + ' ' + (staff.findIndex(s=>s.id===assignedStaff.id)+1)}
          </span>
        ) : (
          <span style={{ fontSize:11, color:'#d1d5db' }}>—</span>
        )}
      </td>
    )
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>

      {/* ── Sub-tab bar ── */}
      <div style={{ display:'flex', alignItems:'center', borderBottom:'1px solid #e5e7eb', background:'#fafafa', padding:'0 12px', flexShrink:0 }}>
        {(['list','matrix'] as const).map(v => (
          <button key={v} onClick={() => setView(v)}
            style={{
              padding:'8px 14px', border:'none',
              borderBottom: view===v ? '2px solid #7C6FE0' : '2px solid transparent',
              marginBottom:-1, background:'transparent', fontSize:12,
              fontWeight: view===v ? 600 : 400, color: view===v ? '#7C6FE0' : '#6b7280',
              cursor:'pointer',
            }}>
            {v === 'list' ? '👤  Teacher List' : '📋  Class-wise Assignment'}
          </button>
        ))}

        {/* Matrix toolbar */}
        {view === 'matrix' && (
          <div style={{ marginLeft:'auto', display:'flex', gap:8, alignItems:'center' }}>
            <span style={{ fontSize:11, color: unassigned>0 ? '#f59e0b' : '#059669', fontWeight:600 }}>
              {unassigned > 0 ? `⚠️ ${unassigned} unassigned` : `✅ All ${totalSlots} slots assigned`}
            </span>
            <button onClick={autoAssign}
              style={{ padding:'4px 11px', borderRadius:5, border:'1px solid #D8D2FF', background:'#EDE9FF', color:'#3730a3', fontSize:11, fontWeight:600, cursor:'pointer' }}>
              ⚡ Auto-assign
            </button>
            <button onClick={() => { setTeacherMatrix({}); setActiveCell(null) }}
              style={{ padding:'4px 9px', borderRadius:5, border:'1px solid #fecaca', background:'#fff1f2', color:'#be123c', fontSize:11, cursor:'pointer' }}>
              ✕ Clear
            </button>
            <button onClick={() => { setTransposed(t=>!t); setActiveCell(null) }}
              style={{ padding:'4px 10px', borderRadius:5, border:'1px solid #d1d5db', background: transposed?'#f0fdf4':'#fff', color: transposed?'#059669':'#374151', fontSize:11, fontWeight:600, cursor:'pointer' }}>
              ⇄ {transposed ? 'Classes as rows' : 'Subjects as rows'}
            </button>
          </div>
        )}
      </div>

      {/* ══ LIST VIEW ══════════════════════════════════════════ */}
      {view === 'list' && (
        <div style={{ overflowY:'auto', flex:1 }}>
          <div style={{ padding:'7px 16px', background:'#eff6ff', borderBottom:'1px solid #dbeafe', fontSize:11, color:'#3730a3' }}>
            💡 Toggle the subjects each teacher <strong>can</strong> teach — then go to <strong>Class-wise Assignment</strong> to assign which class they actually teach it for.
          </div>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr>
              <th style={{...th,width:36,textAlign:"center"}}>#</th>
              <th style={th}>Full Name</th>
              <th style={{...th,width:72}}>Short</th>
              <th style={{...th,width:130}}>Role</th>
              <th style={th}>Can teach (click to toggle)</th>
              <th style={{...th,width:88,textAlign:"center"}}>Max/week</th>
              <th style={{...th,width:90}}>Gender</th>
              <th style={{...th,width:36}}></th>
            </tr></thead>
            <tbody>
              {staff.map((t,i) => {
                const pal = tPal(t.id)
                return (
                  <tr key={t.id}
                    style={{ background:i%2===0?"#fff":"#fafafa" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background="#f0f9ff"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background=i%2===0?"#fff":"#fafafa"}>
                    <td style={{...td,textAlign:"center",color:"#d1d5db",fontSize:10,fontFamily:"monospace"}}>{i+1}</td>
                    <td style={td}><input style={inp({fontWeight:600})} value={t.name} onChange={e=>upd(t.id,"name",e.target.value)} onFocus={onFocus} onBlur={onBlur} /></td>
                    <td style={td}><input style={inp({textTransform:"uppercase",fontFamily:"monospace",fontSize:11})} value={t.shortName??t.name?.slice(0,4).toUpperCase()??""} onChange={e=>upd(t.id,"shortName",e.target.value.toUpperCase())} maxLength={5} onFocus={onFocus} onBlur={onBlur} /></td>
                    <td style={td}>
                      <select style={inp({fontSize:11})} value={t.role??"Teacher"} onChange={e=>upd(t.id,"role",e.target.value)} onFocus={onFocus} onBlur={onBlur}>
                        {ROLES.map(r=><option key={r}>{r}</option>)}
                      </select>
                    </td>
                    <td style={td}>
                      <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                        {subjects.map((s:any) => {
                          const on = (t.subjects??[]).includes(s.name)
                          return (
                            <span key={s.id} onClick={() => toggleSub(t.id,s.name)}
                              style={{
                                padding:"2px 9px", borderRadius:20, fontSize:10, fontWeight:500, cursor:"pointer", userSelect:"none" as const,
                                background: on ? pal.bg : "#f3f4f6",
                                color:      on ? pal.text : "#6b7280",
                                border:     on ? `1px solid ${pal.border}` : "1px solid transparent",
                              }}>
                              {s.name}
                            </span>
                          )
                        })}
                      </div>
                    </td>
                    <td style={{...td,textAlign:"center"}}>
                      <input type="number" min={1} max={45} style={inp({textAlign:"center",fontFamily:"monospace",fontWeight:700})} value={t.maxPeriodsPerWeek??30} onChange={e=>upd(t.id,"maxPeriodsPerWeek",+e.target.value)} onFocus={onFocus} onBlur={onBlur} />
                    </td>
                    <td style={td}>
                      <select style={inp({fontSize:11})} value={t.gender??""} onChange={e=>upd(t.id,"gender",e.target.value as any || undefined)} onFocus={onFocus} onBlur={onBlur}>
                        <option value="">Not specified</option>
                        <option value="male">&#9794; Male</option>
                        <option value="female">&#9792; Female</option>
                        <option value="other">Other</option>
                      </select>
                    </td>
                    <td style={td}><button onClick={()=>del(t.id)} style={{ background:"none",border:"none",cursor:"pointer",color:"#d1d5db",padding:0,display:"flex",alignItems:"center" }}><Trash2 size={13}/></button></td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr><td colSpan={8} style={{ padding:0 }}>
                <button onClick={add} style={{ width:"100%",padding:"9px 16px",border:"none",borderTop:"1.5px dashed #e5e7eb",background:"transparent",cursor:"pointer",fontSize:12,color:"#9ca3af",textAlign:"left" as const,display:"flex",alignItems:"center",gap:6 }}>
                  <Plus size={14}/> Add teacher
                </button>
              </td></tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* ══ MATRIX VIEW ════════════════════════════════════════ */}
      {view === 'matrix' && (
        <div style={{ overflowX:'auto', overflowY:'auto', flex:1 }}>
          <div style={{ padding:'7px 16px', background:'#f0fdf4', borderBottom:'1px solid #bbf7d0', fontSize:11, color:'#166534', flexShrink:0 }}>
            💡 Each cell = which teacher delivers that subject to that class · <strong>Click</strong> to assign · <strong>⚡ Auto-assign</strong> distributes based on "Can teach" list · <kbd style={{ padding:'1px 5px', borderRadius:3, border:'1px solid #bbf7d0', background:'#dcfce7', fontSize:10 }}>Tab</kbd> / <kbd style={{ padding:'1px 5px', borderRadius:3, border:'1px solid #bbf7d0', background:'#dcfce7', fontSize:10 }}>↑↓←→</kbd> to navigate
          </div>

          {/* ── Legend strip ── */}
          <div style={{ padding:'6px 16px', borderBottom:'1px solid #e5e7eb', display:'flex', gap:8, flexWrap:'wrap' as const, alignItems:'center', background:'#fafafa', flexShrink:0 }}>
            <span style={{ fontSize:10, color:'#9ca3af', fontWeight:600, marginRight:4 }}>TEACHERS:</span>
            {staff.map((t,i) => {
              const pal = PALETTES[i % PALETTES.length]
              const assigned = Object.values(teacherMatrix).reduce((a,m) => a + (Object.values(m).filter(v=>v===t.id).length), 0)
              return (
                <span key={t.id} style={{ display:'flex', alignItems:'center', gap:4, padding:'2px 8px', borderRadius:5, background:pal.bg, border:`1px solid ${pal.border}`, fontSize:10, fontWeight:600, color:pal.text }}>
                  {t.name}
                  {assigned > 0 && <span style={{ background:pal.border, color:'#fff', borderRadius:8, padding:'0 5px', fontSize:9 }}>{assigned}</span>}
                </span>
              )
            })}
          </div>

          {transposed ? (
            /* ── TRANSPOSED: rows = sections, cols = subjects ── */
            <table style={{ borderCollapse:'collapse', minWidth: 186 + subjects.length * CELL_W, tableLayout:'fixed' }}>
              <colgroup>
                <col style={{ width:36 }} />
                <col style={{ width:150 }} />
                {subjects.map(s => <col key={s.id} style={{ width:CELL_W }} />)}
              </colgroup>
              <thead>
                <tr>
                  <th style={{ ...th, position:'sticky' as const, left:0,  zIndex:3, background:'#f9fafb', width:36,  textAlign:'center' }}>#</th>
                  <th style={{ ...th, position:'sticky' as const, left:36, zIndex:3, background:'#f9fafb', width:150, boxShadow:'3px 0 6px -2px rgba(0,0,0,0.08)' }}>CLASS</th>
                  {subjects.map(sub => (
                    <th key={sub.id} style={{ ...th, textAlign:'center', background:'#fdf4ff', color:'#9B8EF5', borderLeft:'1px solid #ede9fe', fontSize:10, padding:'5px 4px' }}>
                      <div style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' as const }}>{sub.shortName || sub.name}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sections.map((sec, r) => {
                  const rowBg = r%2===0 ? '#fff' : '#fafafa'
                  return (
                    <tr key={sec.id}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background='#f8faff'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background=rowBg}>
                      <td style={{ ...td, position:'sticky' as const, left:0,  zIndex:1, background:rowBg, textAlign:'center', color:'#d1d5db', fontSize:10, fontFamily:'monospace' }}>{r+1}</td>
                      <td style={{ ...td, position:'sticky' as const, left:36, zIndex:1, background:rowBg, fontWeight:600, fontSize:12, boxShadow:'3px 0 6px -2px rgba(0,0,0,0.08)' }}>{sec.name}</td>
                      {subjects.map((sub, c) => <MatrixCell key={sub.id} secId={sec.id} subId={sub.id} r={r} c={c} rowBg={rowBg} />)}
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr style={{ background:'#f9fafb' }}>
                  <td colSpan={2} style={{ ...td, position:'sticky' as const, left:0, zIndex:1, background:'#f9fafb', fontSize:10, fontWeight:700, color:'#6b7280', textAlign:'right' as const, paddingRight:10, borderTop:'1.5px solid #e5e7eb', boxShadow:'3px 0 6px -2px rgba(0,0,0,0.08)' }}>
                    Assigned →
                  </td>
                  {subjects.map(sub => {
                    const count = sections.filter(sec => getAssigned(sec.id, sub.id)).length
                    return (
                      <td key={sub.id} style={{ ...td, textAlign:'center', background:'#f9fafb', borderLeft:'1px solid #e5e7eb', borderTop:'1.5px solid #e5e7eb', fontFamily:'monospace', fontWeight:700, fontSize:11, color: count<sections.length?'#f59e0b':'#059669', padding:'5px 4px' }}>
                        {count}/{sections.length}
                      </td>
                    )
                  })}
                </tr>
              </tfoot>
            </table>
          ) : (
            /* ── NORMAL: rows = subjects, cols = sections ── */
            <table style={{ borderCollapse:'collapse', minWidth: (mLeft[M_FCOLS.length-1]+M_FCOLS[M_FCOLS.length-1].w) + sections.length * CELL_W, tableLayout:'fixed' }}>
              <colgroup>
                {M_FCOLS.map((_,i) => <col key={i} style={{ width:M_FCOLS[i].w }} />)}
                {sections.map(s => <col key={s.id} style={{ width:CELL_W }} />)}
              </colgroup>
              <thead>
                <tr>
                  {M_FCOLS.map((col,i) => <th key={i} style={mTh(i)}>{col.label}</th>)}
                  {sections.map(sec => (
                    <th key={sec.id} style={{ ...th, textAlign:'center', background:'#f0f9ff', color:'#0369a1', borderLeft:'1px solid #e0f2fe', fontSize:10, padding:'6px 4px' }}>
                      {sec.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {subjects.map((sub, r) => {
                  const rowBg = r%2===0 ? '#fff' : '#fafafa'
                  return (
                    <tr key={sub.id}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background='#f8faff'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background=rowBg}>
                      <td style={{...mTd(0,rowBg), textAlign:'center', color:'#d1d5db', fontSize:10, fontFamily:'monospace'}}>{r+1}</td>
                      <td style={{...mTd(1,rowBg), fontWeight:600, fontSize:12}}>{sub.name}</td>
                      <td style={{...mTd(2,rowBg), textAlign:'center', fontFamily:'monospace', fontSize:11, color:'#9ca3af'}}>{sub.shortName||'—'}</td>
                      {sections.map((sec, c) => <MatrixCell key={sec.id} secId={sec.id} subId={sub.id} r={r} c={c} rowBg={rowBg} />)}
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr style={{ background:'#f9fafb' }}>
                  <td colSpan={M_FCOLS.length} style={{ ...td, position:'sticky' as const, left:0, zIndex:1, background:'#f9fafb', fontSize:10, fontWeight:700, color:'#6b7280', textAlign:'right' as const, paddingRight:10, borderTop:'1.5px solid #e5e7eb', boxShadow:'3px 0 6px -2px rgba(0,0,0,0.08)' }}>
                    Assigned →
                  </td>
                  {sections.map(sec => {
                    const count = subjects.filter(sub => getAssigned(sec.id, sub.id)).length
                    return (
                      <td key={sec.id} style={{ ...td, textAlign:'center', background:'#f9fafb', borderLeft:'1px solid #e5e7eb', borderTop:'1.5px solid #e5e7eb', fontFamily:'monospace', fontWeight:700, fontSize:12, color: count<subjects.length?'#f59e0b':'#059669', padding:'6px 4px' }}>
                        {count}/{subjects.length}
                      </td>
                    )
                  })}
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// ROOMS TABLE
// ════════════════════════════════════════════════════════════════
function RoomsTable({ rooms, setRooms }: { rooms:RoomRow[]; setRooms:(r:RoomRow[])=>void }) {
  const upd = (id:string, k:string, v:any) => setRooms(rooms.map(r => r.id===id ? {...r,[k]:v} : r))
  const add = () => setRooms([...rooms, { id:makeId(), name:`Room ${101+rooms.length}`, type:"Classroom", capacity:40, building:"Main Block", floor:"Ground" }])
  const del = (id:string) => setRooms(rooms.filter(r=>r.id!==id))

  return (
    <table style={{ width:"100%", borderCollapse:"collapse" }}>
      <thead><tr>
        <th style={{...th,width:36,textAlign:"center"}}>#</th>
        <th style={th}>Room Name / Number</th>
        <th style={{...th,width:150}}>Type</th>
        <th style={{...th,width:90,textAlign:"center"}}>Capacity</th>
        <th style={th}>Building / Block</th>
        <th style={{...th,width:130}}>Floor</th>
        <th style={{...th,width:36}}></th>
      </tr></thead>
      <tbody>
        {rooms.map((r,i) => (
          <tr key={r.id}
            style={{ background:i%2===0?"#fff":"#fafafa" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background="#f0f9ff"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background=i%2===0?"#fff":"#fafafa"}>
            <td style={{...td,textAlign:"center",color:"#d1d5db",fontSize:10,fontFamily:"monospace"}}>{i+1}</td>
            <td style={td}><input style={inp({fontWeight:600,fontFamily:"monospace"})} value={r.name} onChange={e=>upd(r.id,"name",e.target.value)} onFocus={onFocus} onBlur={onBlur} /></td>
            <td style={td}>
              <select style={inp({fontSize:11})} value={r.type} onChange={e=>upd(r.id,"type",e.target.value)} onFocus={onFocus} onBlur={onBlur}>
                {ROOM_TYPES.map(t=><option key={t}>{t}</option>)}
              </select>
            </td>
            <td style={{...td,textAlign:"center"}}>
              <input type="number" min={1} max={500} style={inp({textAlign:"center",fontFamily:"monospace"})} value={r.capacity} onChange={e=>upd(r.id,"capacity",+e.target.value)} onFocus={onFocus} onBlur={onBlur} />
            </td>
            <td style={td}><input style={inp()} value={r.building} onChange={e=>upd(r.id,"building",e.target.value)} placeholder="Main Block, Science Wing…" onFocus={onFocus} onBlur={onBlur} /></td>
            <td style={td}>
              <select style={inp({fontSize:11})} value={r.floor} onChange={e=>upd(r.id,"floor",e.target.value)} onFocus={onFocus} onBlur={onBlur}>
                {["Ground","1st Floor","2nd Floor","3rd Floor","Basement"].map(f=><option key={f}>{f}</option>)}
              </select>
            </td>
            <td style={td}><button onClick={()=>del(r.id)} style={{ background:"none",border:"none",cursor:"pointer",color:"#d1d5db",padding:0,display:"flex",alignItems:"center" }}><Trash2 size={13}/></button></td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr><td colSpan={7} style={{ padding:0 }}>
          <button onClick={add} style={{ width:"100%",padding:"9px 16px",border:"none",borderTop:"1.5px dashed #e5e7eb",background:"transparent",cursor:"pointer",fontSize:12,color:"#9ca3af",textAlign:"left",display:"flex",alignItems:"center",gap:6 }}>
            <Plus size={14}/> Add room
          </button>
        </td></tr>
      </tfoot>
    </table>
  )
}
