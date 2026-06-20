/**
 * Features page — deep dive on what schedU does.
 */
import { MarketingChrome } from '@/components/marketing/MarketingChrome'

const FEATURES = [
  {
    icon: '🧠',
    title: 'AI auto-schedule',
    desc: 'Feed schedU your teachers, subjects, and sections, then let the AI build a complete, balanced timetable in seconds. Regenerate instantly when requirements change.',
  },
  {
    icon: '⚠️',
    title: 'Real-time conflict detection',
    desc: 'Every change is validated the moment you make it — teacher clashes, room double-bookings, and over-allocated periods are flagged live, so a finished timetable is always conflict-free.',
  },
  {
    icon: '🔀',
    title: 'Elective OR / AND groups',
    desc: 'Model the real choices students make. OR groups for mutually exclusive electives, AND groups for required combinations — every parallel section scheduled so no student is double-booked.',
  },
  {
    icon: '🎓',
    title: 'Multi-stream support',
    desc: 'Run Science, Commerce, and Arts streams side by side with split and merged sections. Shared subjects stay aligned across streams while each keeps its own requirements.',
  },
  {
    icon: '🏛️',
    title: 'Room & resource planning',
    desc: 'Tag rooms by type and capacity and let schedU place labs, halls, and shared spaces where they fit. Resource constraints are honoured automatically.',
  },
  {
    icon: '📄',
    title: 'Export & share',
    desc: 'Publish polished, print-ready PDF and Excel timetables in seconds — master grids for administrators, personal schedules for teachers, and clear class views for students.',
  },
]

export function FeaturesPage() {
  return (
    <MarketingChrome>
      {/* Hero */}
      <section style={{
        background: 'linear-gradient(180deg, #F8F7FF 0%, #ffffff 100%)',
        padding: '72px 24px 56px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
      }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#8B87AD', marginBottom: 18 }}>
          Features
        </p>
        <h1 style={{
          fontFamily: "'Plus Jakarta Sans', Georgia, serif",
          fontSize: 'clamp(30px, 5vw, 46px)', lineHeight: 1.15, fontWeight: 400,
          letterSpacing: '-1px', color: '#13111E', maxWidth: 640, marginBottom: 16,
        }}>
          Every tool your institution needs to{' '}
          <span style={{ color: '#7C6FE0', fontStyle: 'italic' }}>schedule with confidence.</span>
        </h1>
        <p style={{ fontSize: 16, color: '#4B5275', maxWidth: 560, lineHeight: 1.8 }}>
          schedU combines AI generation with the real constraints institutions live by —
          so the timetable you publish is always conflict-free.
        </p>
      </section>

      {/* Feature grid */}
      <section style={{ background: '#fff', padding: '56px 24px 72px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 20, maxWidth: 980, width: '100%',
        }}>
          {FEATURES.map(f => (
            <div key={f.title} className="lp-feat" style={{
              padding: '28px 24px', borderRadius: 14,
              border: '1px solid #E8E4FF', background: '#FAFAFE',
            }}>
              <div style={{ fontSize: 30, marginBottom: 14, lineHeight: 1 }}>{f.icon}</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#13111E', marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 13.5, color: '#4B5275', lineHeight: 1.7 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: '#F8F7FF', borderTop: '1px solid #F0EDFF', padding: '64px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h2 style={{ fontFamily: "'Plus Jakarta Sans', Georgia, serif", fontSize: 28, fontWeight: 400, color: '#13111E', marginBottom: 24 }}>
          See it on your own data
        </h2>
        <a href="/wizard" style={{ textDecoration: 'none' }}>
          <button style={{
            padding: '13px 32px', borderRadius: 9, border: 'none', background: '#7C6FE0', color: '#fff',
            fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 4px 18px rgba(124,111,224,0.38)',
          }}>
            Start free — no credit card
          </button>
        </a>
      </section>
    </MarketingChrome>
  )
}
