import { useState } from "react"
import { useTimetableStore } from "@/store/timetableStore"
import { generateSections, generateStaff, generateSubjects, generateBreaks } from "@/lib/orgData"
import type { Subject } from "@/types"

// ─── Shared table styles ──────────────────────────────────────
const thS: React.CSSProperties = {
  padding:"8px 10px", background:"#f7f6f2", fontSize:10, fontWeight:700,
  textTransform:"uppercase", letterSpacing:"0.06em", color:"#a8a59e",
  textAlign:"left", borderBottom:"1.5px solid #e8e5de", whiteSpace:"nowrap", position:"sticky", top:0,
}
const tdS: React.CSSProperties = {
  padding:"5px 8px", borderBottom:"1px solid #f0ede7", verticalAlign:"middle",
}
const inp = (extra?: React.CSSProperties): React.CSSProperties => ({
  width:"100%", padding:"4px 6px", border:"1px solid transparent", borderRadius:5,
  fontSize:12, background:"transparent", outline:"none",
  ...extra,
})
const addRowBtn: React.CSSProperties = {
  width:"100%", padding:"9px 14px", border:"none", borderTop:"1.5px dashed #e8e5de",
  background:"transparent", cursor:"pointer", fontSize:12, color:"#a8a59e",
  textAlign:"left", display:"flex", alignItems:"center", gap:6,
}
const delBtnS: React.CSSProperties = {
  width:22, height:22, borderRadius:4, border:"none", background:"transparent",
  cursor:"pointer", color:"#d1cec8", fontSize:16, lineHeight:1, padding:0,
}

const SUBJECT_CATEGORIES = ["Core","Language","Elective","Optional","Activity","Lab","CCA","Other"]

const ROOM_TYPES = ["Classroom","Lab","Computer Lab","Library","Hall","Gym","Staff Room","Other"]

function makeId() { return Math.random().toString(36).slice(2, 8) }

// ─── Component ───────────────────────────────────────────────
type Tab = "classes" | "teachers" | "subjects" | "rooms"

