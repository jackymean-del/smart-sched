import { useEffect, useState } from "react"
import { useTimetableStore } from "@/store/timetableStore"
import { generateSections, generateStaff, generateSubjects, generateBreaks, ORG_CONFIGS, getCountry } from "@/lib/orgData"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Tab = "sections" | "staff" | "subjects" | "breaks"

export function Step5Data() {
  const { config, sections, staff, subjects, breaks,
          setSections, setStaff, setSubjects, setBreaks, setStep } = useTimetableStore()
  const [tab, setTab] = useState<Tab>("sections")
  const org = ORG_CONFIGS[config.orgType ?? "school"]
  const country = getCountry(config.countryCode ?? "IN")

  // Auto-generate on first visit
  useEffect(() => {
    if (!sections.length) {
      setSections(generateSections(config.orgType ?? "school", config.countryCode ?? "IN", config.numSections))
      setStaff(generateStaff(config.orgType ?? "school", config.countryCode ?? "IN", config.numStaff))
      setSubjects(generateSubjects(config.orgType ?? "school", config.countryCode ?? "IN", config.numSubjects))
      setBreaks(generateBreaks(config.orgType ?? "school", config.numBreaks))
    }
  }, [])

  const TAB_LABELS: { key: Tab; label: string }[] = [
    { key: "sections", label: `📚 ${org.sectionLabelsLabel}` },
    { key: "staff",    label: `👤 ${org.staffsLabel}` },
    { key: "subjects", label: `📖 ${org.subjectsLabel}` },
    { key: "breaks",   label: "⏱ Periods & Breaks" },
  ]

  return (
    <div>
      <h1 className="font-serif text-3xl mb-2">Review & edit generated data</h1>
      <p className="text-gray-500 text-[13px] mb-4 leading-relaxed">
        AI generated {sections.length} {org.sectionLabelsLabel.toLowerCase()}, {staff.length} {org.staffsLabel.toLowerCase()},
        {" "}{subjects.length} {org.subjectsLabel.toLowerCase()}, and {breaks.length} break slots based on {country.name} norms.
        Edit anything inline.
      </p>

      <div className="flex items-start gap-2 bg-indigo-50 border-l-4 border-indigo-400 px-4 py-3 rounded-r-lg mb-5 text-[12px] text-indigo-800">
        🪄 Everything was AI-generated. Click any field to edit. Add or delete rows as needed.
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-5">
        {TAB_LABELS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-[12px] font-medium border-b-2 transition-colors whitespace-nowrap
              ${tab === t.key ? "border-indigo-600 text-indigo-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Sections table */}
      {tab === "sections" && (
        <DataTable
          headers={["#", org.sectionLabel, org.roomLabel, "Grade/Type", "Class Teacher", ""]}
          cols="40px 1fr 110px 100px 1fr 32px"
          rows={sections.map((s, i) => [
            <span className="text-[10px] text-gray-400 font-mono">{i+1}</span>,
            <Input className="text-xs h-7 border-transparent focus:border-indigo-400" value={s.name} onChange={e => {const n=[...sections];n[i]={...n[i],name:e.target.value};setSections(n)}} />,
            <Input className="text-xs h-7 border-transparent focus:border-indigo-400" value={s.room??""} onChange={e => {const n=[...sections];n[i]={...n[i],room:e.target.value};setSections(n)}} />,
            <Input className="text-xs h-7 border-transparent focus:border-indigo-400" value={s.grade??""} onChange={e => {const n=[...sections];n[i]={...n[i],grade:e.target.value};setSections(n)}} />,
            <select className="text-xs border border-gray-200 rounded px-1.5 py-1 w-full bg-white" value={s.classTeacher??""} onChange={e => {const n=[...sections];n[i]={...n[i],classTeacher:e.target.value};setSections(n)}}>
              <option value="">— None —</option>
              {staff.map(st => <option key={st.id} value={st.name}>{st.name}</option>)}
            </select>,
            <DelBtn onClick={() => setSections(sections.filter((_,j)=>j!==i))} />,
          ])}
          onAdd={() => setSections([...sections, {id:crypto.randomUUID(),name:`New ${org.sectionLabel}`,room:`${country.roomPrefix} ${country.roomStart+sections.length}`,grade:"",classTeacher:""}])}
          addLabel={`Add ${org.sectionLabel}`}
        />
      )}

      {/* Staff table */}
      {tab === "staff" && (
        <DataTable
          headers={["#", "Name", "Max/week", "Role", ""]}
          cols="40px 1fr 90px 110px 32px"
          rows={staff.map((s, i) => [
            <span className="text-[10px] text-gray-400 font-mono">{i+1}</span>,
            <div>
              <Input className="text-xs h-7 border-transparent focus:border-indigo-400" value={s.name} onChange={e => {const n=[...staff];n[i]={...n[i],name:e.target.value};setStaff(n)}} />
              {s.isClassTeacher && <span className="text-[9px] text-emerald-600 ml-1">★ CT: {s.isClassTeacher}</span>}
            </div>,
            <Input type="number" className="text-xs h-7 font-mono border-transparent focus:border-indigo-400" value={s.maxPeriodsPerWeek} onChange={e => {const n=[...staff];n[i]={...n[i],maxPeriodsPerWeek:+e.target.value};setStaff(n)}} />,
            <Input className="text-xs h-7 border-transparent focus:border-indigo-400" value={s.role} onChange={e => {const n=[...staff];n[i]={...n[i],role:e.target.value};setStaff(n)}} />,
            <DelBtn onClick={() => setStaff(staff.filter((_,j)=>j!==i))} />,
          ])}
          onAdd={() => setStaff([...staff,{id:crypto.randomUUID(),name:`New ${org.staffLabel}`,role:org.staffLabel,subjects:[],classes:[],isClassTeacher:"",maxPeriodsPerWeek:country.maxPeriodsWeek}])}
          addLabel={`Add ${org.staffLabel}`}
        />
      )}

      {/* Subjects table */}
      {tab === "subjects" && (
        <DataTable
          headers={["#", "Name", "Per./week", ""]}
          cols="40px 1fr 90px 32px"
          rows={subjects.map((s, i) => [
            <span className="text-[10px] text-gray-400 font-mono">{i+1}</span>,
            <Input className="text-xs h-7 border-transparent focus:border-indigo-400" value={s.name} onChange={e => {const n=[...subjects];n[i]={...n[i],name:e.target.value};setSubjects(n)}} />,
            <Input type="number" className="text-xs h-7 font-mono border-transparent focus:border-indigo-400" value={s.periodsPerWeek} onChange={e => {const n=[...subjects];n[i]={...n[i],periodsPerWeek:+e.target.value};setSubjects(n)}} />,
            <DelBtn onClick={() => setSubjects(subjects.filter((_,j)=>j!==i))} />,
          ])}
          onAdd={() => setSubjects([...subjects,{id:crypto.randomUUID(),name:`New ${org.subjectLabel}`,periodsPerWeek:2,color:"bg-gray-100 text-gray-700",sections:[]}])}
          addLabel={`Add ${org.subjectLabel}`}
        />
      )}

      {/* Breaks table */}
      {tab === "breaks" && (
        <DataTable
          headers={["#", "Name", "Duration", "Type", "Shiftable", ""]}
          cols="40px 1fr 90px 110px 80px 32px"
          rows={breaks.map((b, i) => [
            <span className="text-[10px] text-gray-400 font-mono">{i+1}</span>,
            <Input className="text-xs h-7 border-transparent focus:border-indigo-400" value={b.name} onChange={e => {const n=[...breaks];n[i]={...n[i],name:e.target.value};setBreaks(n)}} />,
            <div className="flex items-center gap-1">
              <Input type="number" className="text-xs h-7 font-mono border-transparent focus:border-indigo-400 w-14" value={b.duration} onChange={e => {const n=[...breaks];n[i]={...n[i],duration:+e.target.value};setBreaks(n)}} />
              <span className="text-[10px] text-gray-400">min</span>
            </div>,
            <select className="text-xs border border-gray-200 rounded px-1 py-1 w-full" value={b.type} onChange={e => {const n=[...breaks];n[i]={...n[i],type:e.target.value as any};setBreaks(n)}}>
              {["fixed-start","break","lunch","fixed-end"].map(t => <option key={t}>{t}</option>)}
            </select>,
            <div className="flex items-center justify-center gap-1.5">
              <input type="checkbox" className="w-3.5 h-3.5 accent-emerald-600" checked={b.shiftable} onChange={e => {const n=[...breaks];n[i]={...n[i],shiftable:e.target.checked};setBreaks(n)}} />
              <span className="text-[10px] text-gray-400">{b.shiftable?"Yes":"No"}</span>
            </div>,
            <DelBtn onClick={() => setBreaks(breaks.filter((_,j)=>j!==i))} />,
          ])}
          onAdd={() => setBreaks([...breaks,{id:`br_${Date.now()}`,name:"New Break",duration:15,type:"break",shiftable:true}])}
          addLabel="Add break / special slot"
          footer={<p className="text-[11px] text-gray-400 px-3 py-2 bg-gray-50 border-t border-gray-200">💡 <strong>All period types including Assembly and Dispersal can be made shiftable.</strong> When two shiftable periods swap, all data swaps including teacher timetables.</p>}
        />
      )}

      <div className="flex justify-between pt-5 border-t border-gray-100 mt-5">
        <Button variant="outline" onClick={() => setStep(4)}>← Back</Button>
        <Button onClick={() => setStep(6)}>Continue to assignment →</Button>
      </div>
    </div>
  )
}

// ── Reusable mini table ──────────────────────────────────
function DataTable({ headers, cols, rows, onAdd, addLabel, footer }: {
  headers: string[]; cols: string
  rows: React.ReactNode[][]
  onAdd: () => void; addLabel: string
  footer?: React.ReactNode
}) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden mb-3">
      <div className="bg-gray-50 grid gap-0 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-200"
        style={{gridTemplateColumns:cols}}>
        {headers.map(h => <span key={h}>{h}</span>)}
      </div>
      {rows.map((row, i) => (
        <div key={i} className="grid gap-0 px-3 py-1.5 border-b border-gray-100 last:border-0 hover:bg-gray-50 items-center"
          style={{gridTemplateColumns:cols}}>
          {row.map((cell, j) => <div key={j}>{cell}</div>)}
        </div>
      ))}
      {footer}
      <button onClick={onAdd}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-[11.5px] text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 border-t-[1.5px] border-dashed border-gray-200 transition-colors">
        ＋ {addLabel}
      </button>
    </div>
  )
}

function DelBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="w-6 h-6 flex items-center justify-center rounded text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors text-base">
      ×
    </button>
  )
}
