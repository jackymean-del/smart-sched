/**
 * Settings — organization profile + account. This is the permanent home for
 * editing the organization details first captured by the onboarding guide.
 */
import { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { useOrgProfile } from '@/store/orgProfile'
import { useAuthStore, openUserProfile } from '@/store/authStore'
import { meApi } from '@/api/client'

const KINDS = ['School', 'College', 'University', 'Coaching / Training Center', 'Company', 'Hospital', 'NGO', 'Government', 'Other']
const ACCENT = '#7C6FE0'

export function SettingsPage() {
  const { user, logout } = useAuthStore()
  const { name, kind, period, setProfile } = useOrgProfile()
  const [fName, setFName] = useState(name)
  const [fKind, setFKind] = useState(kind)
  const [fPeriod, setFPeriod] = useState(period)
  const [saved, setSaved] = useState(false)
  const dirty = fName !== name || fKind !== kind || fPeriod !== period

  const save = async () => {
    setProfile({ name: fName.trim(), kind: fKind, period: fPeriod.trim() })
    try { await meApi.sync({ schoolName: fName.trim() }) } catch { /* offline ok */ }
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F2FF' }}>
      <PageHeader icon="⚙️" title="Settings" description="Manage your organization profile and account." status={saved ? 'saved' : null} statusLabel={saved ? 'Saved' : undefined} />

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Organization */}
        <Card title="Organization" subtitle="Shown across your dashboard and printed documents.">
          <Field label="Organization name">
            <input value={fName} onChange={e => setFName(e.target.value)} placeholder="e.g. Greenfield Academy" style={inputStyle} />
          </Field>
          <Field label="Type">
            <select value={fKind} onChange={e => setFKind(e.target.value)} style={inputStyle}>
              <option value="">Select a type…</option>
              {KINDS.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </Field>
          <Field label="Academic / planning period">
            <input value={fPeriod} onChange={e => setFPeriod(e.target.value)} placeholder="e.g. 2025–26" style={inputStyle} />
          </Field>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
            <button onClick={save} disabled={!dirty || !fName.trim()}
              style={{ padding: '9px 18px', borderRadius: 9, border: 'none', background: dirty && fName.trim() ? ACCENT : '#C9C3EC', color: '#fff', fontWeight: 700, fontSize: 13, cursor: dirty && fName.trim() ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
              Save changes
            </button>
          </div>
        </Card>

        {/* Account */}
        <Card title="Account" subtitle="Your personal sign-in and profile.">
          <Row label="Name" value={user?.name ?? '—'} />
          <Row label="Email" value={user?.email ?? '—'} />
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button onClick={() => openUserProfile()} style={btnSecondary}>Edit profile & password</button>
            <button onClick={() => { logout(); window.location.href = '/login' }} style={{ ...btnSecondary, color: '#dc2626', borderColor: '#FCA5A5' }}>Sign out</button>
          </div>
        </Card>
      </div>
    </div>
  )
}

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section style={{ background: '#fff', borderRadius: 14, border: '1px solid #ECE9FB', padding: 20 }}>
      <h2 style={{ fontSize: 15, fontWeight: 800, color: '#13111E', margin: 0 }}>{title}</h2>
      {subtitle && <p style={{ fontSize: 12.5, color: '#8B87AD', margin: '4px 0 16px' }}>{subtitle}</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{children}</div>
    </section>
  )
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label style={{ display: 'block' }}><div style={{ fontSize: 12, fontWeight: 600, color: '#4B5275', marginBottom: 5 }}>{label}</div>{children}</label>
}
function Row({ label, value }: { label: string; value: string }) {
  return <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, padding: '6px 0', borderBottom: '1px solid #F3F1FB' }}><span style={{ color: '#8B87AD' }}>{label}</span><span style={{ color: '#13111E', fontWeight: 600 }}>{value}</span></div>
}
const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 11px', borderRadius: 9, border: '1px solid #E5E7EB', fontSize: 13.5, fontFamily: 'inherit', color: '#13111E', outline: 'none', background: '#fff' }
const btnSecondary: React.CSSProperties = { padding: '9px 16px', borderRadius: 9, border: '1px solid #E5E7EB', background: '#fff', color: '#13111E', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }
