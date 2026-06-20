/**
 * Shared chrome for all public marketing pages (home, features, pricing,
 * docs, contact). Provides the page wrapper, the lp-* style block, the
 * sticky nav, and the footer — so every marketing page stays consistent.
 */
import type { ReactNode } from 'react'

const NAV_LINKS = [
  { label: 'Features', href: '/features' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Docs', href: '/docs' },
  { label: 'Contact', href: '/contact' },
]

const FOOTER_LINKS = ['Privacy', 'Terms', 'Support', 'Status']

export function MarketingChrome({ children }: { children: ReactNode }) {
  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif", background: '#fff', color: '#13111E', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { overflow-x: hidden; }

        @keyframes floatCard {
          0%, 100% { transform: translateY(0px);   }
          50%       { transform: translateY(-8px);  }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0);    }
        }

        .lp-nav-link {
          font-size: 14px; color: #4B5275; text-decoration: none;
          font-weight: 500; transition: color 0.15s; white-space: nowrap;
        }
        .lp-nav-link:hover { color: #7C6FE0; }

        .lp-ghost { transition: border-color 0.15s, color 0.15s; }
        .lp-ghost:hover { border-color: #7C6FE0 !important; color: #7C6FE0 !important; }

        .lp-feat {
          transition: transform 0.18s, box-shadow 0.18s, border-color 0.18s;
        }
        .lp-feat:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(124,111,224,0.10);
          border-color: #D8D2FF !important;
        }

        .lp-step {
          transition: transform 0.18s, box-shadow 0.18s, border-color 0.18s;
        }
        .lp-step:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(124,111,224,0.10);
          border-color: #D8D2FF !important;
        }

        .lp-board-tag {
          display: inline-block;
          padding: 5px 12px; border-radius: 20px;
          border: 1px solid #E8E4FF; background: #FAFAFE;
          font-size: 12px; font-weight: 500; color: #4B5275;
          white-space: nowrap; transition: background 0.15s, border-color 0.15s, color 0.15s;
        }
        .lp-board-tag:hover {
          background: #EDE9FF; border-color: #C4B5FD; color: #7C6FE0;
        }

        .lp-hero-animate { animation: fadeUp 0.55s ease both; }
      `}</style>


      {/* ════════════════════════════════════════════════════
          STICKY NAV
      ════════════════════════════════════════════════════ */}
      <nav style={{
        height: 58, background: '#fff',
        borderBottom: '1px solid #F0EDFF',
        display: 'flex', alignItems: 'center',
        padding: '0 48px', gap: 0,
        position: 'sticky', top: 0, zIndex: 200,
      }}>

        {/* Logo — left */}
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', flexShrink: 0 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: '#7C6FE0',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="19" height="19" viewBox="0 0 52 52" fill="none">
              <rect x="12" y="9" width="8" height="33" rx="4" fill="white"/>
              <path d="M 20 22 C 23 14 40 15 40 30 C 40 45 23 46 20 42"
                    stroke="white" strokeWidth="8" fill="none" strokeLinecap="round"/>
              <circle cx="39" cy="10" r="4.5" fill="#D4920E"/>
            </svg>
          </div>
          <span style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 17, fontWeight: 900, letterSpacing: '-0.4px', color: '#13111E',
          }}>
            sched<span style={{
              color: '#7C6FE0',
              fontFamily: "'Plus Jakarta Sans', Georgia, serif",
              fontStyle: 'italic',
            }}>U</span>
          </span>
        </a>

        {/* Spacer pushes everything right */}
        <div style={{ flex: 1 }} />

        {/* Nav links — right of centre, before auth */}
        <div style={{ display: 'flex', gap: 28, alignItems: 'center', marginRight: 32 }}>
          {NAV_LINKS.map(l => (
            <a key={l.label} href={l.href} className="lp-nav-link">{l.label}</a>
          ))}
        </div>

        {/* Auth buttons */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
          <a href="/login" style={{ textDecoration: 'none' }}>
            <button className="lp-ghost" style={{
              padding: '7px 18px', borderRadius: 7,
              border: '1px solid #E8E4FF', background: '#fff',
              fontSize: 13, fontWeight: 600, color: '#4B5275', cursor: 'pointer',
              fontFamily: 'inherit',
            }}>Sign in</button>
          </a>
          <a href="/wizard" style={{ textDecoration: 'none' }}>
            <button style={{
              padding: '8px 18px', borderRadius: 7,
              background: '#13111E', color: '#fff', border: 'none',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit',
            }}>Get started</button>
          </a>
        </div>
      </nav>

      {/* Page content */}
      <div style={{ flex: 1 }}>
        {children}
      </div>

      {/* ════════════════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════════════════ */}
      <footer style={{
        borderTop: '1px solid #F0EDFF',
        padding: '20px 48px',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ display: 'flex', gap: 24 }}>
          {FOOTER_LINKS.map(l => (
            <a key={l} href="#" style={{
              color: '#8B87AD', textDecoration: 'none',
              fontSize: 12, fontWeight: 500,
              transition: 'color 0.15s',
            }}
              onMouseOver={e => (e.currentTarget.style.color = '#7C6FE0')}
              onMouseOut={e  => (e.currentTarget.style.color = '#8B87AD')}
            >{l}</a>
          ))}
        </div>
        <span style={{ fontSize: 12, color: '#8B87AD' }}>© 2025 schedU</span>
      </footer>

    </div>
  )
}
