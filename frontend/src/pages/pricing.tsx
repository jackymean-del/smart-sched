/**
 * Pricing page — tiers + FAQ.
 */
import { MarketingChrome } from '@/components/marketing/MarketingChrome'

const TIERS = [
  {
    name: 'Starter', price: 'Free', period: '',
    desc: 'Everything a small team needs to try AI scheduling.',
    cta: 'Start free', href: '/wizard', popular: false,
    features: ['Up to 2 classes', 'Up to 20 subjects', 'AI auto-schedule', 'Real-time conflict detection', 'PDF export'],
  },
  {
    name: 'Pro', price: '$29', period: '/mo',
    desc: 'For a single institution running multiple streams and electives.',
    cta: 'Start free', href: '/wizard', popular: true,
    features: ['Unlimited classes', 'Unlimited subjects', 'Elective OR/AND groups', 'Multi-stream support', 'Room & resource planning', 'Priority support'],
  },
  {
    name: 'Enterprise', price: '$99', period: '/mo',
    desc: 'For groups managing many campuses or institutions.',
    cta: 'Talk to sales', href: 'mailto:hello@bhusku.com', popular: false,
    features: ['Everything in Pro', 'Multi-campus management', 'API access', 'SSO / SAML', 'Dedicated success manager'],
  },
]

const FAQ = [
  { q: 'Is there really a free plan?', a: 'Yes. Starter is free forever for up to 2 classes and 20 subjects — no credit card required.' },
  { q: 'Can I change plans later?', a: 'Anytime. Upgrade or downgrade from your account; changes take effect immediately and billing is prorated.' },
  { q: 'Do you support any curriculum?', a: 'schedU has no built-in board restrictions. Enter your own period counts, subject names, and grading labels — it adapts to you.' },
  { q: 'What does Enterprise add?', a: 'Multi-campus management, API access, SSO/SAML, and a dedicated success manager for rolling schedU out across many institutions.' },
]

export function PricingPage() {
  return (
    <MarketingChrome>
      {/* Hero */}
      <section style={{
        background: 'linear-gradient(180deg, #F8F7FF 0%, #ffffff 100%)',
        padding: '72px 24px 48px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
      }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#8B87AD', marginBottom: 18 }}>
          Pricing
        </p>
        <h1 style={{
          fontFamily: "'Plus Jakarta Sans', Georgia, serif",
          fontSize: 'clamp(30px, 5vw, 46px)', lineHeight: 1.15, fontWeight: 400,
          letterSpacing: '-1px', color: '#13111E', maxWidth: 640, marginBottom: 14,
        }}>
          Pricing that grows with your{' '}
          <span style={{ color: '#7C6FE0', fontStyle: 'italic' }}>institution.</span>
        </h1>
        <p style={{ fontSize: 16, color: '#4B5275', maxWidth: 520, lineHeight: 1.8 }}>
          Start free on Starter. Upgrade when you need unlimited classes, electives, and multi-campus control.
        </p>
      </section>

      {/* Tiers */}
      <section style={{ background: '#fff', padding: '20px 24px 64px', display: 'flex', justifyContent: 'center' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 18, maxWidth: 920, width: '100%', alignItems: 'stretch',
        }}>
          {TIERS.map(t => (
            <div key={t.name} className="lp-feat" style={{
              display: 'flex', flexDirection: 'column', position: 'relative',
              padding: '28px 24px', borderRadius: 14, background: '#fff',
              border: t.popular ? '1.5px solid #7C6FE0' : '1px solid #E8E4FF',
              boxShadow: t.popular ? '0 12px 32px rgba(124,111,224,0.16)' : 'none',
            }}>
              {t.popular && (
                <span style={{ position: 'absolute', top: 16, right: 16, padding: '3px 10px', borderRadius: 20, background: '#EDE9FF', color: '#7C6FE0', fontSize: 10, fontWeight: 800, letterSpacing: '0.04em' }}>
                  Most popular
                </span>
              )}
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#13111E' }}>{t.name}</h3>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, margin: '14px 0 6px' }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 34, fontWeight: 700, color: '#13111E', lineHeight: 1 }}>{t.price}</span>
                {t.period && <span style={{ fontSize: 13, color: '#8B87AD' }}>{t.period}</span>}
              </div>
              <p style={{ fontSize: 13, color: '#4B5275', lineHeight: 1.6, marginBottom: 18, minHeight: 42 }}>{t.desc}</p>
              <a href={t.href} style={{ textDecoration: 'none' }}>
                <button className={t.popular ? undefined : 'lp-ghost'} style={{
                  width: '100%', padding: '11px 18px', borderRadius: 8,
                  border: t.popular ? 'none' : '1.5px solid #E8E4FF',
                  background: t.popular ? '#7C6FE0' : '#fff',
                  color: t.popular ? '#fff' : '#4B5275',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: t.popular ? '0 4px 14px rgba(124,111,224,0.32)' : 'none',
                }}>
                  {t.cta}
                </button>
              </a>
              <ul style={{ listStyle: 'none', margin: '20px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {t.features.map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 13, color: '#13111E' }}>
                    <span style={{ color: '#7C6FE0', fontWeight: 800, lineHeight: 1.4 }}>✓</span>
                    <span style={{ lineHeight: 1.4 }}>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section style={{ background: '#F8F7FF', borderTop: '1px solid #F0EDFF', padding: '64px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h2 style={{ fontFamily: "'Plus Jakarta Sans', Georgia, serif", fontSize: 28, fontWeight: 400, color: '#13111E', marginBottom: 32 }}>
          Frequently asked questions
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18, maxWidth: 880, width: '100%' }}>
          {FAQ.map(item => (
            <div key={item.q} style={{ padding: '22px 22px', borderRadius: 12, border: '1px solid #E8E4FF', background: '#fff' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#13111E', marginBottom: 8 }}>{item.q}</h3>
              <p style={{ fontSize: 13, color: '#4B5275', lineHeight: 1.7 }}>{item.a}</p>
            </div>
          ))}
        </div>
      </section>
    </MarketingChrome>
  )
}
