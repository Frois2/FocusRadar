import { useState, useEffect } from 'react';
import { CheckCircle, Award } from 'lucide-react';
import api from '@/lib/api';
import useAuthStore from '@/store/auth';
import { calcProductivity, calcSessionScore } from '@/lib/analytics';
import { Card, Input, PageHeader } from '@/components/ui';

export default function Perfil() {
  const { user, updateUser, logout } = useAuthStore();
  const [form, setForm] = useState({ name: '', email: '', meta_horas: 40, password: '' });
  const [stats, setStats] = useState(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setForm({ name: user.name, email: user.email, meta_horas: user.meta_horas || 40, password: '' });
    }
    async function loadStats() {
      const [r, s] = await Promise.all([api.get('/registros?limit=365'), api.get('/sessoes?limit=1000')]);
      const totalHoras = r.data.reduce((a, rec) => a + Number(rec.horas_estudo) + Number(rec.horas_trabalho), 0);
      const avgProd = r.data.length
        ? r.data.reduce((a, rec) => a + calcProductivity(rec), 0) / r.data.length
        : 0;
      const avgScore = s.data.length
        ? s.data.reduce((a, sess) => a + calcSessionScore(sess), 0) / s.data.length
        : 0;
      setStats({ totalRegistros: r.data.length, totalSessoes: s.data.length, totalHoras, avgProd, avgScore });
    }
    loadStats();
  }, [user]);

  function set(field, value) { setForm((p) => ({ ...p, [field]: value })); }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { name: form.name, email: form.email, meta_horas: Number(form.meta_horas) };
      if (form.password) payload.password = form.password;
      const { data } = await api.patch('/auth/me', payload);
      updateUser(data);
      setSuccess(true);
      setForm((p) => ({ ...p, password: '' }));
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Excluir sua conta e todos os dados? Esta ação é irreversível.')) return;
    await api.delete('/auth/me');
    logout();
  }

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const since = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    : '';

  const achievements = buildAchievements(stats);

  return (
    <div className="animate-fade-up">
      <PageHeader title="Meu" titleAccent="Perfil" subtitle="// dados pessoais e estatísticas gerais" />

      {/* Hero */}
      <div className="card mb-5 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent to-pink-500 flex items-center justify-center text-white text-xl font-black flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-black tracking-tight">{user?.name}</h2>
          <p className="text-xs font-mono text-muted mt-0.5">{user?.email}</p>
          {since && <p className="text-[10px] font-mono text-muted-2 mt-1">Membro desde {since}</p>}
          {stats && (
            <div className="flex gap-6 mt-3">
              {[
                { n: stats.totalRegistros, l: 'registros' },
                { n: stats.totalSessoes, l: 'sessões' },
                { n: `${stats.totalHoras.toFixed(0)}h`, l: 'totais' },
                { n: stats.avgProd.toFixed(1), l: 'prod. média' },
              ].map((s) => (
                <div key={s.l}>
                  <p className="text-lg font-black tracking-tight">{s.n}</p>
                  <p className="text-[10px] font-mono text-muted-2">{s.l}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Edit form */}
        <Card>
          <h3 className="text-base font-bold tracking-tight mb-5">Editar Informações</h3>
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <Input label="Nome completo" type="text" value={form.name} onChange={(e) => set('name', e.target.value)} required />
            <Input label="E-mail" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required />
            <Input label="Meta semanal (horas)" type="number" min="1" max="80" value={form.meta_horas} onChange={(e) => set('meta_horas', e.target.value)} />
            <Input label="Nova senha" type="password" placeholder="Deixe em branco para manter" value={form.password} onChange={(e) => set('password', e.target.value)} />

            {error && <p className="text-xs text-red-400 font-mono">{error}</p>}

            <div className="flex items-center gap-3 mt-1">
              <button type="submit" className="btn-primary flex-1" disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar alterações'}
              </button>
              {success && (
                <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 flex-shrink-0">
                  <CheckCircle size={13} /> Salvo!
                </div>
              )}
            </div>

            <button type="button" className="btn-danger text-sm" onClick={handleDelete}>
              Excluir conta
            </button>
          </form>
        </Card>

        {/* Achievements */}
        <Card>
          <h3 className="text-base font-bold tracking-tight mb-5">Conquistas</h3>
          <div className="flex flex-col gap-2.5">
            {achievements.map((a) => (
              <div
                key={a.label}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-xl border transition-all ${
                  a.done
                    ? 'bg-surface-2 border-border'
                    : 'bg-bg-2 border-border opacity-40'
                }`}
              >
                <Award size={18} className={a.done ? 'text-accent-bright' : 'text-muted-2'} />
                <div className="flex-1">
                  <p className="text-sm font-semibold">{a.label}</p>
                  <p className="text-[11px] font-mono text-muted-2 mt-0.5">{a.description}</p>
                </div>
                {a.done && <CheckCircle size={14} className="text-emerald-400 flex-shrink-0" />}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function buildAchievements(stats) {
  if (!stats) return [];
  return [
    { label: 'Primeiro registro', description: 'Adicionou o primeiro dia', done: stats.totalRegistros >= 1 },
    { label: 'Uma semana', description: '7 dias registrados', done: stats.totalRegistros >= 7 },
    { label: 'Um mês', description: '30 dias de consistência', done: stats.totalRegistros >= 30 },
    { label: 'Primeira sessão', description: 'Registrou o primeiro bloco de foco', done: stats.totalSessoes >= 1 },
    { label: '10 sessões', description: '10 blocos de foco registrados', done: stats.totalSessoes >= 10 },
    { label: '50 horas', description: '50 horas produtivas registradas', done: stats.totalHoras >= 50 },
    { label: 'Produtividade alta', description: 'Média de produtividade acima de 6', done: stats.avgProd >= 6 },
  ];
}
