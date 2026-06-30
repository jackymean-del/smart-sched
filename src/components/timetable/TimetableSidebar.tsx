import { getSubjectColor } from "@/lib/orgData"
import { ORG_CONFIGS } from "@/lib/orgData"
import type { Subject, Staff, Period, TeacherSchedule, WizardConfig } from "@/types"

interface Props {
  tab: "legend" | "staff" | "shifts"
  onTabChange: (t: "legend" | "staff" | "shifts") => void
  subjects: Subject[]
  staff: Staff[]
  periods: Period[]
  teacherTT: Record<string, TeacherSchedule>
  config: WizardConfig
  onToggleShift: (id: string) => void
}

export function TimetableSidebar({ tab, onTabChange, subjects, staff, periods, teacherTT, config, onToggleShift }: Props) {
  const org = ORG_CONFIGS[config.orgType ?? "school"]

  return (
    <div className="w-[238px] border-r border-gray-200 bg-white flex flex-col shrink-0 no-print">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {(["legend","staff","shifts"] as const).map(t => (
          <button key={t} onClick={() => onTabChange(t)}
            className={`flex-1 py-2.5 text-[11px] font-medium capitalize border-b-2 transition-colors
              ${tab === t ? "border-indigo-600 text-indigo-700" : "border-transparent text-gray-400 hover:text-gray-600"}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {tab === "legend" && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Subject colors</p>
            {subjects.map(s => (
              <div key={s.id} className="flex items-center gap-2 mb-1.5 text-[10.5px]">
                <div className={`w-3 h-3 rounded-sm shrink-0 ${s.color.split(' ')[0]}`} />
                <span>{s.name}</span>
              </div>
            ))}
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2 mt-4">Special slots</p>
            {[
              ["bg-blue-200","Assembly/Start"],
              ["bg-yellow-100","Break"],
              ["bg-amber-100","Lunch/Meal"],
              ["bg-emerald-100","Dispersal/End"],
            ].map(([bg, label]) => (
              <div key={label} className="flex items-center gap-2 mb-1.5 text-[10.5px]">
                <div className={`w-3 h-3 rounded-sm shrink-0 ${bg}`} />
                <span>{label}</span>
              </div>
            ))}
            <div className="flex items-center gap-2 mb-1.5 text-[10.5px]">
              <div className="w-3 h-3 rounded-sm border-2 border-dashed border-amber-400 shrink-0" />
              <span>Substituted period</span>
            </div>
          </div>
        )}

        {tab === "staff" && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Staff workload</p>
            {staff.map(st => {
              const sched = teacherTT[st.name]?.schedule ?? {}
              const count = Object.values(sched).reduce((a, d) => a + Object.values(d).filter(x => x?.subject).length, 0)
              const max = st.maxPeriodsPerWeek
              const pct = Math.min(100, Math.round(count / max * 100))
              return (
                <div key={st.id} className="border border-gray-100 rounded-lg p-2.5 mb-2 bg-gray-50">
                  <div className="text-[11px] font-semibold">{st.name} {st.isClassTeacher && <span className="text-emerald-600 text-[10px]">★CT</span>}</div>
                  <div className="text-[9.5px] text-gray-400 mt-0.5">{(st.subjects ?? []).slice(0,3).join(", ")}{(st.subjects ?? []).length > 3 ? "…" : ""}</div>
                  <div className="h-1.5 bg-gray-200 rounded mt-2 overflow-hidden">
                    <div className={`h-full rounded ${pct>100?"bg-red-500":pct>85?"bg-amber-500":"bg-emerald-500"}`} style={{width:`${pct}%`}} />
                  </div>
                  <div className="text-[9px] font-mono text-gray-400 mt-1">{count}/{max} {org.loadUnit} ({pct}%)</div>
                </div>
              )
            })}
          </div>
        )}

        {tab === "shifts" && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Period shift controls</p>
            <p className="text-[10.5px] text-gray-400 mb-3 leading-relaxed">
              Toggle any period — including Assembly and Dispersal — to allow/prevent shifting. Changes cascade to teacher timetables.
            </p>
            {periods.map(p => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <span className="text-[11px]">{p.name}</span>
                  <span className="text-[9px] text-gray-400 block">{p.type} · {p.duration}min</span>
                </div>
                <button
                  onClick={() => onToggleShift(p.id)}
                  className={`w-9 h-5 rounded-full relative transition-colors ${p.shiftable ? "bg-emerald-500" : "bg-gray-300"}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${p.shiftable ? "left-4" : "left-0.5"}`} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
