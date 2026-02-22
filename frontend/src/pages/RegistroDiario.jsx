import { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import api from '@/lib/api';
import { calcProductivity, formatDate } from '@/lib/analytics';
import { Card, Input, Textarea, SliderField, PageHeader, EmptyState, Spinner, MoodRing } from '@/components/ui';

const DEFAULT_FORM = {
  data: new Date().toISOString().split('T')[0],
  horas_estudo: '',
  horas_trabalho: '',
  energia: 3,
  humor: 3,
  foco_geral: 3,
  nota: '',
};

export default function RegistroDiario() {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [registros, setRegistros] = useState([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data } = await api.get('/registros?limit=10');
      setRegistros(data);
      setLoading(false);
    }
    load();
  }, []);

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/registros', {
        ...form,
        horas_estudo: Number(form.horas_estudo) || 0,
        horas_trabalho: Number(form.horas_trabalho) || 0,
      });
      const { data } = await api.get('/registros?limit=10');
      setRegistros(data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err.response?.data);
    } finally {
      setSaving(false);
    }
  }

  const previewProd = calcProductivity({
    horas_estudo: Number(form.horas_estudo) || 0,
    horas_trabalho: Number(form.horas_trabalho) || 0,
    foco_geral: form.foco_geral,
  });

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Registro"
        titleAccent="Diário"
        subtitle="// camada macro — como foi o seu dia?"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Form */}
        <Card>
          <h3 className="text-base font-bold tracking-tight mb-5" style={{ color: 'var(--text)' }}>
            Dados do Dia
          </h3>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <Input
              label="Data"
              type="date"
              value={form.data}
              onChange={(e) => set('data', e.target.value)}
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Horas de estudo"
                type="number"
                min="0"
                max="24"
                step="0.5"
                placeholder="0.0"
                value={form.horas_estudo}
                onChange={(e) => set('horas_estudo', e.target.value)}
              />
              <Input
                label="Horas de trabalho"
                type="number"
                min="0"
                max="24"
                step="0.5"
                placeholder="0.0"
                value={form.horas_trabalho}
                onChange={(e) => set('horas_trabalho', e.target.value)}
              />
            </div>

            <SliderField label="Energia" id="energia" value={form.energia} onChange={(v) => set('energia', v)} />
            <SliderField label="Humor"   id="humor"   value={form.humor}   onChange={(v) => set('humor', v)} />
            <SliderField label="Foco geral" id="foco_geral" value={form.foco_geral} onChange={(v) => set('foco_geral', v)} />

            <Textarea
              label="Notas (opcional)"
              placeholder="Como foi o dia? O que impactou seu rendimento?"
              rows={3}
              value={form.nota}
              onChange={(e) => set('nota', e.target.value)}
            />

            {/* Preview */}
            {(form.horas_estudo || form.horas_trabalho) && (
              <div
                className="flex items-center justify-between px-4 py-3 rounded-xl"
                style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-center gap-2">
                  <MoodRing value={form.humor} size={32} />
                  <div>
                    <p className="text-xs font-semibold" style={{ color: 'var(--text)' }}>Prévia do dia</p>
                    <p className="label">{(Number(form.horas_estudo) || 0) + (Number(form.horas_trabalho) || 0)}h registradas</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="label">produtividade</p>
                  <p className="text-xl font-black" style={{ color: 'var(--accent-2)', fontFamily: "'JetBrains Mono', monospace" }}>
                    {previewProd.toFixed(1)}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button type="submit" className="btn-primary flex-1" disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar registro →'}
              </button>
              {success && (
                <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--green)', fontFamily: 'monospace' }}>
                  <CheckCircle size={14} /> Salvo!
                </div>
              )}
            </div>
          </form>
        </Card>

        {/* Recent */}
        <Card>
          <h3 className="text-base font-bold tracking-tight mb-5" style={{ color: 'var(--text)' }}>
            Últimos Registros
          </h3>
          {loading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : registros.length === 0 ? (
            <EmptyState title="Nenhum registro ainda" description="Preencha o formulário para começar." />
          ) : (
            <div className="flex flex-col gap-2">
              {registros.slice(0, 8).map((r) => {
                const prod = calcProductivity(r);
                const prodColor = prod >= 7 ? 'var(--green)' : prod >= 4 ? 'var(--accent-2)' : 'var(--text-3)';
                return (
                  <div
                    key={r.id}
                    className="flex items-center gap-3 rounded-xl px-3.5 py-3"
                    style={{
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border)',
                      transition: 'border-color 0.15s ease',
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-2)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                  >
                    <MoodRing value={Number(r.humor)} size={34} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono" style={{ color: 'var(--text-3)' }}>
                        {formatDate(r.data)}
                      </p>
                      <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--text)' }}>
                        {r.horas_estudo}h estudo · {r.horas_trabalho}h trabalho
                      </p>
                      <div className="flex gap-2 mt-1">
                        {[
                          { label: 'E', val: r.energia },
                          { label: 'H', val: r.humor },
                          { label: 'F', val: r.foco_geral },
                        ].map(({ label, val }) => (
                          <span
                            key={label}
                            className="text-[10px] px-1.5 py-0.5 rounded"
                            style={{
                              background: 'var(--surface-3)',
                              color: 'var(--text-3)',
                              fontFamily: "'JetBrains Mono', monospace",
                            }}
                          >
                            {label}:{val}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="label">prod.</p>
                      <p
                        className="text-xl font-black tracking-tight"
                        style={{ color: prodColor, fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        {prod.toFixed(1)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}