import { useState } from "react"
import { useTimetableStore } from "@/store/timetableStore"
import type { OrgType } from "@/types"

const ORG_TYPES: { type: OrgType; icon: string; label: string }[] = [
  { type:"school",    icon:"🏫", label:"School"    },
  { type:"college",   icon:"🎓", label:"College"   },
  { type:"corporate", icon:"🏢", label:"Company"   },
  { type:"hospital",  icon:"🏥", label:"Hospital"  },
  { type:"ngo",       icon:"🤝", label:"NGO"       },
  { type:"factory",   icon:"🏭", label:"Factory"   },
]

// Facility types per org
const FACILITY_TYPES = [
  { key:"numClassrooms",   icon:"🏫", label:"Classrooms",      sub:"Regular teaching rooms" },
  { key:"numLabs",         icon:"🔬", label:"Labs",             sub:"Science / computer labs" },
  { key:"numHalls",        icon:"🏛️", label:"Halls / Auditoriums", sub:"Assembly, events" },
  { key:"numMusicRooms",   icon:"🎵", label:"Music Rooms",      sub:"For music periods" },
  { key:"numArtRooms",     icon:"🎨", label:"Art Rooms",        sub:"For art & craft" },
  { key:"numSportVenues",  icon:"⚽", label:"Sports / Play",    sub:"Playground, gym, court" },
  { key:"numLibraries",    icon:"📚", label:"Libraries",        sub:"Reading & study rooms" },
  { key:"numOtherRooms",   icon:"🏢", label:"Other Rooms",      sub:"Any other spaces" },
]

const lbl = (text: string, sub?: string) => (
  <div style={{ marginBottom:8 }}>
    <div style={{ fontSize:12, fontWeight:600, color:"#374151" }}>{text}</div>
    {sub && <div style={{ fontSize:10, color:"#a8a59e", marginTop:1 }}>{sub}</div>}
  </div>
)

