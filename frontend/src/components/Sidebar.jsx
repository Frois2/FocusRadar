import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, PlusCircle, Timer, BarChart3,
  User, LogOut, Activity,
} from 'lucide-react';
import useAuthStore from '@/store/auth';

const NAV = [
  { to: '/',          Icon: LayoutDashboard, label: 'Dashboard',     short: 'Início'   },
  { to: '/registro',  Icon: PlusCircle,      label: 'Registrar Dia', short: 'Registrar' },
  { to: '/sessoes',   Icon: Timer,           label: 'Sessões Foco',  short: 'Foco'     },
  { to: '/analytics', Icon: BarChart3,       label: 'Analytics',     short: 'Stats'    },
  { to: '/perfil',    Icon: User,            label: 'Perfil',        short: 'Perfil'   },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const initials = user?.name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?';

  return (
    <>
      {/* ── Desktop Sidebar (hidden on mobile) ── */}
      <aside style={{
        position: 'fixed', left: 0, top: 0, bottom: 0,
        width: 'var(--sidebar-w)',
        display: 'flex', flexDirection: 'column',
        zIndex: 40, overflow: 'hidden',
        background: 'linear-gradient(180deg, #0c1322 0%, #080e1c 100%)',
        borderRight: '1px solid var(--border)',
      }} className="hidden-mobile">

        {/* Top glow line */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(77,124,255,0.55), transparent)',
        }} />

        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'22px 20px 18px' }}>
          <div style={{
            width:32, height:32, flexShrink:0,
            display:'flex', alignItems:'center', justifyContent:'center',
            background:'linear-gradient(135deg, #4d7cff, #6b95ff)',
            clipPath:'polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)',
            boxShadow:'0 0 16px rgba(77,124,255,0.4)',
          }}>
            <Activity size={14} color="white" strokeWidth={2.5} />
          </div>
          <div>
            <p style={{ fontSize:14, fontWeight:700, letterSpacing:'-0.02em', color:'var(--text)', lineHeight:1 }}>FocusRadar</p>
            <p style={{ fontSize:10, marginTop:3, color:'var(--text-3)', fontFamily:"'JetBrains Mono',monospace" }}>v3.0 · beta</p>
          </div>
        </div>

        <div style={{ margin:'0 16px 8px', height:1, background:'var(--border)' }} />

        {/* Nav */}
        <nav style={{ flex:1, display:'flex', flexDirection:'column', gap:2, padding:'4px 12px', overflowY:'auto' }}>
          {NAV.map(({ to, Icon, label }) => (
            <NavLink key={to} to={to} end={to==='/'} style={{ textDecoration:'none' }}>
              {({ isActive }) => (
                <div style={{
                  display:'flex', alignItems:'center', gap:10,
                  padding:'9px 12px', borderRadius:10,
                  fontSize:13.5, fontWeight: isActive ? 600 : 500,
                  color: isActive ? 'var(--accent-2)' : 'var(--text-3)',
                  background: isActive ? 'rgba(77,124,255,0.1)' : 'transparent',
                  border: `1px solid ${isActive ? 'rgba(77,124,255,0.2)' : 'transparent'}`,
                  transition:'all 0.15s ease', cursor:'pointer',
                }}>
                  <Icon size={15} strokeWidth={isActive ? 2.5 : 1.7} style={{ flexShrink:0 }} />
                  <span style={{ flex:1 }}>{label}</span>
                  {isActive && (
                    <div style={{
                      width:6, height:6, borderRadius:'50%',
                      background:'var(--accent)',
                      boxShadow:'0 0 8px rgba(77,124,255,0.7)',
                      flexShrink:0,
                    }} />
                  )}
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User card */}
        <div style={{
          margin:'12px 12px 20px',
          padding:'10px 12px',
          display:'flex', alignItems:'center', gap:10,
          background:'var(--bg-2)',
          border:'1px solid var(--border)',
          borderRadius:12,
        }}>
          <div style={{
            width:32, height:32, borderRadius:'50%', flexShrink:0,
            background:'linear-gradient(135deg, var(--accent), #6b95ff)',
            display:'flex', alignItems:'center', justifyContent:'center',
            color:'white', fontSize:12, fontWeight:700,
          }}>{initials}</div>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontSize:12, fontWeight:600, color:'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
              {user?.name}
            </p>
            <p style={{ fontSize:10, color:'var(--text-3)', fontFamily:"'JetBrains Mono',monospace", whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', marginTop:2 }}>
              {user?.email}
            </p>
          </div>
          <button onClick={logout} title="Sair" style={{
            background:'none', border:'none', cursor:'pointer',
            color:'var(--text-3)', padding:4, transition:'color 0.15s', flexShrink:0,
          }}
          onMouseEnter={e=>e.currentTarget.style.color='var(--red)'}
          onMouseLeave={e=>e.currentTarget.style.color='var(--text-3)'}>
            <LogOut size={13} />
          </button>
        </div>
      </aside>

      {/* ── Mobile Bottom Navigation ── */}
      <nav className="mobile-bottom-nav">
        {NAV.map(({ to, Icon, short }) => (
          <NavLink key={to} to={to} end={to==='/'} style={{ textDecoration:'none', flex:1 }}>
            {({ isActive }) => (
              <div style={{
                display:'flex', flexDirection:'column', alignItems:'center', gap:3,
                padding:'6px 2px',
              }}>
                <div style={{
                  width:44, height:36, borderRadius:10,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  background: isActive ? 'rgba(77,124,255,0.15)' : 'transparent',
                  color: isActive ? 'var(--accent-2)' : 'var(--text-3)',
                  boxShadow: isActive ? '0 0 12px rgba(77,124,255,0.2)' : 'none',
                  transition:'all 0.2s ease',
                }}>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                </div>
                <span style={{
                  fontSize:10,
                  fontFamily:"'JetBrains Mono',monospace",
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? 'var(--accent-2)' : 'var(--text-3)',
                  transition:'color 0.15s',
                }}>{short}</span>
              </div>
            )}
          </NavLink>
        ))}
      </nav>
    </>
  );
}