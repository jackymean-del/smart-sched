import { Component, type ReactNode } from "react"
import { useTimetableStore } from "@/store/timetableStore"
import { WizardSidebar } from "@/components/layout/WizardSidebar"
import { Step1Org }      from "@/routes/wizard/step1-org"
import { Step2Country }  from "@/routes/wizard/step2-country"
import { Step3Schedule } from "@/routes/wizard/step3-schedule"
import { Step4Numbers }  from "@/routes/wizard/step4-numbers"
import { Step5Data }     from "@/routes/wizard/step5-data"
import { Step6Assign }   from "@/routes/wizard/step6-assign"
import { Step7Generate } from "@/routes/wizard/step7-generate"

// Error boundary to catch render errors per step
class StepErrorBoundary extends Component<{children: ReactNode; step: number}, {error: string|null}> {
  constructor(props: any) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error: Error) {
    return { error: error.message }
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding:24, background:"#fef2f2", border:"1px solid #fca5a5", borderRadius:12 }}>
          <div style={{ fontSize:16, fontWeight:600, color:"#991b1b", marginBottom:8 }}>
            ⚠️ Step {this.props.step} encountered an error
          </div>
          <div style={{ fontSize:12, color:"#7f1d1d", fontFamily:"monospace", marginBottom:16 }}>
            {this.state.error}
          </div>
          <button
            onClick={() => { this.setState({ error: null }); useTimetableStore.getState().resetWizard() }}
            style={{ padding:"8px 16px", borderRadius:8, border:"none", background:"#dc2626", color:"#fff", cursor:"pointer", fontSize:13 }}>
            Reset Wizard & Start Over
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export function WizardPage() {
  const step    = useTimetableStore(s => s.step)
  const setStep = useTimetableStore(s => s.setStep)

  const STEPS = [Step1Org, Step2Country, Step3Schedule, Step4Numbers, Step5Data, Step6Assign, Step7Generate]
  const CurrentStep = STEPS[step - 1] ?? Step1Org

  return (
    <div style={{ display:"flex", flex:1, minHeight:"calc(100vh - 52px)" }}>
      <WizardSidebar currentStep={step} onStepClick={setStep} />
      <div style={{ flex:1, overflowY:"auto", padding:28, maxHeight:"calc(100vh - 52px)" }}>
        {/* Auto-save indicator */}
        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:16, fontSize:11, color:"#059669" }}>
          <span>💾</span>
          <span>Progress auto-saved — close browser anytime and resume where you left off</span>
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
