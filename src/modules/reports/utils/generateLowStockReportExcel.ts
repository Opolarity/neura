import * as XLSX from 'xlsx';
import type { LowStockProductItem } from '../types/reports.types';

/**
 * T-269 · Export de la bandeja de reposición.
 *
 * Las filas que recibe son las mismas que muestra la tabla: SKUs cuyo stock
 * efectivo (definición única — stock_type PRD, almacenes activos, producto y
 * variación activos) está entre 1 y el umbral global.
 */
export function generateLowStockReportExcel(
  rows: LowStockProductItem[],
  threshold: number,
  warehouseName: string | null,
): void {
  const wb = XLSX.utils.book_new();

  const header = ['Producto', 'SKU', 'Stock (unidades)'];
  const body = rows.map((r) => [r.product_title, r.sku ?? '', r.stock]);

  const meta = [
    ['Reporte', 'Productos bajo el umbral de stock'],
    ['Umbral (unidades)', threshold],
    ['Almacén', warehouseName ?? 'Todos los almacenes'],
    ['SKUs listados', rows.length],
    [],
  ];

  const ws = XLSX.utils.aoa_to_sheet([...meta, header, ...body]);
  ws['!cols'] = [{ wch: 45 }, { wch: 20 }, { wch: 18 }];

  XLSX.utils.book_append_sheet(wb, ws, 'Stock bajo');
  XLSX.writeFile(wb, `stock-bajo-${new Date().toISOString().slice(0, 10)}.xlsx`);
}
