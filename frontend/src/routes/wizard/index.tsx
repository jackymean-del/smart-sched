import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useTimetableStore } from "@/store/timetableStore"
import { WizardSidebar } from "@/components/layout/WizardSidebar"
import { Step1Org }      from "./step1-org"
import { Step2Country }  from "./step2-country"
import { Step3Schedule } from "./step3-schedule"
import { Step4Numbers }  from "./step4-numbers"
import { Step5Data }     from "./step5-data"
import { Step6Assign }   from "./step6-assign"
import { Step7Generate } from "./step7-generate"

export const Route = createFileRoute("/wizard/")({ component: WizardPage })

function WizardPage() {
  const step = useTimetableStore(s => s.step)
  const setStep = useTimetableStore(s => s.setStep)

  const STEP_COMPONENTS = [
    Step1Org, Step2Country, Step3Schedule, Step4Numbers,
    Step5Data, Step6Assign, Step7Generate,
  ]
  const CurrentStep = STEP_COMPONENTS[step - 1] ?? Step1Org

  return (
    <div className="flex flex-1 min-h-[calc(100vh-52px)]">
      <WizardSidebar currentStep={step} onStepClick={setStep} />
      <div className="flex-1 overflow-y-auto p-7 max-h-[calc(100vh-52px)]">
        <div className="max-w-3xl">
          <CurrentStep />
        </div>
      </div>
    </div>
  )
}
