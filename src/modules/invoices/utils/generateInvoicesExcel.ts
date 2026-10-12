import * as XLSX from "xlsx";
import { formatDateTime, getTodayDate } from "@/shared/utils/date";
import type { ActiveInvoiceFilters } from "../hooks/useInvoices";
import type { InvoiceItem } from "../types/Invoices.types";

/**
 * Listado de comprobantes tal como quedó filtrado en la vista. Serie y número
 * van como texto para no perder los ceros a la izquierda (00000040); el total
 * va como número, sin "S/", para que Excel pueda sumarlo. El estado sigue el
 * mismo criterio que la columna ESTADO de InvoicesTable.
 */
export function generateInvoicesExcel(
  rows: InvoiceItem[],
  filters: ActiveInvoiceFilters
): void {
  const headerRow = [
    "ID",
    "Tipo",
    "Serie",
    "Número",
    "Orden",
    "Cliente",
    "Documento",
    "Total (S/)",
    "Fecha",
    "Estado",
  ];

  const dataRows = rows.map((invoice) => [
    invoice.id,
    invoice.invoiceTypeName || "-",
    invoice.taxSerie || "-",
    invoice.invoiceNumber || "-",
    invoice.orderId ?? "-",
    invoice.clientName || "-",
    invoice.customerDocumentNumber || "-",
    Number(Number(invoice.totalAmount ?? 0).toFixed(2)),
    invoice.createdAt ? formatDateTime(invoice.createdAt) : "-",
    invoice.declared ? "Declarado" : "Pendiente",
  ]);

  const ws = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows]);

  ws["!cols"] = [
    { wch: 8 }, // ID
    { wch: 18 }, // Tipo
    { wch: 10 }, // Serie
    { wch: 12 }, // Número
    { wch: 10 }, // Orden
    { wch: 36 }, // Cliente
    { wch: 15 }, // Documento
    { wch: 12 }, // Total
    { wch: 20 }, // Fecha
    { wch: 12 }, // Estado
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Comprobantes");

  const range =
    filters.start_date && filters.end_date
      ? `${filters.start_date}-a-${filters.end_date}`
      : getTodayDate();
  XLSX.writeFile(wb, `comprobantes-${range}.xlsx`);
}
