import * as XLSX from "xlsx";
import { format } from "date-fns";
import type { SalesReportRow } from "../services/reports.service";

export function generateSalesReportExcel(
  rows: SalesReportRow[],
  startDate: string,
  endDate: string
): void {
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
    r.order_date ? format(new Date(r.order_date), "dd/MM/yyyy HH:mm") : "-",
    r.shipping_method ?? "-",
    r.document_type ?? "-",
    r.document_number ?? "-",
    r.customer_name ?? "-",
    r.sale_type ?? "-",
    r.seller ?? "-",
    r.total,
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

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Ventas");
  XLSX.writeFile(wb, `reporte-ventas-${startDate}-${endDate}.xlsx`);
}
