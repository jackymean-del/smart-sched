import { useState } from 'react'
import { CalendarDays, Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

export function LoginPage() {
  const { login } = useAuthStore()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) { setError('Enter email and password'); return }
    setError(''); setLoading(true)
    try {
      await login(email, password)
      window.location.href = '/dashboard'
    } catch {
      setError('Invalid credentials. Please try again.')
    } finally { setLoading(false) }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      background: 'linear-gradient(135deg, #f0fdf4 0%, #eff6ff 50%, #fdf4ff 100%)',
    }}>
      {/* Left branding panel */}
      <div style={{
        width: 420, flexShrink: 0, background: '#111827',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '60px 52px', position: 'relative', overflow: 'hidden',
      }}>
        {/* Background decoration */}
        <div style={{ position:'absolute', top:-80, right:-80, width:300, height:300, borderRadius:'50%', background:'rgba(79,70,229,0.15)' }} />
        <div style={{ position:'absolute', bottom:-60, left:-60, width:220, height:220, borderRadius:'50%', background:'rgba(5,150,105,0.12)' }} />

        <div style={{ position:'relative', zIndex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:52 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#34d399,#059669)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <CalendarDays size={18} color="#fff" />
            </div>
            <span style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:20, color:'#fff' }}>
              Sche<span style={{ color:'#34d399' }}>du</span>
            </span>
          </div>

          <h2 style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:32, color:'#fff', lineHeight:1.25, marginBottom:16 }}>
            India's smartest<br />timetable engine
          </h2>
          <p style={{ color:'#9ca3af', fontSize:14, lineHeight:1.75, marginBottom:40 }}>
            CBSE · ICSE · State Boards · IB<br />
            AI-generated, conflict-free schedules<br />
            in under 60 seconds.
          </p>

          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {['Zero double-bookings, guaranteed', 'XI–XII optional subjects handled automatically', 'Export to Excel & PDF in one click'].map(f => (
              <div key={f} style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:18, height:18, borderRadius:'50%', background:'#34d399', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:10, color:'#fff', fontWeight:700 }}>✓</div>
                <span style={{ color:'#d1d5db', fontSize:13 }}>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'40px 24px' }}>
        <div style={{ width:'100%', maxWidth:400 }}>
          <h1 style={{ fontSize:26, fontWeight:700, color:'#111827', marginBottom:6 }}>Welcome back</h1>
          <p style={{ color:'#6b7280', fontSize:14, marginBottom:32 }}>
            Sign in to continue to your timetables.{' '}
            <a href="/register" style={{ color:'#4f46e5', fontWeight:600, textDecoration:'none' }}>Create account</a>
          </p>

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <Field label="Email address" icon={<Mail size={15} color="#9ca3af" />}>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@school.edu"
                style={inputStyle} autoFocus
                onFocus={e => focusIn(e.target as HTMLInputElement)}
                onBlur={e => focusOut(e.target as HTMLInputElement)} />
            </Field>

            <Field label="Password" icon={<Lock size={15} color="#9ca3af" />}
              right={
                <button type="button" onClick={() => setShowPw(v => !v)}
                  style={{ background:'none', border:'none', cursor:'pointer', padding:'0 4px', color:'#9ca3af' }}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              }>
              <input type={showPw ? 'text' : 'password'} value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={inputStyle}
                onFocus={e => focusIn(e.target as HTMLInputElement)}
                onBlur={e => focusOut(e.target as HTMLInputElement)} />
            </Field>

            {error && (
              <div style={{ padding:'10px 14px', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, fontSize:12, color:'#dc2626' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{
                padding:'12px', borderRadius:9, border:'none',
                background: loading ? '#d1d5db' : '#4f46e5',
                color:'#fff', fontSize:14, fontWeight:600, cursor: loading ? 'default' : 'pointer',
                display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginTop:4,
                transition:'background 0.15s',
              }}>
              {loading ? <><Loader2 size={16} style={{ animation:'spin 1s linear infinite' }} /> Signing in...</> : 'Sign in'}
            </button>
          </form>

          <div style={{ marginTop:24, padding:'14px 16px', background:'#f9fafb', borderRadius:8, border:'1px solid #e5e7eb', fontSize:12, color:'#6b7280' }}>
            <strong>Demo:</strong> Enter any email + any password to get started instantly.
          </div>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

function Field({ label, icon, right, children }: { label:string; icon?:React.ReactNode; right?:React.ReactNode; children:React.ReactNode }) {
  return (
    <div>
      <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#374151', marginBottom:6 }}>{label}</label>
      <div style={{ position:'relative', display:'flex', alignItems:'center' }}>
        {icon && <span style={{ position:'absolute', left:12, pointerEvents:'none' }}>{icon}</span>}
        <div style={{ flex:1 }}>{children}</div>
        {right && <span style={{ position:'absolute', right:10 }}>{right}</span>}
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width:'100%', padding:'10px 12px 10px 36px',
  border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:14,
  outline:'none', background:'#fff', boxSizing:'border-box', color:'#111827',
}
const focusIn  = (el: HTMLInputElement) => { el.style.borderColor = '#4f46e5'; el.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.08)' }
const focusOut = (el: HTMLInputElement) => { el.style.borderColor = '#e5e7eb'; el.style.boxShadow = 'none' }
