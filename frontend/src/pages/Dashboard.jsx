import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Zap, TrendingUp, TrendingDown,
  Clock, Target, Calendar, BarChart2,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer,
} from 'recharts';
import api from '@/lib/api';
import useAuthStore from '@/store/auth';
import {
  calcProductivity, calcSessionScore, average,
  percentDelta, formatDate, WEEKDAYS,
} from '@/lib/analytics';
import { CHART_COLORS, RECHARTS_DEFAULTS } from '@/lib/chartTheme';
import {
  StatCard, Card, CardHeader, Badge,
  EmptyState, PageHeader, Spinner,
  WeeklyGoalBar, StreakBadge, PomodoroTimer, MoodRing,
} from '@/components/ui';

const { axisStyle, gridStyle, tooltipStyle } = RECHARTS_DEFAULTS;

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [state, setState] = useState({ registros: [], sessoes: [], loading: true });

  useEffect(() => {
    Promise.all([api.get('/registros?limit=30'), api.get('/sessoes?limit=100')])
      .then(([r, s]) => setState({ registros: r.data, sessoes: s.data, loading: false }))
      .catch(() => setState(s => ({ ...s, loading: false })));
  }, []);

  if (state.loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spinner size={24} />
      </div>
    );
  }

  const { registros, sessoes } = state;
  const sorted  = [...registros].sort((a, b) => a.data.localeCompare(b.data));
  const last14  = sorted.slice(-14);
  const last7   = sorted.slice(-7);
  const prev7   = sorted.slice(-14, -7);

  const avgProd   = average(last7.map(calcProductivity));
  const prevProd  = average(prev7.map(calcProductivity));
  const prodDelta = percentDelta(avgProd, prevProd);
  const avgEnerg  = average(last7.map(r => Number(r.energia)));
  const totalH    = last7.reduce((a, r) => a + Number(r.horas_estudo) + Number(r.horas_trabalho), 0);
  const metaHoras = user?.meta_horas || 40;

  const cutoff    = new Date(); cutoff.setDate(cutoff.getDate() - 7);
  const last7Sess = sessoes.filter(s => new Date(s.data + 'T00:00') >= cutoff);
  const avgScore  = average(last7Sess.map(calcSessionScore));

  const streak   = calcStreak(sorted);
  const lineData = last14.map(r => ({ date: formatDate(r.data), prod: calcProductivity(r), humor: Number(r.humor) }));
  const barData  = last7.map(r => ({ date: formatDate(r.data), estudo: Number(r.horas_estudo), trabalho: Number(r.horas_trabalho) }));
  const scatterD = registros.map(r => ({ x: Number(r.humor), y: calcProductivity(r) }));
  const today    = sorted[sorted.length - 1];

  const radarData = today ? [
    { subject: 'Energia',  value: Number(today.energia) },
    { subject: 'Humor',    value: Number(today.humor) },
    { subject: 'Foco',     value: Number(today.foco_geral) },
    { subject: 'Estudo',   value: Math.min(Number(today.horas_estudo), 5) },
    { subject: 'Trabalho', value: Math.min(Number(today.horas_trabalho) / 2, 5) },
  ] : [];

  const hourBlocks = buildHourBlocks(sessoes);
  const insights   = buildInsights(registros, sessoes);

  const now       = new Date();
  const greetHour = now.getHours();
  const greeting  = greetHour < 12 ? 'Bom dia' : greetHour < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <div className="animate-fade-up">

      {/* ── Header ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <p className="label" style={{ marginBottom: 4 }}>
              {greeting}, {user?.name?.split(' ')[0]} 👋
            </p>
            <h1 style={{ fontSize: 'clamp(22px, 5vw, 30px)', fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text)', lineHeight: 1.1 }}>
              Visão <span style={{ color: 'var(--accent-2)' }}>Geral</span>
            </h1>
            <p className="label" style={{ marginTop: 6 }}>
              {now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              {' · '}{registros.length} registros
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {streak > 0 && <StreakBadge days={streak} />}
            <button className="btn-primary" onClick={() => navigate('/registro')}>
              <Plus size={14} /> Registrar
            </button>
            <button className="btn-ghost" onClick={() => navigate('/sessoes')}>
              <Zap size={14} /> Sessão
            </button>
          </div>
        </div>
      </div>

      {/* ── Stats 2×2 mobile / 4 desktop ── */}
      <div className="grid-stats" style={{ marginBottom: 14 }}>
        <StatCard label="Produtividade"  value={avgProd.toFixed(1)}                        delta={prodDelta} deltaLabel="vs sem. ant." accentColor={CHART_COLORS.accent} />
        <StatCard label="Score Sessões"  value={avgScore > 0 ? avgScore.toFixed(1) : '—'}  sub={`${last7Sess.length} sessões / sem.`} accentColor={CHART_COLORS.green} />
        <StatCard label="Energia Média"  value={avgEnerg > 0 ? avgEnerg.toFixed(1) : '—'}  sub="escala 1–5 · 7 dias" accentColor="var(--pink)" />
        <StatCard label="Horas Totais"   value={`${totalH.toFixed(0)}h`}                   sub="últimos 7 dias" accentColor={CHART_COLORS.amber} />
      </div>

      {/* ── Meta semanal ── */}
      {metaHoras > 0 && (
        <div className="card stagger-1 animate-fade-up" style={{ marginBottom: 14 }}>
          <WeeklyGoalBar current={totalH} goal={metaHoras} label="Meta semanal de horas" />
        </div>
      )}

      {/* ── Produtividade + Radar ── */}
      <div className="grid-2-1 stagger-2 animate-fade-up" style={{ marginBottom: 14 }}>
        <Card>
          <CardHeader label="Evolução" title="Produtividade — 14 dias">
            <Badge variant="blue">macro</Badge>
          </CardHeader>
          {last14.length === 0
            ? <EmptyState title="Sem dados" description="Adicione registros para ver a evolução." />
            : <ResponsiveContainer width="100%" height={190}>
                <LineChart data={lineData} margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid {...gridStyle} />
                  <XAxis dataKey="date" {...axisStyle} />
                  <YAxis {...axisStyle} />
                  <Tooltip {...tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: 'var(--text-3)' }} />
                  <Line type="monotone" dataKey="prod"  stroke={CHART_COLORS.accent} strokeWidth={2} dot={{ r: 3, fill: CHART_COLORS.accent }} name="Produtividade" />
                  <Line type="monotone" dataKey="humor" stroke="var(--pink)" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="Humor" />
                </LineChart>
              </ResponsiveContainer>
          }
        </Card>

        <Card>
          <CardHeader label="Radar" title="Perfil Hoje">
            <Badge variant="teal">hoje</Badge>
          </CardHeader>
          {radarData.length === 0
            ? <EmptyState title="Registre hoje" description="Preencha o dia para ver o radar." />
            : <>
                {today && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <MoodRing value={Number(today.humor)} size={36} />
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                        {(Number(today.horas_estudo) + Number(today.horas_trabalho)).toFixed(1)}h hoje
                      </p>
                      <p className="label">prod: {calcProductivity(today).toFixed(1)}</p>
                    </div>
                  </div>
                )}
                <ResponsiveContainer width="100%" height={160}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="var(--border-2)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-3)', fontSize: 10, fontFamily: "'JetBrains Mono',monospace" }} />
                    <Radar dataKey="value" stroke={CHART_COLORS.accent} fill={CHART_COLORS.accent} fillOpacity={0.12} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </>
          }
        </Card>
      </div>

      {/* ── 3 charts ── */}
      <div className="grid-3-col stagger-3 animate-fade-up" style={{ marginBottom: 14 }}>
        <Card>
          <CardHeader label="Correlação" title="Humor × Produtividade" />
          <ResponsiveContainer width="100%" height={155}>
            <ScatterChart margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid {...gridStyle} />
              <XAxis type="number" dataKey="x" name="Humor" domain={[1,5]} {...axisStyle} />
              <YAxis type="number" dataKey="y" name="Prod." {...axisStyle} />
              <Tooltip {...tooltipStyle} cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={scatterD} fill={CHART_COLORS.accent} fillOpacity={0.6} r={5} />
            </ScatterChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <CardHeader label="Horas / Dia" title="Estudo + Trabalho" />
          <ResponsiveContainer width="100%" height={155}>
            <BarChart data={barData} margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid {...gridStyle} />
              <XAxis dataKey="date" {...axisStyle} />
              <YAxis {...axisStyle} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="estudo"   stackId="a" fill={CHART_COLORS.green}  radius={[0,0,0,0]} name="Estudo" />
              <Bar dataKey="trabalho" stackId="a" fill={CHART_COLORS.accent} radius={[4,4,0,0]} name="Trabalho" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <CardHeader label="Sessões" title="Score por Horário" />
          {hourBlocks.length === 0
            ? <EmptyState title="Sem sessões" description="Registre sessões de foco." />
            : <ResponsiveContainer width="100%" height={155}>
                <BarChart data={hourBlocks} layout="vertical" margin={{ top: 0, right: 4, left: 8, bottom: 0 }}>
                  <CartesianGrid {...gridStyle} />
                  <XAxis type="number" {...axisStyle} />
                  <YAxis type="category" dataKey="block" {...axisStyle} width={60} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="score" fill={CHART_COLORS.accent} radius={4} name="Score médio" />
                </BarChart>
              </ResponsiveContainer>
          }
        </Card>
      </div>

      {/* ── Insights + Pomodoro ── */}
      <div className="grid-2-1 stagger-4 animate-fade-up">
        <div>
          <p className="label" style={{ marginBottom: 12 }}>Insights automáticos</p>
          <div className="grid-2-col">
            {insights.map((ins, i) => <InsightCard key={i} {...ins} />)}
          </div>
        </div>
        <PomodoroTimer />
      </div>

    </div>
  );
}

