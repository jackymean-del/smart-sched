/**
 * Docs page — getting-started hub + quick links.
 */
import { MarketingChrome } from '@/components/marketing/MarketingChrome'

const STEPS = [
  { n: 1, title: 'Enter the basics', desc: 'Name your institution, pick a board (or define your own), and add class ranges, teachers, and rooms.' },
  { n: 2, title: 'Let the AI generate', desc: 'schedU builds period allocations, cross-class groups, and constraints automatically — no manual tables.' },
  { n: 3, title: 'Review & refine', desc: 'Edit inline like a spreadsheet. schedU re-validates on every change and explains each choice.' },
  { n: 4, title: 'Export & publish', desc: 'Download class-wise, teacher-wise, and room-wise timetables as PDF or Excel, or print them directly.' },
]

const TOPICS = [
  { icon: '🚀', title: 'Getting started', desc: 'Create your first conflict-free timetable in under five minutes.', href: '/wizard' },
  { icon: '🔀', title: 'Electives & groups', desc: 'Model OR/AND elective groups and parallel sections that always stay clash-free.', href: '/features' },
  { icon: '🏛️', title: 'Rooms & resources', desc: 'Tag labs, halls, and shared spaces so schedU places them automatically.', href: '/features' },
  { icon: '📄', title: 'Exporting timetables', desc: 'Publish print-ready PDF and Excel grids for staff and students.', href: '/features' },
  { icon: '🔌', title: 'API & integrations', desc: 'Programmatic access to generate and sync timetables (Enterprise plan).', href: '/pricing' },
  { icon: '💬', title: 'Support', desc: 'Stuck on something? Reach the team and we will help you out.', href: '/contact' },
]

export function DocsPage() {
  return (
    <MarketingChrome>
      {/* Hero */}
      <section style={{
        background: 'linear-gradient(180deg, #F8F7FF 0%, #ffffff 100%)',
        padding: '72px 24px 48px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
      }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#8B87AD', marginBottom: 18 }}>
          Documentation
        </p>
        <h1 style={{
          fontFamily: "'Plus Jakarta Sans', Georgia, serif",
          fontSize: 'clamp(30px, 5vw, 46px)', lineHeight: 1.15, fontWeight: 400,
          letterSpacing: '-1px', color: '#13111E', maxWidth: 640, marginBottom: 14,
        }}>
          Everything you need to{' '}
          <span style={{ color: '#7C6FE0', fontStyle: 'italic' }}>get scheduling.</span>
        </h1>
        <p style={{ fontSize: 16, color: '#4B5275', maxWidth: 520, lineHeight: 1.8 }}>
          A quick tour of how schedU works, from your first timetable to advanced electives and exports.
        </p>
      </section>

      {/* Quick start steps */}
      <section style={{ background: '#fff', padding: '56px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#8B87AD', marginBottom: 28 }}>
          Quick start
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, maxWidth: 920, width: '100%' }}>
          {STEPS.map(s => (
            <div key={s.n} className="lp-step" style={{ padding: '22px 20px', borderRadius: 12, border: '1px solid #E8E4FF', background: '#fff' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '3px 10px', borderRadius: 20, background: '#EDE9FF', marginBottom: 14, fontSize: 10, fontWeight: 800, color: '#7C6FE0', letterSpacing: '0.04em' }}>
                Step {s.n}
              </div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#13111E', marginBottom: 7 }}>{s.title}</h3>
              <p style={{ fontSize: 12.5, color: '#4B5275', lineHeight: 1.65 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Topics */}
      <section style={{ background: '#F8F7FF', borderTop: '1px solid #F0EDFF', padding: '56px 24px 72px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#8B87AD', marginBottom: 28 }}>
          Browse by topic
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18, maxWidth: 920, width: '100%' }}>
          {TOPICS.map(t => (
            <a key={t.title} href={t.href} style={{ textDecoration: 'none' }}>
              <div className="lp-feat" style={{ height: '100%', padding: '24px 22px', borderRadius: 14, border: '1px solid #E8E4FF', background: '#fff' }}>
                <div style={{ fontSize: 26, marginBottom: 12, lineHeight: 1 }}>{t.icon}</div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#13111E', marginBottom: 7 }}>{t.title}</h3>
                <p style={{ fontSize: 13, color: '#4B5275', lineHeight: 1.65 }}>{t.desc}</p>
              </div>
            </a>
          ))}
        </div>
        <p style={{ fontSize: 13, color: '#8B87AD', marginTop: 28, textAlign: 'center', maxWidth: 460, lineHeight: 1.6 }}>
          Looking for something specific? <a href="/contact" style={{ color: '#7C6FE0', fontWeight: 600, textDecoration: 'none' }}>Get in touch</a> and we'll point you the right way.
        </p>
      </section>
    </MarketingChrome>
  )
}
