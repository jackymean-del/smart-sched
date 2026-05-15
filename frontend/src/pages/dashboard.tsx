import { CalendarDays, Plus, Clock, Users, BookOpen, ChevronRight, LogOut, Settings, Sparkles } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useTimetableStore } from '@/store/timetableStore'

const GREETING = () => {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export function DashboardPage() {
  const { user, logout } = useAuthStore()
  const store = useTimetableStore()

  if (!user) { window.location.href = '/login'; return null }

  const hasTimetable = Object.keys(store.classTT ?? {}).length > 0
  const staffCount   = store.staff.length
  const sectionCount = store.sections.length
  const subjectCount = store.subjects.length

  const handleLogout = () => { logout(); window.location.href = '/login' }

  return (
    <div style={{ minHeight:'100vh', background:'#f9fafb' }}>

      {/* Top nav */}
      <header style={{
        height:56, background:'#fff', borderBottom:'1px solid #e5e7eb',
        display:'flex', alignItems:'center', padding:'0 28px', gap:16,
        position:'sticky', top:0, zIndex:100,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:30, height:30, borderRadius:8, background:'linear-gradient(135deg,#34d399,#059669)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <CalendarDays size={15} color="#fff" />
          </div>
          <span style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:17 }}>
            Sche<span style={{ color:'#059669' }}>du</span>
          </span>
        </div>

        <nav style={{ flex:1, display:'flex', gap:2, marginLeft:16 }}>
          {[
            { label:'Dashboard', href:'/dashboard', active:true },
            { label:'Timetable', href:'/timetable', active:false },
          ].map(n => (
            <a key={n.label} href={n.href} style={{
              padding:'6px 14px', borderRadius:6, fontSize:13, fontWeight: n.active?600:400,
              color: n.active?'#111827':'#6b7280', textDecoration:'none',
              background: n.active?'#f3f4f6':'transparent',
            }}>{n.label}</a>
          ))}
        </nav>

        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:13, fontWeight:600, color:'#111827' }}>{user.name}</div>
            {user.schoolName && <div style={{ fontSize:11, color:'#6b7280' }}>{user.schoolName}</div>}
          </div>
          <div style={{ width:34, height:34, borderRadius:'50%', background:'#4f46e5', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:13, fontWeight:700 }}>
            {user.name[0].toUpperCase()}
          </div>
          <button onClick={handleLogout}
            style={{ padding:'6px 10px', borderRadius:6, border:'1px solid #e5e7eb', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', gap:5, fontSize:12, color:'#6b7280' }}>
            <LogOut size={13} /> Logout
          </button>
        </div>
      </header>

      {/* Main content */}
      <main style={{ padding:'32px 32px', maxWidth:1200, margin:'0 auto' }}>

        {/* Welcome */}
        <div style={{ marginBottom:32 }}>
          <h1 style={{ fontSize:24, fontWeight:700, color:'#111827', marginBottom:4 }}>
            {GREETING()}, {user.name.split(' ')[0]} 👋
          </h1>
          <p style={{ color:'#6b7280', fontSize:14 }}>
            {user.schoolName ? `Managing timetables for ${user.schoolName}` : 'Set up your school to get started'}
          </p>
        </div>

        {/* Stats row */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:32 }}>
          {[
            { icon:<CalendarDays size={20} color="#4f46e5" />, label:'Timetables', value: hasTimetable ? 1 : 0, bg:'#eff6ff', border:'#dbeafe' },
            { icon:<Users size={20} color="#059669" />,        label:'Teachers',   value: staffCount,            bg:'#f0fdf4', border:'#bbf7d0' },
            { icon:<BookOpen size={20} color="#7c3aed" />,     label:'Classes',    value: sectionCount,          bg:'#faf5ff', border:'#e9d5ff' },
            { icon:<Clock size={20} color="#d97706" />,        label:'Subjects',   value: subjectCount,          bg:'#fffbeb', border:'#fde68a' },
          ].map(s => (
            <div key={s.label} style={{ background:'#fff', borderRadius:12, padding:'20px 20px', border:`1px solid ${s.border}`, display:'flex', alignItems:'center', gap:16 }}>
              <div style={{ width:44, height:44, borderRadius:10, background:s.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                {s.icon}
              </div>
              <div>
                <div style={{ fontSize:26, fontWeight:700, fontFamily:"'DM Mono',monospace", color:'#111827', lineHeight:1 }}>{s.value}</div>
                <div style={{ fontSize:12, color:'#6b7280', marginTop:3 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Action cards */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:32 }}>

          {/* Create new timetable */}
          <div style={{ background:'linear-gradient(135deg,#4f46e5,#7c3aed)', borderRadius:14, padding:'28px 28px', color:'#fff', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:-30, right:-30, width:160, height:160, borderRadius:'50%', background:'rgba(255,255,255,0.08)' }} />
            <div style={{ position:'relative' }}>
              <div style={{ fontSize:30, marginBottom:12 }}>✨</div>
              <h2 style={{ fontSize:18, fontWeight:700, marginBottom:8 }}>
                {hasTimetable ? 'Create New Timetable' : 'Start Your First Timetable'}
              </h2>
              <p style={{ fontSize:13, opacity:0.85, marginBottom:20, lineHeight:1.6 }}>
                Set up school details, bell schedule, and resources. Schedu generates a conflict-free timetable in seconds.
              </p>
              <button onClick={() => window.location.href = '/wizard'}
                style={{ padding:'10px 20px', borderRadius:8, background:'#fff', border:'none', color:'#4f46e5', fontWeight:700, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
                <Plus size={15} /> Start Setup Wizard <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* View existing */}
          <div style={{ background:'#fff', borderRadius:14, padding:'28px 28px', border:'1px solid #e5e7eb' }}>
            <div style={{ fontSize:30, marginBottom:12 }}>📋</div>
            <h2 style={{ fontSize:18, fontWeight:700, color:'#111827', marginBottom:8 }}>View Timetable</h2>
            <p style={{ fontSize:13, color:'#6b7280', marginBottom:20, lineHeight:1.6 }}>
              {hasTimetable
                ? `Current timetable has ${sectionCount} classes, ${staffCount} teachers.`
                : 'No timetable generated yet. Complete the wizard to generate one.'}
            </p>
            <button onClick={() => window.location.href = hasTimetable ? '/timetable' : '/wizard'}
              disabled={false}
              style={{
                padding:'10px 20px', borderRadius:8, border:'1.5px solid #e5e7eb',
                background: hasTimetable ? '#f9fafb' : '#f3f4f6',
                color: hasTimetable ? '#374151' : '#9ca3af',
                fontWeight:600, fontSize:13, cursor:'pointer',
                display:'flex', alignItems:'center', gap:6,
              }}>
              {hasTimetable ? <><Sparkles size={14} /> View Timetable</> : 'Complete wizard first'}
            </button>
          </div>
        </div>

        {/* Quick actions */}
        <div style={{ background:'#fff', borderRadius:12, border:'1px solid #e5e7eb', overflow:'hidden' }}>
          <div style={{ padding:'16px 20px', borderBottom:'1px solid #f3f4f6' }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:'#111827' }}>Quick Actions</h3>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)' }}>
            {[
              { icon:'🏫', label:'School Setup',   href:'/wizard' },
              { icon:'📊', label:'Load Demo',      href:'/demo' },
              { icon:'📤', label:'Export Excel',   href:'/timetable' },
              { icon:'⚙️', label:'Settings',       href:'#' },
            ].map((a, i) => (
              <a key={a.label} href={a.href} style={{
                display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                padding:'20px 16px', textDecoration:'none', gap:8,
                borderRight: i < 3 ? '1px solid #f3f4f6' : 'none',
                transition:'background 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.background='#f9fafb'}
              onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.background='transparent'}>
                <span style={{ fontSize:24 }}>{a.icon}</span>
                <span style={{ fontSize:12, fontWeight:500, color:'#374151' }}>{a.label}</span>
              </a>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
