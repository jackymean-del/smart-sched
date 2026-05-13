import { Component, type ReactNode } from "react"
import { useTimetableStore } from "@/store/timetableStore"
import { Step1Org }        from "@/routes/wizard/step1-org"
import { Step2Schedule }   from "@/routes/wizard/step2-schedule"
import { Step3Subjects }   from "@/routes/wizard/step3-subjects"
import { Step4Pools }      from "@/routes/wizard/step4-pools"
import { Step5Facilities } from "@/routes/wizard/step5-facilities"
import { Step6Generate }   from "@/routes/wizard/step6-generate"

/**
 * Spec §7.1 — 6-step wizard:
 * 1. Organization  — org type, country, standards
 * 2. Schedule      — working days, shifts, period duration, breaks
 * 3. Subjects      — subjects, scheduling mode, periods/week or duration
 * 4. Participant Pools — teacher pools with grade range + auto-names
 * 5. Facilities    — rooms, labs, halls
 * 6. Generate      — async timetable generation
 */

const STEPS = [Step1Org, Step2Schedule, Step3Subjects, Step4Pools, Step5Facilities, Step6Generate]

const STEP_META = [
  { n:1, label:"Organization",      sub:"Type & country",        icon:"🏫" },
  { n:2, label:"Schedule",          sub:"Days, shifts & timing",  icon:"📅" },
  { n:3, label:"Subjects",          sub:"Resources & periods",    icon:"📖" },
  { n:4, label:"Participant Pools", sub:"Teacher groups",         icon:"👥" },
  { n:5, label:"Facilities",        sub:"Rooms & spaces",         icon:"🏢" },
  { n:6, label:"Generate",          sub:"Build timetable",        icon:"✨" },
]

class StepErrorBoundary extends Component<
  { children: ReactNode; step: number },
  { error: string | null }
> {
  constructor(props: any) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(e: Error) { return { error: e.message } }
  render() {
    if (this.state.error) return (
      <div style={{ padding:24, background:"#fef2f2", border:"1px solid #fca5a5", borderRadius:12 }}>
        <div style={{ fontSize:16, fontWeight:600, color:"#991b1b", marginBottom:8 }}>
          ⚠️ Step {this.props.step} error
        </div>
        <div style={{ fontSize:11, color:"#7f1d1d", fontFamily:"monospace", marginBottom:16 }}>
          {this.state.error}
        </div>
        <button
          onClick={() => { this.setState({ error:null }); useTimetableStore.getState().resetWizard() }}
          style={{ padding:"8px 16px", borderRadius:8, border:"none", background:"#dc2626", color:"#fff", cursor:"pointer", fontSize:13 }}>
          Reset Wizard
        </button>
      </div>
    )
    return this.props.children
  }
}

export function WizardPage() {
  const { step, setStep } = useTimetableStore()
  const CurrentStep = STEPS[step - 1] ?? Step1Org

  return (
    <div style={{ display:"flex", flex:1, minHeight:"calc(100vh - 52px)" }}>

      {/* Sidebar */}
      <div style={{ width:220, background:"#1c1b18", flexShrink:0, display:"flex", flexDirection:"column" }}>
        <div style={{ padding:"20px 16px 16px", borderBottom:"1px solid #2a2926" }}>
          <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:"#6a6860" }}>
            Setup Wizard
          </div>
        </div>
        <nav style={{ flex:1, padding:"8px 0" }}>
          {STEP_META.map(s => {
            const active = step === s.n
            const done   = step > s.n
            return (
              <button key={s.n}
                onClick={() => done && setStep(s.n)}
                style={{
                  width:"100%", display:"flex", alignItems:"center", gap:10,
                  padding:"10px 16px", border:"none", textAlign:"left",
                  background: active ? "#2a2926" : "transparent",
                  cursor: done ? "pointer" : "default",
                }}>
                <div style={{
                  width:24, height:24, borderRadius:"50%", flexShrink:0,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:11, fontWeight:700,
                  background: done ? "#059669" : active ? "#4f46e5" : "#2a2926",
                  color: done || active ? "#fff" : "#4a4844",
                  border: done || active ? "none" : "1px solid #3a3834",
                }}>
                  {done ? "✓" : s.n}
                </div>
                <div>
                  <div style={{ fontSize:12, fontWeight: active ? 600 : 400, color: active ? "#fff" : done ? "#d4d1c8" : "#6a6860" }}>
                    {s.label}
                  </div>
                  <div style={{ fontSize:10, color:"#4a4844", marginTop:1 }}>{s.sub}</div>
                </div>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Main content */}
      <div style={{ flex:1, overflowY:"auto", background:"#fafaf9", padding:"32px 40px", maxHeight:"calc(100vh - 52px)" }}>
        {/* Auto-save banner */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color:"#059669" }}>
            <span>💾</span>
            <span>Progress auto-saved — close anytime and resume where you left off</span>
          </div>
          <div style={{ fontSize:11, color:"#a8a59e" }}>Step {step} of {STEPS.length}</div>
        </div>

        <div style={{ maxWidth:760, margin:"0 auto" }}>
          <StepErrorBoundary step={step}>
            <CurrentStep />
          </StepErrorBoundary>
        </div>
      </div>

    </div>
  )
}
