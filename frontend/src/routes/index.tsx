import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Brain, Globe, RefreshCcw, ArrowLeftRight,
  FileOutput, Settings2, Sparkles, Eye,
  GraduationCap, Building2, Briefcase, Stethoscope, HeartHandshake, Factory,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export const Route = createFileRoute('/')({ component: HomePage })

const ORG_PILLS = [
  { icon: GraduationCap, label: 'School' },
  { icon: Building2,     label: 'College' },
  { icon: Briefcase,     label: 'Corporate' },
  { icon: Stethoscope,   label: 'Healthcare' },
  { icon: HeartHandshake,label: 'NGO' },
  { icon: Factory,       label: 'Factory' },
]

const FEATURES = [
  { icon: Brain,        color: 'text-emerald-600', title: 'AI Constraint Solver',    desc: 'Zero-conflict timetables via genetic optimization + constraint propagation in seconds.' },
  { icon: Globe,        color: 'text-indigo-600',  title: '8+ Country Standards',    desc: 'Auto-loads national labour laws, workload norms, break mandates for India, US, UK, UAE and more.' },
  { icon: RefreshCcw,   color: 'text-amber-600',   title: 'Smart Substitution',      desc: 'AI instantly finds the best available substitute by subject match and free slot.' },
  { icon: ArrowLeftRight,color:'text-purple-600',  title: 'All Periods Shiftable',   desc: 'Assembly, Dispersal, breaks, class periods — any slot swappable. Changes cascade to teacher timetable.' },
  { icon: FileOutput,   color: 'text-orange-600',  title: 'Export Anywhere',         desc: 'PDF auto-fit (any paper/orientation), multi-sheet Excel with teacher info headers.' },
  { icon: Settings2,    color: 'text-teal-600',    title: 'Fully Editable',          desc: 'Edit any cell live. Lock/unlock any period. Toggle teacher names and room numbers.' },
]

function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-[calc(100vh-52px)] px-6 py-12 text-center bg-gradient-to-b from-emerald-50/60 to-gray-50">

      {/* Hero icon */}
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white shadow-lg mb-7">
        <Sparkles className="w-9 h-9" />
      </div>

      <h1 className="font-serif text-5xl leading-tight mb-4 max-w-2xl">
        AI-Powered <em className="text-emerald-600 not-italic">Timetable</em><br />Generator
      </h1>
      <p className="text-gray-500 text-[15px] max-w-xl leading-relaxed mb-9">
        Generate conflict-free, regulation-compliant timetables for any organization in seconds.
        AI handles the complexity — you just review and approve.
      </p>

      {/* Org pills */}
      <div className="flex gap-2 flex-wrap justify-center mb-9">
        {ORG_PILLS.map(({ icon: Icon, label }) => (
          <span key={label} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-[11px] font-medium text-gray-500">
            <Icon className="w-3.5 h-3.5" /> {label}
          </span>
        ))}
      </div>

      {/* CTA */}
      <div className="flex gap-3 mb-14">
        <Link to="/wizard">
          <Button size="lg" className="gap-2 text-[15px]">
            <Sparkles className="w-4 h-4" /> Create Timetable — Free
          </Button>
        </Link>
        <Link to="/demo">
          <Button size="lg" variant="outline" className="gap-2 text-[15px]">
            <Eye className="w-4 h-4" /> View Live Demo
          </Button>
        </Link>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl w-full">
        {FEATURES.map(({ icon: Icon, color, title, desc }) => (
          <Card key={title} className="text-left hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <Icon className={`w-6 h-6 ${color} mb-3`} />
              <h3 className="font-semibold text-[13px] mb-1.5">{title}</h3>
              <p className="text-[11.5px] text-gray-500 leading-relaxed">{desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  )
}