function InsightCard({ Icon, title, text, value, color }) {
  return (
    <div className="card" style={{ transition: 'border-color 0.2s' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-2)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, flexShrink: 0, marginTop: 2,
          background: 'var(--surface-2)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={14} style={{ color }} />
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{title}</p>
          <p style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: "'JetBrains Mono',monospace", marginTop: 4, lineHeight: 1.5 }}>{text}</p>
          <p style={{ fontSize: 18, fontWeight: 900, color, marginTop: 8, letterSpacing: '-0.02em' }}>{value}</p>
        </div>
      </div>
    </div>
  );
}

function calcStreak(sorted) {
  if (!sorted.length) return 0;
  let streak = 0;
  const dates = new Set(sorted.map(r => r.data));
  const check = new Date();
  while (true) {
    const key = check.toISOString().split('T')[0];
    if (dates.has(key)) { streak++; check.setDate(check.getDate() - 1); }
    else break;
  }
  return streak;
}

function buildHourBlocks(sessoes) {
  const m = { Madrugada: [], Manhã: [], Tarde: [], Noite: [] };
  sessoes.forEach(s => {
    const h = parseInt(s.hora_inicio.split(':')[0], 10);
    const b = h < 7 ? 'Madrugada' : h < 12 ? 'Manhã' : h < 18 ? 'Tarde' : 'Noite';
    m[b].push(calcSessionScore(s));
  });
  return Object.entries(m).filter(([, v]) => v.length).map(([block, arr]) => ({ block, score: +average(arr).toFixed(2) }));
}

