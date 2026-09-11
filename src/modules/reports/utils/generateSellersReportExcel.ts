import * as XLSX from 'xlsx';
import { formatDateDisplay } from '@/shared/utils/date';
import type { SellersOrderExportRow } from '../services/reports.service';
import type { SellerSummaryItem } from '../types/reports.types';

/**
 * Dos hojas con los filtros ya aplicados en la barra:
 * - "Por vendedor": una fila por vendedor (la misma tabla de la pantalla),
 *   con "Sin vendedor" al final.
 * - "Pedidos": un pedido por fila con su vendedor, para poder auditar quién
 *   registró cada venta. La suma de "Total" cuadra con la hoja anterior.
 */
export function generateSellersReportExcel(
  summary: SellerSummaryItem[],
  orders: SellersOrderExportRow[],
  startDate: string,
  endDate: string,
): void {
  const wb = XLSX.utils.book_new();

  // ── Hoja 1: Por vendedor ─────────────────────────────────
  const summaryHeader = [
    'Vendedor',
    'Sucursal (perfil)',
    'Pedidos',
    'Unidades',
    'Ventas (S/)',
    'Ticket promedio (S/)',
    'Participación (%)',
    'Primera venta',
    'Última venta',
  ];
  const sorted = [...summary].sort((a, b) => {
    if (a.seller_id === null) return 1;
    if (b.seller_id === null) return -1;
    return b.revenue - a.revenue;
  });
  const summaryRows = sorted.map((r) => [
    r.seller_id === null ? 'Sin vendedor (web / chatbot)' : r.seller_name,
    r.seller_id === null ? '-' : r.branch_name,
    r.orders,
    r.units,
    r.revenue,
    r.avg_ticket,
    r.share_pct ?? '-',
    r.first_order ? formatDateDisplay(r.first_order) : '-',
    r.last_order ? formatDateDisplay(r.last_order) : '-',
  ]);
  const wsSummary = XLSX.utils.aoa_to_sheet([summaryHeader, ...summaryRows]);
  wsSummary['!cols'] = [
    { wch: 34 }, { wch: 18 }, { wch: 10 }, { wch: 10 }, { wch: 14 }, { wch: 18 }, { wch: 16 }, { wch: 14 }, { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Por vendedor');

  // ── Hoja 2: Pedidos ──────────────────────────────────────
  const ordersHeader = [
    'N° pedido',
    'Fecha',
    'Vendedor',
    'Sucursal del vendedor',
    'Sucursal del pedido',
    'Canal',
    'Estado',
    'Cliente',
    'Unidades',
    'Total (S/)',
  ];
  const ordersRows = orders.map((r) => [
    r.order_id,
    formatDateDisplay(r.order_date),
    r.seller_name,
    r.seller_branch || '-',
    r.branch_name || '-',
    r.sale_type_name || '-',
    r.situation_name || '-',
    r.customer_name || '-',
    r.units,
    r.total,
  ]);
  const wsOrders = XLSX.utils.aoa_to_sheet([ordersHeader, ...ordersRows]);
  wsOrders['!cols'] = [
    { wch: 11 }, { wch: 12 }, { wch: 30 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 14 }, { wch: 30 }, { wch: 10 }, { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb, wsOrders, 'Pedidos');

  XLSX.writeFile(wb, `reporte-vendedores-${startDate}-${endDate}.xlsx`);
}
