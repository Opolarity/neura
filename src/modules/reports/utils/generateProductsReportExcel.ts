import * as XLSX from 'xlsx';

export interface ProductExportRow {
  product_id: number;
  product_title: string;
  sku: string;
  category_name: string;
  total_quantity: number;
  total_revenue: number;
}

export interface CategoryExportRow {
  category_name: string;
  product_count: number;
  total_quantity: number;
  total_revenue: number;
}

export function generateProductsReportExcel(
  byProduct: ProductExportRow[],
  byCategory: CategoryExportRow[],
  startDate: string,
  endDate: string,
): void {
  const wb = XLSX.utils.book_new();

  // ── Hoja 1: Por producto ──────────────────────────────────
  const productHeader = ['Producto', 'SKU', 'Cantidad', 'Ingresos (S/)'];
  const productRows = byProduct.map((r) => [
    r.product_title,
    r.sku,
    r.total_quantity,
    r.total_revenue,
  ]);
  const wsProducts = XLSX.utils.aoa_to_sheet([productHeader, ...productRows]);
  wsProducts['!cols'] = [
    { wch: 40 }, // Producto
    { wch: 18 }, // SKU
    { wch: 12 }, // Cantidad
    { wch: 16 }, // Ingresos
  ];
  XLSX.utils.book_append_sheet(wb, wsProducts, 'Por Producto');

  // ── Hoja 2: Por categoría ─────────────────────────────────
  const categoryHeader = ['Categoría', 'N° Productos', 'Cantidad Total', 'Ingresos (S/)'];
  const categoryRows = byCategory.map((r) => [
    r.category_name,
    r.product_count,
    r.total_quantity,
    r.total_revenue,
  ]);
  const wsCategories = XLSX.utils.aoa_to_sheet([categoryHeader, ...categoryRows]);
  wsCategories['!cols'] = [
    { wch: 28 }, // Categoría
    { wch: 14 }, // N° Productos
    { wch: 16 }, // Cantidad Total
    { wch: 16 }, // Ingresos
  ];
  XLSX.utils.book_append_sheet(wb, wsCategories, 'Por Categoría');

  XLSX.writeFile(wb, `reporte-productos-${startDate}-${endDate}.xlsx`);
}
