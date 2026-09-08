import * as XLSX from 'xlsx';
import { formatDateDisplay } from '@/shared/utils/date';
import type { InventoryExportRow } from '../services/reports.service';

export function generateInventoryReportExcel(
  rows: InventoryExportRow[],
  fileLabel: string,
): void {
  const headerRow = [
    'SKU',
    'Producto',
    'Almacén',
    'Stock en almacén',
    'Stock total del SKU',
    'Stock bajo',
    'Costo unitario',
    'Valor a costo',
    'Precio unitario',
    'Valor a venta',
    'Último movimiento',
  ];

  const dataRows = rows.map((r) => [
    r.sku,
    r.product_title,
    r.warehouse_name,
    r.stock,
    r.stock_sku_total,
    // null = el umbral no está configurado, así que no se puede decidir.
    r.is_low_stock === null ? 'Sin umbral' : r.is_low_stock ? 'Sí' : 'No',
    r.unit_cost,
    r.cost_value,
    r.unit_price,
    r.retail_value,
    r.last_movement ? formatDateDisplay(r.last_movement) : 'Sin movimientos',
  ]);

  const ws = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows]);

  ws['!cols'] = [
    { wch: 16 }, // SKU
    { wch: 38 }, // Producto
    { wch: 16 }, // Almacén
    { wch: 16 }, // Stock en almacén
    { wch: 18 }, // Stock total del SKU
    { wch: 12 }, // Stock bajo
    { wch: 14 }, // Costo unitario
    { wch: 16 }, // Valor a costo
    { wch: 15 }, // Precio unitario
    { wch: 16 }, // Valor a venta
    { wch: 18 }, // Último movimiento
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Inventario');
  XLSX.writeFile(wb, `reporte-inventario-${fileLabel}.xlsx`);
}