export function StepResources() {
  const store = useTimetableStore()
  const { config, sections, staff, subjects, setStep,
          setSections, setStaff, setSubjects } = store

  const [tab, setTab] = useState<Tab>("classes")
  const [rooms, setRooms] = useState<RoomRow[]>(() =>
    sections.map((s, i) => ({
      id: makeId(), name: s.room ?? `Room ${101 + i}`,
      type: "Classroom", capacity: 40, building: "Main Block", floor: "Ground"
    }))
  )

  // ── Regenerate all data ──────────────────────────────────────
  const handleRegenerate = () => {
    const orgType = config.orgType ?? "school"
    const cc      = config.countryCode ?? "IN"
    setSections(generateSections(orgType, cc, config.numSections))
    setStaff(generateStaff(orgType, cc, config.numStaff))
    setSubjects(generateSubjects(orgType, cc, config.numSubjects) as Subject[])
  }

  const handleContinue = () => setStep(4)

  const TAB_META: { key: Tab; label: string; count: number }[] = [
    { key:"classes",  label:"📚 Classes",  count: sections.length },
    { key:"teachers", label:"👤 Teachers", count: staff.length },
    { key:"subjects", label:"📖 Subjects", count: subjects.length },
    { key:"rooms",    label:"🏢 Rooms",    count: rooms.length },
  ]

  return (
    <div>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:6 }}>
        <div style={{ width:40, height:40, borderRadius:12, background:"linear-gradient(135deg,#059669,#047857)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>📋</div>
        <div>
          <h1 style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:28, margin:0 }}>Resources</h1>
          <p style={{ color:"#6a6860", fontSize:12, margin:0 }}>Step 3 of 6 — Classes, Teachers, Subjects & Rooms</p>
        </div>
      </div>
      <p style={{ color:"#6a6860", fontSize:13, marginBottom:16, lineHeight:1.7 }}>
        Schedu generated initial data based on your counts. Review and edit anything inline — click any cell to modify. Add or remove rows as needed.
      </p>

      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
        {/* Tabs */}
        <div style={{ display:"flex", borderBottom:"2px solid #e8e5de" }}>
          {TAB_META.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ padding:"8px 18px", border:"none", borderBottom: tab===t.key?"2px solid #059669":"2px solid transparent",
                marginBottom:-2, background:"transparent", fontSize:12,
                fontWeight: tab===t.key?700:500, color: tab===t.key?"#059669":"#6a6860", cursor:"pointer", whiteSpace:"nowrap" }}>
              {t.label}
              <span style={{ marginLeft:6, fontSize:10, fontWeight:400, background:"#f0ede7", padding:"1px 6px", borderRadius:10, color:"#6a6860" }}>{t.count}</span>
            </button>
          ))}
        </div>
        <button onClick={handleRegenerate}
          style={{ padding:"6px 14px", borderRadius:8, border:"1.5px solid #e8e5de", background:"#fff", fontSize:11, fontWeight:600, cursor:"pointer", color:"#6a6860", display:"flex", alignItems:"center", gap:6 }}>
          🔄 Regenerate All
        </button>
      </div>

      {/* ── CLASSES TAB ─────────────────────────────────────── */}
      {tab === "classes" && (
        <ClassesTable sections={sections} setSections={setSections} staff={staff} />
      )}

      {/* ── TEACHERS TAB ────────────────────────────────────── */}
      {tab === "teachers" && (
        <TeachersTable staff={staff} setStaff={setStaff} subjects={subjects} />
      )}

      {/* ── SUBJECTS TAB ────────────────────────────────────── */}
      {tab === "subjects" && (
        <SubjectsTable subjects={subjects} setSubjects={setSubjects} />
      )}

      {/* ── ROOMS TAB ───────────────────────────────────────── */}
      {tab === "rooms" && (
        <RoomsTable rooms={rooms} setRooms={setRooms} />
      )}

      {/* Footer */}
      <div style={{ display:"flex", justifyContent:"space-between", paddingTop:16, marginTop:8, borderTop:"1px solid #e8e5de" }}>
        <button onClick={() => setStep(2)}
          style={{ padding:"9px 18px", borderRadius:8, border:"1.5px solid #e8e5de", background:"#fff", fontSize:13, fontWeight:500, cursor:"pointer" }}>
          ← Back
        </button>
        <button onClick={handleContinue}
          style={{ padding:"11px 28px", borderRadius:9, border:"none", fontSize:14, fontWeight:600, cursor:"pointer", background:"#059669", color:"#fff" }}>
          Continue → Subject Hours
        </button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// CLASSES TABLE
