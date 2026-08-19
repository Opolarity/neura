import type { CSSProperties } from 'react';
import type { LoyaltyLevel } from '../../types/reports.types';

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
  violet: '#7a57f2', // Violeta --brand de la landing neura.pe
  slate: '#64748b',
  pink: '#db2777',
  fuchsia: '#c026d3',
};

// Serie cualitativa armada con los tokens de color de `index.css`, alternando
// familias de tono para que dos series contiguas nunca queden en el mismo
// color. Al ser tokens, en `.dark` se aclaran solos (los `-soft-foreground`
// invierten su luminosidad) sin declarar nada aparte.
// Ojo al reordenar: en `.dark` los pares primary/ring y
// muted-foreground/pending-foreground colapsan al mismo valor, por eso van
// separados varias posiciones y no contiguos.
export const chartQualitativeSeries = [
  'hsl(var(--success))', // verde
  'hsl(var(--primary))', // morado
  'hsl(var(--warning))', // ámbar
  'hsl(var(--info))', // azul
  'hsl(var(--destructive))', // rojo
  'hsl(var(--pending-foreground))', // gris oscuro
  'hsl(var(--success-soft-foreground))', // verde oscuro
  'hsl(var(--ring))', // morado claro
  'hsl(var(--warning-soft-foreground))', // ámbar oscuro
  'hsl(var(--muted-foreground))', // gris medio
  'hsl(var(--destructive-soft-foreground))', // rojo oscuro
];

/** Badge outline teñido con un color de `reportChartColors` (borde 20%, fondo 8%, texto pleno). */
export function chartBadgeStyle(color: string): CSSProperties {
  return { borderColor: `${color}33`, backgroundColor: `${color}14`, color };
}

/** Color por nivel de fidelización — fuente única para tabla y chart. */
export const loyaltyBadgeColors: Record<LoyaltyLevel, string> = {
  sin_nivel: reportChartColors.slate,
  L1: reportChartColors.sky,
  L2: reportChartColors.indigo,
  L3: reportChartColors.violet,
  L4: reportChartColors.amber,
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
