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
  { icon: Brain,          color: '#7C6FE0', title: 'AI Constraint Solver',   desc: 'Zero-conflict timetables via genetic optimization in seconds.' },
  { icon: Globe,          color: '#9B8EF5', title: '8+ Country Standards',   desc: 'Auto-loads national labour laws, workload norms for India, US, UK, UAE and more.' },
  { icon: RefreshCcw,     color: '#D4920E', title: 'Smart Substitution',     desc: 'AI instantly finds the best available substitute by subject match.' },
  { icon: ArrowLeftRight, color: '#7C6FE0', title: 'All Periods Shiftable',  desc: 'Assembly, Dispersal, breaks — any slot swappable. Cascades to teacher timetable.' },
  { icon: FileOutput,     color: '#D4920E', title: 'Export Anywhere',        desc: 'PDF auto-fit (any paper/orientation), multi-sheet Excel with teacher headers.' },
  { icon: Settings2,      color: '#9B8EF5', title: 'Fully Editable',         desc: 'Edit any cell live. Lock/unlock any period. Toggle teacher names and rooms.' },
]

export function HomePage() {
  return (
    <main style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: 'calc(100vh - 56px)',
      padding: '56px 24px', textAlign: 'center',
      fontFamily: "'Inter', sans-serif",
      background: 'linear-gradient(to bottom, #F5F2FF, #FFFFFF)',
    }}>
      {/* Brand b mark — bigger, hero scale */}
      <div style={{
        width: 84, height: 84, borderRadius: 22,
        background: '#7C6FE0',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', marginBottom: 28,
        boxShadow: '0 14px 30px rgba(124,111,224,0.32)',
      }}>
        <svg width="50" height="50" viewBox="0 0 52 52" fill="none">
          <rect x="12" y="9" width="8" height="33" rx="4" fill="white"/>
          <path d="M 20 22 C 23 14 40 15 40 30 C 40 45 23 46 20 42" stroke="white" strokeWidth="8" fill="none" strokeLinecap="round"/>
          <circle cx="39" cy="10" r="5" fill="#D4920E"/>
        </svg>
      </div>

      {/* "by bhusku" eyebrow */}
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#8B87AD', marginBottom: 10 }}>
        by <span style={{ color: '#D4920E' }}>bhusku</span>
      </div>

      {/* Title */}
      <h1 style={{
        fontFamily: "'DM Serif Display', Georgia, serif",
        fontSize: 52, lineHeight: 1.12, marginBottom: 16, maxWidth: 720,
        color: '#13111E', fontWeight: 400, letterSpacing: '-1.5px',
      }}>
        AI-Powered <span style={{ color: '#7C6FE0', fontStyle: 'italic' }}>Timetable</span><br />Generator
      </h1>
      <p style={{ color: '#4B5275', fontSize: 15, maxWidth: 540, lineHeight: 1.7, marginBottom: 36, fontWeight: 400 }}>
        Generate conflict-free, regulation-compliant timetables for any organization in seconds.
        AI handles the complexity — you just review and approve.
      </p>

      {/* Org pills */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 36 }}>
        {ORG_PILLS.map(({ icon: Icon, label }) => (
          <span key={label} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', background: '#fff',
            border: '1px solid #E8E4FF', borderRadius: 20,
            fontSize: 11, fontWeight: 500, color: '#4B5275',
          }}>
            <Icon size={14} /> {label}
          </span>
        ))}
      </div>

      {/* CTA Buttons */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 56, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={() => window.location.href = '/wizard'}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '14px 30px', borderRadius: 10, fontSize: 15, fontWeight: 600,
            background: '#7C6FE0', color: '#fff', border: 'none',
            cursor: 'pointer', transition: 'all 0.18s',
            boxShadow: '0 6px 18px rgba(124,111,224,0.38)',
            fontFamily: "'Inter', sans-serif",
          }}
          onMouseEnter={e => { (e.target as HTMLElement).style.transform = 'translateY(-2px)'; (e.target as HTMLElement).style.boxShadow = '0 10px 26px rgba(124,111,224,0.5)'; }}
          onMouseLeave={e => { (e.target as HTMLElement).style.transform = 'translateY(0)'; (e.target as HTMLElement).style.boxShadow = '0 6px 18px rgba(124,111,224,0.38)'; }}
        >
          <Sparkles size={18} /> Create Timetable — Free
        </button>
        <button
          onClick={() => window.location.href = '/demo'}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '14px 30px', borderRadius: 10, fontSize: 15, fontWeight: 600,
            background: '#fff', color: '#13111E',
            border: '1.5px solid #D8D2FF', cursor: 'pointer', transition: 'all 0.18s',
            fontFamily: "'Inter', sans-serif",
          }}
          onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = '#7C6FE0'; (e.target as HTMLElement).style.color = '#7C6FE0'; }}
          onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = '#D8D2FF'; (e.target as HTMLElement).style.color = '#13111E'; }}
        >
          <Eye size={18} /> View Live Demo
        </button>
      </div>

      {/* Feature cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, maxWidth: 800, width: '100%' }}>
        {FEATURES.map(({ icon: Icon, color, title, desc }) => (
          <div key={title} style={{
            background: '#fff', borderRadius: 12, padding: '22px 20px',
            border: '1px solid #E8E4FF', textAlign: 'left', transition: 'all 0.18s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 28px rgba(124,111,224,0.12)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLElement).style.borderColor = '#D8D2FF'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.borderColor = '#E8E4FF'; }}
          >
            <div style={{ width: 38, height: 38, borderRadius: 9, background: '#EDE9FF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <Icon size={20} color={color} />
            </div>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, color: '#13111E', fontFamily: "'Inter', sans-serif" }}>{title}</h3>
            <p style={{ fontSize: 11.5, color: '#4B5275', lineHeight: 1.6 }}>{desc}</p>
          </div>
        ))}
      </div>
    </main>
  )
}
