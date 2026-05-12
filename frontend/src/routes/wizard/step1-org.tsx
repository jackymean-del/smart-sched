import { useTimetableStore } from "@/store/timetableStore"
import type { OrgType } from "@/types"

const ORGS: { key: OrgType; emoji: string; label: string; sub: string }[] = [
  { key: "school",    emoji: "🎓", label: "School",           sub: "K–12 · Primary · Secondary" },
  { key: "college",   emoji: "🏛️", label: "College/University", sub: "UG · PG · Research" },
  { key: "corporate", emoji: "💼", label: "Corporate",        sub: "Shifts · Teams · Meetings" },
  { key: "hospital",  emoji: "🏥", label: "Healthcare",       sub: "Hospital · Clinic · OT" },
  { key: "ngo",       emoji: "🤝", label: "NGO/Non-profit",   sub: "Projects · Volunteers" },
  { key: "factory",   emoji: "🏭", label: "Factory/Labour",   sub: "Shifts · Assembly Lines" },
]

export function Step1Org() {
  const { config, setConfig, setStep } = useTimetableStore()

  return (
    <div>
      <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 28, marginBottom: 8 }}>
        What kind of organization?
      </h1>
      <p style={{ color: '#6a6860', fontSize: 13, marginBottom: 24, lineHeight: 1.65 }}>
        SmartSched adapts all terminology, workload standards, break rules and AI behaviour to match your org type.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
        {ORGS.map(({ key, emoji, label, sub }) => {
          const selected = config.orgType === key
          return (
            <button key={key} onClick={() => setConfig({ orgType: key })}
              style={{
                border: selected ? '2px solid #4f46e5' : '1.5px solid #e8e5de',
                borderRadius: 12,
                padding: '18px 14px',
                textAlign: 'center',
                cursor: 'pointer',
                background: selected ? '#eaecf8' : '#fff',
                transition: 'all 0.15s',
                boxShadow: selected ? '0 2px 8px rgba(79,70,229,0.15)' : 'none',
              }}
              onMouseEnter={e => { if (!selected) { (e.currentTarget as HTMLElement).style.borderColor = '#34d399'; (e.currentTarget as HTMLElement).style.background = '#f0fdf4'; } }}
              onMouseLeave={e => { if (!selected) { (e.currentTarget as HTMLElement).style.borderColor = '#e8e5de'; (e.currentTarget as HTMLElement).style.background = '#fff'; } }}
            >
              <div style={{ fontSize: 28, marginBottom: 8 }}>{emoji}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: selected ? '#3730a3' : '#1c1b18' }}>{label}</div>
              <div style={{ fontSize: 11, color: '#6a6860', marginTop: 4 }}>{sub}</div>
            </button>
          )
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 16, borderTop: '1px solid #e8e5de' }}>
        <button
          onClick={() => config.orgType && setStep(2)}
          disabled={!config.orgType}
          style={{
            padding: '10px 22px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            background: config.orgType ? '#059669' : '#d4d1c8',
            color: '#fff', border: 'none', cursor: config.orgType ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s',
          }}
        >
          Continue →
        </button>
      </div>
    </div>
  )
}
