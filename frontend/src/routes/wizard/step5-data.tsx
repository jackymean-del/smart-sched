import { useEffect, useState } from "react"
import { useTimetableStore } from "@/store/timetableStore"
import { generateSections, generateStaff, generateSubjects, generateBreaks, ORG_CONFIGS, getCountry } from "@/lib/orgData"

type Tab = "sections" | "staff" | "subjects" | "breaks"

const S = {
  label: { fontSize:11, fontWeight:700, textTransform:'uppercase' as const, letterSpacing:'0.06em', color:'#a8a59e', marginBottom:6 },
  input: { width:'100%', padding:'5px 8px', border:'1px solid transparent', borderRadius:6, fontSize:12, background:'transparent', outline:'none' },
  delBtn: { width:24, height:24, borderRadius:4, border:'none', background:'transparent', cursor:'pointer', color:'#c8c5bc', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' } as React.CSSProperties,
  addRow: { width:'100%', padding:'8px 14px', border:'none', borderTop:'1.5px dashed #e8e5de', background:'transparent', cursor:'pointer', fontSize:12, color:'#a8a59e', textAlign:'left' as const },
  navBtn: (primary: boolean) => ({
    padding:'9px 18px', borderRadius:8, border: primary?'none':'1.5px solid #e8e5de',
    background: primary?'#059669':'#fff', color: primary?'#fff':'#1c1b18',
    fontSize:13, fontWeight:600, cursor:'pointer',
  }),
}

export function Step5Data() {
  const { config, sections, staff, subjects, breaks,
          setSections, setStaff, setSubjects, setBreaks, setStep } = useTimetableStore()
  const [tab, setTab] = useState<Tab>("sections")
  const org     = ORG_CONFIGS[config.orgType ?? "school"]
  const country = getCountry(config.countryCode ?? "IN")

  useEffect(() => {
    if (!sections.length) {
      setSections(generateSections(config.orgType ?? "school", config.countryCode ?? "IN", config.numSections))
      setStaff(generateStaff(config.orgType ?? "school", config.countryCode ?? "IN", config.numStaff))
      setSubjects(generateSubjects(config.orgType ?? "school", config.countryCode ?? "IN", config.numSubjects))
      setBreaks(generateBreaks(config.orgType ?? "school", config.numBreaks))
    }
  }, [])

  const TABS: { key: Tab; label: string }[] = [
    { key:"sections", label:`📚 ${org.sectionsLabel}` },
    { key:"staff",    label:`👤 ${org.staffsLabel}` },
    { key:"subjects", label:`📖 ${org.subjectsLabel}` },
    { key:"breaks",   label:"⏱ Breaks" },
  ]

  const tdStyle: React.CSSProperties = { padding:'4px 6px', borderBottom:'1px solid #f0ede7', verticalAlign:'middle' }
  const thStyle: React.CSSProperties = { padding:'8px 6px', background:'#f7f6f2', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'#a8a59e', textAlign:'left', borderBottom:'1px solid #e8e5de' }

  return (
    <div>
      <h1 style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:28, marginBottom:8 }}>Review & edit generated data</h1>
      <p style={{ color:'#6a6860', fontSize:13, marginBottom:14, lineHeight:1.65 }}>
        AI generated {sections.length} {org.sectionsLabel.toLowerCase()}, {staff.length} {org.staffsLabel.toLowerCase()}, {subjects.length} {org.subjectsLabel.toLowerCase()} based on {country.name} norms. Edit anything inline.
      </p>
      <div style={{ background:'#eaecf8', borderLeft:'4px solid #4f46e5', borderRadius:'0 8px 8px 0', padding:'8px 14px', marginBottom:18, fontSize:12, color:'#3730a3' }}>
        🪄 Click any field to edit. Add or delete rows as needed.
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', borderBottom:'2px solid #e8e5de', marginBottom:16, gap:0 }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ padding:'8px 16px', border:'none', borderBottom: tab===t.key?'2px solid #4f46e5':'2px solid transparent', marginBottom:-2, background:'transparent', fontSize:12, fontWeight: tab===t.key?700:500, color: tab===t.key?'#4f46e5':'#6a6860', cursor:'pointer', whiteSpace:'nowrap' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ border:'1.5px solid #e8e5de', borderRadius:12, overflow:'hidden', marginBottom:16 }}>
        {tab === "sections" && (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr>
              <th style={thStyle}>#</th>
              <th style={thStyle}>{org.sectionLabel}</th>
              <th style={thStyle}>{org.roomLabel}</th>
              <th style={thStyle}>Grade/Type</th>
              <th style={thStyle}>Class Teacher</th>
              <th style={thStyle}></th>
            </tr></thead>
            <tbody>
              {sections.map((s, i) => (
                <tr key={s.id}>
                  <td style={{...tdStyle, color:'#a8a59e', fontSize:10, fontFamily:'monospace', width:32}}>{i+1}</td>
                  <td style={tdStyle}><input style={S.input} value={s.name} onChange={e=>{const n=[...sections];n[i]={...n[i],name:e.target.value};setSections(n)}} /></td>
                  <td style={tdStyle}><input style={S.input} value={s.room??""} onChange={e=>{const n=[...sections];n[i]={...n[i],room:e.target.value};setSections(n)}} /></td>
                  <td style={tdStyle}><input style={S.input} value={s.grade??""} onChange={e=>{const n=[...sections];n[i]={...n[i],grade:e.target.value};setSections(n)}} /></td>
                  <td style={tdStyle}>
                    <select style={{ fontSize:11, border:'1px solid #e8e5de', borderRadius:6, padding:'4px 6px', width:'100%', background:'#fff' }}
                      value={s.classTeacher??""} onChange={e=>{const n=[...sections];n[i]={...n[i],classTeacher:e.target.value};setSections(n)}}>
                      <option value="">— None —</option>
                      {staff.map(st=><option key={st.id} value={st.name}>{st.name}</option>)}
                    </select>
                  </td>
                  <td style={tdStyle}><button style={S.delBtn} onClick={()=>setSections(sections.filter((_,j)=>j!==i))}>×</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === "staff" && (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr>
              <th style={thStyle}>#</th>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Max/week</th>
              <th style={thStyle}>Role</th>
              <th style={thStyle}></th>
            </tr></thead>
            <tbody>
              {staff.map((s, i) => (
                <tr key={s.id}>
                  <td style={{...tdStyle, color:'#a8a59e', fontSize:10, fontFamily:'monospace', width:32}}>{i+1}</td>
                  <td style={tdStyle}>
                    <input style={S.input} value={s.name} onChange={e=>{const n=[...staff];n[i]={...n[i],name:e.target.value};setStaff(n)}} />
                    {s.isClassTeacher && <span style={{ fontSize:10, color:'#059669', marginLeft:4 }}>★ CT: {s.isClassTeacher}</span>}
                  </td>
                  <td style={tdStyle}><input type="number" style={{...S.input, fontFamily:'monospace', width:60}} value={s.maxPeriodsPerWeek} onChange={e=>{const n=[...staff];n[i]={...n[i],maxPeriodsPerWeek:+e.target.value};setStaff(n)}} /></td>
                  <td style={tdStyle}><input style={S.input} value={s.role} onChange={e=>{const n=[...staff];n[i]={...n[i],role:e.target.value};setStaff(n)}} /></td>
                  <td style={tdStyle}><button style={S.delBtn} onClick={()=>setStaff(staff.filter((_,j)=>j!==i))}>×</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === "subjects" && (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr>
              <th style={thStyle}>#</th>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Per./week</th>
              <th style={thStyle}></th>
            </tr></thead>
            <tbody>
              {subjects.map((s, i) => (
                <tr key={s.id}>
                  <td style={{...tdStyle, color:'#a8a59e', fontSize:10, fontFamily:'monospace', width:32}}>{i+1}</td>
                  <td style={tdStyle}><input style={S.input} value={s.name} onChange={e=>{const n=[...subjects];n[i]={...n[i],name:e.target.value};setSubjects(n)}} /></td>
                  <td style={tdStyle}><input type="number" style={{...S.input, fontFamily:'monospace', width:60}} value={s.periodsPerWeek} onChange={e=>{const n=[...subjects];n[i]={...n[i],periodsPerWeek:+e.target.value};setSubjects(n)}} /></td>
                  <td style={tdStyle}><button style={S.delBtn} onClick={()=>setSubjects(subjects.filter((_,j)=>j!==i))}>×</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === "breaks" && (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr>
              <th style={thStyle}>#</th>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Duration</th>
              <th style={thStyle}>Type</th>
              <th style={thStyle}>Shiftable</th>
              <th style={thStyle}></th>
            </tr></thead>
            <tbody>
              {breaks.map((b, i) => (
                <tr key={b.id}>
                  <td style={{...tdStyle, color:'#a8a59e', fontSize:10, fontFamily:'monospace', width:32}}>{i+1}</td>
                  <td style={tdStyle}><input style={S.input} value={b.name} onChange={e=>{const n=[...breaks];n[i]={...n[i],name:e.target.value};setBreaks(n)}} /></td>
                  <td style={tdStyle}>
                    <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                      <input type="number" style={{...S.input, fontFamily:'monospace', width:50}} value={b.duration} onChange={e=>{const n=[...breaks];n[i]={...n[i],duration:+e.target.value};setBreaks(n)}} />
                      <span style={{ fontSize:10, color:'#a8a59e' }}>min</span>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <select style={{ fontSize:11, border:'1px solid #e8e5de', borderRadius:6, padding:'4px 6px', background:'#fff' }}
                      value={b.type} onChange={e=>{const n=[...breaks];n[i]={...n[i],type:e.target.value as any};setBreaks(n)}}>
                      {["fixed-start","break","lunch","fixed-end"].map(t=><option key={t}>{t}</option>)}
                    </select>
                  </td>
                  <td style={{...tdStyle, textAlign:'center'}}>
                    <input type="checkbox" checked={b.shiftable} onChange={e=>{const n=[...breaks];n[i]={...n[i],shiftable:e.target.checked};setBreaks(n)}} style={{ width:14, height:14, accentColor:'#059669' }} />
                  </td>
                  <td style={tdStyle}><button style={S.delBtn} onClick={()=>setBreaks(breaks.filter((_,j)=>j!==i))}>×</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <button style={S.addRow} onClick={() => {
          if(tab==="sections") setSections([...sections,{id:crypto.randomUUID(),name:`New ${org.sectionLabel}`,room:`${country.roomPrefix} ${country.roomStart+sections.length}`,grade:"",classTeacher:""}])
          else if(tab==="staff") setStaff([...staff,{id:crypto.randomUUID(),name:`New ${org.staffLabel}`,role:org.staffLabel,subjects:[],classes:[],isClassTeacher:"",maxPeriodsPerWeek:country.maxPeriodsWeek}])
          else if(tab==="subjects") setSubjects([...subjects,{id:crypto.randomUUID(),name:`New ${org.subjectLabel}`,periodsPerWeek:2,color:"bg-gray-100 text-gray-700",sections:[]}])
          else setBreaks([...breaks,{id:`br_${Date.now()}`,name:"New Break",duration:15,type:"break" as const,shiftable:true}])
        }}>
          ＋ Add {tab==="sections"?org.sectionLabel:tab==="staff"?org.staffLabel:tab==="subjects"?org.subjectLabel:"break / special slot"}
        </button>
      </div>

      <div style={{ display:'flex', justifyContent:'space-between', paddingTop:16, borderTop:'1px solid #e8e5de' }}>
        <button style={S.navBtn(false)} onClick={()=>setStep(4)}>← Back</button>
        <button style={S.navBtn(true)} onClick={()=>setStep(6)}>Continue to assignment →</button>
      </div>
    </div>
  )
}
