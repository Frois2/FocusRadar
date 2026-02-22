import { useState } from 'react';
import { Mail, X, CheckCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import useAuthStore from '@/store/auth';

export default function EmailVerificationBanner() {
  const user = useAuthStore(s => s.user);
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  if (!user || user.email_verified || dismissed) return null;

  async function resend() {
    setSending(true);
    try { await api.post('/auth/resend-verification'); setSent(true); }
    catch { /* silent */ }
    finally { setSending(false); }
  }

  return (
    <div className="flex items-center gap-3 bg-amber-400/8 border border-amber-400/20 rounded-xl px-4 py-3 mb-6">
      <Mail size={14} className="text-amber-400 flex-shrink-0" />
      <p className="flex-1 text-amber-300/80 font-mono text-[11px]">
        Confirme seu e-mail para garantir acesso à conta.
      </p>
      {sent ? (
        <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1"><CheckCircle size={11} /> Enviado</span>
      ) : (
        <button onClick={() => navigate('/verify-email')}
          className="text-[11px] font-mono text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors">
          Verificar agora <ArrowRight size={10} />
        </button>
      )}
      <button onClick={() => setDismissed(true)} className="text-amber-500/40 hover:text-amber-400/70 transition-colors ml-1">
        <X size={12} />
      </button>
    </div>
  );
}
