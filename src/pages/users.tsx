/**
 * Users — people who can access this organization's workspace. Shows the
 * signed-in owner; inviting teammates is surfaced as the next step.
 */
import { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { useAuthStore } from '@/store/authStore'
import { useOrgProfile } from '@/store/orgProfile'

export function UsersPage() {
  const { user } = useAuthStore()
  const { name: orgName } = useOrgProfile()
  const [invite, setInvite] = useState('')
  const [sent, setSent] = useState<string[]>([])

  const sendInvite = () => {
    const e = invite.trim()
    if (!e || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return
    setSent(s => [...s, e]); setInvite('')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F2FF' }}>
      <PageHeader icon="👥" title="Users" description={`People with access to ${orgName || 'your organization'}.`} />
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        <section style={{ background: '#fff', border: '1px solid #ECE9FB', borderRadius: 14, padding: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 14px', color: '#13111E' }}>Members</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0' }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#7C6FE0', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{(user?.name ?? 'U')[0].toUpperCase()}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: '#13111E' }}>{user?.name ?? '—'}</div>
              <div style={{ fontSize: 12, color: '#8B87AD' }}>{user?.email ?? ''}</div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#7C6FE0', background: '#EDE9FF', padding: '3px 10px', borderRadius: 20 }}>Owner</span>
          </div>
          {sent.map(e => (
            <div key={e} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: '1px solid #F3F1FB' }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#E5E7EB', color: '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{e[0].toUpperCase()}</div>
              <div style={{ flex: 1, fontSize: 13.5, color: '#13111E' }}>{e}</div>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#92400e', background: '#FEF3C7', padding: '3px 10px', borderRadius: 20 }}>Invited</span>
            </div>
          ))}
        </section>

        <section style={{ background: '#fff', border: '1px solid #ECE9FB', borderRadius: 14, padding: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 4px', color: '#13111E' }}>Invite a teammate</h2>
          <p style={{ fontSize: 12.5, color: '#8B87AD', margin: '0 0 14px' }}>Send an invite by email. They'll get access once they sign in.</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <input value={invite} onChange={e => setInvite(e.target.value)} placeholder="name@email.com" onKeyDown={e => { if (e.key === 'Enter') sendInvite() }}
              style={{ flex: 1, padding: '10px 12px', borderRadius: 9, border: '1px solid #E5E7EB', fontSize: 13.5, fontFamily: 'inherit', outline: 'none' }} />
            <button onClick={sendInvite} style={{ padding: '10px 18px', borderRadius: 9, border: 'none', background: '#7C6FE0', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Send invite</button>
          </div>
        </section>
      </div>
    </div>
  )
}
