import * as XLSX from 'xlsx';
import { formatDateDisplay } from '@/shared/utils/date';
import type { ReturnsExportRow } from '../services/reports.service';

/**
 * Una fila por retorno, el mismo grano que las tarjetas: la cantidad de filas
 * es "Total devoluciones", la suma de "Reembolsado" es el KPI de monto y la de
 * "Unidades devueltas" es el de unidades.
 *
 * "Valor devuelto" NO es lo reembolsado: es el precio de lista de la mercadería
 * que volvió. Lo que se le devolvió al cliente sale de los movimientos de caja
 * del retorno, y en un cambio la diferencia puede ser cero o a favor del local.
 */
export function generateReturnsReportExcel(
  rows: ReturnsExportRow[],
  startDate: string,
  endDate: string,
): void {
  const headerRow = [
    'N° retorno',
    'Fecha del retorno',
    'N° pedido',
    'Fecha del pedido',
    'Cliente',
    'Documento',
    'Tipo',
    'Situación',
    'Motivo',
    'Sede',
    'Canal',
    'Productos devueltos',
    'Unidades devueltas',
    'Valor devuelto',
    'Reembolsado',
  ];

  const dataRows = rows.map((r) => [
    r.return_id,
    formatDateDisplay(r.return_date),
    r.order_id,
    r.order_date ? formatDateDisplay(r.order_date) : 'Sin fecha',
    r.customer_name,
    r.customer_document,
    r.return_type_name,
    r.situation_name,
    r.reason,
    r.branch_name,
    r.sale_type_name,
    r.products,
    r.units_returned,
    r.returned_value,
    r.refunded_amount,
  ]);

  const ws = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows]);

  ws['!cols'] = [
    { wch: 11 }, // N° retorno
    { wch: 17 }, // Fecha del retorno
    { wch: 11 }, // N° pedido
    { wch: 17 }, // Fecha del pedido
    { wch: 30 }, // Cliente
    { wch: 14 }, // Documento
    { wch: 18 }, // Tipo
    { wch: 12 }, // Situación
    { wch: 32 }, // Motivo
    { wch: 16 }, // Sede
    { wch: 20 }, // Canal
    { wch: 40 }, // Productos devueltos
    { wch: 18 }, // Unidades devueltas
    { wch: 15 }, // Valor devuelto
    { wch: 14 }, // Reembolsado
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Retornos');
  XLSX.writeFile(wb, `reporte-retornos-${startDate}-${endDate}.xlsx`);
}
