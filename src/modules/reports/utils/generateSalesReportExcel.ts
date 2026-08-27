import * as XLSX from "xlsx";
import { formatDateTime } from "@/shared/utils/date";
import type {
  SalesReportRow,
  SalesDetailReportRow,
} from "../services/reports.service";

export function generateSalesReportExcel(
  rows: SalesReportRow[],
  detailRows: SalesDetailReportRow[],
  startDate: string,
  endDate: string
): void {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, buildSalesSheet(rows), "Ventas");
  XLSX.utils.book_append_sheet(
    wb,
    buildDetailSheet(detailRows),
    "Ventas Detalle"
  );
  XLSX.writeFile(wb, `reporte-ventas-${startDate}-${endDate}.xlsx`);
}

// ------------------------------------------------------------
// Hoja "Ventas" — una fila por orden
// ------------------------------------------------------------
function buildSalesSheet(rows: SalesReportRow[]): XLSX.WorkSheet {
  const headerRow = [
    "ID Orden",
    "Fecha",
    "Método de Envío",
    "Tipo Doc.",
    "N° Documento",
    "Nombre Cliente",
    "Canal de Venta",
    "Vendedor",
    "Total",
    "Cobrado",
    "Método de Pago",
    "Comprobante",
    "Estado",
    "Distrito",
    "Provincia",
    "Departamento",
    "Sucursal",
    "Almacén",
    "Lista de Precios",
    "Productos",
  ];

  const dataRows = rows.map((r) => [
    r.order_id,
    r.order_date ? formatDateTime(r.order_date) : "-",
    r.shipping_method ?? "-",
    r.document_type ?? "-",
    r.document_number ?? "-",
    r.customer_name ?? "-",
    r.sale_type ?? "-",
    r.seller ?? "-",
    r.total,
    r.paid_amount,
    r.payment_methods ?? "-",
    r.invoice ?? "-",
    r.situation ?? "-",
    r.district ?? "-",
    r.province ?? "-",
    r.department ?? "-",
    r.branch ?? "-",
    r.warehouse ?? "-",
    r.price_list ?? "-",
    r.products ?? "-",
  ]);

  const ws = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows]);

  ws["!cols"] = [
    { wch: 10 }, // ID Orden
    { wch: 18 }, // Fecha
    { wch: 22 }, // Método de Envío
    { wch: 12 }, // Tipo Doc.
    { wch: 15 }, // N° Documento
    { wch: 32 }, // Nombre Cliente
    { wch: 16 }, // Canal de Venta
    { wch: 24 }, // Vendedor
    { wch: 12 }, // Total
    { wch: 12 }, // Cobrado
    { wch: 34 }, // Método de Pago
    { wch: 18 }, // Comprobante
    { wch: 16 }, // Estado
    { wch: 18 }, // Distrito
    { wch: 18 }, // Provincia
    { wch: 18 }, // Departamento
    { wch: 20 }, // Sucursal
    { wch: 20 }, // Almacén
    { wch: 22 }, // Lista de Precios
    { wch: 65 }, // Productos
  ];

  return ws;
}

// ------------------------------------------------------------
// Hoja "Ventas Detalle" — una fila por item vendido
// ------------------------------------------------------------
function buildDetailSheet(rows: SalesDetailReportRow[]): XLSX.WorkSheet {
  const headerRow = [
    "ID Orden",
    "Fecha",
    "Nombre Cliente",
    "Canal de Venta",
    "Vendedor",
    "Estado",
    "Sucursal",
    "Comprobante",
    "Producto",
    "SKU",
    "Variación",
    "Cantidad",
    "Precio Unitario",
    // El descuento se guarda por linea completa, no por unidad: si la
    // cabecera dijera solo "Descuento" se leeria como unitario.
    "Descuento (línea)",
    "Total Línea",
    "Categorías",
    "Marca",
    "Etiquetas",
    // Es el costo con el que se registro la linea (order_products.unit_cost).
    // Solo si esa linea no lo tiene cae al costo vigente de la variacion.
    "Costo Unit.",
    "Costo Línea",
    "Margen Línea",
    "Margen %",
    "Almacén",
  ];

  // Nulo se pinta "-", igual que en la hoja "Ventas". Importa sobre todo
  // en costo y margen: un 0 es un valor valido y no debe confundirse con
  // "esta variacion no tiene costo cargado".
  const num = (v: number | null) => (v === null || v === undefined ? "-" : v);

  const dataRows = rows.map((r) => [
    r.order_id,
    r.order_date ? formatDateTime(r.order_date) : "-",
    r.customer_name ?? "-",
    r.sale_type ?? "-",
    r.seller ?? "-",
    r.situation ?? "-",
    r.branch ?? "-",
    r.invoice ?? "-",
    r.product_title ?? "-",
    r.sku ?? "-",
    r.variation ?? "-",
    r.quantity,
    r.unit_price,
    r.discount,
    r.line_total,
    r.categories ?? "-",
    r.brand ?? "-",
    r.tags ?? "-",
    num(r.unit_cost),
    num(r.line_cost),
    num(r.line_margin),
    num(r.margin_pct),
    r.warehouse ?? "-",
  ]);

  const ws = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows]);

  ws["!cols"] = [
    { wch: 10 }, // ID Orden
    { wch: 18 }, // Fecha
    { wch: 32 }, // Nombre Cliente
    { wch: 16 }, // Canal de Venta
    { wch: 24 }, // Vendedor
    { wch: 16 }, // Estado
    { wch: 20 }, // Sucursal
    { wch: 18 }, // Comprobante
    { wch: 42 }, // Producto
    { wch: 18 }, // SKU
    { wch: 22 }, // Variación
    { wch: 10 }, // Cantidad
    { wch: 15 }, // Precio Unitario
    { wch: 17 }, // Descuento (línea)
    { wch: 13 }, // Total Línea
    { wch: 40 }, // Categorías
    { wch: 20 }, // Marca
    { wch: 24 }, // Etiquetas
    { wch: 19 }, // Costo Unit.
    { wch: 13 }, // Costo Línea
    { wch: 14 }, // Margen Línea
    { wch: 11 }, // Margen %
    { wch: 20 }, // Almacén
  ];

  return ws;
}
