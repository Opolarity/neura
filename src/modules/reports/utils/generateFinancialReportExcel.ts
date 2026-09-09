import * as XLSX from 'xlsx';
import { formatDateDisplay } from '@/shared/utils/date';
import type { FinancialMovementExportRow } from '../services/reports.service';
import type { MarginByProductItem } from '../types/reports.types';

/**
 * Excel de /reports/movements. Dos hojas porque la pestaña mide dos cosas
 * distintas y no se pueden mezclar en una grilla:
 *
 *   * "Movimientos" -- una fila por movimiento de caja. Las columnas Ingreso y
 *     Egreso suman exactamente las tarjetas de Ingresos y Egresos, porque
 *     clasifican por el signo del monto igual que el SP de los KPI.
 *   * "Margen por producto" -- una fila por producto, SIN el corte de 20 de la
 *     pantalla. Su costo y su margen suman las tarjetas de Costo Total y
 *     Ganancia Neta, que miden la misma población.
 */
export function generateFinancialReportExcel(
  movements: FinancialMovementExportRow[],
  margins: MarginByProductItem[],
  startDate: string,
  endDate: string,
): void {
  // ---------------------------------------------------------------
  // Hoja 1 — Movimientos
  // ---------------------------------------------------------------
  const movHeader = [
    'ID',
    'Fecha',
    'Código',
    'Ingreso/Egreso',
    'Tipo registrado',
    'Motivo',
    'Descripción',
    'Método de pago',
    'Cuenta',
    'Sede',
    'Usuario',
    'Monto',
    'Ingreso',
    'Egreso',
  ];

  const movRows = movements.map((m) => [
    m.movement_id,
    formatDateDisplay(m.movement_date),
    m.code ?? '-',
    m.direction,
    m.registered_type ?? '-',
    m.class_name,
    m.description ?? '-',
    m.payment_method ?? '-',
    m.business_account ?? '-',
    m.branch ?? '-',
    m.user_name ?? '-',
    m.amount,
    m.income,
    m.expense,
  ]);

  const wsMov = XLSX.utils.aoa_to_sheet([movHeader, ...movRows]);
  wsMov['!cols'] = [
    { wch: 8 },  // ID
    { wch: 12 }, // Fecha
    { wch: 12 }, // Código
    { wch: 15 }, // Ingreso/Egreso
    { wch: 16 }, // Tipo registrado
    { wch: 22 }, // Motivo
    { wch: 46 }, // Descripción
    { wch: 20 }, // Método de pago
    { wch: 26 }, // Cuenta
    { wch: 18 }, // Sede
    { wch: 20 }, // Usuario
    { wch: 14 }, // Monto
    { wch: 14 }, // Ingreso
    { wch: 14 }, // Egreso
  ];

  // ---------------------------------------------------------------
  // Hoja 2 — Margen por producto
  // ---------------------------------------------------------------
  const marginHeader = [
    'Producto',
    'Unidades vendidas',
    'Unidades con costo conocido',
    'Ingresos',
    'Costo',
    'Margen',
    'Margen %',
  ];

  // null = ninguna unidad del producto tiene costo cargado, así que no hay
  // margen que calcular. Se dice, no se rellena con cero.
  const marginRows = margins.map((p) => [
    p.product_title,
    p.units_sold,
    p.units_with_known_cost,
    p.revenue ?? 'Sin costo cargado',
    p.cost ?? 'Sin costo cargado',
    p.margin ?? 'Sin costo cargado',
    p.margin_pct ?? 'Sin costo cargado',
  ]);

  const wsMargin = XLSX.utils.aoa_to_sheet([marginHeader, ...marginRows]);
  wsMargin['!cols'] = [
    { wch: 42 }, // Producto
    { wch: 18 }, // Unidades vendidas
    { wch: 26 }, // Unidades con costo conocido
    { wch: 16 }, // Ingresos
    { wch: 16 }, // Costo
    { wch: 16 }, // Margen
    { wch: 12 }, // Margen %
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsMov, 'Movimientos');
  XLSX.utils.book_append_sheet(wb, wsMargin, 'Margen por producto');
  XLSX.writeFile(wb, `reporte-financiero-${startDate}-a-${endDate}.xlsx`);
}
