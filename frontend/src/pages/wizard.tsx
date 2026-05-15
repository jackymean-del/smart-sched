import { Component, type ReactNode } from "react"
import { useTimetableStore } from "@/store/timetableStore"
import { useAuthStore } from "@/store/authStore"
import { Step1Org }        from "@/routes/wizard/step1-org"
import { StepBell }        from "@/routes/wizard/step-bell"
import { StepResources }   from "@/routes/wizard/step-resources"
import { Step6Generate }   from "@/routes/wizard/step6-generate"
import { CheckCircle2 } from "lucide-react"

// ── 4-step, no-redundancy wizard ─────────────────────────────
const STEPS = [Step1Org, StepBell, StepResources, Step6Generate]

const STEP_META = [
  { label:"School",      sub:"Board, grades & scale",       icon:"🏫", color:"#4f46e5" },
  { label:"Schedule",    sub:"Days, periods & breaks",      icon:"🔔", color:"#0891b2" },
  { label:"Resources",   sub:"Classes, teachers & subjects",icon:"📋", color:"#059669" },
  { label:"Generate",    sub:"Build & review timetable",    icon:"✨", color:"#7c3aed" },
]

// ── Error boundary ────────────────────────────────────────────
class StepErrorBoundary extends Component<
  { children: ReactNode; step: number },
  { error: string | null }
> {
  constructor(props: any) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(e: Error) { return { error: e.message } }
  render() {
    if (this.state.error) return (
      <div style={{ padding:28, background:"#fef2f2", border:"1px solid #fecaca", borderRadius:12, margin:24 }}>
        <div style={{ fontSize:14, fontWeight:700, color:"#dc2626", marginBottom:8 }}>⚠️ Step {this.props.step} error</div>
        <div style={{ fontSize:11, color:"#7f1d1d", fontFamily:"monospace", marginBottom:16, whiteSpace:"pre-wrap", maxHeight:120, overflow:'auto' }}>{this.state.error}</div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => { this.setState({ error:null }); useTimetableStore.getState().resetWizard() }}
            style={{ padding:"7px 14px", borderRadius:7, border:"none", background:"#dc2626", color:"#fff", cursor:"pointer", fontSize:12 }}>
            Reset Wizard
          </button>
          <button onClick={() => this.setState({ error:null })}
            style={{ padding:"7px 14px", borderRadius:7, border:"1px solid #fecaca", background:"#fff", color:"#dc2626", cursor:"pointer", fontSize:12 }}>
            Try Again
          </button>
        </div>
      </div>
    )
    return this.props.children
  }
}

// ── Main ─────────────────────────────────────────────────────
export function WizardPage() {
  const { step, setStep } = useTimetableStore()
  const { isAuthenticated, user } = useAuthStore()
  const CurrentStep = STEPS[step - 1] ?? Step1Org
  const total = STEPS.length

  return (
    <div style={{ display:"flex", height:"calc(100vh - 52px)", overflow:"hidden" }}>

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside style={{
        width: 220, background:"#111827", flexShrink:0,
        display:"flex", flexDirection:"column", borderRight:"1px solid #1f2937",
      }}>
        {/* School / user info */}
        <div style={{ padding:"16px 16px", borderBottom:"1px solid #1f2937" }}>
          {isAuthenticated && user ? (
            <>
              <div style={{ fontSize:11, fontWeight:600, color:"#9ca3af", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:4 }}>Setup Wizard</div>
              <div style={{ fontSize:12, color:"#fff", fontWeight:500 }}>{user.schoolName || user.name}</div>
              <div style={{ fontSize:10, color:"#6b7280", marginTop:2 }}>Step {step} of {total}</div>
            </>
          ) : (
            <div>
              <div style={{ fontSize:11, fontWeight:600, color:"#9ca3af", textTransform:"uppercase", letterSpacing:"0.06em" }}>Setup Wizard</div>
              <div style={{ fontSize:10, color:"#6b7280", marginTop:4 }}>Step {step} of {total}</div>
            </div>
          )}
        </div>

        {/* Steps list */}
        <nav style={{ flex:1, padding:"12px 0" }}>
          {STEP_META.map((s, i) => {
            const n = i + 1
            const active = step === n
            const done   = step > n
            return (
              <button key={n}
                onClick={() => done && setStep(n)}
                style={{
                  width:"100%", display:"flex", alignItems:"center", gap:12,
                  padding:"10px 16px", border:"none", background:"transparent",
                  cursor: done ? "pointer" : "default", textAlign:"left",
                  borderLeft: active ? `3px solid ${s.color}` : "3px solid transparent",
                  transition:"background 0.12s",
                }}
                onMouseEnter={e => { if (done) (e.currentTarget as HTMLButtonElement).style.background="rgba(255,255,255,0.04)" }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background="transparent" }}>

                {/* Step indicator */}
                <div style={{
                  width:28, height:28, borderRadius:"50%", flexShrink:0,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  background: done ? "#059669" : active ? s.color : "#1f2937",
                  border: done || active ? "none" : "1px solid #374151",
                }}>
                  {done
                    ? <CheckCircle2 size={14} color="#fff" />
                    : <span style={{ fontSize:11, fontWeight:700, color: active?"#fff":"#6b7280" }}>{n}</span>}
                </div>

                {/* Label */}
                <div>
                  <div style={{ fontSize:12, fontWeight: active?600:400, color: active?"#fff": done?"#e5e7eb":"#6b7280" }}>
                    {s.label}
                  </div>
                  <div style={{ fontSize:10, color:"#4b5563", marginTop:1 }}>{s.sub}</div>
                </div>
              </button>
            )
          })}
        </nav>

        {/* Progress bar */}
        <div style={{ padding:"14px 16px", borderTop:"1px solid #1f2937" }}>
          <div style={{ height:3, background:"#1f2937", borderRadius:2, marginBottom:6, overflow:"hidden" }}>
            <div style={{
              height:"100%", borderRadius:2,
              background:`linear-gradient(90deg, ${STEP_META[0].color}, ${STEP_META[Math.min(step-1, total-1)].color})`,
              width:`${((step-1) / (total-1)) * 100}%`,
              transition:"width 0.35s ease",
            }} />
          </div>
          <div style={{ fontSize:10, color:"#4b5563" }}>
            {Math.round(((step-1)/(total-1))*100)}% complete
          </div>
        </div>
      </aside>

      {/* ── Content ─────────────────────────────────────────── */}
      <div style={{ flex:1, overflowY:"auto", background:"#f9fafb" }}>

        {/* Step header bar */}
        <div style={{
          height:44, background:"#fff", borderBottom:"1px solid #e5e7eb",
          display:"flex", alignItems:"center", padding:"0 28px",
          position:"sticky", top:0, zIndex:10, gap:12,
        }}>
          <span style={{ fontSize:18 }}>{STEP_META[step-1]?.icon}</span>
          <div>
            <span style={{ fontSize:13, fontWeight:700, color:"#111827" }}>{STEP_META[step-1]?.label}</span>
            <span style={{ fontSize:12, color:"#9ca3af", marginLeft:8 }}>— {STEP_META[step-1]?.sub}</span>
          </div>
          <div style={{ marginLeft:"auto", fontSize:11, color:"#9ca3af", display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'#22c55e', display:'inline-block' }} />
            Auto-saved
          </div>
        </div>

        {/* Step content — full width */}
        <div style={{ padding:"24px 28px" }}>
          <StepErrorBoundary step={step}>
            <CurrentStep />
          </StepErrorBoundary>
        </div>
      </div>
    </div>
  )
}
