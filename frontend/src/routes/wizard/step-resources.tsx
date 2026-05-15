import { useState, useMemo, useEffect } from "react"
import { useTimetableStore } from "@/store/timetableStore"
import { generateSections, generateStaff, generateSubjects, generateBreaks } from "@/lib/orgData"
import type { Subject } from "@/types"
import { ChevronDown, ChevronRight, RefreshCw, Plus, Trash2 } from "lucide-react"

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
  (e.target as HTMLElement).style.borderColor = "#6366f1"
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
  // Subject hours panel: which subject rows are expanded
  const [expandedSubs, setExpandedSubs] = useState<Set<string>>(new Set())
  // Class-wise overrides: subjectId → classId → periodsPerWeek
  const [classOverrides, setClassOverrides] = useState<Record<string, Record<string, number>>>({})

  // Base classes for overrides column
  const baseClasses = useMemo(() => {
    const seen = new Map<string,{id:string;name:string}>()
    sections.forEach(s => {
      const m = s.name.match(/^(.+?)[\s\-–]?([A-E\d])$/i)
      const base = m ? m[1].trim() : s.name
      if (!seen.has(base)) seen.set(base, { id:s.id, name:base })
    })
    return [...seen.values()]
  }, [sections])

  // Generate all data fresh using current config counts
  const regen = () => {
    const o = config.orgType ?? "school", c = config.countryCode ?? "IN"
    const newSections = generateSections(o, c, config.numSections)
    setSections(newSections)
    setStaff(generateStaff(o, c, config.numStaff))
    setSubjects(generateSubjects(o, c, config.numSubjects) as Subject[])
    setBreaks(generateBreaks(o, config.numBreaks))
    // Reset rooms to match new sections
    setRooms(newSections.map((s: any, i: number) => ({
      id: makeId(), name: s.room ?? `Room ${101 + i}`,
      type: "Classroom", capacity: 40, building: "Main Block", floor: "Ground"
    })))
  }

  // Auto-generate on first load if store is empty OR counts don't match what user entered
  useEffect(() => {
    const countsMismatch =
      sections.length !== config.numSections ||
      staff.length    !== config.numStaff    ||
      subjects.length !== config.numSubjects
    if (sections.length === 0 || countsMismatch) {
      regen()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persist class-wise overrides into subjects then advance
  const handleContinue = () => {
    setSubjects(subjects.map(s => {
      const ov = classOverrides[s.id]
      if (!ov || Object.keys(ov).length === 0) return s
      const classConfigs = Object.entries(ov).map(([classId, pw]) => ({
        classId,
        sectionName: baseClasses.find(c => c.id === classId)?.name ?? classId,
        periodsPerWeek: pw,
        sessionDuration: s.sessionDuration ?? 45,
        maxPeriodsPerDay: s.maxPeriodsPerDay ?? 2,
      }))
      return { ...s, classConfigs }
    }))
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
                padding:"10px 20px", border:"none", borderBottom: tab===t.key?"2px solid #4f46e5":"2px solid transparent",
                marginBottom:-1.5, background:"transparent", fontSize:13,
                fontWeight: tab===t.key?600:400, color: tab===t.key?"#4f46e5":"#6b7280",
                cursor:"pointer", display:"flex", alignItems:"center", gap:6, whiteSpace:"nowrap",
              }}>
              {t.label}
              <span style={{ fontSize:10, padding:"1px 7px", borderRadius:10, background: tab===t.key?"#eff6ff":"#f3f4f6", color: tab===t.key?"#4f46e5":"#9ca3af", fontWeight:500 }}>
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
            baseClasses={baseClasses}
            expandedSubs={expandedSubs} setExpandedSubs={setExpandedSubs}
            classOverrides={classOverrides} setClassOverrides={setClassOverrides}
            periodsPerDay={config.periodsPerDay ?? 8}
            workDaysCount={config.workDays?.length ?? 6}
          />
        )}

        {/* ══ TEACHERS ═════════════════════════════════════════ */}
        {tab === "teachers" && (
          <TeachersTable staff={staff} setStaff={setStaff} subjects={subjects} />
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
          style={{ padding:"9px 22px", borderRadius:7, border:"none", fontSize:13, fontWeight:600, cursor:"pointer", background:"#4f46e5", color:"#fff" }}>
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
// SUBJECTS TABLE — with inline class-wise hours expansion
// ════════════════════════════════════════════════════════════════
function SubjectsTable({
  subjects, setSubjects, baseClasses,
  expandedSubs, setExpandedSubs,
  classOverrides, setClassOverrides,
  periodsPerDay, workDaysCount,
}: {
  subjects: any[]; setSubjects:(s:any[])=>void;
  baseClasses: {id:string;name:string}[];
  expandedSubs: Set<string>; setExpandedSubs: (s:Set<string>)=>void;
  classOverrides: Record<string,Record<string,number>>;
  setClassOverrides: (o:Record<string,Record<string,number>>)=>void;
  periodsPerDay: number; workDaysCount: number;
}) {
  const upd = (id:string, k:string, v:any) => setSubjects(subjects.map(s => s.id===id ? {...s,[k]:v} : s))
  const add = () => setSubjects([...subjects, { id:makeId(), name:`Subject ${subjects.length+1}`, shortName:`S${subjects.length+1}`, category:"Core", periodsPerWeek:4, sessionDuration:45, maxPeriodsPerDay:2, isOptional:false, requiresLab:false }])
  const del = (id:string) => setSubjects(subjects.filter(s=>s.id!==id))

  const toggleExpand = (id:string) => {
    const next = new Set(expandedSubs)
    next.has(id) ? next.delete(id) : next.add(id)
    setExpandedSubs(next)
  }

  const setOv = (subId:string, classId:string, pw:number) =>
    setClassOverrides({ ...classOverrides, [subId]: { ...(classOverrides[subId]??{}), [classId]: pw } })

  const clearOv = (subId:string, classId:string) => {
    const next = { ...classOverrides }
    if (next[subId]) { next[subId] = {...next[subId]}; delete next[subId][classId] }
    setClassOverrides(next)
  }

  const slotsPerWeek = periodsPerDay * workDaysCount
  const totalGlobal = subjects.reduce((s,x) => s + (x.periodsPerWeek ?? suggestPW(x.name)), 0)

  return (
    <div>
      {/* Hints bar */}
      <div style={{ padding:"8px 14px", background:"#eff6ff", borderBottom:"1px solid #dbeafe", fontSize:11, color:"#3730a3", display:"flex", gap:24, alignItems:"center" }}>
        <span>🗓 {workDaysCount} days/week · {periodsPerDay} periods/day · <strong>{slotsPerWeek} total slots/class/week</strong></span>
        <span style={{ color: totalGlobal > slotsPerWeek ? "#dc2626" : "#059669" }}>
          Σ global: <strong>{totalGlobal}/{slotsPerWeek}</strong> {totalGlobal > slotsPerWeek ? "⚠ over" : "✓"}
        </span>
        <button onClick={() => setSubjects(subjects.map(s => ({...s, periodsPerWeek: suggestPW(s.name)})))}
          style={{ marginLeft:"auto", padding:"4px 10px", borderRadius:5, border:"1px solid #c7d2fe", background:"#e0e7ff", color:"#3730a3", fontSize:11, fontWeight:600, cursor:"pointer" }}>
          🏫 Auto-fill CBSE norms
        </button>
      </div>

      <table style={{ width:"100%", borderCollapse:"collapse" }}>
        <thead><tr>
          <th style={{...th,width:30}}></th>
          <th style={{...th,width:36,textAlign:"center"}}>#</th>
          <th style={th}>Subject Name</th>
          <th style={{...th,width:72}}>Short</th>
          <th style={{...th,width:110}}>Category</th>
          <th style={{...th,width:80,textAlign:"center"}}>Per/wk</th>
          <th style={{...th,width:80,textAlign:"center"}}>Sess.min</th>
          <th style={{...th,width:72,textAlign:"center"}}>Max/day</th>
          <th style={{...th,width:70,textAlign:"center"}}>Optional</th>
          <th style={{...th,width:56,textAlign:"center"}}>Lab</th>
          <th style={{...th,width:36}}></th>
        </tr></thead>
        <tbody>
          {subjects.map((s,i) => {
            const expanded = expandedSubs.has(s.id)
            const hasOv = classOverrides[s.id] && Object.keys(classOverrides[s.id]).length > 0
            return (
              <>
                <tr key={s.id}
                  style={{ background: expanded?"#f5f3ff": i%2===0?"#fff":"#fafafa" }}
                  onMouseEnter={e => { if (!expanded) (e.currentTarget as HTMLElement).style.background="#fdf4ff" }}
                  onMouseLeave={e => { if (!expanded) (e.currentTarget as HTMLElement).style.background=i%2===0?"#fff":"#fafafa" }}>

                  {/* Expand toggle */}
                  <td style={{...td,textAlign:"center",paddingRight:0}}>
                    <button onClick={() => toggleExpand(s.id)}
                      style={{ background:"none",border:"none",cursor:"pointer",color: hasOv?"#7c3aed":"#d1d5db",padding:2,display:"flex",alignItems:"center" }}>
                      {expanded ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                    </button>
                  </td>

                  <td style={{...td,textAlign:"center",color:"#d1d5db",fontSize:10,fontFamily:"monospace"}}>{i+1}</td>
                  <td style={td}>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <input style={inp({fontWeight:600})} value={s.name} onChange={e=>upd(s.id,"name",e.target.value)} onFocus={onFocus} onBlur={onBlur} />
                      {hasOv && <span style={{ fontSize:9, padding:"1px 5px", borderRadius:10, background:"#f5f3ff", color:"#7c3aed", fontWeight:700, flexShrink:0 }}>class overrides</span>}
                    </div>
                  </td>
                  <td style={td}><input style={inp({textTransform:"uppercase",fontFamily:"monospace",fontSize:11})} value={s.shortName??""} onChange={e=>upd(s.id,"shortName",e.target.value.toUpperCase())} maxLength={6} onFocus={onFocus} onBlur={onBlur} /></td>
                  <td style={td}>
                    <select style={inp({fontSize:11})} value={s.category??"Core"} onChange={e=>upd(s.id,"category",e.target.value)} onFocus={onFocus} onBlur={onBlur}>
                      {SUBJECT_CATS.map(c=><option key={c}>{c}</option>)}
                    </select>
                  </td>
                  <td style={{...td,textAlign:"center"}}>
                    <input type="number" min={0} max={14} style={inp({textAlign:"center",fontFamily:"monospace",fontWeight:700})} value={s.periodsPerWeek??suggestPW(s.name)} onChange={e=>upd(s.id,"periodsPerWeek",Math.max(0,+e.target.value))} onFocus={onFocus} onBlur={onBlur} />
                  </td>
                  <td style={{...td,textAlign:"center"}}>
                    <input type="number" min={20} max={120} style={inp({textAlign:"center",fontFamily:"monospace"})} value={s.sessionDuration??45} onChange={e=>upd(s.id,"sessionDuration",+e.target.value)} onFocus={onFocus} onBlur={onBlur} />
                  </td>
                  <td style={{...td,textAlign:"center"}}>
                    <input type="number" min={1} max={4} style={inp({textAlign:"center",fontFamily:"monospace"})} value={s.maxPeriodsPerDay??2} onChange={e=>upd(s.id,"maxPeriodsPerDay",+e.target.value)} onFocus={onFocus} onBlur={onBlur} />
                  </td>
                  <td style={{...td,textAlign:"center"}}><Toggle on={s.isOptional??false} onChange={v=>upd(s.id,"isOptional",v)} color="#7c3aed"/></td>
                  <td style={{...td,textAlign:"center"}}><Toggle on={s.requiresLab??false} onChange={v=>upd(s.id,"requiresLab",v)} color="#0891b2"/></td>
                  <td style={td}><button onClick={()=>del(s.id)} style={{ background:"none",border:"none",cursor:"pointer",color:"#d1d5db",padding:0,display:"flex",alignItems:"center" }}><Trash2 size={13}/></button></td>
                </tr>

                {/* ── Expanded: class-wise hours override ── */}
                {expanded && (
                  <tr key={`${s.id}-ov`}>
                    <td colSpan={11} style={{ background:"#f5f3ff", padding:"0 0 0 46px", borderBottom:"1px solid #ede9fe" }}>
                      <div style={{ padding:"12px 16px 12px 0" }}>
                        <div style={{ fontSize:11, fontWeight:600, color:"#7c3aed", marginBottom:8 }}>
                          Class-wise periods/week overrides — global: <strong>{s.periodsPerWeek ?? suggestPW(s.name)}</strong>
                        </div>
                        <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                          {baseClasses.map(c => {
                            const ov = classOverrides[s.id]?.[c.id]
                            const hasThis = ov !== undefined
                            return (
                              <div key={c.id} style={{
                                display:"flex", flexDirection:"column", alignItems:"center", gap:4,
                                padding:"8px 10px", borderRadius:8, border: hasThis?"1.5px solid #a78bfa":"1px solid #e5e7eb",
                                background: hasThis?"#ede9fe":"#fff", minWidth:70,
                              }}>
                                <div style={{ fontSize:10, fontWeight:600, color: hasThis?"#7c3aed":"#374151" }}>{c.name}</div>
                                <input type="number" min={0} max={14}
                                  value={ov ?? (s.periodsPerWeek ?? suggestPW(s.name))}
                                  onChange={e => setOv(s.id, c.id, Math.max(0,+e.target.value))}
                                  style={{ width:48, padding:"4px", border:"1px solid #e5e7eb", borderRadius:5, fontSize:14, fontWeight:700, fontFamily:"monospace", textAlign:"center", outline:"none", background:"#fff" }}
                                  onFocus={e => { e.target.style.borderColor="#7c3aed" }}
                                  onBlur={e => { e.target.style.borderColor="#e5e7eb" }}
                                />
                                {hasThis && (
                                  <button onClick={() => clearOv(s.id,c.id)}
                                    style={{ fontSize:9, color:"#a78bfa", background:"none", border:"none", cursor:"pointer", padding:0, textDecoration:"underline" }}>
                                    reset
                                  </button>
                                )}
                              </div>
                            )
                          })}
                          {baseClasses.length === 0 && (
                            <span style={{ fontSize:11, color:"#9ca3af" }}>No classes added yet — add classes in the Classes tab first.</span>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            )
          })}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={11} style={{ padding:0 }}>
              <button onClick={add} style={{ width:"100%",padding:"9px 16px",border:"none",borderTop:"1.5px dashed #e5e7eb",background:"transparent",cursor:"pointer",fontSize:12,color:"#9ca3af",textAlign:"left",display:"flex",alignItems:"center",gap:6 }}>
                <Plus size={14}/> Add subject
              </button>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// TEACHERS TABLE
// ════════════════════════════════════════════════════════════════
function TeachersTable({ staff, setStaff, subjects }: { staff:any[]; setStaff:(s:any[])=>void; subjects:any[] }) {
  const upd = (id:string, k:string, v:any) => setStaff(staff.map(t => t.id===id ? {...t,[k]:v} : t))
  const add = () => setStaff([...staff, { id:makeId(), name:`Teacher ${staff.length+1}`, role:"Teacher", subjects:[], classes:[], isClassTeacher:"", maxPeriodsPerWeek:30 }])
  const del = (id:string) => setStaff(staff.filter(t=>t.id!==id))

  const toggleSub = (tid:string, sname:string) => {
    const t = staff.find(x=>x.id===tid); if (!t) return
    const cur:string[] = t.subjects??[]
    upd(tid,"subjects", cur.includes(sname) ? cur.filter((x:string)=>x!==sname) : [...cur,sname])
  }

  return (
    <table style={{ width:"100%", borderCollapse:"collapse" }}>
      <thead><tr>
        <th style={{...th,width:36,textAlign:"center"}}>#</th>
        <th style={th}>Full Name</th>
        <th style={{...th,width:72}}>Short</th>
        <th style={{...th,width:130}}>Role</th>
        <th style={th}>Subjects (click to assign)</th>
        <th style={{...th,width:88,textAlign:"center"}}>Max/week</th>
        <th style={{...th,width:36}}></th>
      </tr></thead>
      <tbody>
        {staff.map((t,i) => (
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
                        padding:"2px 8px", borderRadius:20, fontSize:10, fontWeight:500, cursor:"pointer", userSelect:"none",
                        background: on?"#dbeafe":"#f3f4f6", color: on?"#1d4ed8":"#6b7280",
                        border: on?"1px solid #93c5fd":"1px solid transparent",
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
            <td style={td}><button onClick={()=>del(t.id)} style={{ background:"none",border:"none",cursor:"pointer",color:"#d1d5db",padding:0,display:"flex",alignItems:"center" }}><Trash2 size={13}/></button></td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr><td colSpan={7} style={{ padding:0 }}>
          <button onClick={add} style={{ width:"100%",padding:"9px 16px",border:"none",borderTop:"1.5px dashed #e5e7eb",background:"transparent",cursor:"pointer",fontSize:12,color:"#9ca3af",textAlign:"left",display:"flex",alignItems:"center",gap:6 }}>
            <Plus size={14}/> Add teacher
          </button>
        </td></tr>
      </tfoot>
    </table>
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
