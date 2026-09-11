import { reportChartColors } from '../shared/reportChartUtils';

// Un color fijo por tipo, para que la dona y la tabla de al lado se lean igual
// sin importar el orden en que vengan.
export const RETURN_TYPE_COLORS: Record<string, string> = {
  'Devolución total': reportChartColors.rose,
  'Devolución parcial': reportChartColors.orange,
  Cambio: reportChartColors.blue,
};
const FALLBACK_COLORS = [reportChartColors.amber, reportChartColors.pink, reportChartColors.slate];

export function returnTypeColor(name: string, index: number): string {
  return RETURN_TYPE_COLORS[name] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}
