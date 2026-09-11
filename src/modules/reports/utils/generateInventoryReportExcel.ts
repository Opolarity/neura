import * as XLSX from 'xlsx';
import { formatDateDisplay } from '@/shared/utils/date';
import type { InventoryExportRow } from '../services/reports.service';
import type { LowStockProductItem } from '../types/reports.types';

export function generateInventoryReportExcel(
  rows: InventoryExportRow[],
  lowStockRows: LowStockProductItem[],
  threshold: number | null,
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

  // ── Hoja 2: SKUs bajo el umbral ──────────────────────────
  // Misma definición que la bandeja de reposición y la alerta de la campana:
  // el stock es el total del SKU en almacenes activos, no el de un depósito.
  // Sin umbral configurado la hoja igual va, con el aviso, para que quien abre
  // el archivo entienda por qué está vacía.
  const lowHeader = ['Producto', 'SKU', 'Stock total (unidades)'];
  const lowRows = lowStockRows.map((r) => [r.product_title, r.sku ?? '', r.stock]);
  const lowMeta =
    threshold === null
      ? [['Umbral (unidades)', 'Sin configurar (Configuración → Negocio → Operación)'], []]
      : [['Umbral (unidades)', threshold], ['SKUs bajo el umbral', lowStockRows.length], []];
  const wsLow = XLSX.utils.aoa_to_sheet([...lowMeta, lowHeader, ...lowRows]);
  wsLow['!cols'] = [{ wch: 38 }, { wch: 16 }, { wch: 22 }];
  // Excel limita el nombre a 31 caracteres.
  const sheetName = threshold === null ? 'Umbral bajo stock' : `Umbral bajo stock (${threshold})`;
  XLSX.utils.book_append_sheet(wb, wsLow, sheetName.slice(0, 31));

  XLSX.writeFile(wb, `reporte-inventario-${fileLabel}.xlsx`);
}
