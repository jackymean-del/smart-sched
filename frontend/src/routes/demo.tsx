import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useEffect } from "react"
import { useTimetableStore } from "@/store/timetableStore"
import { generateSections, generateStaff, generateSubjects, generateBreaks } from "@/lib/orgData"
import { buildPeriodSequence, generateTimetable, autoAssign } from "@/lib/aiEngine"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"

export const Route = createFileRoute("/demo")({ component: DemoPage })

function DemoPage() {
  const navigate = useNavigate()
  const { setConfig, setSections, setStaff, setSubjects, setBreaks, setPeriods, setClassTT, setTeacherTT, setConflicts } = useTimetableStore()

  const loadDemo = () => {
    const orgType = "school"
    const countryCode = "IN"
    const workDays = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"]

    setConfig({ orgType, countryCode, workDays, periodsPerDay: 8, numBreaks: 4, numStaff: 8, numSections: 4, numSubjects: 8 })

    let secs    = generateSections(orgType, countryCode, 4)
    let staffArr = generateStaff(orgType, countryCode, 8)
    let subs    = generateSubjects(orgType, countryCode, 8)
    const brks  = generateBreaks(orgType, 4)

    const assigned = autoAssign(secs, staffArr, subs)
    secs     = assigned.sections
    staffArr = assigned.staff
    subs     = assigned.subjects

    setSections(secs); setStaff(staffArr); setSubjects(subs); setBreaks(brks)

    const periods = buildPeriodSequence(brks, 8)
    const { classTT, teacherTT, conflicts } = generateTimetable(secs, staffArr, subs, periods, workDays)

    setPeriods(periods); setClassTT(classTT); setTeacherTT(teacherTT); setConflicts(conflicts)
    navigate({ to: "/timetable" })
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-52px)] gap-6 text-center px-6">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white shadow-lg">
        <Sparkles className="w-7 h-7" />
      </div>
      <h1 className="font-serif text-3xl">Live Demo</h1>
      <p className="text-gray-500 max-w-sm leading-relaxed">
        India school · 4 classes · 8 teachers · 6-day week · All features enabled
      </p>
      <Button onClick={loadDemo} size="lg" className="gap-2 text-base px-8">
        <Sparkles className="w-4 h-4" /> Load Demo Timetable
      </Button>
    </div>
  )
}
