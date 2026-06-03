export const chartGrid = 'stroke-border/60';
export const chartAxis = 'text-xs fill-muted-foreground';

export const reportChartColors = {
  primary: 'hsl(var(--primary))',
  blue: '#2563eb',
  sky: '#0284c7',
  indigo: '#4f46e5',
  emerald: '#059669',
  teal: '#0d9488',
  cyan: '#0891b2',
  amber: '#d97706',
  orange: '#ea580c',
  rose: '#e11d48',
  violet: '#7c3aed',
  slate: '#64748b',
  pink: '#db2777',
  fuchsia: '#c026d3',
};

export function formatNumber(value: number | string) {
  return Number(value).toLocaleString('es-PE');
}

export function formatCurrencyAxis(value: number | string) {
  return `S/ ${Number(value).toLocaleString('es-PE')}`;
}

export function truncateLabel(value: string, length: number) {
  return value.length > length ? `${value.slice(0, length)}...` : value;
}
