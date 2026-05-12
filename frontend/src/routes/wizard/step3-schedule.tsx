import { cn } from "@/lib/utils"
import { useTimetableStore } from "@/store/timetableStore"
import { Button } from "@/components/ui/button"

const ALL_DAYS = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"]
const DAY_LABELS: Record<string,string> = { MONDAY:"Mo",TUESDAY:"Tu",WEDNESDAY:"We",THURSDAY:"Th",FRIDAY:"Fr",SATURDAY:"Sa",SUNDAY:"Su" }

export function Step3Schedule() {
  const { config, setConfig, setStep } = useTimetableStore()

  const toggleDay = (day: string) => {
    const days = config.workDays.includes(day)
      ? config.workDays.filter(d => d !== day)
      : [...config.workDays, day]
    if (days.length > 0) setConfig({ workDays: days })
  }

  return (
    <div>
      <h1 className="font-serif text-3xl mb-2">Time format & working schedule</h1>
      <p className="text-gray-500 text-[13px] mb-6">Configure how times are displayed and set your working week.</p>

      {/* Time format */}
      <div className="mb-6">
        <label className="text-[10.5px] font-bold uppercase tracking-wider text-gray-400 block mb-2">Time Format</label>
        <div className="grid grid-cols-2 gap-3 max-w-sm">
          {(["12h","24h"] as const).map(fmt => (
            <button key={fmt} onClick={() => setConfig({ timeFormat: fmt })}
              className={cn("border-[1.5px] rounded-lg py-3.5 text-center transition-all",
                config.timeFormat === fmt ? "border-indigo-500 bg-indigo-50" : "border-gray-200 bg-white hover:border-gray-300")}>
              <div className={cn("font-mono text-xl font-bold", config.timeFormat === fmt ? "text-indigo-600" : "text-gray-700")}>
                {fmt === "12h" ? "2:30 PM" : "14:30"}
              </div>
              <div className="text-[10px] text-gray-400 mt-1">{fmt === "12h" ? "AM/PM (12-hour)" : "Military (24-hour)"}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Working days */}
      <div className="mb-6">
        <label className="text-[10.5px] font-bold uppercase tracking-wider text-gray-400 block mb-2">Working Days</label>
        <div className="flex gap-2 flex-wrap">
          {ALL_DAYS.map(day => (
            <button key={day} onClick={() => toggleDay(day)}
              className={cn("w-10 h-10 rounded-full border-[1.5px] text-[12px] font-bold transition-all",
                config.workDays.includes(day)
                  ? "bg-indigo-600 border-indigo-600 text-white"
                  : "border-gray-300 text-gray-400 hover:border-gray-400")}>
              {DAY_LABELS[day]}
            </button>
          ))}
        </div>
      </div>

      {/* Start / End time */}
      <div className="grid grid-cols-2 gap-4 max-w-sm mb-6">
        <div>
          <label className="text-[10.5px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5">Start Time</label>
          <select value={config.startTime} onChange={e => setConfig({ startTime: e.target.value })}
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
            {["07:00","08:00","08:30","09:00","09:05","09:30"].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10.5px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5">End Time</label>
          <select value={config.endTime} onChange={e => setConfig({ endTime: e.target.value })}
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
            {["14:00","14:30","15:00","15:30","15:45","16:00","17:00","18:00"].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div className="flex justify-between pt-5 border-t border-gray-100">
        <Button variant="outline" onClick={() => setStep(2)}>← Back</Button>
        <Button onClick={() => setStep(4)}>Continue →</Button>
      </div>
    </div>
  )
}
