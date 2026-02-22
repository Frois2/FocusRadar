export const CHART_COLORS = {
  accent:  '#4d7cff',
  green:   '#34d399',
  pink:    '#f472b6',
  amber:   '#fbbf24',
  blue:    '#60a5fa',
  purple:  '#a78bfa',
  teal:    '#2dd4bf',
};

export const RECHARTS_DEFAULTS = {
  axisStyle: {
    tick: { fill: '#4e5a7a', fontSize: 10, fontFamily: "'JetBrains Mono', monospace" },
    axisLine: { stroke: '#1a243e' },
    tickLine: { stroke: '#1a243e' },
  },
  gridStyle: {
    stroke: '#1a243e',
    strokeDasharray: '3 3',
  },
  tooltipStyle: {
    contentStyle: {
      background: '#0f1628',
      border: '1px solid rgba(99,130,255,0.16)',
      borderRadius: 10,
      fontSize: 11,
      fontFamily: "'JetBrains Mono', monospace",
      color: '#dde4ff',
      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
    },
    cursor: { fill: 'rgba(77,124,255,0.05)' },
  },
};