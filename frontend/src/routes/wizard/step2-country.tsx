import { useState, useEffect, useRef } from "react"
import { useTimetableStore } from "@/store/timetableStore"
import { COUNTRIES, ORG_CONFIGS } from "@/lib/orgData"
import { ALL_COUNTRIES } from "@/lib/allCountries"
import { getStandard } from "@/lib/standardsDB"

interface OrgStandard {
  maxPeriodsWeek: number
  maxPeriodsDay: number
  hoursPerWeek: number
  lunchMinutes: number
  breakMinutes: number
  numBreaks: number
  periodDuration: number
  notes: string
}

function getDefaultStandard(countryCode: string, orgType: string): OrgStandard {
  const c = COUNTRIES.find(x => x.code === countryCode)
  const orgDefaults: Record<string, Partial<OrgStandard>> = {
    school:    { lunchMinutes:30, breakMinutes:10, numBreaks:3, periodDuration:40, notes:"NCTE / Ministry of Education guidelines" },
    college:   { lunchMinutes:45, breakMinutes:15, numBreaks:2, periodDuration:60, notes:"UGC guidelines" },
    corporate: { lunchMinutes:60, breakMinutes:15, numBreaks:2, periodDuration:60, notes:"Labour Act / Factory Act" },
    hospital:  { lunchMinutes:30, breakMinutes:20, numBreaks:3, periodDuration:60, notes:"Healthcare Staffing Standards" },
    ngo:       { lunchMinutes:45, breakMinutes:15, numBreaks:2, periodDuration:45, notes:"Internal HR policy" },
    factory:   { lunchMinutes:30, breakMinutes:15, numBreaks:3, periodDuration:30, notes:"Factory Act / Labour Law" },
  }
  const d = orgDefaults[orgType] ?? orgDefaults.school
  const maxPeriodsDay = c?.maxPeriodsDay ?? 6
  const periodDuration = d.periodDuration ?? 40
  const numBreaks = d.numBreaks ?? 3
  const lunchMinutes = d.lunchMinutes ?? 30
  const breakMinutes = d.breakMinutes ?? 10
  const totalBreakTime = lunchMinutes + (breakMinutes * (numBreaks - 1))
  const hoursPerWeek = Math.round((maxPeriodsDay * periodDuration + totalBreakTime) * 5 / 60 * 10) / 10
  return {
    maxPeriodsWeek: c?.maxPeriodsWeek ?? 36,
    maxPeriodsDay,
    hoursPerWeek,
    lunchMinutes,
    breakMinutes,
    numBreaks,
    periodDuration,
    notes: d.notes ?? "Organization standard",
  }
}

function recalculate(std: OrgStandard, changedKey: keyof OrgStandard, value: number | string): OrgStandard {
  const s = { ...std, [changedKey]: value }
  if (changedKey === "maxPeriodsDay") {
    s.maxPeriodsWeek = (value as number) * 5
    const tb = s.lunchMinutes + s.breakMinutes * (s.numBreaks - 1)
    s.hoursPerWeek = Math.round(((value as number) * s.periodDuration + tb) * 5 / 60 * 10) / 10
  }
  if (changedKey === "maxPeriodsWeek") {
    s.maxPeriodsDay = Math.round((value as number) / 5)
    const tb = s.lunchMinutes + s.breakMinutes * (s.numBreaks - 1)
    s.hoursPerWeek = Math.round((s.maxPeriodsDay * s.periodDuration + tb) * 5 / 60 * 10) / 10
  }
  if (changedKey === "periodDuration") {
    const tb = s.lunchMinutes + s.breakMinutes * (s.numBreaks - 1)
    s.hoursPerWeek = Math.round((s.maxPeriodsDay * (value as number) + tb) * 5 / 60 * 10) / 10
  }
  if (["lunchMinutes","breakMinutes","numBreaks"].includes(changedKey)) {
    const tb = s.lunchMinutes + s.breakMinutes * (s.numBreaks - 1)
    s.hoursPerWeek = Math.round((s.maxPeriodsDay * s.periodDuration + tb) * 5 / 60 * 10) / 10
  }
  if (changedKey === "hoursPerWeek") {
    const dailyMins = ((value as number) * 60) / 5
    const tb = s.lunchMinutes + s.breakMinutes * (s.numBreaks - 1)
    s.periodDuration = Math.round((dailyMins - tb) / s.maxPeriodsDay)
  }
  return s
}

