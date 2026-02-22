import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import api from '@/lib/api';
import { Input } from '@/components/ui';
import { Shell } from '@/pages/Auth';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch { setError('Erro ao processar. Tente novamente.'); }
    finally { setLoading(false); }
  }

  return (
    <Shell title="Recuperar senha" subtitle="enviaremos um link por e-mail">
      {sent ? (
        <div className="text-center py-2">
          <div className="w-14 h-14 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={28} className="text-accent-bright" />
          </div>
          <p className="text-sm text-muted leading-relaxed mb-6">
            Se o endereço existir na nossa base, você receberá um link de redefinição em instantes.
          </p>
          <Link to="/login" className="text-xs font-mono text-muted-2 hover:text-accent-bright transition-colors inline-flex items-center gap-1.5">
            <ArrowLeft size={11} /> Voltar ao login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="E-mail da conta" type="email" placeholder="seu@email.com"
            value={email} onChange={(e) => setEmail(e.target.value)} required />
          {error && <p className="text-xs text-red-400 font-mono bg-red-500/8 rounded-lg py-2 px-3">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar link →'}
          </button>
          <Link to="/login" className="text-[11px] font-mono text-muted-2 hover:text-muted transition-colors text-center inline-flex items-center gap-1 justify-center mt-1">
            <ArrowLeft size={10} /> Voltar ao login
          </Link>
        </form>
      )}
    </Shell>
  );
}
