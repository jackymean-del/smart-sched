import { useState } from 'react'
import { CalendarDays, Mail, Lock, User, School, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

export function RegisterPage() {
  const { register } = useAuthStore()
  const [name, setName]           = useState('')
  const [email, setEmail]         = useState('')
  const [school, setSchool]       = useState('')
  const [password, setPassword]   = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !password) { setError('All fields are required'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    setError(''); setLoading(true)
    try {
      await register(name, email, password, school || undefined)
      window.location.href = '/wizard'
    } catch {
      setError('Registration failed. Please try again.')
    } finally { setLoading(false) }
  }

  return (
    <div style={{
      minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:'linear-gradient(135deg,#f0fdf4 0%,#eff6ff 50%,#fdf4ff 100%)',
      padding:'24px',
    }}>
      <div style={{ width:'100%', maxWidth:440, background:'#fff', borderRadius:16, padding:'40px 40px', boxShadow:'0 4px 24px rgba(0,0,0,0.08)', border:'1px solid #e5e7eb' }}>

        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:28 }}>
          <div style={{ width:32, height:32, borderRadius:9, background:'linear-gradient(135deg,#34d399,#059669)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <CalendarDays size={16} color="#fff" />
          </div>
          <span style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:18, color:'#111827' }}>
            Sche<span style={{ color:'#059669' }}>du</span>
          </span>
        </div>

        <h1 style={{ fontSize:22, fontWeight:700, color:'#111827', marginBottom:4 }}>Create your account</h1>
        <p style={{ color:'#6b7280', fontSize:13, marginBottom:28 }}>
          Already have one?{' '}
          <a href="/login" style={{ color:'#4f46e5', fontWeight:600, textDecoration:'none' }}>Sign in</a>
        </p>

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <Field label="Full Name" icon={<User size={14} color="#9ca3af" />}>
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="Priya Sharma" style={inp} autoFocus
              onFocus={e => fi(e.target as HTMLInputElement)} onBlur={e => fo(e.target as HTMLInputElement)} />
          </Field>

          <Field label="School / Institution" icon={<School size={14} color="#9ca3af" />}>
            <input value={school} onChange={e => setSchool(e.target.value)}
              placeholder="Delhi Public School (optional)" style={inp}
              onFocus={e => fi(e.target as HTMLInputElement)} onBlur={e => fo(e.target as HTMLInputElement)} />
          </Field>

          <Field label="Email Address" icon={<Mail size={14} color="#9ca3af" />}>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@school.edu" style={inp}
              onFocus={e => fi(e.target as HTMLInputElement)} onBlur={e => fo(e.target as HTMLInputElement)} />
          </Field>

          <Field label="Password" icon={<Lock size={14} color="#9ca3af" />}>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Min. 6 characters" style={inp}
              onFocus={e => fi(e.target as HTMLInputElement)} onBlur={e => fo(e.target as HTMLInputElement)} />
          </Field>

          {error && (
            <div style={{ padding:'9px 12px', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:7, fontSize:12, color:'#dc2626' }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            style={{
              padding:'12px', borderRadius:8, border:'none', marginTop:4,
              background: loading ? '#d1d5db' : '#059669', color:'#fff',
              fontSize:14, fontWeight:600, cursor: loading ? 'default' : 'pointer',
              display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            }}>
            {loading
              ? <><Loader2 size={15} style={{ animation:'spin 1s linear infinite' }} /> Creating account...</>
              : 'Create account & start setup'}
          </button>
        </form>

        <p style={{ marginTop:20, fontSize:11, color:'#9ca3af', textAlign:'center', lineHeight:1.6 }}>
          By signing up you agree to Schedu's terms. Your data stays on your device in demo mode.
        </p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

function Field({ label, icon, children }: { label:string; icon?:React.ReactNode; children:React.ReactNode }) {
  return (
    <div>
      <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#374151', marginBottom:5 }}>{label}</label>
      <div style={{ position:'relative' }}>
        {icon && <span style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}>{icon}</span>}
        {children}
      </div>
    </div>
  )
}

const inp: React.CSSProperties = {
  width:'100%', padding:'10px 12px 10px 34px', border:'1.5px solid #e5e7eb',
  borderRadius:7, fontSize:13, outline:'none', background:'#fff', boxSizing:'border-box', color:'#111827',
}
const fi = (el: HTMLInputElement) => { el.style.borderColor='#059669'; el.style.boxShadow='0 0 0 3px rgba(5,150,105,0.08)' }
const fo = (el: HTMLInputElement) => { el.style.borderColor='#e5e7eb'; el.style.boxShadow='none' }
