/**
 * Produtividade diária = (horas_estudo + horas_trabalho) × (foco_geral / 5)
 */
export function calcProductivity(registro) {
  const hours = Number(registro.horas_estudo) + Number(registro.horas_trabalho);
  return +(hours * (registro.foco_geral / 5)).toFixed(2);
}

/**
 * Score de sessão = (foco × 0.5) + (energia × 0.3) − (dificuldade × 0.2)
 */
export function calcSessionScore(sessao) {
  return +(sessao.foco * 0.5 + sessao.energia * 0.3 - sessao.dificuldade * 0.2).toFixed(2);
}

export function average(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export function percentDelta(current, previous) {
  if (!previous) return null;
  return +(((current - previous) / previous) * 100).toFixed(0);
}

export function formatDate(isoDate) {
  return new Date(isoDate + 'T00:00').toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'short',
  });
}

export function formatDateLong(isoDate) {
  return new Date(isoDate + 'T00:00').toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export function getHourBlock(horaInicio) {
  const hour = parseInt(horaInicio.split(':')[0], 10);
  if (hour < 7) return 'Madrugada';
  if (hour < 12) return 'Manhã';
  if (hour < 18) return 'Tarde';
  return 'Noite';
}

export const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const TASK_TYPES = [
  'Estudo',
  'Código',
  'Escrita',
  'Criativo',
  'Reunião',
  'Planejamento',
  'Revisão',
  'Outro',
];
