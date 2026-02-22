import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend, ResponsiveContainer,
} from 'recharts';
import api from '@/lib/api';
import { calcSessionScore, average, formatDate, TASK_TYPES } from '@/lib/analytics';
import { CHART_COLORS, RECHARTS_DEFAULTS } from '@/lib/chartTheme';
import { Card, CardHeader, Badge, Modal, SliderField, Select, Input, PageHeader, EmptyState, Spinner } from '@/components/ui';

const { axisStyle, gridStyle, tooltipStyle } = RECHARTS_DEFAULTS;

const PIE_COLORS = Object.values(CHART_COLORS);

const DEFAULT_FORM = {
  data: new Date().toISOString().split('T')[0],
  hora_inicio: new Date().toTimeString().slice(0, 5),
  duracao: 60,
  tipo_tarefa: 'Estudo',
  foco: 3,
  energia: 3,
  dificuldade: 3,
};

export default function SessoesFoco() {
  const [sessoes, setSessoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);

  async function loadSessoes() {
    setLoading(true);
    const { data } = await api.get('/sessoes?limit=100');
    setSessoes(data);
    setLoading(false);
  }

  useEffect(() => { loadSessoes(); }, []);

  function set(field, value) { setForm((p) => ({ ...p, [field]: value })); }

  async function handleSave() {
    setSaving(true);
    try {
      await api.post('/sessoes', { ...form, duracao: Number(form.duracao) });
      setModalOpen(false);
      setForm(DEFAULT_FORM);
      loadSessoes();
    } catch (err) {
      console.error(err.response?.data);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Remover esta sessão?')) return;
    await api.delete(`/sessoes/${id}`);
    setSessoes((prev) => prev.filter((s) => s.id !== id));
  }

  // Chart data
  const byHour = {};
  sessoes.forEach((s) => {
    const hr = parseInt(s.hora_inicio.split(':')[0], 10);
    const block = hr < 7 ? 'Madrugada' : hr < 12 ? 'Manhã' : hr < 18 ? 'Tarde' : 'Noite';
    if (!byHour[block]) byHour[block] = [];
    byHour[block].push(calcSessionScore(s));
  });
  const hourData = Object.entries(byHour).map(([block, arr]) => ({
    block,
    score: +average(arr).toFixed(2),
    count: arr.length,
  }));

  const byTipo = {};
  sessoes.forEach((s) => {
    if (!byTipo[s.tipo_tarefa]) byTipo[s.tipo_tarefa] = [];
    byTipo[s.tipo_tarefa].push(calcSessionScore(s));
  });
  const tipoData = Object.entries(byTipo).map(([name, arr]) => ({
    name,
    value: +average(arr).toFixed(2),
    count: arr.length,
  }));

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Sessões de"
        titleAccent="Foco"
        subtitle="// camada micro — análise por bloco de trabalho"
      >
        <button className="btn-primary text-sm" onClick={() => setModalOpen(true)}>
          <Plus size={14} /> Nova sessão
        </button>
      </PageHeader>

      {/* Charts */}
      <div className="grid grid-cols-[2fr_1fr] gap-4 mb-5">
        <Card>
          <CardHeader label="Desempenho" title="Score por Faixa Horária">
            <Badge variant="accent">score médio</Badge>
          </CardHeader>
          {sessoes.length === 0 ? (
            <EmptyState title="Sem sessões" description="Registre sessões para ver os padrões de foco." />
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={hourData} margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid {...gridStyle} />
                <XAxis dataKey="block" {...axisStyle} />
                <YAxis {...axisStyle} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="score" fill={CHART_COLORS.accent} radius={[6, 6, 0, 0]} name="Score" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card>
          <CardHeader label="Por Tipo" title="Onde você rende mais?">
            <Badge variant="green">tipo</Badge>
          </CardHeader>
          {tipoData.length === 0 ? (
            <EmptyState title="Sem dados" description="" />
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={tipoData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={3}>
                  {tipoData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 10, fontFamily: 'DM Mono', color: '#555568' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* List */}
      <Card>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold tracking-tight">Histórico de Sessões</h3>
          <Badge variant="accent">{sessoes.length} sessões</Badge>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : sessoes.length === 0 ? (
          <EmptyState title="Nenhuma sessão ainda" description="Clique em Nova sessão para começar." />
        ) : (
          <div className="flex flex-col gap-2">
            {sessoes.slice(0, 25).map((s) => {
              const score = calcSessionScore(s);
              return (
                <div key={s.id} className="flex items-center gap-3 bg-surface-2 rounded-lg px-3.5 py-3 border border-border hover:border-border-2 transition-colors group">
                  <div className="text-xs font-mono text-muted w-12 flex-shrink-0">{s.hora_inicio.slice(0, 5)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{s.tipo_tarefa}</p>
                    <p className="text-xs font-mono text-muted-2 mt-0.5">{formatDate(s.data)} · {s.duracao}min</p>
                  </div>
                  <ScorePips label="F" value={s.foco} />
                  <ScorePips label="E" value={s.energia} color="emerald" />
                  <div className="ml-2 bg-accent/10 text-accent-bright text-xs font-mono font-bold px-2.5 py-1 rounded-lg">
                    {score.toFixed(1)}
                  </div>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="opacity-0 group-hover:opacity-100 text-muted-2 hover:text-red-400 transition-all ml-1"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nova Sessão de Foco"
        subtitle="// camada micro — registre um bloco de trabalho"
      >
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Data" type="date" value={form.data} onChange={(e) => set('data', e.target.value)} />
            <Input label="Horário início" type="time" value={form.hora_inicio} onChange={(e) => set('hora_inicio', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Duração (min)" type="number" min="5" max="480" step="5" value={form.duracao} onChange={(e) => set('duracao', e.target.value)} />
            <Select label="Tipo de tarefa" value={form.tipo_tarefa} onChange={(e) => set('tipo_tarefa', e.target.value)}>
              {TASK_TYPES.map((t) => <option key={t}>{t}</option>)}
            </Select>
          </div>
          <SliderField label="Foco" id="foco" value={form.foco} onChange={(v) => set('foco', v)} />
          <SliderField label="Energia" id="energia" value={form.energia} onChange={(v) => set('energia', v)} />
          <SliderField label="Dificuldade" id="dificuldade" value={form.dificuldade} onChange={(v) => set('dificuldade', v)} />
          <div className="flex gap-2.5 mt-2">
            <button className="btn-ghost flex-1" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button className="btn-primary flex-1" onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar →'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function ScorePips({ label, value, color = 'accent' }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[9px] font-mono text-muted-2">{label}</span>
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
            className={`w-1.5 h-1.5 rounded-sm ${
              i < value
                ? color === 'emerald' ? 'bg-emerald-400' : 'bg-accent'
                : 'bg-border-2'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
