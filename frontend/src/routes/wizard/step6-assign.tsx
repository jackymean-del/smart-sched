import { useState } from "react"
import { useTimetableStore } from "@/store/timetableStore"
import { ORG_CONFIGS, getCountry } from "@/lib/orgData"
import { autoAssign } from "@/lib/aiEngine"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"

type Tab = "matrix" | "staff"

export function Step6Assign() {
  const { config, sections, staff, subjects, setSections, setStaff, setSubjects, setStep } = useTimetableStore()
  const [tab, setTab] = useState<Tab>("matrix")
  const org = ORG_CONFIGS[config.orgType ?? "school"]
  const country = getCountry(config.countryCode ?? "IN")

  const handleAutoAssign = () => {
    const result = autoAssign(sections, staff, subjects)
    setSections(result.sections)
    setStaff(result.staff)
    setSubjects(result.subjects)
  }

  const toggleSubSec = (subIdx: number, secName: string, checked: boolean) => {
    const updated = [...subjects]
    const secs = updated[subIdx].sections ?? []
    updated[subIdx] = {
      ...updated[subIdx],
      sections: checked ? [...secs, secName] : secs.filter(s => s !== secName),
    }
    setSubjects(updated)
  }

  const overloaded = staff.filter(st => {
    const load = (st.subjects ?? []).reduce((a, sn) => {
      const s = subjects.find(x => x.name === sn)
      return a + (s?.periodsPerWeek ?? 2)
    }, 0) * (st.classes?.length ?? 1)
    return load > (st.maxPeriodsPerWeek ?? country.maxPeriodsWeek)
  })

  return (
    <div>
      <h1 className="font-serif text-3xl mb-2">Assign {org.subjectsLabel} & {org.staffsLabel}</h1>
      <p className="text-gray-500 text-[13px] mb-4 leading-relaxed">
        Map {org.subjectsLabel.toLowerCase()} to {org.sectionsLabel.toLowerCase()}, then assign {org.staffsLabel.toLowerCase()} to teach them. Or let AI do it all.
      </p>

      <div className="flex items-start gap-2 bg-indigo-50 border-l-4 border-indigo-400 px-4 py-3 rounded-r-lg mb-5 text-[12px] text-indigo-800">
        ✨ Click <strong>AI Auto-Assign</strong> for optimal distribution. You can fine-tune afterwards.
      </div>

      <div className="flex gap-2 mb-5">
        <Button onClick={handleAutoAssign} className="gap-2">
          <Sparkles className="w-4 h-4" /> AI Auto-Assign Everything
        </Button>
        <Button variant="outline" onClick={() => setSubjects(subjects.map(s => ({ ...s, sections: [] })))}>Clear All</Button>
        <Button variant="outline" onClick={() => setSubjects(subjects.map(s => ({ ...s, sections: sections.map(x => x.name) })))}>Check All</Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-5">
        {(["matrix","staff"] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-[12px] font-medium border-b-2 transition-colors
              ${tab === t ? "border-indigo-600 text-indigo-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            {t === "matrix" ? `${org.subjectLabel} → ${org.section} Matrix` : "Staff Assignments"}
          </button>
        ))}
      </div>

      {/* Matrix */}
      {tab === "matrix" && (
        <div className="overflow-x-auto">
          <table className="text-[10.5px] border-collapse">
            <thead>
              <tr>
                <th className="bg-gray-100 border border-gray-200 px-3 py-2 text-left min-w-[150px] font-semibold">{org.subjectLabel} / Freq</th>
                {sections.map(s => <th key={s.id} className="bg-gray-100 border border-gray-200 px-2 py-2 font-semibold whitespace-nowrap">{s.name}</th>)}
              </tr>
            </thead>
            <tbody>
              {subjects.map((sub, si) => (
                <tr key={sub.id} className="hover:bg-gray-50">
                  <td className="bg-gray-50 border border-gray-200 px-3 py-1.5 font-medium">
                    {sub.name}<br/>
                    <span className="text-[9px] font-mono text-gray-400">{sub.periodsPerWeek}×/wk</span>
                  </td>
                  {sections.map(sec => (
                    <td key={sec.id} className="border border-gray-200 px-2 py-1 text-center">
                      <input type="checkbox"
                        className="w-3.5 h-3.5 accent-emerald-600 cursor-pointer"
                        checked={(sub.sections ?? []).includes(sec.name)}
                        onChange={e => toggleSubSec(si, sec.name, e.target.checked)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Staff assignments */}
      {tab === "staff" && (
        <div className="space-y-2">
          {staff.map((st, i) => {
            const load = (st.subjects ?? []).reduce((a, sn) => {
              const s = subjects.find(x => x.name === sn)
              return a + (s?.periodsPerWeek ?? 2)
            }, 0) * (st.classes?.length ?? 1)
            const maxP = st.maxPeriodsPerWeek ?? country.maxPeriodsWeek
            const pct = Math.min(100, Math.round(load / maxP * 100))
            return (
              <div key={st.id} className="border border-gray-200 rounded-lg p-3 grid gap-3" style={{gridTemplateColumns:"150px 1fr 1fr 90px"}}>
                <div>
                  <div className="text-[12px] font-semibold">{st.name}</div>
                  <div className="text-[10px] text-gray-400">{st.role}</div>
                  {st.isClassTeacher && <div className="text-[9px] text-emerald-600 mt-0.5">★ CT: {st.isClassTeacher}</div>}
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 mb-1">{org.subjectsLabel} (Ctrl=multi)</div>
                  <select multiple className="border border-gray-200 rounded text-[10.5px] w-full h-14 px-1"
                    value={st.subjects ?? []}
                    onChange={e => {const n=[...staff];n[i]={...n[i],subjects:Array.from(e.target.selectedOptions).map(o=>o.value)};setStaff(n)}}>
                    {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 mb-1">{org.sectionsLabel} (Ctrl=multi)</div>
                  <select multiple className="border border-gray-200 rounded text-[10.5px] w-full h-14 px-1"
                    value={st.classes ?? []}
                    onChange={e => {const n=[...staff];n[i]={...n[i],classes:Array.from(e.target.selectedOptions).map(o=>o.value)};setStaff(n)}}>
                    {sections.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <div className="text-[11px] font-mono">{load}/{maxP}</div>
                  <div className="h-1.5 bg-gray-200 rounded mt-1.5 overflow-hidden">
                    <div className={`h-full rounded transition-all ${pct>100?"bg-red-500":pct>85?"bg-amber-500":"bg-emerald-500"}`} style={{width:`${pct}%`}} />
                  </div>
                  <div className="text-[9px] text-gray-400 mt-1">{pct}%</div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Alerts */}
      {overloaded.length > 0 && (
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-[12px] text-amber-700">
          ⚠️ <strong>{overloaded.length} overloaded:</strong> {overloaded.map(s => s.name).join(", ")}
        </div>
      )}

      <div className="flex justify-between pt-5 border-t border-gray-100 mt-5">
        <Button variant="outline" onClick={() => setStep(5)}>← Back</Button>
        <Button variant="success" onClick={() => setStep(7)} className="gap-2">
          <Sparkles className="w-4 h-4" /> Generate Timetable
        </Button>
      </div>
    </div>
  )
}
