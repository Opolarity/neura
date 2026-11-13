import * as XLSX from 'xlsx';
import { formatDateDisplay } from '@/shared/utils/date';
import { getPerformanceCoverage, partialCoverageNotice } from './priceRulePerformanceCoverage';
import type {
  PriceRulePerformance,
  PriceRuleReportRow,
  PriceRulesOther,
} from '../services/reports.service';

/**
 * El Excel sale del mismo payload que pinta la pantalla, no de un SP aparte:
 * la tabla de reglas entra entera en una sola respuesta, así que no hay forma
 * de que el archivo y la pantalla se separen.
 *
 * Trae TODAS las filas, sin el filtro Todas/Usadas/Activas/Inactivas de la
 * pestaña — ese recorta la vista, la descarga baja el listado completo — y
 * cierra con la línea de "Otros descuentos" para que el total del archivo
 * cuadre con todos los descuentos del período.
 *
 * T-1158: con `performance` suma dos hojas, "Desempeño por regla" y "Productos
 * por regla", con lo que el sistema registró por regla (desde el despliegue).
 */
export function generatePriceRulesReportExcel(
  rows: PriceRuleReportRow[],
  other: PriceRulesOther | undefined,
  startDate: string,
  endDate: string,
  performance?: PriceRulePerformance,
): void {
  const headerRow = [
    'Regla',
    'Código',
    'Tipo',
    'Estado',
    'Vigencia desde',
    'Vigencia hasta',
    'Aplicaciones',
    'Pedidos',
    'Venta de los pedidos',
    '% de uso',
  ];

  const dataRows: (string | number)[][] = rows.map((r) => [
    r.name,
    r.code ?? 'Sin código',
    r.rule_type === 'automatic' ? 'Automática' : 'Cupón',
    r.is_deleted ? 'Eliminada' : r.is_active ? 'Activa' : 'Inactiva',
    r.valid_from ? formatDateDisplay(r.valid_from) : 'Sin límite',
    r.valid_to ? formatDateDisplay(r.valid_to) : 'Sin límite',
    r.applications,
    r.orders,
    r.revenue,
    r.share,
  ]);

  if (other && other.applications > 0) {
    dataRows.push([
      'Otros descuentos (no vienen de una regla)',
      other.codes.join(', '),
      '',
      '',
      '',
      '',
      other.applications,
      other.orders,
      other.revenue,
      '',
    ]);
  }

  const ws = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows]);

  ws['!cols'] = [
    { wch: 40 }, // Regla
    { wch: 24 }, // Código
    { wch: 13 }, // Tipo
    { wch: 12 }, // Estado
    { wch: 15 }, // Vigencia desde
    { wch: 15 }, // Vigencia hasta
    { wch: 13 }, // Aplicaciones
    { wch: 10 }, // Pedidos
    { wch: 20 }, // Venta de los pedidos
    { wch: 10 }, // % de uso
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Reglas de precio');
  // Si el rango termina antes de la implementación no hay desempeño que exportar.
  if (performance) {
    const coverage = getPerformanceCoverage(performance.tracked_from, startDate, endDate);
    if (coverage.kind !== 'none') {
      appendPerformanceSheets(wb, performance, coverage.kind === 'partial' ? partialCoverageNotice(coverage) : null);
    }
  }
  XLSX.writeFile(wb, `reporte-reglas-precio-${startDate}-${endDate}.xlsx`);
}

/** T-1158: hojas de desempeño por regla y de productos vendidos con cada regla. */
function appendPerformanceSheets(
  wb: XLSX.WorkBook,
  performance: PriceRulePerformance,
  partialNotice: string | null,
): void {
  const since = performance.tracked_from
    ? `Solo ventas creadas desde el ${formatDateDisplay(performance.tracked_from)}, cuando empezó el registro por regla. Venta de la promoción es lo que pagaron las unidades de cada regla; sumada entre reglas no es el total vendido.`
    : 'Todavía no hay ventas con este detalle.';

  const rulesSheet = XLSX.utils.aoa_to_sheet([
    ...(partialNotice ? [[partialNotice]] : []),
    [since],
    [],
    [
      'Regla',
      'Código',
      'Estado',
      'Pedidos',
      'Unidades vendidas',
      'Unidades bonificadas',
      'Unidades regaladas',
      'Venta de la promoción',
      'Descuento otorgado',
      'Descuento en regalos',
      'Ahorro de envío',
      'Ticket promedio',
      'Productos',
    ],
    ...performance.rules.map((r) => [
      r.name,
      r.code ?? 'Sin código',
      r.is_deleted ? 'Eliminada' : r.is_active ? 'Activa' : 'Inactiva',
      r.orders,
      r.units,
      r.discounted_units,
      r.gift_units,
      r.sales,
      r.discount,
      r.gift_discount,
      r.shipping_discount,
      r.avg_ticket,
      r.products,
    ]),
  ]);
  rulesSheet['!cols'] = [
    { wch: 40 }, { wch: 24 }, { wch: 12 }, { wch: 10 }, { wch: 17 }, { wch: 20 }, { wch: 18 },
    { wch: 22 }, { wch: 18 }, { wch: 20 }, { wch: 16 }, { wch: 16 }, { wch: 11 },
  ];
  XLSX.utils.book_append_sheet(wb, rulesSheet, 'Desempeño por regla');

  const productsSheet = XLSX.utils.aoa_to_sheet([
    ['Regla', 'Producto', 'Variación', 'SKU', 'Tipo', 'Pedidos', 'Unidades', 'Unidades bonificadas', 'Venta de la promoción', 'Descuento'],
    ...performance.products.map((p) => [
      p.rule_name,
      p.product_name,
      p.variation_name ?? '',
      p.sku ?? '',
      p.is_gift ? 'Regalo' : 'Vendido',
      p.orders,
      p.units,
      p.discounted_units,
      p.is_gift ? 0 : p.sales,
      p.discount,
    ]),
    ...(performance.products_truncated
      ? [[], [`Lista recortada a los ${performance.products.length} productos con más unidades.`]]
      : []),
  ]);
  productsSheet['!cols'] = [
    { wch: 40 }, { wch: 40 }, { wch: 22 }, { wch: 18 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 20 }, { wch: 22 }, { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, productsSheet, 'Productos por regla');
}
