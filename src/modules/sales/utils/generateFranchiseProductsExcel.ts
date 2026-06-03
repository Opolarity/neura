import * as XLSX from "xlsx";
import type {
  FranchisePaymentStatus,
  FranchiseProductRow,
  FranchiseProductsFilters,
  FranchiseSalesStatus,
  FranchiseSummary,
} from "../services/FranchiseProducts.service";

const PAYMENT_STATUS_LABELS: Record<FranchisePaymentStatus, string> = {
  paid: "Pagado",
  unpaid: "Sin pagar",
  partial: "Pagado parcialmente",
};

const SALES_STATUS_LABELS: Record<FranchiseSalesStatus, string> = {
  all: "Todos",
  with_sales: "Con ventas",
  without_sales: "Sin ventas",
};

const formatFilterDate = (value: string | undefined): string =>
  value || "Sin filtro";

const getPaymentStatusesLabel = (
  statuses: FranchisePaymentStatus[] | undefined,
): string => {
  if (!statuses) return "Sin filtro";
  if (statuses.length === 0) return "Sin filtro";
  if (statuses.length === Object.keys(PAYMENT_STATUS_LABELS).length) {
    return "Todos";
  }

  return statuses.map((status) => PAYMENT_STATUS_LABELS[status]).join(", ");
};

const getSalesStatusLabel = (
  status: FranchiseSalesStatus | undefined,
): string => {
  if (!status) return "Sin filtro";
  return SALES_STATUS_LABELS[status];
};

const roundMoney = (value: number): number => Number(value.toFixed(2));

export interface FranchiseProductsExcelData {
  rows: FranchiseProductRow[];
  summary: FranchiseSummary;
  filters: FranchiseProductsFilters;
}

export function generateFranchiseProductsExcel({
  rows,
  summary,
  filters,
}: FranchiseProductsExcelData): void {
  const filterRows = [
    ["Filtros aplicados"],
    ["Fecha desde", formatFilterDate(filters.date_from)],
    ["Fecha hasta", formatFilterDate(filters.date_to)],
    ["Estado de pago", getPaymentStatusesLabel(filters.payment_statuses)],
    ["Estado de venta", getSalesStatusLabel(filters.sales_status)],
    [],
  ];

  const summaryRows = [
    ["Montos"],
    ["Total enviado", roundMoney(summary.totalSent)],
    ["Total vendido", roundMoney(summary.totalSold)],
    ["Total pagado", roundMoney(summary.totalPaid)],
    ["Total por pagar", roundMoney(summary.totalPending)],
    [],
  ];

  const headerRow = [
    "Nombre del producto",
    "ID de la orden",
    "Cantidad",
    "Cantidad vendida",
    "Monto vendido",
    "Total pagado",
    "Total",
    "Franquiciado",
  ];

  const dataRows = rows.map((item) => [
    item.productName,
    item.orderId,
    item.quantity,
    item.soldByFranchise ?? 0,
    roundMoney(item.productPrice * (item.soldByFranchise ?? 0)),
    item.paidByFranchise ?? 0,
    roundMoney(item.total),
    item.franchiseName ?? "-",
  ]);

  const wsData = [...filterRows, ...summaryRows, headerRow, ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws["!cols"] = [
    { wch: 36 },
    { wch: 16 },
    { wch: 14 },
    { wch: 18 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 28 },
  ];

  const range = XLSX.utils.decode_range(ws["!ref"] ?? "A1:H1");
  for (let row = range.s.r; row <= range.e.r; row += 1) {
    for (let col = range.s.c; col <= range.e.c; col += 1) {
      const cell = ws[XLSX.utils.encode_cell({ r: row, c: col })];
      if (!cell || typeof cell.v !== "number") continue;

      if (row >= 1 && row <= 4 && col === 1) {
        cell.z = '"S/ "#,##0.00';
      }

      if (row >= filterRows.length + 1 && row <= filterRows.length + 4 && col === 1) {
        cell.z = '"S/ "#,##0.00';
      }

      if (row > filterRows.length + summaryRows.length) {
        if ([4, 5, 6].includes(col)) cell.z = '"S/ "#,##0.00';
        if ([2, 3].includes(col)) cell.z = "#,##0.##";
      }
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Ventas Franquiciados");

  const today = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `ventas-franquiciados-${today}.xlsx`);
}
