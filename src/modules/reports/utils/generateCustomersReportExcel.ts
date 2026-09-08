import * as XLSX from 'xlsx';
import { formatDateDisplay } from '@/shared/utils/date';
import type { CustomerExportRow } from '../services/reports.service';

// Mismas etiquetas que LoyaltyDistributionChart, para que el archivo y la
// pantalla no nombren distinto al mismo nivel.
const LOYALTY_LABELS: Record<string, string> = {
  sin_nivel: 'Sin nivel',
  L1: 'Nivel 1 (150-749)',
  L2: 'Nivel 2 (750-1499)',
  L3: 'Nivel 3 (1500-2999)',
  L4: 'Nivel 4 (3000+)',
};

export function generateCustomersReportExcel(
  rows: CustomerExportRow[],
  startDate: string,
  endDate: string,
): void {
  const headerRow = [
    'Cliente',
    'Documento',
    'Tipo',
    'N° Pedidos',
    'Total Gastado',
    'Ticket Promedio',
    'Primera Compra',
    'Última Compra',
    'Nivel de Lealtad',
    'Puntos',
  ];

  const dataRows = rows.map((r) => [
    r.customer_name,
    r.document_number ?? '-',
    // Las ventas sin cliente identificable vienen agrupadas en una sola fila:
    // conviene que en la planilla se distinga de una persona real.
    r.is_anonymous ? 'Sin identificar' : r.has_account ? 'Con cuenta' : 'Sin cuenta',
    r.order_count,
    r.total_spent,
    r.avg_ticket,
    r.first_order ? formatDateDisplay(r.first_order) : '-',
    r.last_order ? formatDateDisplay(r.last_order) : '-',
    LOYALTY_LABELS[r.loyalty_level] ?? r.loyalty_level,
    r.loyalty_points ?? '-',
  ]);

  const ws = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows]);

  ws['!cols'] = [
    { wch: 36 }, // Cliente
    { wch: 16 }, // Documento
    { wch: 16 }, // Tipo
    { wch: 12 }, // N° Pedidos
    { wch: 16 }, // Total Gastado
    { wch: 16 }, // Ticket Promedio
    { wch: 16 }, // Primera Compra
    { wch: 16 }, // Última Compra
    { wch: 22 }, // Nivel de Lealtad
    { wch: 12 }, // Puntos
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Clientes');
  XLSX.writeFile(wb, `reporte-clientes-${startDate}-${endDate}.xlsx`);
}
