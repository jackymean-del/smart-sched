import { useState } from "react"
import { useTimetableStore } from "@/store/timetableStore"
import { ORG_CONFIGS, getCountry } from "@/lib/orgData"
import { autoAssign } from "@/lib/aiEngine"

type Tab = "matrix" | "staff"

const S = {
  navBtn: (primary: boolean) => ({
    padding:'9px 18px', borderRadius:8, border: primary?'none':'1.5px solid #e8e5de',
    background: primary?'#059669':'#fff', color: primary?'#fff':'#1c1b18',
    fontSize:13, fontWeight:600, cursor:'pointer',
  }),
}

export function Step6Assign() {
  const { config, sections, staff, subjects, setSections, setStaff, setSubjects, setStep } = useTimetableStore()
  const [tab, setTab] = useState<Tab>("matrix")
  const org     = ORG_CONFIGS[config.orgType ?? "school"]
  const country = getCountry(config.countryCode ?? "IN")

  const handleAutoAssign = () => {
    const r = autoAssign(sections, staff, subjects)
    setSections(r.sections)
    setStaff(r.staff.map(s => ({ ...s, isClassTeacher: s.isClassTeacher ?? '' })))
    setSubjects(r.subjects)
  }

  const toggleSubSec = (si: number, secName: string, checked: boolean) => {
    const updated = [...subjects]
    const secs = updated[si].sections ?? []
    updated[si] = { ...updated[si], sections: checked ? [...secs, secName] : secs.filter(s => s !== secName) }
    setSubjects(updated)
  }

  const overloaded = staff.filter(st => {
    const load = (st.subjects ?? []).reduce((a, sn) => a + (subjects.find(x => x.name === sn)?.periodsPerWeek ?? 2), 0) * (st.classes?.length ?? 1)
    return load > (st.maxPeriodsPerWeek ?? country.maxPeriodsWeek)
  })

  const thS: React.CSSProperties = { padding:'8px 8px', background:'#f7f6f2', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'#a8a59e', textAlign:'left', borderBottom:'1px solid #e8e5de', whiteSpace:'nowrap' }
  const tdS: React.CSSProperties = { padding:'6px 8px', borderBottom:'1px solid #f0ede7', verticalAlign:'middle', fontSize:11 }

  return (
    <div>
      <h1 style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:28, marginBottom:8 }}>
        Assign {org.subjectsLabel} & {org.staffsLabel}
      </h1>
      <p style={{ color:'#6a6860', fontSize:13, marginBottom:16, lineHeight:1.65 }}>
        Map {org.subjectsLabel.toLowerCase()} to {org.sectionsLabel.toLowerCase()}, then assign {org.staffsLabel.toLowerCase()} to teach them. Or let AI do it all.
      </p>

      <div style={{ background:'#eaecf8', borderLeft:'4px solid #4f46e5', borderRadius:'0 8px 8px 0', padding:'8px 14px', marginBottom:16, fontSize:12, color:'#3730a3' }}>
        ✨ Click <strong>AI Auto-Assign</strong> for optimal distribution. Fine-tune afterwards.
      </div>

      {/* Action buttons */}
      <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
        <button onClick={handleAutoAssign}
          style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 16px', borderRadius:8, border:'none', background:'#059669', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer' }}>
          ✨ AI Auto-Assign Everything
        </button>
        <button onClick={() => setSubjects(subjects.map(s => ({ ...s, sections: [] })))}
          style={{ padding:'9px 16px', borderRadius:8, border:'1.5px solid #e8e5de', background:'#fff', fontSize:13, fontWeight:500, cursor:'pointer' }}>
          Clear All
        </button>
        <button onClick={() => setSubjects(subjects.map(s => ({ ...s, sections: sections.map(x => x.name) })))}
          style={{ padding:'9px 16px', borderRadius:8, border:'1.5px solid #e8e5de', background:'#fff', fontSize:13, fontWeight:500, cursor:'pointer' }}>
          Check All
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', borderBottom:'2px solid #e8e5de', marginBottom:16, gap:0 }}>
        {([['matrix',`${org.subjectLabel} → ${org.sectionLabel} Matrix`],['staff','Staff Assignments']] as [Tab,string][]).map(([t,l]) => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding:'8px 16px', border:'none', borderBottom: tab===t?'2px solid #4f46e5':'2px solid transparent', marginBottom:-2, background:'transparent', fontSize:12, fontWeight: tab===t?700:500, color: tab===t?'#4f46e5':'#6a6860', cursor:'pointer', whiteSpace:'nowrap' }}>
            {l}
          </button>
        ))}
      </div>

      {/* Matrix */}
      {tab === "matrix" && (
        <div style={{ overflowX:'auto', border:'1.5px solid #e8e5de', borderRadius:12 }}>
          <table style={{ borderCollapse:'collapse', fontSize:11 }}>
            <thead>
              <tr>
                <th style={{...thS, minWidth:160}}>{org.subjectLabel} / Freq</th>
                {sections.map(s => <th key={s.id} style={{...thS, textAlign:'center', minWidth:60}}>{s.name}</th>)}
              </tr>
            </thead>
            <tbody>
              {subjects.map((sub, si) => (
                <tr key={sub.id} style={{ background: si%2===0?'#fff':'#fafaf9' }}>
                  <td style={{...tdS, fontWeight:500}}>
                    {sub.name}<br/>
                    <span style={{ fontSize:10, fontFamily:'monospace', color:'#a8a59e' }}>{sub.periodsPerWeek}×/wk</span>
                  </td>
                  {sections.map(sec => (
                    <td key={sec.id} style={{...tdS, textAlign:'center'}}>
                      <input type="checkbox" style={{ width:14, height:14, accentColor:'#059669', cursor:'pointer' }}
                        checked={(sub.sections??[]).includes(sec.name)}
                        onChange={e => toggleSubSec(si, sec.name, e.target.checked)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Staff */}
      {tab === "staff" && (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {staff.map((st, i) => {
            const load = (st.subjects??[]).reduce((a,sn) => a + (subjects.find(x=>x.name===sn)?.periodsPerWeek??2), 0) * (st.classes?.length??1)
            const maxP = st.maxPeriodsPerWeek ?? country.maxPeriodsWeek
            const pct  = Math.min(100, Math.round(load / maxP * 100))
            const barColor = pct>100?'#ef4444':pct>85?'#f59e0b':'#059669'
            return (
              <div key={st.id} style={{ border:'1.5px solid #e8e5de', borderRadius:10, padding:'12px', display:'grid', gap:12, gridTemplateColumns:'150px 1fr 1fr 90px', alignItems:'start' }}>
                <div>
                  <div style={{ fontSize:12, fontWeight:600 }}>{st.name}</div>
                  <div style={{ fontSize:10, color:'#6a6860', marginTop:2 }}>{st.role}</div>
                  {st.isClassTeacher && <div style={{ fontSize:10, color:'#059669', marginTop:2 }}>★ CT: {st.isClassTeacher}</div>}
                </div>
                <div>
                  <div style={{ fontSize:10, color:'#a8a59e', marginBottom:4 }}>{org.subjectsLabel} (Ctrl=multi)</div>
                  <select multiple style={{ border:'1px solid #e8e5de', borderRadius:6, fontSize:11, width:'100%', height:64, padding:'2px' }}
                    value={st.subjects??[]}
                    onChange={e=>{const n=[...staff];n[i]={...n[i],subjects:Array.from(e.target.selectedOptions).map(o=>o.value)};setStaff(n)}}>
                    {subjects.map(s=><option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize:10, color:'#a8a59e', marginBottom:4 }}>{org.sectionsLabel} (Ctrl=multi)</div>
                  <select multiple style={{ border:'1px solid #e8e5de', borderRadius:6, fontSize:11, width:'100%', height:64, padding:'2px' }}
                    value={st.classes??[]}
                    onChange={e=>{const n=[...staff];n[i]={...n[i],classes:Array.from(e.target.selectedOptions).map(o=>o.value)};setStaff(n)}}>
                    {sections.map(s=><option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize:11, fontFamily:'monospace', color:'#1c1b18' }}>{load}/{maxP}</div>
                  <div style={{ height:6, background:'#e8e5de', borderRadius:4, marginTop:6, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${pct}%`, background:barColor, borderRadius:4, transition:'width 0.3s' }} />
                  </div>
                  <div style={{ fontSize:10, color:'#a8a59e', marginTop:4 }}>{pct}%</div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {overloaded.length > 0 && (
        <div style={{ background:'#fffbeb', border:'1px solid #fcd34d', borderRadius:8, padding:'10px 14px', fontSize:12, color:'#92400e', marginTop:12 }}>
          ⚠️ <strong>{overloaded.length} overloaded:</strong> {overloaded.map(s=>s.name).join(", ")}
        </div>
      )}

      <div style={{ display:'flex', justifyContent:'space-between', paddingTop:16, borderTop:'1px solid #e8e5de', marginTop:16 }}>
        <button style={S.navBtn(false)} onClick={()=>setStep(5)}>← Back</button>
        <button onClick={()=>setStep(7)}
          style={{ padding:'9px 18px', borderRadius:8, border:'none', background:'#4f46e5', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
          ✨ Generate Timetable
        </button>
      </div>
    </div>
  )
}
