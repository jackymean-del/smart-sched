import { Component, type ReactNode } from "react"
import { useTimetableStore } from "@/store/timetableStore"
import { WizardSidebar } from "@/components/layout/WizardSidebar"
import { Step1Org }          from "@/routes/wizard/step1-org"
import { Step2Country }      from "@/routes/wizard/step2-country"
import { Step3Schedule }     from "@/routes/wizard/step3-schedule"
import { Step4Pools }        from "@/routes/wizard/step4-pools"
import { Step5Facilities }   from "@/routes/wizard/step5-facilities"
import { Step6Generate }     from "@/routes/wizard/step6-generate"

/**
 * Spec §7.1 — Setup Wizard (6 Screens):
 * 1. Organization Details  (org type + country + standards)
 * 2. Groups & Schedule     (working days, shifts, periods, subjects per group)
 * 3. Subject Configuration (subjects + mode + periods/duration)
 * 4. Participant Pools     (pools with grade range + auto-generated teachers)
 * 5. Facility Setup        (rooms, labs, halls)
 * 6. Generate              (async job + polling)
 */

class StepErrorBoundary extends Component<{children: ReactNode; step: number}, {error: string|null}> {
  constructor(props: any) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(error: Error) { return { error: error.message } }
  render() {
    if (this.state.error) return (
      <div style={{ padding:24, background:"#fef2f2", border:"1px solid #fca5a5", borderRadius:12 }}>
        <div style={{ fontSize:16, fontWeight:600, color:"#991b1b", marginBottom:8 }}>⚠️ Step {this.props.step} error</div>
        <div style={{ fontSize:11, color:"#7f1d1d", fontFamily:"monospace", marginBottom:16 }}>{this.state.error}</div>
        <button onClick={() => { this.setState({ error:null }); useTimetableStore.getState().resetWizard() }}
          style={{ padding:"8px 16px", borderRadius:8, border:"none", background:"#dc2626", color:"#fff", cursor:"pointer", fontSize:13 }}>
          Reset Wizard
        </button>
      </div>
    )
    return this.props.children
  }
}

// Spec §7.1 — 6 steps
const STEPS = [Step1Org, Step2Country, Step3Schedule, Step4Pools, Step5Facilities, Step6Generate]

const STEP_LABELS = [
  { label:"Organization",     sub:"Type & country" },
  { label:"Schedule",         sub:"Days, shifts & timing" },
  { label:"Subjects",         sub:"Resources & periods" },
  { label:"Participant Pools",sub:"Teacher pools" },
  { label:"Facilities",       sub:"Rooms & spaces" },
  { label:"Generate",         sub:"Build timetable" },
]

export function WizardPage() {
  const { step, setStep } = useTimetableStore()
  const CurrentStep = STEPS[step - 1] ?? Step1Org

  return (
    <div style={{ display:"flex", flex:1, minHeight:"calc(100vh - 52px)" }}>
      {/* Sidebar */}
      <div style={{ width:220, background:"#1c1b18", padding:"24px 0", flexShrink:0 }}>
        <div style={{ padding:"0 16px 20px", borderBottom:"1px solid #2a2926" }}>
          <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase" as const, letterSpacing:"0.1em", color:"#6a6860" }}>Setup Wizard</div>
        </div>
        {STEP_LABELS.map((s, i) => {
          const n = i + 1
          const isActive = step === n
          const isDone   = step > n
          return (
            <button key={n} onClick={() => isDone && setStep(n)}
              style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"10px 16px", border:"none", background: isActive?"#2a2926":"transparent", cursor: isDone?"pointer":"default", textAlign:"left" as const }}>
              <div style={{ width:22, height:22, borderRadius:"50%", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, background: isActive?"#059669":isDone?"#34d399":"#2a2926", color: isActive||isDone?"#fff":"#6a6860" }}>
                {isDone ? "✓" : n}
              </div>
              <div>
                <div style={{ fontSize:12, fontWeight: isActive?600:400, color: isActive?"#fff":isDone?"#d4d1c8":"#6a6860" }}>{s.label}</div>
                <div style={{ fontSize:10, color:"#4a4844", marginTop:1 }}>{s.sub}</div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div style={{ flex:1, overflowY:"auto", padding:28, maxHeight:"calc(100vh - 52px)" }}>
        {/* Auto-save indicator */}
        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:14, fontSize:11, color:"#059669" }}>
          <span>💾</span>
          <span>Progress auto-saved — close anytime and resume where you left off</span>
          <span style={{ marginLeft:"auto", color:"#a8a59e" }}>Step {step} of {STEPS.length}</span>
        </div>
        <div style={{ maxWidth:820 }}>
          <StepErrorBoundary step={step}>
            <CurrentStep />
          </StepErrorBoundary>
        </div>
      </div>
    </div>
  )
}