function buildInsights(registros, sessoes) {
  const out = [];
  if (registros.length >= 6) {
    const hi = registros.filter(r => r.humor >= 4);
    const lo = registros.filter(r => r.humor <= 2);
    if (hi.length && lo.length) {
      const d = percentDelta(average(hi.map(calcProductivity)), average(lo.map(calcProductivity)));
      out.push({ Icon: d >= 0 ? TrendingUp : TrendingDown, title: 'Humor e produtividade', text: `Com humor alto, sua produtividade é ${Math.abs(d)}% ${d >= 0 ? 'maior' : 'menor'}.`, value: `${d >= 0 ? '+' : ''}${d}%`, color: d >= 0 ? CHART_COLORS.green : 'var(--red)' });
    }
  }
  if (sessoes.length >= 5) {
    const blocks = {};
    sessoes.forEach(s => {
      const h = parseInt(s.hora_inicio.split(':')[0], 10);
      const b = h < 7 ? 'Madrugada' : h < 12 ? 'Manhã' : h < 18 ? 'Tarde' : 'Noite';
      if (!blocks[b]) blocks[b] = [];
      blocks[b].push(calcSessionScore(s));
    });
    let best = '', bestV = 0;
    Object.entries(blocks).forEach(([k, v]) => { const a = average(v); if (a > bestV) { bestV = a; best = k; } });
    if (best) out.push({ Icon: Clock, title: 'Pico de foco', text: `Sessões da ${best} têm score médio de ${bestV.toFixed(1)}.`, value: best, color: CHART_COLORS.accent });

    const byTipo = {};
    sessoes.forEach(s => { if (!byTipo[s.tipo_tarefa]) byTipo[s.tipo_tarefa] = []; byTipo[s.tipo_tarefa].push(calcSessionScore(s)); });
    let bTipo = '', bTV = 0;
    Object.entries(byTipo).forEach(([k, v]) => { const a = average(v); if (a > bTV) { bTV = a; bTipo = k; } });
    if (bTipo) out.push({ Icon: Target, title: 'Tarefa ideal', text: `${bTipo} tem score ${bTV.toFixed(1)} — você entra em foco mais facilmente.`, value: bTipo, color: CHART_COLORS.green });
  }
  if (registros.length >= 7) {
    const byWd = {};
    registros.forEach(r => { const wd = new Date(r.data+'T00:00').getDay(); if(!byWd[wd])byWd[wd]=[]; byWd[wd].push(calcProductivity(r)); });
    let bWd = -1, bWdV = 0;
    Object.entries(byWd).forEach(([k,v]) => { const a = average(v); if(a>bWdV){bWdV=a;bWd=Number(k);} });
    if (bWd >= 0) out.push({ Icon: Calendar, title: 'Melhor dia', text: `${WEEKDAYS[bWd]} é seu dia mais produtivo (média ${bWdV.toFixed(1)}).`, value: WEEKDAYS[bWd], color: CHART_COLORS.amber });
    const avgEn = average(registros.slice(-7).map(r => Number(r.energia)));
    out.push({ Icon: Zap, title: 'Energia', text: avgEn < 2.5 ? 'Baixa — avalie sono e alimentação.' : avgEn >= 4 ? 'Excelente! Bom para tarefas desafiadoras.' : 'Razoável. Pequenos ajustes podem ajudar.', value: `${avgEn.toFixed(1)}/5`, color: avgEn < 3 ? 'var(--red)' : avgEn >= 4 ? CHART_COLORS.green : CHART_COLORS.amber });
  }
  if (!out.length) out.push({ Icon: BarChart2, title: 'Comece a registrar', text: 'Adicione registros e sessões para ver seus insights.', value: 'Sem dados', color: 'var(--text-3)' });
  return out.slice(0, 4);
}