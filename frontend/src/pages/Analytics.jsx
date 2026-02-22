import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Clock, Target, Zap } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import api from '@/lib/api';
import { calcProductivity, calcSessionScore, average, formatDate, WEEKDAYS } from '@/lib/analytics';
import { CHART_COLORS, RECHARTS_DEFAULTS } from '@/lib/chartTheme';
import { Card, CardHeader, Badge, PageHeader, EmptyState, Spinner } from '@/components/ui';

const { axisStyle, gridStyle, tooltipStyle } = RECHARTS_DEFAULTS;

export default function Analytics() {
  const [state, setState] = useState({ registros: [], sessoes: [], loading: true });

  useEffect(() => {
    Promise.all([api.get('/registros?limit=90'), api.get('/sessoes?limit=500')])
      .then(([r, s]) => setState({ registros: r.data, sessoes: s.data, loading: false }))
      .catch(() => setState(s => ({ ...s, loading: false })));
  }, []);

  if (state.loading) return <div className="flex justify-center items-center h-64"><Spinner size={24} /></div>;

  const { registros, sessoes } = state;
  const sorted = [...registros].sort((a, b) => a.data.localeCompare(b.data));

  const trendData = sorted.slice(-30).map(r => ({
    date: formatDate(r.data), prod: calcProductivity(r),
    energia: Number(r.energia), humor: Number(r.humor),
  }));

  const byWd = {};
  sorted.forEach(r => {
    const wd = new Date(r.data + 'T00:00').getDay();
    if (!byWd[wd]) byWd[wd] = [];
    byWd[wd].push(calcProductivity(r));
  });
  const wdMax  = Math.max(...Object.values(byWd).map(arr => average(arr)), 0);
  const wdData = Array.from({ length:7 }, (_, i) => ({
    day: WEEKDAYS[i], prod: byWd[i] ? +average(byWd[i]).toFixed(2) : 0,
  }));

  const efScatter = sessoes.map(s => ({ x: Number(s.energia), y: Number(s.foco) }));

  const prodMap = {};
  sorted.forEach(r => { prodMap[r.data] = calcProductivity(r); });
  const maxProd = Math.max(0.1, ...Object.values(prodMap));
  const heatCells = buildHeatmap(prodMap, maxProd);

  const facts = buildFacts(sorted, sessoes);

  return (
    <div className="animate-fade-up">
      <PageHeader title="Analytics" titleAccent="Avançado" subtitle="// padrões e correlações comportamentais" />

      {/* Row 1 */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <Card>
          <CardHeader label="Tendência" title="Produtividade — 30 dias"><Badge variant="blue">mensal</Badge></CardHeader>
          {trendData.length === 0
            ? <EmptyState title="Sem dados" description="Adicione registros para ver a tendência." />
            : <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trendData} margin={{ top:0, right:4, left:-20, bottom:0 }}>
                  <CartesianGrid {...gridStyle} />
                  <XAxis dataKey="date" {...axisStyle} interval="preserveStartEnd" />
                  <YAxis {...axisStyle} />
                  <Tooltip {...tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize:10, fontFamily:'DM Mono', color:'#4a5280' }} />
                  <Line type="monotone" dataKey="prod"    stroke={CHART_COLORS.accent} strokeWidth={2} dot={false} name="Produtividade" />
                  <Line type="monotone" dataKey="energia" stroke="#f472b6" strokeWidth={1.5} strokeDasharray="3 3" dot={false} name="Energia" />
                  <Line type="monotone" dataKey="humor"   stroke={CHART_COLORS.green}  strokeWidth={1.5} strokeDasharray="3 3" dot={false} name="Humor" />
                </LineChart>
              </ResponsiveContainer>
          }
        </Card>

        <Card>
          <CardHeader label="Dia da Semana" title="Quando você rende mais?"><Badge variant="teal">padrão</Badge></CardHeader>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={wdData} margin={{ top:0, right:4, left:-20, bottom:0 }}>
              <CartesianGrid {...gridStyle} />
              <XAxis dataKey="day" {...axisStyle} />
              <YAxis {...axisStyle} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="prod" radius={[6,6,0,0]} fill={CHART_COLORS.accent} fillOpacity={0.5} name="Prod. média" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-[1fr_2fr] gap-4 mb-6">
        <Card>
          <CardHeader label="Heatmap" title="Calendário de Atividade" />
          <Heatmap cells={heatCells} />
          <div className="flex items-center gap-2 mt-3 justify-end">
            <span className="text-[10px] font-mono text-muted-2">Baixo</span>
            {['bg-border', 'bg-accent/20', 'bg-accent/50', 'bg-accent'].map((c, i) => (
              <div key={i} className={`w-2.5 h-2.5 rounded-sm ${c}`} />
            ))}
            <span className="text-[10px] font-mono text-muted-2">Alto</span>
          </div>
        </Card>

        <Card>
          <CardHeader label="Correlação" title="Energia × Foco nas Sessões"><Badge variant="teal">micro</Badge></CardHeader>
          {efScatter.length === 0
            ? <EmptyState title="Sem sessões" description="Registre sessões para ver a correlação." />
            : <ResponsiveContainer width="100%" height={200}>
                <ScatterChart margin={{ top:0, right:4, left:-20, bottom:0 }}>
                  <CartesianGrid {...gridStyle} />
                  <XAxis type="number" dataKey="x" name="Energia" domain={[1,5]} {...axisStyle} />
                  <YAxis type="number" dataKey="y" name="Foco"    domain={[1,5]} {...axisStyle} />
                  <Tooltip {...tooltipStyle} />
                  <Scatter data={efScatter} fill={CHART_COLORS.green} fillOpacity={0.6} r={5} />
                </ScatterChart>
              </ResponsiveContainer>
          }
        </Card>
      </div>

      {/* Behavioral facts */}
      {facts.length > 0 && (
        <>
          <p className="label mb-3">Relatório comportamental</p>
          <div className="grid grid-cols-3 gap-4">
            {facts.map((f, i) => (
              <div key={i} className="card flex gap-3 items-start">
                <div className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <f.Icon size={15} style={{ color: f.color }} />
                </div>
                <div>
                  <p className="text-[11px] font-mono text-muted-2 uppercase tracking-wider">{f.label}</p>
                  <p className="text-xl font-black tracking-tight mt-0.5" style={{ color: f.color }}>{f.value}</p>
                  <p className="text-xs font-mono text-muted mt-1.5 leading-relaxed">{f.text}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Heatmap({ cells }) {
  return (
    <div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['D','S','T','Q','Q','S','S'].map((d, i) => (
          <div key={i} className="text-center text-[9px] font-mono text-muted-2">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((c, i) => (
          <div key={i} title={c.label} style={{ background: c.color }}
            className="aspect-square rounded flex items-center justify-center text-[8px] font-mono cursor-default hover:scale-110 transition-transform"
          >{c.day}</div>
        ))}
      </div>
    </div>
  );
}

function buildHeatmap(prodMap, maxProd) {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 27 - start.getDay());
  return Array.from({ length:28 }, (_, i) => {
    const d = new Date(start); d.setDate(d.getDate() + i);
    const key = d.toISOString().split('T')[0];
    const p = prodMap[key] || 0;
    const r = p / maxProd;
    const color = p===0 ? '#1e2236' : r>0.75 ? '#3b82f6' : r>0.5 ? 'rgba(59,130,246,0.5)' : 'rgba(59,130,246,0.2)';
    return { day: d.getDate(), prod: p, color, label: `${key}: ${p.toFixed(1)}` };
  });
}

function buildFacts(registros, sessoes) {
  const facts = [];

  if (registros.length >= 10) {
    const hi = registros.filter(r => r.humor >= 4);
    const lo = registros.filter(r => r.humor <= 2);
    if (hi.length && lo.length) {
      const pct = Math.abs(Math.round((average(hi.map(calcProductivity)) - average(lo.map(calcProductivity))) / average(lo.map(calcProductivity)) * 100));
      facts.push({ Icon: TrendingUp, color: CHART_COLORS.green, label: 'Impacto do humor', value: `+${pct}%`, text: `Dias com humor 4–5 têm produtividade ${pct}% maior do que dias difíceis.` });
    }
  }

  if (sessoes.length >= 10) {
    const blocks = { Manhã:[], Tarde:[], Noite:[] };
    sessoes.forEach(s => {
      const h = parseInt(s.hora_inicio.split(':')[0], 10);
      const b = h < 12 ? 'Manhã' : h < 18 ? 'Tarde' : 'Noite';
      blocks[b].push(calcSessionScore(s));
    });
    let best = '', bestV = 0;
    Object.entries(blocks).forEach(([k, v]) => { if (v.length) { const a = average(v); if (a > bestV) { bestV = a; best = k; } } });
    if (best) {
      const mV = average(blocks['Manhã'] || []);
      const tV = average(blocks['Tarde'] || []);
      const pct = tV > 0 ? Math.round((mV - tV) / tV * 100) : 0;
      facts.push({ Icon: Clock, color: CHART_COLORS.accent, label: 'Pico de concentração', value: best, text: `Score ${Math.abs(pct)}% ${pct >= 0 ? 'maior' : 'menor'} de manhã vs tarde. Seu melhor momento é ${best}.` });
    }

    const byTipo = {};
    sessoes.forEach(s => { if (!byTipo[s.tipo_tarefa]) byTipo[s.tipo_tarefa] = []; byTipo[s.tipo_tarefa].push(calcSessionScore(s)); });
    let bTipo = '', bV = 0;
    Object.entries(byTipo).forEach(([k, v]) => { const a = average(v); if (a > bV) { bV = a; bTipo = k; } });
    if (bTipo) facts.push({ Icon: Target, color: CHART_COLORS.amber, label: 'Tarefa de alto rendimento', value: bTipo, text: `Score médio de ${bV.toFixed(1)} — você entra em estado de foco mais facilmente neste contexto.` });

    const totalMin = sessoes.reduce((a, s) => a + Number(s.duracao), 0);
    facts.push({ Icon: Zap, color: '#f472b6', label: 'Total em foco', value: `${Math.round(totalMin / 60)}h`, text: `${totalMin} minutos de sessões registradas. Média de ${(totalMin / sessoes.length).toFixed(0)} min por sessão.` });
  }

  return facts;
}
