import * as XLSX from 'xlsx';

// Espejo exacto de lo que devuelve sp_rpt_export_products_by_product (desde la
// migración 31000910110000). Una fila por producto × SKU × sucursal × lista de
// precios: sucursal y lista son del pedido, no del producto, así que un mismo
// SKU vendido en dos sedes sale en dos filas. Marca, categorías y etiquetas
// son del producto y vienen ya concatenadas con coma cuando hay varias.
export interface ProductExportRow {
  product_id: number;
  product_title: string;
  sku: string;
  brand: string;
  categories: string;
  tags: string;
  branch_name: string;
  price_list_name: string;
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
  const productHeader = [
    'Producto',
    'SKU',
    'Marca',
    'Categorías',
    'Etiquetas',
    'Sucursal',
    'Lista de precios',
    'Cantidad',
    'Ingresos (S/)',
  ];
  const productRows = byProduct.map((r) => [
    r.product_title,
    r.sku,
    r.brand,
    r.categories,
    r.tags,
    r.branch_name,
    r.price_list_name,
    r.total_quantity,
    r.total_revenue,
  ]);
  const wsProducts = XLSX.utils.aoa_to_sheet([productHeader, ...productRows]);
  wsProducts['!cols'] = [
    { wch: 40 }, // Producto
    { wch: 18 }, // SKU
    { wch: 16 }, // Marca
    { wch: 44 }, // Categorías
    { wch: 24 }, // Etiquetas
    { wch: 18 }, // Sucursal
    { wch: 18 }, // Lista de precios
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
