import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '@/lib/api';
import { Input } from '@/components/ui';

const PASSWORD_HINT = 'Mínimo 8 caracteres, 1 maiúscula e 1 número';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [form, setForm] = useState({ password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!token) {
    return (
      <AuthShell title="Link inválido" subtitle="Este link de redefinição não é válido.">
        <Link to="/forgot-password" className="btn-primary block text-center">
          Solicitar novo link
        </Link>
      </AuthShell>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirm) {
      setError('As senhas não coincidem');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password: form.password });
      navigate('/login?reset=true');
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao redefinir senha. O link pode ter expirado.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Nova senha" subtitle="Escolha uma senha forte para sua conta">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <Input
            label="Nova senha"
            type="password"
            placeholder="Mínimo 8 caracteres"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <p className="text-[10px] font-mono text-muted-2 mt-1.5">{PASSWORD_HINT}</p>
        </div>
        <Input
          label="Confirmar nova senha"
          type="password"
          placeholder="Repita a senha"
          value={form.confirm}
          onChange={(e) => setForm({ ...form, confirm: e.target.value })}
          required
        />
        {error && <p className="text-xs text-red-400 font-mono text-center">{error}</p>}
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? 'Redefinindo...' : 'Redefinir senha →'}
        </button>
      </form>
    </AuthShell>
  );
}

function AuthShell({ title, subtitle, children }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-bg p-6"
      style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(124,106,255,0.1) 0%, transparent 70%)' }}
    >
      <div className="w-full max-w-sm">
        <div className="text-center mb-10 animate-fade-up">
          <div className="inline-flex items-center gap-2.5 text-base font-bold tracking-tight">
            <div className="w-8 h-8 bg-accent flex items-center justify-center" style={{ clipPath: 'polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)' }}>
              <span className="text-white text-[10px] font-black">FR</span>
            </div>
            FocusRadar
          </div>
        </div>
        <div className="bg-surface border border-border-2 rounded-2xl p-8 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-lg font-black tracking-tight mb-1">{title}</h2>
          <p className="text-xs font-mono text-muted-2 mb-6">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
