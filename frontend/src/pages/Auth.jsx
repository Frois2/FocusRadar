import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '@/store/auth';
import { Input } from '@/components/ui';

export default function AuthPage() {
  const [tab, setTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [login_d, setLoginD] = useState({ email: '', password: '' });
  const [reg_d, setRegD] = useState({ name: '', email: '', password: '', confirm: '' });

  const { login, register } = useAuthStore();
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault(); setError(''); setLoading(true);
    try { await login(login_d.email, login_d.password); navigate('/'); }
    catch (err) { setError(err.response?.data?.error || 'E-mail ou senha incorretos'); }
    finally { setLoading(false); }
  }

  async function handleRegister(e) {
    e.preventDefault(); setError('');
    if (reg_d.password !== reg_d.confirm) { setError('As senhas não coincidem'); return; }
    setLoading(true);
    try {
      await register(reg_d.name, reg_d.email, reg_d.password);
      navigate('/verify-email');
    }
    catch (err) { setError(err.response?.data?.error || 'Erro ao criar conta'); }
    finally { setLoading(false); }
  }

  return (
    <Shell>
      <div className="flex bg-bg-2 rounded-xl p-1 mb-7">
        {[['login','Entrar'],['register','Criar conta']].map(([t, l]) => (
          <button key={t} onClick={() => { setTab(t); setError(''); }}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
              tab === t ? 'bg-surface-2 text-[#ccd6f6] shadow-sm' : 'text-muted hover:text-[#ccd6f6]'
            }`}
          >{l}</button>
        ))}
      </div>

      {tab === 'login' && (
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <Input label="E-mail" type="email" placeholder="seu@email.com"
            value={login_d.email} onChange={(e) => setLoginD({ ...login_d, email: e.target.value })} required />
          <div>
            <Input label="Senha" type="password" placeholder="••••••••"
              value={login_d.password} onChange={(e) => setLoginD({ ...login_d, password: e.target.value })} required />
            <div className="flex justify-end mt-1.5">
              <Link to="/forgot-password" className="text-[11px] font-mono text-muted-2 hover:text-accent-bright transition-colors">
                Esqueci minha senha
              </Link>
            </div>
          </div>
          {error && <p className="text-xs text-red-400 font-mono text-center bg-red-500/8 rounded-lg py-2 px-3">{error}</p>}
          <button type="submit" className="btn-primary w-full mt-1" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar →'}
          </button>
        </form>
      )}

      {tab === 'register' && (
        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <Input label="Nome completo" type="text" placeholder="Seu nome"
            value={reg_d.name} onChange={(e) => setRegD({ ...reg_d, name: e.target.value })} required />
          <Input label="E-mail" type="email" placeholder="seu@email.com"
            value={reg_d.email} onChange={(e) => setRegD({ ...reg_d, email: e.target.value })} required />
          <Input label="Senha" type="password" placeholder="Mínimo 8 caracteres"
            hint="Precisa ter ao menos 1 maiúscula e 1 número"
            value={reg_d.password} onChange={(e) => setRegD({ ...reg_d, password: e.target.value })} required />
          <Input label="Confirmar senha" type="password" placeholder="Repita a senha"
            value={reg_d.confirm} onChange={(e) => setRegD({ ...reg_d, confirm: e.target.value })} required />
          {error && <p className="text-xs text-red-400 font-mono text-center bg-red-500/8 rounded-lg py-2 px-3">{error}</p>}
          <button type="submit" className="btn-primary w-full mt-1" disabled={loading}>
            {loading ? 'Criando conta...' : 'Criar conta →'}
          </button>
        </form>
      )}
    </Shell>
  );
}

export function Shell({ children, title, subtitle }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-6"
      style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(59,130,246,0.09) 0%, transparent 65%)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8 animate-fade-up">
          <Logo />
          {title
            ? <><h2 className="text-lg font-black tracking-tight mt-4 mb-1">{title}</h2>
                {subtitle && <p className="label">{subtitle}</p>}</>
            : <p className="text-muted text-sm mt-3">Sistema de produtividade pessoal</p>
          }
        </div>
        <div className="bg-surface border border-border rounded-2xl p-7 animate-fade-up" style={{ animationDelay:'0.08s' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function Logo() {
  return (
    <div className="inline-flex items-center gap-2.5 text-[15px] font-black tracking-tight">
      <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center"
        style={{ clipPath:'polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)' }}>
        <span className="text-white text-[10px] font-black">FR</span>
      </div>
      FocusRadar
    </div>
  );
}
