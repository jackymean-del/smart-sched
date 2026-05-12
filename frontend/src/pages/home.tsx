import {
  Brain, Globe, RefreshCcw, ArrowLeftRight,
  FileOutput, Settings2, Sparkles, Eye,
  GraduationCap, Building2, Briefcase, Stethoscope, HeartHandshake, Factory,
} from 'lucide-react'

const ORG_PILLS = [
  { icon: GraduationCap, label: 'School' },
  { icon: Building2,     label: 'College' },
  { icon: Briefcase,     label: 'Corporate' },
  { icon: Stethoscope,   label: 'Healthcare' },
  { icon: HeartHandshake,label: 'NGO' },
  { icon: Factory,       label: 'Factory' },
]

const FEATURES = [
  { icon: Brain,          color: 'color:#059669', title: 'AI Constraint Solver',   desc: 'Zero-conflict timetables via genetic optimization in seconds.' },
  { icon: Globe,          color: 'color:#4f46e5', title: '8+ Country Standards',   desc: 'Auto-loads national labour laws, workload norms for India, US, UK, UAE and more.' },
  { icon: RefreshCcw,     color: 'color:#d97706', title: 'Smart Substitution',     desc: 'AI instantly finds the best available substitute by subject match.' },
  { icon: ArrowLeftRight, color: 'color:#7c3aed', title: 'All Periods Shiftable',  desc: 'Assembly, Dispersal, breaks — any slot swappable. Cascades to teacher timetable.' },
  { icon: FileOutput,     color: 'color:#ea580c', title: 'Export Anywhere',        desc: 'PDF auto-fit (any paper/orientation), multi-sheet Excel with teacher headers.' },
  { icon: Settings2,      color: 'color:#0d9488', title: 'Fully Editable',         desc: 'Edit any cell live. Lock/unlock any period. Toggle teacher names and rooms.' },
]

export function HomePage() {
  return (
    <main style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: 'calc(100vh - 52px)',
      padding: '48px 24px', textAlign: 'center',
      background: 'linear-gradient(to bottom, rgba(209,250,229,0.4), #f7f6f2)',
    }}>
      {/* Icon */}
      <div style={{
        width: 80, height: 80, borderRadius: 22,
        background: 'linear-gradient(135deg, #34d399, #059669)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', marginBottom: 24, boxShadow: '0 10px 25px rgba(5,150,105,0.3)',
      }}>
        <Sparkles size={38} />
      </div>

      {/* Title */}
      <h1 className="font-serif" style={{ fontSize: 48, lineHeight: 1.15, marginBottom: 14, maxWidth: 640 }}>
        AI-Powered <span style={{ color: '#059669' }}>Timetable</span><br />Generator
      </h1>
      <p style={{ color: '#6a6860', fontSize: 15, maxWidth: 520, lineHeight: 1.75, marginBottom: 32 }}>
        Generate conflict-free, regulation-compliant timetables for any organization in seconds.
        AI handles the complexity — you just review and approve.
      </p>

      {/* Org pills */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 32 }}>
        {ORG_PILLS.map(({ icon: Icon, label }) => (
          <span key={label} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 14px', background: '#fff',
            border: '1px solid #e8e5de', borderRadius: 20,
            fontSize: 11, fontWeight: 500, color: '#6a6860',
          }}>
            <Icon size={14} /> {label}
          </span>
        ))}
      </div>

      {/* CTA Buttons */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 52, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={() => window.location.href = '/wizard'}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '13px 28px', borderRadius: 10, fontSize: 15, fontWeight: 600,
            background: '#059669', color: '#fff', border: 'none',
            cursor: 'pointer', transition: 'all 0.18s',
            boxShadow: '0 4px 14px rgba(5,150,105,0.35)',
          }}
          onMouseEnter={e => { (e.target as HTMLElement).style.transform = 'translateY(-2px)'; (e.target as HTMLElement).style.boxShadow = '0 6px 20px rgba(5,150,105,0.45)'; }}
          onMouseLeave={e => { (e.target as HTMLElement).style.transform = 'translateY(0)'; (e.target as HTMLElement).style.boxShadow = '0 4px 14px rgba(5,150,105,0.35)'; }}
        >
          <Sparkles size={18} /> Create Timetable — Free
        </button>
        <button
          onClick={() => window.location.href = '/demo'}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '13px 28px', borderRadius: 10, fontSize: 15, fontWeight: 600,
            background: '#fff', color: '#1c1b18',
            border: '2px solid #d4d1c8', cursor: 'pointer', transition: 'all 0.18s',
          }}
          onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = '#059669'; (e.target as HTMLElement).style.color = '#059669'; }}
          onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = '#d4d1c8'; (e.target as HTMLElement).style.color = '#1c1b18'; }}
        >
          <Eye size={18} /> View Live Demo
        </button>
      </div>

      {/* Feature cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, maxWidth: 760, width: '100%' }}>
        {FEATURES.map(({ icon: Icon, color, title, desc }) => (
          <div key={title} style={{
            background: '#fff', borderRadius: 12, padding: '20px 18px',
            border: '1px solid #e8e5de', textAlign: 'left', transition: 'all 0.18s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
          >
            <Icon size={24} style={{ marginBottom: 10, ...Object.fromEntries([color.split(':')]) }} />
            <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{title}</h3>
            <p style={{ fontSize: 11.5, color: '#6a6860', lineHeight: 1.55 }}>{desc}</p>
          </div>
        ))}
      </div>
    </main>
  )
}