// ═══════════════════════════════════════════════════════════════
function ClassesTable({ sections, setSections, staff }: {
  sections: any[]; setSections: (s: any[]) => void; staff: any[]
}) {
  const upd = (id: string, key: string, val: any) =>
    setSections(sections.map(s => s.id === id ? { ...s, [key]: val } : s))

  const addRow = () => setSections([...sections, {
    id: makeId(), name: `Class ${sections.length + 1}`,
    room: `Room ${101 + sections.length}`, grade: "", strength: 40, stream: "", classTeacher: ""
  }])

  const del = (id: string) => setSections(sections.filter(s => s.id !== id))

  return (
    <div style={{ border:"1.5px solid #e8e5de", borderRadius:12, overflow:"hidden" }}>
      <div style={{ overflowX:"auto", maxHeight:420, overflowY:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead><tr>
            <th style={{...thS, width:32}}>#</th>
            <th style={thS}>Class / Section</th>
            <th style={{...thS, width:100}}>Grade</th>
            <th style={{...thS, width:100}}>Stream</th>
            <th style={{...thS, width:80}}>Strength</th>
            <th style={{...thS, width:110}}>Room</th>
            <th style={thS}>Class Teacher</th>
            <th style={{...thS, width:28}}></th>
          </tr></thead>
          <tbody>
            {sections.map((s, i) => (
              <tr key={s.id} style={{ background: i%2===0?"#fff":"#fafaf9" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background="#f0fdf4"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background=i%2===0?"#fff":"#fafaf9"}>
                <td style={{...tdS, color:"#a8a59e", fontSize:10, fontFamily:"monospace", textAlign:"center"}}>{i+1}</td>
                <td style={tdS}>
                  <input style={inp({ fontWeight:600 })} value={s.name}
                    onChange={e => upd(s.id, "name", e.target.value)}
                    onFocus={e => (e.target as HTMLInputElement).style.borderColor="#059669"}
                    onBlur={e => (e.target as HTMLInputElement).style.borderColor="transparent"} />
                </td>
                <td style={tdS}>
                  <input style={inp()} value={s.grade ?? ""}
                    onChange={e => upd(s.id, "grade", e.target.value)}
                    placeholder="e.g. VI"
                    onFocus={e => (e.target as HTMLInputElement).style.borderColor="#059669"}
                    onBlur={e => (e.target as HTMLInputElement).style.borderColor="transparent"} />
                </td>
                <td style={tdS}>
                  <input style={inp()} value={s.stream ?? ""}
                    onChange={e => upd(s.id, "stream", e.target.value)}
                    placeholder="Science / Arts…"
                    onFocus={e => (e.target as HTMLInputElement).style.borderColor="#059669"}
                    onBlur={e => (e.target as HTMLInputElement).style.borderColor="transparent"} />
                </td>
                <td style={tdS}>
                  <input type="number" min={1} max={100} style={inp({ textAlign:"center", fontFamily:"monospace" })}
                    value={s.strength ?? 40}
                    onChange={e => upd(s.id, "strength", +e.target.value)}
                    onFocus={e => (e.target as HTMLInputElement).style.borderColor="#059669"}
                    onBlur={e => (e.target as HTMLInputElement).style.borderColor="transparent"} />
                </td>
                <td style={tdS}>
                  <input style={inp({ fontFamily:"monospace", fontSize:11 })} value={s.room ?? ""}
                    onChange={e => upd(s.id, "room", e.target.value)}
                    onFocus={e => (e.target as HTMLInputElement).style.borderColor="#059669"}
                    onBlur={e => (e.target as HTMLInputElement).style.borderColor="transparent"} />
                </td>
                <td style={tdS}>
                  <select style={inp({ fontSize:11 })} value={s.classTeacher ?? ""}
                    onChange={e => upd(s.id, "classTeacher", e.target.value)}>
                    <option value="">— Unassigned —</option>
                    {staff.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </td>
                <td style={tdS}>
                  <button style={delBtnS} onClick={() => del(s.id)} title="Delete">×</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button style={addRowBtn} onClick={addRow}>
        <span style={{ fontSize:16, lineHeight:1 }}>+</span> Add class / section
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// TEACHERS TABLE
// ═══════════════════════════════════════════════════════════════
function TeachersTable({ staff, setStaff, subjects }: {
  staff: any[]; setStaff: (s: any[]) => void; subjects: any[]
}) {
  const upd = (id: string, key: string, val: any) =>
    setStaff(staff.map(t => t.id === id ? { ...t, [key]: val } : t))

  const addRow = () => setStaff([...staff, {
    id: makeId(), name: `Teacher ${staff.length + 1}`,
    role: "Teacher", subjects: [], classes: [],
    isClassTeacher: "", maxPeriodsPerWeek: 30
  }])

  const del = (id: string) => setStaff(staff.filter(t => t.id !== id))

  const toggleSubject = (teacherId: string, subName: string) => {
    const t = staff.find(x => x.id === teacherId)
    if (!t) return
    const cur: string[] = t.subjects ?? []
    const next = cur.includes(subName) ? cur.filter((x: string) => x !== subName) : [...cur, subName]
    upd(teacherId, "subjects", next)
  }

  return (
    <div style={{ border:"1.5px solid #e8e5de", borderRadius:12, overflow:"hidden" }}>
      <div style={{ overflowX:"auto", maxHeight:420, overflowY:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead><tr>
            <th style={{...thS, width:32}}>#</th>
            <th style={thS}>Name</th>
            <th style={{...thS, width:90}}>Short</th>
            <th style={{...thS, width:100}}>Role</th>
            <th style={{...thS, width:220}}>Subjects Taught</th>
            <th style={{...thS, width:90}}>Max/Week</th>
            <th style={{...thS, width:28}}></th>
          </tr></thead>
          <tbody>
            {staff.map((t, i) => (
              <tr key={t.id} style={{ background: i%2===0?"#fff":"#fafaf9" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background="#f0f9ff"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background=i%2===0?"#fff":"#fafaf9"}>
                <td style={{...tdS, color:"#a8a59e", fontSize:10, fontFamily:"monospace", textAlign:"center"}}>{i+1}</td>
                <td style={tdS}>
                  <input style={inp({ fontWeight:600 })} value={t.name}
                    onChange={e => upd(t.id, "name", e.target.value)}
                    onFocus={e => (e.target as HTMLInputElement).style.borderColor="#4f46e5"}
                    onBlur={e => (e.target as HTMLInputElement).style.borderColor="transparent"} />
                </td>
                <td style={tdS}>
                  <input style={inp({ fontFamily:"monospace", fontSize:11, textTransform:"uppercase" as const })}
                    value={t.shortName ?? t.name?.slice(0,4).toUpperCase() ?? ""}
                    onChange={e => upd(t.id, "shortName", e.target.value.toUpperCase())}
                    maxLength={5}
                    onFocus={e => (e.target as HTMLInputElement).style.borderColor="#4f46e5"}
                    onBlur={e => (e.target as HTMLInputElement).style.borderColor="transparent"} />
                </td>
                <td style={tdS}>
                  <select style={inp({ fontSize:11 })} value={t.role ?? "Teacher"}
                    onChange={e => upd(t.id, "role", e.target.value)}>
                    {["Teacher","HoD","Coordinator","Principal","Vice Principal","Counsellor","Librarian","Lab Incharge"].map(r =>
                      <option key={r} value={r}>{r}</option>
                    )}
                  </select>
                </td>
                <td style={tdS}>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:3 }}>
                    {subjects.slice(0, 8).map((s: any) => {
                      const on = (t.subjects ?? []).includes(s.name)
                      return (
                        <span key={s.id} onClick={() => toggleSubject(t.id, s.name)}
                          style={{ padding:"2px 7px", borderRadius:20, fontSize:9, fontWeight:600, cursor:"pointer",
                            background: on?"#4f46e5":"#f0ede7", color: on?"#fff":"#6a6860",
                            border: on?"1px solid #4f46e5":"1px solid #e8e5de", userSelect:"none" }}>
                          {s.name}
                        </span>
                      )
                    })}
                    {subjects.length > 8 && (
                      <span style={{ padding:"2px 7px", borderRadius:20, fontSize:9, color:"#a8a59e" }}>+{subjects.length-8} more</span>
                    )}
                  </div>
                </td>
                <td style={tdS}>
                  <input type="number" min={1} max={45} style={inp({ textAlign:"center", fontFamily:"monospace" })}
                    value={t.maxPeriodsPerWeek ?? 30}
                    onChange={e => upd(t.id, "maxPeriodsPerWeek", +e.target.value)}
                    onFocus={e => (e.target as HTMLInputElement).style.borderColor="#4f46e5"}
                    onBlur={e => (e.target as HTMLInputElement).style.borderColor="transparent"} />
                </td>
                <td style={tdS}>
                  <button style={delBtnS} onClick={() => del(t.id)} title="Delete">×</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button style={addRowBtn} onClick={addRow}>
        <span style={{ fontSize:16, lineHeight:1 }}>+</span> Add teacher
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// SUBJECTS TABLE
// ═══════════════════════════════════════════════════════════════
function SubjectsTable({ subjects, setSubjects }: {
  subjects: any[]; setSubjects: (s: any[]) => void
}) {
  const upd = (id: string, key: string, val: any) =>
    setSubjects(subjects.map(s => s.id === id ? { ...s, [key]: val } : s))

  const addRow = () => setSubjects([...subjects, {
    id: makeId(), name: `Subject ${subjects.length + 1}`,
    shortName: `S${subjects.length + 1}`,
    category: "Core", isOptional: false, requiresLab: false,
    periodsPerWeek: 5, sessionDuration: 45, maxPeriodsPerDay: 2
  }])

  const del = (id: string) => setSubjects(subjects.filter(s => s.id !== id))

  return (
    <div style={{ border:"1.5px solid #e8e5de", borderRadius:12, overflow:"hidden" }}>
      <div style={{ overflowX:"auto", maxHeight:420, overflowY:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead><tr>
            <th style={{...thS, width:32}}>#</th>
            <th style={thS}>Subject Name</th>
            <th style={{...thS, width:80}}>Short</th>
            <th style={{...thS, width:120}}>Category</th>
            <th style={{...thS, width:70}}>Periods/wk</th>
            <th style={{...thS, width:70}}>Sess.min</th>
            <th style={{...thS, width:70}}>Max/day</th>
            <th style={{...thS, width:75}}>Optional</th>
            <th style={{...thS, width:65}}>Lab</th>
            <th style={{...thS, width:28}}></th>
          </tr></thead>
          <tbody>
            {subjects.map((s, i) => (
              <tr key={s.id} style={{ background: i%2===0?"#fff":"#fafaf9" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background="#fdf4ff"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background=i%2===0?"#fff":"#fafaf9"}>
                <td style={{...tdS, color:"#a8a59e", fontSize:10, fontFamily:"monospace", textAlign:"center"}}>{i+1}</td>
                <td style={tdS}>
                  <input style={inp({ fontWeight:600 })} value={s.name}
                    onChange={e => upd(s.id, "name", e.target.value)}
                    onFocus={e => (e.target as HTMLInputElement).style.borderColor="#7c3aed"}
                    onBlur={e => (e.target as HTMLInputElement).style.borderColor="transparent"} />
                </td>
                <td style={tdS}>
                  <input style={inp({ fontFamily:"monospace", fontSize:11, textTransform:"uppercase" as const })}
                    value={s.shortName ?? ""}
                    onChange={e => upd(s.id, "shortName", e.target.value.toUpperCase())}
                    maxLength={6}
                    onFocus={e => (e.target as HTMLInputElement).style.borderColor="#7c3aed"}
                    onBlur={e => (e.target as HTMLInputElement).style.borderColor="transparent"} />
                </td>
                <td style={tdS}>
                  <select style={inp({ fontSize:11 })} value={s.category ?? "Core"}
                    onChange={e => upd(s.id, "category", e.target.value)}>
                    {SUBJECT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </td>
                <td style={tdS}>
                  <input type="number" min={1} max={10} style={inp({ textAlign:"center", fontFamily:"monospace" })}
                    value={s.periodsPerWeek ?? 5}
                    onChange={e => upd(s.id, "periodsPerWeek", +e.target.value)}
                    onFocus={e => (e.target as HTMLInputElement).style.borderColor="#7c3aed"}
                    onBlur={e => (e.target as HTMLInputElement).style.borderColor="transparent"} />
                </td>
                <td style={tdS}>
                  <input type="number" min={20} max={120} style={inp({ textAlign:"center", fontFamily:"monospace" })}
                    value={s.sessionDuration ?? 45}
                    onChange={e => upd(s.id, "sessionDuration", +e.target.value)}
                    onFocus={e => (e.target as HTMLInputElement).style.borderColor="#7c3aed"}
                    onBlur={e => (e.target as HTMLInputElement).style.borderColor="transparent"} />
                </td>
                <td style={tdS}>
                  <input type="number" min={1} max={4} style={inp({ textAlign:"center", fontFamily:"monospace" })}
                    value={s.maxPeriodsPerDay ?? 2}
                    onChange={e => upd(s.id, "maxPeriodsPerDay", +e.target.value)}
                    onFocus={e => (e.target as HTMLInputElement).style.borderColor="#7c3aed"}
                    onBlur={e => (e.target as HTMLInputElement).style.borderColor="transparent"} />
                </td>
                <td style={{...tdS, textAlign:"center"}}>
                  <TogglePill on={s.isOptional ?? false} onColor="#7c3aed"
                    onChange={v => upd(s.id, "isOptional", v)} />
                </td>
                <td style={{...tdS, textAlign:"center"}}>
                  <TogglePill on={s.requiresLab ?? false} onColor="#0891b2"
                    onChange={v => upd(s.id, "requiresLab", v)} />
                </td>
                <td style={tdS}>
                  <button style={delBtnS} onClick={() => del(s.id)} title="Delete">×</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button style={addRowBtn} onClick={addRow}>
        <span style={{ fontSize:16, lineHeight:1 }}>+</span> Add subject
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// ROOMS TABLE
// ═══════════════════════════════════════════════════════════════
interface RoomRow {
  id: string
  name: string
  type: string
  capacity: number
  building: string
  floor: string
}

function RoomsTable({ rooms, setRooms }: {
  rooms: RoomRow[]; setRooms: (r: RoomRow[]) => void
}) {
  const upd = (id: string, key: string, val: any) =>
    setRooms(rooms.map(r => r.id === id ? { ...r, [key]: val } : r))

  const addRow = () => setRooms([...rooms, {
    id: makeId(), name: `Room ${101 + rooms.length}`,
    type: "Classroom", capacity: 40, building: "Main Block", floor: "Ground"
  }])

  const del = (id: string) => setRooms(rooms.filter(r => r.id !== id))

  return (
    <div style={{ border:"1.5px solid #e8e5de", borderRadius:12, overflow:"hidden" }}>
      <div style={{ overflowX:"auto", maxHeight:420, overflowY:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead><tr>
            <th style={{...thS, width:32}}>#</th>
            <th style={thS}>Room Name / Number</th>
            <th style={{...thS, width:150}}>Type</th>
            <th style={{...thS, width:90}}>Capacity</th>
            <th style={thS}>Building / Block</th>
            <th style={{...thS, width:110}}>Floor</th>
            <th style={{...thS, width:28}}></th>
          </tr></thead>
          <tbody>
            {rooms.map((r, i) => (
              <tr key={r.id} style={{ background: i%2===0?"#fff":"#fafaf9" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background="#f0f9ff"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background=i%2===0?"#fff":"#fafaf9"}>
                <td style={{...tdS, color:"#a8a59e", fontSize:10, fontFamily:"monospace", textAlign:"center"}}>{i+1}</td>
                <td style={tdS}>
                  <input style={inp({ fontWeight:600, fontFamily:"monospace" })} value={r.name}
                    onChange={e => upd(r.id, "name", e.target.value)}
                    onFocus={e => (e.target as HTMLInputElement).style.borderColor="#0891b2"}
                    onBlur={e => (e.target as HTMLInputElement).style.borderColor="transparent"} />
                </td>
                <td style={tdS}>
                  <select style={inp({ fontSize:11 })} value={r.type}
                    onChange={e => upd(r.id, "type", e.target.value)}>
                    {ROOM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </td>
                <td style={tdS}>
                  <input type="number" min={1} max={500} style={inp({ textAlign:"center", fontFamily:"monospace" })}
                    value={r.capacity}
                    onChange={e => upd(r.id, "capacity", +e.target.value)}
                    onFocus={e => (e.target as HTMLInputElement).style.borderColor="#0891b2"}
                    onBlur={e => (e.target as HTMLInputElement).style.borderColor="transparent"} />
                </td>
                <td style={tdS}>
                  <input style={inp()} value={r.building}
                    onChange={e => upd(r.id, "building", e.target.value)}
                    placeholder="Main Block, Science Wing…"
                    onFocus={e => (e.target as HTMLInputElement).style.borderColor="#0891b2"}
                    onBlur={e => (e.target as HTMLInputElement).style.borderColor="transparent"} />
                </td>
                <td style={tdS}>
                  <select style={inp({ fontSize:11 })} value={r.floor}
                    onChange={e => upd(r.id, "floor", e.target.value)}>
                    {["Ground","1st Floor","2nd Floor","3rd Floor","Basement","Terrace"].map(f =>
                      <option key={f} value={f}>{f}</option>
                    )}
                  </select>
                </td>
                <td style={tdS}>
                  <button style={delBtnS} onClick={() => del(r.id)} title="Delete">×</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button style={addRowBtn} onClick={addRow}>
        <span style={{ fontSize:16, lineHeight:1 }}>+</span> Add room
      </button>
    </div>
  )
}

// ─── Toggle Pill ──────────────────────────────────────────────
function TogglePill({ on, onColor, onChange }: {
  on: boolean; onColor: string; onChange: (v: boolean) => void
}) {
  return (
    <button onClick={() => onChange(!on)}
      style={{ width:36, height:20, borderRadius:10, border:"none", cursor:"pointer",
        background: on ? onColor : "#e8e5de", position:"relative", transition:"background 0.15s" }}>
      <span style={{ position:"absolute", top:2, left: on?18:2, width:16, height:16, borderRadius:"50%",
        background:"#fff", transition:"left 0.15s", boxShadow:"0 1px 3px rgba(0,0,0,0.2)" }} />
    </button>
  )
}