export function Step1Org() {
  const { config, setConfig, setStep } = useTimetableStore()
  const [orgName, setOrgName] = useState((config as any).orgName ?? "")
  const facilityConfig = (config as any).facilityConfig ?? {}
  const selectedType = config.orgType

  const setFacility = (key: string, val: number) => {
    setConfig({ facilityConfig: { ...facilityConfig, [key]: Math.max(0, val) } } as any)
  }

  const canContinue = !!selectedType && config.numSections > 0 && config.numStaff > 0

  const totalFacilities = FACILITY_TYPES.reduce((a, f) => a + (facilityConfig[f.key] ?? 0), 0)

  return (
    <div>
      <h1 style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:32, marginBottom:6 }}>
        Welcome to Schedu ✨
      </h1>
      <p style={{ color:"#6a6860", fontSize:14, marginBottom:28, lineHeight:1.65 }}>
        Tell us about your organization. Schedu will auto-generate everything — you just review and edit.
      </p>

      {/* Org type */}
      <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase" as const, letterSpacing:"0.06em", color:"#a8a59e", marginBottom:10 }}>
        Organization Type
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:8, marginBottom:24 }}>
        {ORG_TYPES.map(o => {
          const sel = config.orgType === o.type
          return (
            <button key={o.type} onClick={() => setConfig({ orgType: o.type })}
              style={{ padding:"12px 8px", borderRadius:10, textAlign:"center" as const, cursor:"pointer", border: sel?"2px solid #4f46e5":"1.5px solid #e8e5de", background: sel?"#eaecf8":"#fff", transition:"all 0.12s" }}
              onMouseEnter={e => { if(!sel){ (e.currentTarget as HTMLElement).style.background="#f0fdf4"; (e.currentTarget as HTMLElement).style.borderColor="#34d399" }}}
              onMouseLeave={e => { if(!sel){ (e.currentTarget as HTMLElement).style.background="#fff"; (e.currentTarget as HTMLElement).style.borderColor="#e8e5de" }}}>
              <div style={{ fontSize:24, marginBottom:4 }}>{o.icon}</div>
              <div style={{ fontSize:11, fontWeight:600, color: sel?"#3730a3":"#1c1b18" }}>{o.label}</div>
            </button>
          )
        })}
      </div>

      {selectedType && (
        <div style={{ border:"1.5px solid #e8e5de", borderRadius:14, overflow:"hidden", marginBottom:20 }}>

          {/* Org Name */}
          <div style={{ padding:"20px 24px", borderBottom:"1px solid #e8e5de", background:"#fafaf9" }}>
            <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase" as const, letterSpacing:"0.06em", color:"#a8a59e", marginBottom:8 }}>
              Organization Name
            </div>
            <input value={orgName}
              onChange={e => { setOrgName(e.target.value); setConfig({ orgName: e.target.value } as any) }}
              placeholder={`e.g. St. Mary's ${ORG_TYPES.find(o=>o.type===selectedType)?.label}`}
              style={{ width:"100%", padding:"10px 14px", border:"1.5px solid #e8e5de", borderRadius:8, fontSize:14, outline:"none", boxSizing:"border-box" as const }}
              onFocus={e=>(e.target as HTMLInputElement).style.borderColor="#4f46e5"}
              onBlur={e=>(e.target as HTMLInputElement).style.borderColor="#e8e5de"} />
          </div>

          {/* Academic numbers */}
          <div style={{ padding:"20px 24px", borderBottom:"1px solid #e8e5de" }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#1c1b18", marginBottom:14 }}>👥 Academic Structure</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14 }}>
              {[
                { label:"Total Classes / Sections",  sub:"No. of class sections (e.g. I-A, I-B...)", key:"numSections"  as const, icon:"📚", val:config.numSections, min:1, max:500 },
                { label:"Total Teachers / Staff",     sub:"No. of teaching staff",                    key:"numStaff"     as const, icon:"👤", val:config.numStaff,    min:1, max:1000 },
                { label:"Total Subjects",             sub:"No. of subjects taught",                   key:"numSubjects"  as const, icon:"📖", val:config.numSubjects, min:1, max:100 },
              ].map(f => (
                <div key={f.key} style={{ background:"#f7f6f2", borderRadius:10, padding:"14px", textAlign:"center" as const }}>
                  <div style={{ fontSize:22, marginBottom:5 }}>{f.icon}</div>
                  {lbl(f.label, f.sub)}
                  <input type="number" min={f.min} max={f.max}
                    defaultValue={f.val} key={f.key+selectedType}
                    onBlur={e => setConfig({ [f.key]: Math.max(f.min, +e.target.value) })}
                    style={{ width:"100%", padding:"8px", border:"1.5px solid #e8e5de", borderRadius:8, fontSize:24, fontWeight:700, fontFamily:"monospace", textAlign:"center" as const, outline:"none", background:"#fff" }} />
                </div>
              ))}
            </div>
          </div>

          {/* Facilities */}
          <div style={{ padding:"20px 24px" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
              <div style={{ fontSize:13, fontWeight:700, color:"#1c1b18" }}>🏢 Facilities & Spaces</div>
              <div style={{ fontSize:11, color:"#a8a59e" }}>Total: {totalFacilities} spaces</div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
              {FACILITY_TYPES.map(f => {
                const val = facilityConfig[f.key] ?? 0
                return (
                  <div key={f.key} style={{ background: val>0?"#f0fdf4":"#f7f6f2", borderRadius:10, padding:"12px", textAlign:"center" as const, border:`1.5px solid ${val>0?"#86efac":"#e8e5de"}`, transition:"all 0.15s" }}>
                    <div style={{ fontSize:20, marginBottom:4 }}>{f.icon}</div>
                    <div style={{ fontSize:11, fontWeight:600, color:"#374151", marginBottom:2, lineHeight:1.3 }}>{f.label}</div>
                    <div style={{ fontSize:9, color:"#a8a59e", marginBottom:8, lineHeight:1.3 }}>{f.sub}</div>
                    <input type="number" min={0} max={200}
                      defaultValue={val} key={f.key+'-'+val}
                      onBlur={e => setFacility(f.key, Math.max(0, +e.target.value))}
                      style={{ width:"100%", padding:"6px", border:`1.5px solid ${val>0?"#86efac":"#e8e5de"}`, borderRadius:8, fontSize:20, fontWeight:700, fontFamily:"monospace", textAlign:"center" as const, outline:"none", background:"#fff", color: val>0?"#059669":"#374151" }}
                      onFocus={e => (e.target as HTMLInputElement).style.borderColor="#4f46e5"}
                    />
                  </div>
                )
              })}
            </div>
            <div style={{ marginTop:14, padding:"10px 14px", background:"#eaecf8", borderRadius:8, fontSize:11, color:"#3730a3", lineHeight:1.6 }}>
              ✨ Schedu will auto-generate names for all spaces:
              {totalFacilities === 0
                ? " — set counts above"
                : ` Room 1–${facilityConfig.numClassrooms??0}, Lab 1–${facilityConfig.numLabs??0}, Hall 1–${facilityConfig.numHalls??0}... All editable in Step 5.`}
            </div>
          </div>

        </div>
      )}

      {/* Summary */}
      {canContinue && (
        <div style={{ padding:"12px 16px", background:"#f0fdf4", border:"1px solid #86efac", borderRadius:10, marginBottom:20, fontSize:12, color:"#14532d", lineHeight:1.8 }}>
          ✅ Schedu will generate: <strong>{config.numSections}</strong> classes · <strong>{config.numStaff}</strong> teachers · <strong>{config.numSubjects}</strong> subjects · <strong>{totalFacilities}</strong> spaces
          <br/>Next: Set working days, shifts and timings →
        </div>
      )}

      <div style={{ display:"flex", justifyContent:"flex-end", paddingTop:16, borderTop:"1px solid #e8e5de" }}>
        <button onClick={() => canContinue && setStep(2)} disabled={!canContinue}
          style={{ padding:"11px 28px", borderRadius:8, border:"none", fontSize:14, fontWeight:600, cursor: canContinue?"pointer":"not-allowed", background: canContinue?"#059669":"#d4d1c8", color:"#fff" }}>
          Continue →
        </button>
      </div>
    </div>
  )
}
