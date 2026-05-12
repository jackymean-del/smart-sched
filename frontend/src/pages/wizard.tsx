import { useTimetableStore } from "@/store/timetableStore"
import { WizardSidebar } from "@/components/layout/WizardSidebar"
import { Step1Org }      from "@/routes/wizard/step1-org"
import { Step2Country }  from "@/routes/wizard/step2-country"
import { Step3Schedule } from "@/routes/wizard/step3-schedule"
import { Step4Numbers }  from "@/routes/wizard/step4-numbers"
import { Step5Data }     from "@/routes/wizard/step5-data"
import { Step6Assign }   from "@/routes/wizard/step6-assign"
import { Step7Generate } from "@/routes/wizard/step7-generate"

export function WizardPage() {
  const step    = useTimetableStore(s => s.step)
  const setStep = useTimetableStore(s => s.setStep)

  const STEPS = [Step1Org, Step2Country, Step3Schedule, Step4Numbers, Step5Data, Step6Assign, Step7Generate]
  const CurrentStep = STEPS[step - 1] ?? Step1Org

  return (
    <div className="flex flex-1 min-h-[calc(100vh-52px)]">
      <WizardSidebar currentStep={step} onStepClick={setStep} />
      <div className="flex-1 overflow-y-auto p-7 max-h-[calc(100vh-52px)]">
        <div className="max-w-3xl"><CurrentStep /></div>
      </div>
    </div>
  )
}
