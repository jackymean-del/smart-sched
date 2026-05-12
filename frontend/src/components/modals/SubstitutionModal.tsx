import { useState } from "react"
import { RefreshCcw } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useTimetableStore } from "@/store/timetableStore"
import { findSubstitutes } from "@/lib/aiEngine"
import { ORG_CONFIGS } from "@/lib/orgData"

interface Props { open: boolean; onClose: () => void }

export function SubstitutionModal({ open, onClose }: Props) {
  const { config, staff, classTT, periods, substitutions, setSubstitutions } = useTimetableStore()
  const [selectedStaff, setSelectedStaff] = useState<string>("")
  const [selectedDay, setSelectedDay] = useState(config.workDays[0] ?? "MONDAY")
  const org = ORG_CONFIGS[config.orgType ?? "school"]

  const absentStaff = staff.find(s => s.name === selectedStaff)
  const suggestions = absentStaff
    ? findSubstitutes(absentStaff, selectedDay, staff, classTT, periods)
    : []

  const apply = () => {
    const newSubs = { ...substitutions }
    suggestions.forEach(s => {
      if (s.substitute !== "Not available") {
        newSubs[`${s.sectionName}|${selectedDay}|${s.periodId}`] = s.substitute
      }
    })
    setSubstitutions(newSubs)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif text-xl">
            <RefreshCcw className="w-5 h-5 text-amber-500" /> Substitution Manager
          </DialogTitle>
          <DialogDescription>
            Select absent {org.staffLabel.toLowerCase()} and day. AI finds best substitute by subject match.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-[10.5px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5">Day</label>
            <select value={selectedDay} onChange={e => setSelectedDay(e.target.value)}
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
              {config.workDays.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <Button onClick={apply} variant="success" className="w-full gap-2">Apply</Button>
          </div>
        </div>

        <label className="text-[10.5px] font-bold uppercase tracking-wider text-gray-400 block mb-2">
          Select absent {org.staffLabel.toLowerCase()}
        </label>
        <div className="space-y-1.5 mb-4 max-h-40 overflow-y-auto">
          {staff.map(st => (
            <button key={st.id} onClick={() => setSelectedStaff(st.name)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 border rounded-lg text-left transition-all text-sm
                ${selectedStaff === st.name ? "border-amber-400 bg-amber-50" : "border-gray-200 hover:border-amber-300 hover:bg-amber-50"}`}>
              <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-[11px] font-bold text-gray-500">
                {st.name[0]}
              </div>
              <div>
                <div className="font-semibold text-[12px]">{st.name} {st.isClassTeacher && <span className="text-emerald-600 text-[10px]">★CT</span>}</div>
                <div className="text-[10px] text-gray-400">{st.role} · {(st.subjects ?? []).join(", ") || "No subjects"}</div>
              </div>
            </button>
          ))}
        </div>

        {suggestions.length > 0 && (
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-wider text-gray-400 mb-2">
              AI Suggestions for {selectedDay}
            </p>
            {suggestions.map((s, i) => (
              <div key={i} className="bg-emerald-50 border border-emerald-200 rounded-lg px-3.5 py-3 mb-2 text-[12px] text-emerald-800 leading-relaxed">
                <strong>{s.periodName} · {s.sectionName}:</strong> <em>{s.subject}</em><br/>
                <span>→ {org.staffLabel}: <strong>{s.substitute}</strong></span>
                {s.isPerfectMatch
                  ? <span className="ml-2 text-[9px] bg-emerald-600 text-white px-1.5 py-0.5 rounded">Best match</span>
                  : s.substitute !== "Not available"
                    ? <span className="ml-2 text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Diff. subject</span>
                    : <span className="ml-2 text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded">Unavailable</span>
                }
              </div>
            ))}
          </div>
        )}
        {selectedStaff && suggestions.length === 0 && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3.5 py-3 text-[12px] text-emerald-800">
            ✅ <strong>{selectedStaff}</strong> has no classes on {selectedDay}. No substitution needed.
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
