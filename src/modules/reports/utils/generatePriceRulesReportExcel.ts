import * as XLSX from 'xlsx';
import { formatDateDisplay } from '@/shared/utils/date';
import type { PriceRuleReportRow, PriceRulesOther } from '../services/reports.service';

/**
 * El Excel sale del mismo payload que pinta la pantalla, no de un SP aparte:
 * la tabla de reglas entra entera en una sola respuesta, así que no hay forma
 * de que el archivo y la pantalla se separen.
 *
 * Trae TODAS las filas, sin el filtro Todas/Usadas/Activas/Inactivas de la
 * pestaña — ese recorta la vista, la descarga baja el listado completo — y
 * cierra con la línea de "Otros descuentos" para que el total del archivo
 * cuadre con todos los descuentos del período.
 */
export function generatePriceRulesReportExcel(
  rows: PriceRuleReportRow[],
  other: PriceRulesOther | undefined,
  startDate: string,
  endDate: string,
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
    'Venta generada',
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
    { wch: 16 }, // Venta generada
    { wch: 10 }, // % de uso
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Reglas de precio');
  XLSX.writeFile(wb, `reporte-reglas-precio-${startDate}-${endDate}.xlsx`);
}
