import { GraduationCap, Building2, Briefcase, Stethoscope, HeartHandshake, Factory } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTimetableStore } from "@/store/timetableStore"
import { Button } from "@/components/ui/button"
import type { OrgType } from "@/types"

const ORGS: { key: OrgType; icon: React.ElementType; label: string; sub: string }[] = [
  { key: "school",    icon: GraduationCap, label: "School",          sub: "K–12 · Primary · Secondary" },
  { key: "college",   icon: Building2,     label: "College/University", sub: "UG · PG · Research" },
  { key: "corporate", icon: Briefcase,     label: "Corporate",       sub: "Shifts · Teams · Meetings" },
  { key: "hospital",  icon: Stethoscope,   label: "Healthcare",      sub: "Hospital · Clinic · OT" },
  { key: "ngo",       icon: HeartHandshake,label: "NGO/Non-profit",  sub: "Projects · Volunteers" },
  { key: "factory",   icon: Factory,       label: "Factory/Labour",  sub: "Shifts · Assembly Lines" },
]

export function Step1Org() {
  const { config, setConfig, setStep } = useTimetableStore()

  return (
    <div>
      <h1 className="font-serif text-3xl mb-2">What kind of organization?</h1>
      <p className="text-gray-500 text-[13px] mb-6 leading-relaxed">
        SmartSched adapts all terminology, workload standards, break rules and AI behaviour to match your org type.
      </p>

      <div className="grid grid-cols-3 gap-3 mb-8">
        {ORGS.map(({ key, icon: Icon, label, sub }) => (
          <button
            key={key}
            onClick={() => setConfig({ orgType: key })}
            className={cn(
              "border-[1.5px] rounded-xl p-4 text-center cursor-pointer transition-all hover:border-emerald-400 hover:bg-emerald-50",
              config.orgType === key
                ? "border-indigo-500 bg-indigo-50"
                : "border-gray-200 bg-white"
            )}
          >
            <Icon className={cn("w-7 h-7 mx-auto mb-2.5", config.orgType === key ? "text-indigo-600" : "text-gray-400")} />
            <div className="text-[12px] font-semibold">{label}</div>
            <div className="text-[10px] text-gray-400 mt-1">{sub}</div>
          </button>
        ))}
      </div>

      <div className="flex justify-end pt-5 border-t border-gray-100">
        <Button onClick={() => setStep(2)} disabled={!config.orgType} className="gap-2">
          Continue →
        </Button>
      </div>
    </div>
  )
}