export function Step2Country() {
  const { config, setConfig, setStep } = useTimetableStore()
  const [search, setSearch] = useState("")
  const [showDropdown, setShowDropdown] = useState(false)
  const [editingStd, setEditingStd] = useState(false)
  const [savedMsg, setSavedMsg] = useState(false)
  const [standard, setStandard] = useState<OrgStandard | null>(null)
  const searchRef = useRef<HTMLDivElement>(null)

  const selected = COUNTRIES.find(c => c.code === config.countryCode)
  const selectedWorld = ALL_COUNTRIES.find(c => c.code === config.countryCode)
  const org = ORG_CONFIGS[config.orgType ?? "school"]
  const MAIN_CODES = COUNTRIES.map(c => c.code)

  const filteredCountries = ALL_COUNTRIES
    .filter(c => !MAIN_CODES.includes(c.code))
    .filter(c =>
      search === "" ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase())
    )
    .slice(0, 20)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  useEffect(() => {
    if (config.countryCode && config.orgType) {
      const saved = localStorage.getItem(`std_${config.orgType}_${config.countryCode}`)
      setStandard(saved ? JSON.parse(saved) : getStandard(config.orgType, config.countryCode))
    }
  }, [config.countryCode, config.orgType])

  const handleFieldChange = (key: keyof OrgStandard, value: number | string) => {
    if (!standard) return
    setStandard(recalculate(standard, key, value))
  }

  const saveStandard = () => {
    if (!standard || !config.countryCode || !config.orgType) return
    localStorage.setItem(`std_${config.orgType}_${config.countryCode}`, JSON.stringify(standard))
    setEditingStd(false)
    setSavedMsg(true)
    setTimeout(() => setSavedMsg(false), 2500)
  }

  const resetStandard = () => {
    if (!config.countryCode || !config.orgType) return
    localStorage.removeItem(`std_${config.orgType}_${config.countryCode}`)
    setStandard(getStandard(config.orgType, config.countryCode))
    setEditingStd(false)
  }

  const displayName = selected?.name ?? selectedWorld?.name ?? (config.countryCode === "CUSTOM" ? search : "")
  const displayFlag = selected?.flag ?? selectedWorld?.flag ?? "🌍"

  const Field = ({ label, fieldKey, unit, readOnly = false }: {
    label: string; fieldKey: keyof OrgStandard; unit: string; readOnly?: boolean
  }) => {
    const val = standard?.[fieldKey]
    const isNum = typeof val === "number"
    return (
      <div style={{ display:"grid", gridTemplateColumns:"1fr 130px 60px", alignItems:"center", gap:8, padding:"7px 0", borderBottom:"1px solid #f0ede7" }}>
        <span style={{ fontSize:12, color:"#1c1b18" }}>{label}</span>
        {editingStd && !readOnly ? (
          <input
            type={isNum ? "number" : "text"}
            defaultValue={String(val ?? "")}
            key={String(val ?? "")}
            onBlur={e => handleFieldChange(fieldKey, isNum ? +e.target.value : e.target.value)}
            style={{ padding:"5px 8px", border:"1.5px solid #4f46e5", borderRadius:6, fontSize:12, fontFamily: isNum?"'DM Mono',monospace":"inherit", textAlign: isNum?"right":"left", outline:"none", width:"100%", background:"#fff" }}
          />
        ) : (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"flex-end", gap:4 }}>
            {readOnly && editingStd && (
              <span style={{ fontSize:9, background:"#f0fdf4", color:"#059669", padding:"1px 5px", borderRadius:4, fontWeight:600 }}>AUTO</span>
            )}
            <span style={{ fontSize:12, fontFamily: isNum?"'DM Mono',monospace":"inherit", fontWeight:600, color: readOnly&&editingStd?"#059669":"#1c1b18" }}>
              {String(val ?? "—")}
            </span>
          </div>
        )}
        <span style={{ fontSize:11, color:"#a8a59e" }}>{unit}</span>
      </div>
    )
  }

  return (
    <div>
      <h1 style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:28, marginBottom:8 }}>Select your country</h1>
      <p style={{ color:"#6a6860", fontSize:13, marginBottom:20, lineHeight:1.65 }}>
        We auto-load national labour laws, workload norms and regulatory standards based on your country and organization type.
      </p>

      {/* Main country grid */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
        {COUNTRIES.map(c => {
          const sel = config.countryCode === c.code
          return (
            <button key={c.code} onClick={() => { setConfig({ countryCode: c.code }); setSearch("") }}
              style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", borderRadius:10, textAlign:"left", border: sel?"2px solid #4f46e5":"1.5px solid #e8e5de", background: sel?"#eaecf8":"#fff", cursor:"pointer", transition:"all 0.15s" }}
              onMouseEnter={e => { if(!sel){ (e.currentTarget as HTMLElement).style.borderColor="#34d399"; (e.currentTarget as HTMLElement).style.background="#f0fdf4" }}}
              onMouseLeave={e => { if(!sel){ (e.currentTarget as HTMLElement).style.borderColor="#e8e5de"; (e.currentTarget as HTMLElement).style.background="#fff" }}}
            >
              <span style={{ fontSize:24 }}>{c.flag}</span>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color: sel?"#3730a3":"#1c1b18" }}>{c.name}</div>
                <div style={{ fontSize:11, color:"#6a6860", marginTop:2 }}>{c.subtitle}</div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Searchable world countries dropdown */}
      <div ref={searchRef} style={{ position:"relative", marginBottom:20 }}>
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setShowDropdown(true) }}
          onFocus={() => setShowDropdown(true)}
          placeholder="🔍 Search all other countries of the world..."
          style={{ width:"100%", padding:"10px 14px", borderRadius:10, border: showDropdown?"1.5px solid #4f46e5":"1.5px solid #e8e5de", fontSize:13, outline:"none", boxSizing:"border-box", background:"#fff" }}
        />

        {showDropdown && (
          <div style={{ position:"absolute", top:"100%", left:0, right:0, zIndex:200, background:"#fff", border:"1.5px solid #4f46e5", borderRadius:10, boxShadow:"0 8px 24px rgba(0,0,0,0.12)", marginTop:4, maxHeight:260, overflowY:"auto" }}>
            {filteredCountries.length === 0
              ? <div style={{ padding:"14px", fontSize:12, color:"#a8a59e", textAlign:"center" }}>No countries found for "{search}"</div>
              : filteredCountries.map(c => {
                  const sel = config.countryCode === c.code
                  return (
                    <button key={c.code}
                      onClick={() => { setConfig({ countryCode: c.code }); setSearch(c.name); setShowDropdown(false) }}
                      style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"10px 14px", border:"none", background: sel?"#eaecf8":"transparent", cursor:"pointer", textAlign:"left", borderBottom:"1px solid #f0ede7" }}
                      onMouseEnter={e => { if(!sel) (e.currentTarget as HTMLElement).style.background="#f7f6f2" }}
                      onMouseLeave={e => { if(!sel) (e.currentTarget as HTMLElement).style.background= sel?"#eaecf8":"transparent" }}
                    >
                      <span style={{ fontSize:20 }}>{c.flag}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, fontWeight: sel?700:500, color: sel?"#3730a3":"#1c1b18" }}>{c.name}</div>
                        <div style={{ fontSize:10, color:"#a8a59e" }}>{c.code}</div>
                      </div>
                      {sel && <span style={{ color:"#4f46e5", fontSize:14, fontWeight:700 }}>✓</span>}
                    </button>
                  )
                })
            }
          </div>
        )}
      </div>

      {/* Standards panel */}
      {config.countryCode && standard && (
        <div style={{ border:"1.5px solid #e8e5de", borderRadius:12, overflow:"hidden", marginBottom:20 }}>
          <div style={{ padding:"10px 14px", background: editingStd?"#eaecf8":"#f0fdf4", borderBottom:"1px solid #e8e5de", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:18 }}>{displayFlag}</span>
              <div>
                <div style={{ fontSize:12, fontWeight:700, color: editingStd?"#3730a3":"#14532d" }}>
                  {editingStd ? `✏️ Editing: ${displayName} · ${org.name}` : `✅ ${displayName} · ${org.name} Standard`}
                </div>
                <div style={{ fontSize:11, color:"#6a6860" }}>{standard.notes}</div>
              </div>
            </div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {!editingStd
                ? <button onClick={() => setEditingStd(true)} style={{ padding:"5px 12px", borderRadius:6, border:"1.5px solid #d4d1c8", background:"#fff", fontSize:11, fontWeight:600, cursor:"pointer", color:"#4f46e5" }}>✏️ Customize</button>
                : <>
                    <button onClick={saveStandard} style={{ padding:"5px 12px", borderRadius:6, border:"none", background:"#059669", color:"#fff", fontSize:11, fontWeight:600, cursor:"pointer" }}>💾 Save as My Standard</button>
                    <button onClick={() => setEditingStd(false)} style={{ padding:"5px 12px", borderRadius:6, border:"1.5px solid #e8e5de", background:"#fff", fontSize:11, cursor:"pointer" }}>Cancel</button>
                    <button onClick={resetStandard} style={{ padding:"5px 12px", borderRadius:6, border:"1.5px solid #fca5a5", background:"#fff", fontSize:11, cursor:"pointer", color:"#dc2626" }}>Reset</button>
                  </>
              }
            </div>
          </div>
          <div style={{ padding:"6px 14px 10px" }}>
            {editingStd && (
              <div style={{ background:"#fffbeb", border:"1px solid #fcd34d", borderRadius:6, padding:"6px 10px", marginBottom:8, fontSize:11, color:"#92400e" }}>
                💡 Edit any field — related fields update <strong>automatically</strong>. Fields marked <strong style={{ color:"#059669" }}>AUTO</strong> are calculated.
              </div>
            )}
            <Field label={`Max periods / week (${org.staffsLabel})`} fieldKey="maxPeriodsWeek" unit="periods" />
            <Field label="Max periods / day"    fieldKey="maxPeriodsDay"   unit="periods" />
            <Field label="Period duration"      fieldKey="periodDuration"  unit="min" />
            <Field label="Working hours / week" fieldKey="hoursPerWeek"    unit="hrs" readOnly={true} />
            <Field label="Lunch break"          fieldKey="lunchMinutes"    unit="min" />
            <Field label="Short break duration" fieldKey="breakMinutes"    unit="min" />
            <Field label="Number of breaks"     fieldKey="numBreaks"       unit="total" />
            <Field label="Notes / regulation"   fieldKey="notes"           unit="" />

          {/* Official reference links */}
          {standard.links && standard.links.length > 0 && (
            <div style={{ marginTop:10, paddingTop:10, borderTop:"1px solid #f0ede7" }}>
              <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase" as const, letterSpacing:"0.06em", color:"#a8a59e", marginBottom:6 }}>
                📎 Official Reference Documents
              </div>
              <div style={{ display:"flex", flexDirection:"column" as const, gap:5 }}>
                {standard.links.map((link, i) => (
                  <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                    style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:"#4f46e5", textDecoration:"none", padding:"5px 8px", borderRadius:6, background:"#f7f6ff", border:"1px solid #e0e7ff", transition:"all 0.15s" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background="#eaecf8"; (e.currentTarget as HTMLElement).style.borderColor="#a5b4fc"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background="#f7f6ff"; (e.currentTarget as HTMLElement).style.borderColor="#e0e7ff"; }}
                  >
                    <span style={{ fontSize:14 }}>🔗</span>
                    <span style={{ flex:1, fontWeight:500 }}>{link.label}</span>
                    <span style={{ fontSize:10, color:"#a8a59e", fontFamily:"monospace" }}>↗</span>
                  </a>
                ))}
              </div>
            </div>
          )}
          </div>
          {editingStd && (
            <div style={{ padding:"8px 14px", background:"#eaecf8", fontSize:11, color:"#3730a3", borderTop:"1px solid #c7d2fe" }}>
              📌 Saved per browser for <strong>{displayName} · {org.name}</strong>. Auto-loads next time.
            </div>
          )}
        </div>
      )}

      {savedMsg && (
        <div style={{ background:"#f0fdf4", border:"1px solid #86efac", borderRadius:8, padding:"8px 14px", fontSize:12, color:"#14532d", marginBottom:12 }}>
          ✅ Saved! Will auto-load for all future {displayName} · {org.name} timetables.
        </div>
      )}

      <div style={{ display:"flex", justifyContent:"space-between", paddingTop:16, borderTop:"1px solid #e8e5de" }}>
        <button onClick={() => setStep(1)} style={{ padding:"9px 18px", borderRadius:8, border:"1.5px solid #e8e5de", background:"#fff", fontSize:13, fontWeight:500, cursor:"pointer" }}>← Back</button>
        <button onClick={() => config.countryCode && setStep(3)} disabled={!config.countryCode}
          style={{ padding:"9px 18px", borderRadius:8, border:"none", fontSize:13, fontWeight:600, cursor: config.countryCode?"pointer":"not-allowed", background: config.countryCode?"#059669":"#d4d1c8", color:"#fff" }}>
          Continue →
        </button>
      </div>
    </div>
  )
}
