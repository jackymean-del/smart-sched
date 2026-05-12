import { useState } from "react"
import { useTimetableStore } from "@/store/timetableStore"
import { ORG_CONFIGS, getCountry } from "@/lib/orgData"
import { autoAssign } from "@/lib/aiEngine"

type Tab = "matrix" | "staff"

// Get unique class names (without sections) e.g. ["Nursery","LKG","I","II"...]
function getBaseClasses(sections: { name: string }[]): string[] {
  const bases = sections.map(s => {
    const match = s.name.match(/^(.+?)[-\s][A-E]$/)
    return match ? match[1].trim() : s.name
  })
  return [...new Set(bases)]
}

// Get sections for a base class
function getSectionsForClass(sections: { name: string }[], baseClass: string): string[] {
  return sections
    .filter(s => s.name === baseClass || s.name.startsWith(baseClass + '-') || s.name.startsWith(baseClass + ' '))
    .map(s => s.name)
}

export function Step6Assign() {
  const { config, sections, staff, subjects, setSections, setStaff, setSubjects, setStep } = useTimetableStore()
  const [tab, setTab] = useState<Tab>("matrix")
  const [allocated, setAllocated] = useState(false)
  const org     = ORG_CONFIGS[config.orgType ?? "school"]
  const country = getCountry(config.countryCode ?? "IN")
  const baseClasses = getBaseClasses(sections)

  // ── Matrix: toggle subject for ALL sections of a class ──
  const toggleSubForAllSections = (subIdx: number, baseClass: string, checked: boolean) => {
    const classSections = getSectionsForClass(sections, baseClass)
    const updated = [...subjects]
    const current = updated[subIdx].sections ?? []
    if (checked) {
      const newSecs = [...new Set([...current, ...classSections])]
      updated[subIdx] = { ...updated[subIdx], sections: newSecs }
    } else {
      updated[subIdx] = { ...updated[subIdx], sections: current.filter(s => !classSections.includes(s)) }
    }
    setSubjects(updated)
  }

  // Check if subject is assigned to ALL sections of a class
  const isAllChecked = (subIdx: number, baseClass: string) => {
    const classSections = getSectionsForClass(sections, baseClass)
    const assigned = subjects[subIdx].sections ?? []
    return classSections.length > 0 && classSections.every(s => assigned.includes(s))
  }
  const isSomeChecked = (subIdx: number, baseClass: string) => {
    const classSections = getSectionsForClass(sections, baseClass)
    const assigned = subjects[subIdx].sections ?? []
    return classSections.some(s => assigned.includes(s)) && !isAllChecked(subIdx, baseClass)
  }

  // ── Staff: get subjects available for a teacher based on their assigned classes ──
  const getSubjectsForTeacher = (stIdx: number) => {
    const teacherClasses = staff[stIdx].classes ?? []
    if (!teacherClasses.length) return subjects
    // Show subjects assigned to any of the teacher's classes
    return subjects.filter(sub => {
      const subSections = sub.sections ?? []
      return teacherClasses.some(cls => {
        const secs = getSectionsForClass(sections, cls)
        return secs.some(s => subSections.includes(s)) || subSections.length === 0
      })
    })
  }

  // ── AI Auto-allocate sections to teachers ──
  const handleAutoAllocate = () => {
    // For each teacher, expand their class assignments to include all sections
    const updatedStaff = staff.map(st => {
      const expandedClasses: string[] = []
      ;(st.classes ?? []).forEach(cls => {
        const secs = getSectionsForClass(sections, cls)
        if (secs.length > 0) {
          expandedClasses.push(...secs)
        } else {
          expandedClasses.push(cls)
        }
      })
      return { ...st, classes: [...new Set(expandedClasses)] }
    })
    setStaff(updatedStaff)
    setAllocated(true)
  }

  const overloaded = staff.filter(st => {
    const load = (st.subjects ?? []).reduce((a, sn) => {
      return a + (subjects.find(x => x.name === sn)?.periodsPerWeek ?? 2)
    }, 0) * Math.max(1, st.classes?.length ?? 1)
    return load > (st.maxPeriodsPerWeek ?? country.maxPeriodsWeek)
  })

  const thS: React.CSSProperties = { padding:"8px 10px", background:"#f7f6f2", fontSize:10, fontWeight:700, textTransform:"uppercase" as const, letterSpacing:"0.06em", color:"#a8a59e", textAlign:"left" as const, borderBottom:"1px solid #e8e5de", whiteSpace:"nowrap" as const }
  const tdS: React.CSSProperties = { padding:"7px 10px", borderBottom:"1px solid #f0ede7", verticalAlign:"middle", fontSize:11 }

  return (
    <div>
      <h1 style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:28, marginBottom:8 }}>
        Assign {org.subjectsLabel} & {org.staffsLabel}
      </h1>
      <p style={{ color:"#6a6860", fontSize:13, marginBottom:16, lineHeight:1.65 }}>
        Step 1: Assign which {org.subjectsLabel.toLowerCase()} apply to which classes.<br />
        Step 2: Assign {org.staffsLabel.toLowerCase()} to classes + subjects → then Auto-allocate sections.
      </p>

      {/* Tabs */}
      <div style={{ display:"flex", borderBottom:"2px solid #e8e5de", marginBottom:16 }}>
        {([["matrix", `Step 1: ${org.subjectLabel} → Class Matrix`],["staff",`Step 2: ${org.staffLabel} Assignments`]] as [Tab,string][]).map(([t,l]) => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding:"9px 18px", border:"none", borderBottom: tab===t?"2px solid #4f46e5":"2px solid transparent", marginBottom:-2, background:"transparent", fontSize:12, fontWeight: tab===t?700:500, color: tab===t?"#4f46e5":"#6a6860", cursor:"pointer", whiteSpace:"nowrap" as const }}>
            {t === "matrix" ? "1️⃣ " : "2️⃣ "}{l}
          </button>
        ))}
      </div>

      {/* ── MATRIX TAB ── */}
      {tab === "matrix" && (
        <div>
          <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap" as const }}>
            <button onClick={() => setSubjects(subjects.map(s => ({ ...s, sections: sections.map(x => x.name) })))}
              style={{ padding:"7px 14px", borderRadius:7, border:"1.5px solid #e8e5de", background:"#fff", fontSize:12, fontWeight:500, cursor:"pointer" }}>
              ✅ Check All
            </button>
            <button onClick={() => setSubjects(subjects.map(s => ({ ...s, sections: [] })))}
              style={{ padding:"7px 14px", borderRadius:7, border:"1.5px solid #e8e5de", background:"#fff", fontSize:12, fontWeight:500, cursor:"pointer" }}>
              ☐ Clear All
            </button>
            <div style={{ flex:1, background:"#eaecf8", borderRadius:7, padding:"7px 12px", fontSize:11, color:"#3730a3" }}>
              💡 Click the subject name to assign to ALL classes at once. Use checkboxes per class column. "All" button assigns to all sections of that class.
            </div>
          </div>

          <div style={{ overflowX:"auto", border:"1.5px solid #e8e5de", borderRadius:12 }}>
            <table style={{ borderCollapse:"collapse", fontSize:11, minWidth:"100%" }}>
              <thead>
                <tr>
                  <th style={{ ...thS, minWidth:160, position:"sticky" as const, left:0, background:"#f7f6f2", zIndex:1 }}>
                    {org.subjectLabel} / Freq
                  </th>
                  {baseClasses.map(cls => (
                    <th key={cls} style={{ ...thS, textAlign:"center" as const, minWidth:80 }}>
                      {cls}
                      <div style={{ fontSize:9, color:"#c8c5bc", fontWeight:400, marginTop:2 }}>
                        {getSectionsForClass(sections, cls).length} sec.
                      </div>
                    </th>
                  ))}
                  <th style={{ ...thS, textAlign:"center" as const, minWidth:60, background:"#f0fdf4", color:"#059669" }}>
                    All Classes
                  </th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((sub, si) => (
                  <tr key={sub.id} style={{ background: si%2===0?"#fff":"#fafaf9" }}>
                    <td style={{ ...tdS, position:"sticky" as const, left:0, background: si%2===0?"#fff":"#fafaf9", fontWeight:500, zIndex:1 }}>
                      <div style={{ cursor:"pointer", color:"#1c1b18" }}
                        onClick={() => setSubjects(subjects.map((s,i) => i===si ? { ...s, sections: sections.map(x=>x.name) } : s))}>
                        {sub.name}
                      </div>
                      <div style={{ fontSize:10, fontFamily:"monospace", color:"#a8a59e" }}>{sub.periodsPerWeek}×/wk</div>
                    </td>
                    {baseClasses.map(cls => {
                      const allChecked = isAllChecked(si, cls)
                      const someChecked = isSomeChecked(si, cls)
                      const secCount = getSectionsForClass(sections, cls).length
                      return (
                        <td key={cls} style={{ ...tdS, textAlign:"center" as const }}>
                          <div style={{ display:"flex", flexDirection:"column" as const, alignItems:"center", gap:3 }}>
                            <input type="checkbox"
                              checked={allChecked}
                              ref={el => { if (el) el.indeterminate = someChecked }}
                              onChange={e => toggleSubForAllSections(si, cls, e.target.checked)}
                              style={{ width:14, height:14, accentColor:"#059669", cursor:"pointer" }}
                              title={`Assign ${sub.name} to all ${secCount} ${cls} sections`}
                            />
                            {secCount > 1 && (
                              <span style={{ fontSize:8, color: allChecked?"#059669":someChecked?"#d97706":"#a8a59e" }}>
                                {allChecked ? "All" : someChecked ? "Some" : ""}
                              </span>
                            )}
                          </div>
                        </td>
                      )
                    })}
                    {/* Assign to ALL classes */}
                    <td style={{ ...tdS, textAlign:"center" as const, background: si%2===0?"#f0fdf4":"#ecfdf5" }}>
                      <button
                        onClick={() => setSubjects(subjects.map((s,i) => i===si ? { ...s, sections: sections.map(x=>x.name) } : s))}
                        style={{ fontSize:10, padding:"2px 8px", borderRadius:4, border:"1px solid #86efac", background:"#fff", color:"#059669", cursor:"pointer", fontWeight:600, whiteSpace:"nowrap" as const }}>
                        + All
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop:12, padding:"8px 12px", background:"#f7f6f2", borderRadius:8, fontSize:11, color:"#6a6860" }}>
            ℹ️ Checking a class column assigns the subject to <strong>all sections</strong> of that class (e.g. checking "I" assigns to I-A, I-B, I-C automatically). Use indeterminate (—) state to check some sections manually.
          </div>

          <div style={{ display:"flex", justifyContent:"flex-end", marginTop:16 }}>
            <button onClick={() => setTab("staff")}
              style={{ padding:"9px 20px", borderRadius:8, border:"none", background:"#4f46e5", color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer" }}>
              Continue to {org.staffLabel} Assignments →
            </button>
          </div>
        </div>
      )}

      {/* ── STAFF TAB ── */}
      {tab === "staff" && (
        <div>
          {/* Workflow explanation */}
          <div style={{ background:"#f0fdf4", border:"1.5px solid #86efac", borderRadius:10, padding:"12px 16px", marginBottom:16, fontSize:12, color:"#14532d" }}>
            <div style={{ fontWeight:700, marginBottom:6 }}>📋 How to assign:</div>
            <div style={{ lineHeight:1.7 }}>
              1. For each {org.staffLabel.toLowerCase()}: select <strong>Classes</strong> (e.g. "I", "II") — not sections<br/>
              2. The <strong>Subjects</strong> column will show only subjects assigned to those classes<br/>
              3. Select which subjects this {org.staffLabel.toLowerCase()} teaches<br/>
              4. Click <strong>🤖 Auto-allocate Sections</strong> — AI assigns specific sections (I-A, I-B etc.)<br/>
              5. Review and edit final allocations, then generate timetable
            </div>
          </div>

          {/* Auto-allocate button */}
          {!allocated ? (
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16, padding:"12px 16px", background:"#eaecf8", borderRadius:10, border:"1.5px solid #c7d2fe" }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:600, color:"#3730a3" }}>🤖 Auto-allocate Sections</div>
                <div style={{ fontSize:11, color:"#4f46e5", marginTop:2 }}>
                  After assigning classes (without sections) to {org.staffsLabel.toLowerCase()}, click to let AI distribute specific sections automatically.
                </div>
              </div>
              <button onClick={handleAutoAllocate}
                style={{ padding:"9px 18px", borderRadius:8, border:"none", background:"#4f46e5", color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap" as const }}>
                🤖 Auto-allocate Sections
              </button>
            </div>
          ) : (
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16, padding:"10px 14px", background:"#f0fdf4", borderRadius:10, border:"1px solid #86efac" }}>
              <span style={{ fontSize:16 }}>✅</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, fontWeight:600, color:"#14532d" }}>Sections auto-allocated!</div>
                <div style={{ fontSize:11, color:"#059669" }}>AI has distributed sections to {org.staffsLabel.toLowerCase()}. Review below and edit as needed.</div>
              </div>
              <button onClick={() => { handleAutoAllocate() }}
                style={{ padding:"5px 12px", borderRadius:6, border:"1px solid #86efac", background:"#fff", fontSize:11, color:"#059669", cursor:"pointer", fontWeight:600 }}>
                Re-allocate
              </button>
            </div>
          )}

          {/* Staff cards */}
          <div style={{ display:"flex", flexDirection:"column" as const, gap:10 }}>
            {staff.map((st, i) => {
              const availableSubjects = getSubjectsForTeacher(i)
              const load = (st.subjects ?? []).reduce((a, sn) => a + (subjects.find(x=>x.name===sn)?.periodsPerWeek??2), 0) * Math.max(1, (st.classes??[]).length)
              const maxP = st.maxPeriodsPerWeek ?? country.maxPeriodsWeek
              const pct = Math.min(150, Math.round(load / maxP * 100))
              const barColor = pct>100?"#ef4444":pct>85?"#f59e0b":"#059669"

              return (
                <div key={st.id} style={{ border:"1.5px solid #e8e5de", borderRadius:10, overflow:"hidden" }}>
                  {/* Teacher header */}
                  <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background:"#f7f6f2", borderBottom:"1px solid #e8e5de" }}>
                    <div style={{ width:32, height:32, borderRadius:"50%", background:"#4f46e5", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, flexShrink:0 }}>
                      {i+1}
                    </div>
                    <div style={{ flex:1 }}>
                      <input value={st.name}
                        onChange={e=>{const n=[...staff];n[i]={...n[i],name:e.target.value};setStaff(n)}}
                        style={{ fontSize:13, fontWeight:600, background:"transparent", border:"none", outline:"none", width:"100%", color:"#1c1b18" }} />
                      {st.isClassTeacher && <div style={{ fontSize:10, color:"#059669" }}>★ Class Teacher: {st.isClassTeacher}</div>}
                    </div>
                    {/* Workload bar */}
                    <div style={{ textAlign:"right" as const, flexShrink:0 }}>
                      <div style={{ fontSize:11, fontFamily:"monospace", color:"#1c1b18" }}>{load}/{maxP}</div>
                      <div style={{ width:80, height:5, background:"#e8e5de", borderRadius:3, marginTop:3, overflow:"hidden" }}>
                        <div style={{ height:"100%", width:`${Math.min(100,pct)}%`, background:barColor, borderRadius:3, transition:"width 0.3s" }} />
                      </div>
                      <div style={{ fontSize:9, color:"#a8a59e", marginTop:2 }}>{pct}% loaded</div>
                    </div>
                  </div>

                  {/* Assignment columns */}
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:0 }}>
                    {/* Column 1: Classes (base, no sections) */}
                    <div style={{ padding:"10px 12px", borderRight:"1px solid #f0ede7" }}>
                      <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase" as const, letterSpacing:"0.06em", color:"#a8a59e", marginBottom:6 }}>
                        Classes (no sections)
                      </div>
                      <div style={{ fontSize:10, color:"#6a6860", marginBottom:6 }}>
                        Select class groups. AI will assign sections later.
                      </div>
                      <div style={{ display:"flex", flexDirection:"column" as const, gap:3, maxHeight:120, overflowY:"auto" }}>
                        {baseClasses.map(cls => {
                          const checked = (st.classes ?? []).includes(cls)
                          return (
                            <label key={cls} style={{ display:"flex", alignItems:"center", gap:6, cursor:"pointer", padding:"3px 6px", borderRadius:5, background: checked?"#eaecf8":"transparent" }}>
                              <input type="checkbox" checked={checked} style={{ accentColor:"#4f46e5", width:13, height:13 }}
                                onChange={e => {
                                  const n=[...staff]
                                  const cur = n[i].classes ?? []
                                  n[i] = { ...n[i], classes: e.target.checked ? [...cur, cls] : cur.filter(c=>c!==cls) }
                                  setStaff(n)
                                  setAllocated(false) // reset allocation when classes change
                                }} />
                              <span style={{ fontSize:12, fontWeight: checked?600:400, color: checked?"#3730a3":"#1c1b18" }}>{cls}</span>
                              <span style={{ fontSize:9, color:"#a8a59e", marginLeft:"auto" }}>
                                {getSectionsForClass(sections, cls).length} sec.
                              </span>
                            </label>
                          )
                        })}
                      </div>
                      {allocated && (st.classes ?? []).length > 0 && (
                        <div style={{ marginTop:8, padding:"4px 8px", background:"#f0fdf4", borderRadius:5, fontSize:10, color:"#059669" }}>
                          ✓ Allocated: {sections.filter(s => (st.classes??[]).some(c => s.name===c || s.name.startsWith(c+'-') || s.name.startsWith(c+' '))).map(s=>s.name).join(", ")}
                        </div>
                      )}
                    </div>

                    {/* Column 2: Subjects for those classes */}
                    <div style={{ padding:"10px 12px" }}>
                      <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase" as const, letterSpacing:"0.06em", color:"#a8a59e", marginBottom:6 }}>
                        {org.subjectsLabel} to Teach
                      </div>
                      <div style={{ fontSize:10, color:"#6a6860", marginBottom:6 }}>
                        {(st.classes??[]).length === 0 ? "← Assign classes first to see relevant subjects" : `Subjects for: ${(st.classes??[]).join(", ")}`}
                      </div>
                      <div style={{ display:"flex", flexDirection:"column" as const, gap:3, maxHeight:120, overflowY:"auto" }}>
                        {((st.classes??[]).length === 0 ? subjects : availableSubjects).map(sub => {
                          const checked = (st.subjects ?? []).includes(sub.name)
                          return (
                            <label key={sub.id} style={{ display:"flex", alignItems:"center", gap:6, cursor:"pointer", padding:"3px 6px", borderRadius:5, background: checked?"#f0fdf4":"transparent", opacity:(st.classes??[]).length===0?0.4:1 }}>
                              <input type="checkbox" checked={checked} disabled={(st.classes??[]).length===0} style={{ accentColor:"#059669", width:13, height:13 }}
                                onChange={e => {
                                  const n=[...staff]
                                  const cur = n[i].subjects ?? []
                                  n[i] = { ...n[i], subjects: e.target.checked ? [...cur, sub.name] : cur.filter(s=>s!==sub.name) }
                                  setStaff(n)
                                }} />
                              <span style={{ fontSize:12, fontWeight: checked?600:400, color: checked?"#14532d":"#1c1b18" }}>{sub.name}</span>
                              <span style={{ fontSize:9, color:"#a8a59e", marginLeft:"auto", fontFamily:"monospace" }}>{sub.periodsPerWeek}×</span>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {overloaded.length > 0 && (
            <div style={{ background:"#fffbeb", border:"1px solid #fcd34d", borderRadius:8, padding:"10px 14px", fontSize:12, color:"#92400e", marginTop:12 }}>
              ⚠️ <strong>{overloaded.length} overloaded:</strong> {overloaded.map(s=>s.name).join(", ")}
            </div>
          )}
        </div>
      )}

      <div style={{ display:"flex", justifyContent:"space-between", paddingTop:16, borderTop:"1px solid #e8e5de", marginTop:16 }}>
        <button onClick={() => setStep(5)} style={{ padding:"9px 18px", borderRadius:8, border:"1.5px solid #e8e5de", background:"#fff", fontSize:13, fontWeight:500, cursor:"pointer" }}>← Back</button>
        <button onClick={() => setStep(7)}
          style={{ padding:"9px 18px", borderRadius:8, border:"none", background:"#059669", color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
          ✨ Generate Timetable →
        </button>
      </div>
    </div>
  )
}
