/**
 * Contact page — contact form (mailto) + details.
 */
import { useState } from 'react'
import { MarketingChrome } from '@/components/marketing/MarketingChrome'

const CHANNELS = [
  { icon: '✉️', title: 'Email', value: 'hello@bhusku.com', href: 'mailto:hello@bhusku.com' },
  { icon: '💬', title: 'Support', value: 'support@bhusku.com', href: 'mailto:support@bhusku.com' },
  { icon: '🚀', title: 'Start free', value: 'Create a timetable now', href: '/wizard' },
]

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', borderRadius: 8,
  border: '1px solid #E8E4FF', background: '#fff',
  fontSize: 14, color: '#13111E', fontFamily: 'inherit', outline: 'none',
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600, color: '#4B5275', marginBottom: 6,
}

export function ContactPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const subject = encodeURIComponent(`schedU enquiry from ${name || 'a visitor'}`)
    const body = encodeURIComponent(`${message}\n\n— ${name}${email ? ` (${email})` : ''}`)
    window.location.href = `mailto:hello@bhusku.com?subject=${subject}&body=${body}`
  }

  return (
    <MarketingChrome>
      {/* Hero */}
      <section style={{
        background: 'linear-gradient(180deg, #F8F7FF 0%, #ffffff 100%)',
        padding: '72px 24px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
      }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#8B87AD', marginBottom: 18 }}>
          Contact
        </p>
        <h1 style={{
          fontFamily: "'Plus Jakarta Sans', Georgia, serif",
          fontSize: 'clamp(30px, 5vw, 46px)', lineHeight: 1.15, fontWeight: 400,
          letterSpacing: '-1px', color: '#13111E', maxWidth: 640, marginBottom: 14,
        }}>
          Let's talk{' '}
          <span style={{ color: '#7C6FE0', fontStyle: 'italic' }}>scheduling.</span>
        </h1>
        <p style={{ fontSize: 16, color: '#4B5275', maxWidth: 520, lineHeight: 1.8 }}>
          Questions about schedU, a demo for your institution, or help getting set up — we'd love to hear from you.
        </p>
      </section>

      {/* Body: form + channels */}
      <section style={{ background: '#fff', padding: '40px 24px 72px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 28, maxWidth: 900, width: '100%', alignItems: 'start' }}>

          {/* Form */}
          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '28px 26px', borderRadius: 14, border: '1px solid #E8E4FF', background: '#FAFAFE' }}>
            <div>
              <label style={labelStyle} htmlFor="c-name">Name</label>
              <input id="c-name" style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="Your name" required />
            </div>
            <div>
              <label style={labelStyle} htmlFor="c-email">Email</label>
              <input id="c-email" type="email" style={inputStyle} value={email} onChange={e => setEmail(e.target.value)} placeholder="you@institution.edu" required />
            </div>
            <div>
              <label style={labelStyle} htmlFor="c-msg">Message</label>
              <textarea id="c-msg" style={{ ...inputStyle, minHeight: 120, resize: 'vertical' }} value={message} onChange={e => setMessage(e.target.value)} placeholder="How can we help?" required />
            </div>
            <button type="submit" style={{
              padding: '12px 18px', borderRadius: 8, border: 'none', background: '#7C6FE0', color: '#fff',
              fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 4px 14px rgba(124,111,224,0.32)',
            }}>
              Send message
            </button>
            <p style={{ fontSize: 11, color: '#8B87AD', lineHeight: 1.5 }}>
              This opens your email app pre-filled. Prefer to write directly? Email{' '}
              <a href="mailto:hello@bhusku.com" style={{ color: '#7C6FE0', fontWeight: 600, textDecoration: 'none' }}>hello@bhusku.com</a>.
            </p>
          </form>

          {/* Channels */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {CHANNELS.map(c => (
              <a key={c.title} href={c.href} style={{ textDecoration: 'none' }}>
                <div className="lp-feat" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '18px 20px', borderRadius: 14, border: '1px solid #E8E4FF', background: '#fff' }}>
                  <div style={{ fontSize: 24, lineHeight: 1 }}>{c.icon}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#13111E' }}>{c.title}</div>
                    <div style={{ fontSize: 13, color: '#7C6FE0', marginTop: 2 }}>{c.value}</div>
                  </div>
                </div>
              </a>
            ))}
          </div>

        </div>
      </section>
    </MarketingChrome>
  )
}
