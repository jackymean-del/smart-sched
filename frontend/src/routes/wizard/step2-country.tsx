import { useState } from "react"
import { cn } from "@/lib/utils"
import { useTimetableStore } from "@/store/timetableStore"
import { COUNTRIES } from "@/lib/orgData"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

export function Step2Country() {
  const { config, setConfig, setStep } = useTimetableStore()
  const [customCountry, setCustomCountry] = useState("")

  const selected = COUNTRIES.find(c => c.code === config.countryCode)

  return (
    <div>
      <h1 className="font-serif text-3xl mb-2">Select your country</h1>
      <p className="text-gray-500 text-[13px] mb-6 leading-relaxed">
        We auto-load national labour laws, workload norms, break mandates and regulatory standards.
      </p>

      <div className="grid grid-cols-2 gap-2.5 mb-5">
        {COUNTRIES.map(c => (
          <button
            key={c.code}
            onClick={() => setConfig({ countryCode: c.code })}
            className={cn(
              "border-[1.5px] rounded-lg px-3.5 py-3 flex items-center gap-3 cursor-pointer transition-all text-left",
              config.countryCode === c.code
                ? "border-indigo-500 bg-indigo-50"
                : "border-gray-200 bg-white hover:border-emerald-400 hover:bg-emerald-50"
            )}
          >
            <span className="text-2xl">{c.flag}</span>
            <div>
              <div className="text-[12px] font-semibold">{c.name}</div>
              <div className="text-[10px] text-gray-400">{c.subtitle}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Custom country */}
      <div className="flex gap-2 mb-5">
        <Input
          placeholder="Other country — type and press Enter"
          value={customCountry}
          onChange={e => setCustomCountry(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && customCountry.trim()) {
              setConfig({ countryCode: "CUSTOM" })
            }
          }}
          className="text-sm"
        />
        <Button variant="outline" onClick={() => customCountry.trim() && setConfig({ countryCode: "CUSTOM" })}>
          Use
        </Button>
      </div>

      {/* Standards banner */}
      {selected && (
        <div className="border-l-4 border-emerald-500 bg-emerald-50 px-4 py-3 rounded-r-lg mb-6 text-[12px] text-emerald-800">
          <strong className="block mb-1">✅ Standard loaded: {selected.name}</strong>
          {selected.standard}
        </div>
      )}

      <div className="flex justify-between pt-5 border-t border-gray-100">
        <Button variant="outline" onClick={() => setStep(1)}>← Back</Button>
        <Button onClick={() => setStep(3)} disabled={!config.countryCode}>Continue →</Button>
      </div>
    </div>
  )
}
