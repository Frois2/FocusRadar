import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import EmailVerificationBanner from '@/components/EmailVerificationBanner';
import { Activity } from 'lucide-react';

const PAGE_TITLES = {
  '/':          { title: 'Dashboard' },
  '/registro':  { title: 'Registrar' },
  '/sessoes':   { title: 'Sessões' },
  '/analytics': { title: 'Analytics' },
  '/perfil':    { title: 'Perfil' },
};

export default function AppLayout() {
  const { pathname } = useLocation();
  const page = PAGE_TITLES[pathname] || { title: 'FocusRadar' };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />

      <main className="app-main">
        {/* ── Mobile top bar ── */}
        <div className="mobile-topbar">
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(135deg, #4d7cff, #6b95ff)',
              clipPath: 'polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)',
              boxShadow: '0 0 10px rgba(77,124,255,0.35)',
            }}>
              <Activity size={12} color="white" strokeWidth={2.5} />
            </div>
            <span style={{
              fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em',
              color: 'var(--text-3)',
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              FocusRadar
            </span>
          </div>

          {/* Current page title */}
          <div style={{
            marginLeft: 'auto',
            fontSize: 15, fontWeight: 700,
            color: 'var(--text)',
            letterSpacing: '-0.02em',
          }}>
            {page.title}
          </div>
        </div>

        {/* ── Page content wrapper ── */}
        <div className="page-content">
          <EmailVerificationBanner />
          <Outlet />
        </div>
      </main>
    </div>
  );
}