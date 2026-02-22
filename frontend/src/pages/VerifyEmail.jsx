import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import api from '@/lib/api';
import useAuthStore from '@/store/auth';
import { PinInput } from '@/components/ui';
import { Shell } from '@/pages/Auth';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Auto-verify via token link
  useEffect(() => {
    if (token) {
      api.post('/auth/verify-email', { token })
        .then(() => { setDone(true); updateUser({ ...user, email_verified: true }); })
        .catch(() => setError('Link inválido ou expirado.'));
    }
  }, [token]);

  // Auto-submit when 6 digits entered
  useEffect(() => {
    if (code.length === 6) handleVerify();
  }, [code]);

  // Resend cooldown
  useEffect(() => {
    if (countdown > 0) { const t = setTimeout(() => setCountdown(c => c - 1), 1000); return () => clearTimeout(t); }
  }, [countdown]);

  async function handleVerify() {
    if (loading || code.length < 6) return;
    setError(''); setLoading(true);
    try {
      await api.post('/auth/verify-email', { code, userId: user?.id });
      setDone(true);
      updateUser({ ...user, email_verified: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Código inválido');
      setCode('');
      document.getElementById('pin-0')?.focus();
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    setResending(true); setError('');
    try {
      await api.post('/auth/resend-verification');
      setCountdown(60);
    } catch { setError('Não foi possível reenviar. Tente mais tarde.'); }
    finally { setResending(false); }
  }

  if (done) {
    return (
      <Shell title="E-mail confirmado" subtitle="sua conta está ativa">
        <div className="text-center py-4">
          <div className="w-14 h-14 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={28} className="text-emerald-400" />
          </div>
          <p className="text-sm text-muted leading-relaxed mb-6">
            Tudo certo. Você já pode usar o FocusRadar.
          </p>
          <button onClick={() => navigate('/')} className="btn-primary w-full">
            Ir para o app →
          </button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell title="Confirme seu e-mail" subtitle={user?.email ? `código enviado para ${user.email}` : 'verifique sua caixa de entrada'}>
      {token ? (
        <div className="text-center py-4">
          {error
            ? <p className="text-sm text-red-400 font-mono">{error}</p>
            : <p className="text-sm text-muted">Verificando...</p>
          }
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div>
            <p className="label text-center mb-5">Digite o código de 6 dígitos</p>
            <PinInput value={code} onChange={setCode} length={6} />
          </div>

          {error && (
            <p className="text-xs text-red-400 font-mono text-center bg-red-500/8 rounded-lg py-2 px-3">
              {error}
            </p>
          )}

          <button
            onClick={handleVerify}
            className="btn-primary w-full"
            disabled={loading || code.length < 6}
          >
            {loading ? 'Verificando...' : 'Confirmar →'}
          </button>

          <div className="divider-line" />

          <div className="text-center flex flex-col gap-2">
            <p className="text-xs font-mono text-muted-2">Não recebeu o código?</p>
            {countdown > 0 ? (
              <p className="text-xs font-mono text-muted-2">Reenviar em {countdown}s</p>
            ) : (
              <button onClick={resend} disabled={resending}
                className="text-xs font-mono text-accent-bright hover:text-accent transition-colors inline-flex items-center gap-1.5 mx-auto">
                <RefreshCw size={11} className={resending ? 'animate-spin' : ''} />
                {resending ? 'Reenviando...' : 'Reenviar código'}
              </button>
            )}
          </div>

          {user && (
            <Link to="/" className="text-[11px] font-mono text-muted-2 hover:text-muted transition-colors text-center inline-flex items-center gap-1 justify-center">
              <ArrowLeft size={10} /> Verificar depois
            </Link>
          )}
        </div>
      )}
    </Shell>
  );
}
