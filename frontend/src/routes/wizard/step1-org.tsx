import { useState } from "react"
import { useTimetableStore } from "@/store/timetableStore"
import type { OrgType } from "@/types"

const ORG_TYPES: { type: OrgType; icon: string; label: string; q: string }[] = [
  { type:"school",    icon:"🏫", label:"School",    q:"Tell me about your school" },
  { type:"college",   icon:"🎓", label:"College",   q:"Tell me about your college" },
  { type:"corporate", icon:"🏢", label:"Company",   q:"Tell me about your company" },
  { type:"hospital",  icon:"🏥", label:"Hospital",  q:"Tell me about your hospital" },
  { type:"ngo",       icon:"🤝", label:"NGO",       q:"Tell me about your organization" },
  { type:"factory",   icon:"🏭", label:"Factory",   q:"Tell me about your factory" },
]

export function Step1Org() {
  const { config, setConfig, setStep } = useTimetableStore()
  const [orgName, setOrgName] = useState((config as any).orgName ?? "")
  const selectedType = config.orgType
  const org = ORG_TYPES.find(o => o.type === selectedType) ?? ORG_TYPES[0]

  const canContinue = selectedType && config.numSections > 0 && config.numStaff > 0

  return (
    <div>
      <h1 style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:32, marginBottom:8 }}>
        Welcome to Schedu
      </h1>
      <p style={{ color:"#6a6860", fontSize:14, marginBottom:28, lineHeight:1.65 }}>
        Let's set up your timetable in minutes. First, tell us a bit about your organization.
      </p>

      {/* Org type cards */}
      <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase" as const, letterSpacing:"0.06em", color:"#a8a59e", marginBottom:10 }}>
        What type of organization?
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:28 }}>
        {ORG_TYPES.map(o => {
          const sel = config.orgType === o.type
          return (
            <button key={o.type} onClick={() => setConfig({ orgType: o.type })}
              style={{ padding:"14px 12px", borderRadius:10, textAlign:"center" as const, cursor:"pointer", transition:"all 0.15s", border: sel?"2px solid #4f46e5":"1.5px solid #e8e5de", background: sel?"#eaecf8":"#fff" }}
              onMouseEnter={e => { if(!sel) { (e.currentTarget as HTMLElement).style.borderColor="#34d399"; (e.currentTarget as HTMLElement).style.background="#f0fdf4" }}}
              onMouseLeave={e => { if(!sel) { (e.currentTarget as HTMLElement).style.borderColor="#e8e5de"; (e.currentTarget as HTMLElement).style.background="#fff" }}}>
              <div style={{ fontSize:28, marginBottom:6 }}>{o.icon}</div>
              <div style={{ fontSize:13, fontWeight:600, color: sel?"#3730a3":"#1c1b18" }}>{o.label}</div>
            </button>
          )
        })}
      </div>

      {/* "Tell me about your X" form */}
      {selectedType && (
        <div style={{ background:"#fff", border:"1.5px solid #e8e5de", borderRadius:14, padding:"24px", marginBottom:24 }}>
          <div style={{ fontSize:18, fontWeight:600, color:"#1c1b18", marginBottom:20 }}>
            {org.icon} {org.q}
          </div>

          {/* Org name */}
          <div style={{ marginBottom:20 }}>
            <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:6 }}>
              {org.label} Name
            </label>
            <input value={orgName}
              onChange={e => { setOrgName(e.target.value); setConfig({ orgName: e.target.value } as any) }}
              placeholder={`e.g. St. Mary's ${org.label}`}
              style={{ width:"100%", padding:"10px 14px", border:"1.5px solid #e8e5de", borderRadius:8, fontSize:14, outline:"none", boxSizing:"border-box" as const }}
              onFocus={e => (e.target as HTMLInputElement).style.borderColor="#4f46e5"}
              onBlur={e => (e.target as HTMLInputElement).style.borderColor="#e8e5de"} />
          </div>

          {/* 3 key numbers */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16 }}>
            {[
              { label:"Total Classes / Groups", sub:"How many class sections?", key:"numSections" as const, icon:"📚", default: config.numSections || 10, min:1, max:200 },
              { label:"Total Teachers / Staff", sub:"How many teaching staff?", key:"numStaff" as const, icon:"👤", default: config.numStaff || 20, min:1, max:500 },
              { label:"Total Subjects", sub:"How many subjects taught?", key:"numSubjects" as const, icon:"📖", default: config.numSubjects || 8, min:1, max:50 },
            ].map(f => (
              <div key={f.key} style={{ background:"#f7f6f2", borderRadius:10, padding:"16px", textAlign:"center" as const }}>
                <div style={{ fontSize:24, marginBottom:6 }}>{f.icon}</div>
                <div style={{ fontSize:11, fontWeight:600, color:"#374151", marginBottom:4, lineHeight:1.3 }}>{f.label}</div>
                <div style={{ fontSize:10, color:"#a8a59e", marginBottom:10 }}>{f.sub}</div>
                <input type="number" min={f.min} max={f.max}
                  defaultValue={f.default} key={f.key+'-'+selectedType}
                  onBlur={e => setConfig({ [f.key]: Math.max(f.min, +e.target.value) })}
                  style={{ width:"100%", padding:"8px 10px", border:"1.5px solid #e8e5de", borderRadius:8, fontSize:22, fontWeight:700, fontFamily:"'DM Mono',monospace", textAlign:"center" as const, outline:"none", background:"#fff" }}
                  onFocus={e => (e.target as HTMLInputElement).style.borderColor="#4f46e5"}
                />
              </div>
            ))}
          </div>

          <div style={{ marginTop:16, padding:"10px 14px", background:"#eaecf8", borderRadius:8, fontSize:11, color:"#3730a3" }}>
            ✨ Schedu will auto-generate <strong>{config.numSections} class names</strong>, <strong>{config.numStaff} teacher names</strong>, and <strong>{config.numSubjects} subject names</strong> — all editable in the next steps.
          </div>
        </div>
      )}

      <div style={{ display:"flex", justifyContent:"flex-end", paddingTop:16, borderTop:"1px solid #e8e5de" }}>
        <button
          onClick={() => canContinue && setStep(2)}
          disabled={!canContinue}
          style={{ padding:"11px 28px", borderRadius:8, border:"none", fontSize:14, fontWeight:600, cursor: canContinue?"pointer":"not-allowed", background: canContinue?"#059669":"#d4d1c8", color:"#fff" }}>
          Continue →
        </button>
      </div>
    </div>
  )
}
