import { useMemo } from "react"
import { useTimetableStore } from "@/store/timetableStore"
import { getCountry, ORG_CONFIGS } from "@/lib/orgData"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

export function Step4Numbers() {
  const { config, setConfig, setStep } = useTimetableStore()
  const country = getCountry(config.countryCode ?? "IN")
  const org = ORG_CONFIGS[config.orgType ?? "school"]

  const totalSlots = config.numSections * config.periodsPerDay * config.workDays.length
  const capacity   = config.numStaff * country.maxPeriodsWeek
  const pct        = Math.round((totalSlots / capacity) * 100)
  const needed     = Math.ceil(totalSlots / country.maxPeriodsWeek)

  const status = pct > 110 ? "danger" : pct > 90 ? "warning" : "ok"

  const fields = [
    { id: "numStaff",      label: org.staffsLabel,    sub: `Max ${country.maxPeriodsWeek}/week`, key: "numStaff" as const },
    { id: "numSections",   label: org.sectionsLabel,  sub: "Sections / Batches",                 key: "numSections" as const },
    { id: "numSubjects",   label: org.subjectsLabel,  sub: "Courses / Duties",                   key: "numSubjects" as const },
    { id: "periodsPerDay", label: "Periods/day",      sub: "Excluding breaks",                    key: "periodsPerDay" as const },
    { id: "numBreaks",     label: "Breaks",           sub: "Incl. Assembly & Dispersal",          key: "numBreaks" as const },
  ]

  return (
    <div>
      <h1 className="font-serif text-3xl mb-2">{org.name} — How many of each?</h1>
      <p className="text-gray-500 text-[13px] mb-4 leading-relaxed">
        Enter numbers only — AI generates all realistic names, rooms, subjects, and breaks automatically.
      </p>
      <div className="flex items-start gap-2 bg-indigo-50 border-l-4 border-indigo-400 px-4 py-3 rounded-r-lg mb-6 text-[12px] text-indigo-800">
        <span className="mt-0.5">✨</span>
        <span>AI will generate realistic staff names, {org.sectionsLabel.toLowerCase()}, {org.subjectsLabel.toLowerCase()}, and break schedules based on <strong>{country.name}</strong> norms. Everything is editable in the next step.</span>
      </div>

      {/* Number inputs */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {fields.map(f => (
          <div key={f.id} className="bg-white border-[1.5px] border-gray-200 rounded-xl p-3.5 text-center focus-within:border-indigo-400 transition-colors">
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">{f.label}</div>
            <input
              type="number" min={1} max={500}
              value={config[f.key]}
              onChange={e => setConfig({ [f.key]: Math.max(1, +e.target.value) } as any)}
              className="w-full text-center text-3xl font-bold font-mono text-gray-800 bg-transparent border-none outline-none"
            />
            <div className="text-[10px] text-gray-400 mt-1.5 leading-tight">{f.sub}</div>
          </div>
        ))}
      </div>

      {/* Capacity summary */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          { v: config.numStaff,    l: org.staffsLabel },
          { v: config.numSections, l: org.sectionsLabel },
          { v: config.numSubjects, l: org.subjectsLabel },
          { v: pct,                l: "Capacity used", pct: true },
        ].map(({ v, l, pct: isPct }) => (
          <div key={l} className={`bg-white rounded-xl border-[1.5px] p-3.5 text-center ${isPct && status === "danger" ? "border-red-300" : isPct && status === "warning" ? "border-amber-300" : "border-gray-200"}`}>
            <div className={`text-2xl font-bold font-mono ${isPct && status === "danger" ? "text-red-600" : isPct && status === "warning" ? "text-amber-600" : "text-gray-800"}`}>
              {v}{isPct ? "%" : ""}
            </div>
            <div className="text-[10px] text-gray-400 mt-1">{l}</div>
          </div>
        ))}
      </div>

      {/* Alert */}
      {status === "danger" && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-[12px] text-red-700 mb-4">
          <span>⚠️</span>
          <div>
            <strong>Staff overloaded ({pct}%)!</strong> Need at least <strong>{needed}</strong> {org.staffsLabel.toLowerCase()}.
            <button onClick={() => setConfig({ numStaff: needed })}
              className="ml-2 underline font-semibold hover:no-underline">Auto-fix → {needed}</button>
          </div>
        </div>
      )}
      {status === "warning" && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-[12px] text-amber-700 mb-4">
          <span>⚠️</span> <strong>High workload ({pct}%)</strong> — Some staff near national max of {country.maxPeriodsWeek}/week.
        </div>
      )}
      {status === "ok" && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2.5 text-[12px] text-emerald-700 mb-4">
          ✅ <strong>Well balanced ({pct}%)</strong> — Staff count is sufficient.
        </div>
      )}

      <div className="flex justify-between pt-5 border-t border-gray-100">
        <Button variant="outline" onClick={() => setStep(3)}>← Back</Button>
        <Button onClick={() => setStep(5)}>Generate data & continue →</Button>
      </div>
    </div>
  )
}
