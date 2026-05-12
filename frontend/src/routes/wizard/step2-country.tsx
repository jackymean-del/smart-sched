import { useState } from "react"
import { useTimetableStore } from "@/store/timetableStore"
import { COUNTRIES } from "@/lib/orgData"

export function Step2Country() {
  const { config, setConfig, setStep } = useTimetableStore()
  const [custom, setCustom] = useState("")
  const selected = COUNTRIES.find(c => c.code === config.countryCode)

  return (
    <div>
      <h1 style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:28, marginBottom:8 }}>Select your country</h1>
      <p style={{ color:'#6a6860', fontSize:13, marginBottom:20, lineHeight:1.65 }}>
        We auto-load national labour laws, workload norms, break mandates and regulatory standards.
      </p>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
        {COUNTRIES.map(c => {
          const sel = config.countryCode === c.code
          return (
            <button key={c.code} onClick={() => setConfig({ countryCode: c.code })}
              style={{
                display:'flex', alignItems:'center', gap:12,
                padding:'12px 14px', borderRadius:10, textAlign:'left',
                border: sel ? '2px solid #4f46e5' : '1.5px solid #e8e5de',
                background: sel ? '#eaecf8' : '#fff',
                cursor:'pointer', transition:'all 0.15s',
              }}
              onMouseEnter={e => { if(!sel){ (e.currentTarget as HTMLElement).style.borderColor='#34d399'; (e.currentTarget as HTMLElement).style.background='#f0fdf4'; }}}
              onMouseLeave={e => { if(!sel){ (e.currentTarget as HTMLElement).style.borderColor='#e8e5de'; (e.currentTarget as HTMLElement).style.background='#fff'; }}}
            >
              <span style={{ fontSize:24 }}>{c.flag}</span>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color: sel?'#3730a3':'#1c1b18' }}>{c.name}</div>
                <div style={{ fontSize:11, color:'#6a6860', marginTop:2 }}>{c.subtitle}</div>
              </div>
            </button>
          )
        })}
      </div>

      <div style={{ display:'flex', gap:8, marginBottom:14 }}>
        <input value={custom} onChange={e=>setCustom(e.target.value)}
          onKeyDown={e=>{ if(e.key==='Enter'&&custom.trim()) setConfig({countryCode:'CUSTOM'}) }}
          placeholder="Other country — type and press Enter"
          style={{ flex:1, padding:'8px 12px', borderRadius:8, border:'1.5px solid #e8e5de', fontSize:13, outline:'none' }}
        />
        <button onClick={() => custom.trim() && setConfig({countryCode:'CUSTOM'})}
          style={{ padding:'8px 16px', borderRadius:8, border:'1.5px solid #e8e5de', background:'#fff', fontSize:13, cursor:'pointer', fontWeight:500 }}>
          Use
        </button>
      </div>

      {selected && (
        <div style={{ borderLeft:'4px solid #059669', background:'#f0fdf4', padding:'10px 14px', borderRadius:'0 8px 8px 0', marginBottom:16, fontSize:12, color:'#14532d', lineHeight:1.6 }}>
          <strong style={{ display:'block', marginBottom:4 }}>✅ Standard loaded: {selected.name}</strong>
          {selected.standard}
        </div>
      )}

      <div style={{ display:'flex', justifyContent:'space-between', paddingTop:16, borderTop:'1px solid #e8e5de' }}>
        <button onClick={() => setStep(1)}
          style={{ padding:'9px 18px', borderRadius:8, border:'1.5px solid #e8e5de', background:'#fff', fontSize:13, fontWeight:500, cursor:'pointer' }}>
          ← Back
        </button>
        <button onClick={() => config.countryCode && setStep(3)} disabled={!config.countryCode}
          style={{ padding:'9px 18px', borderRadius:8, border:'none', fontSize:13, fontWeight:600, cursor: config.countryCode?'pointer':'not-allowed', background: config.countryCode?'#059669':'#d4d1c8', color:'#fff' }}>
          Continue →
        </button>
      </div>
    </div>
  )
}
