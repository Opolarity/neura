import * as XLSX from "xlsx";
import type {
  FranchisePaymentStatus,
  FranchiseProductRow,
  FranchiseProductsFilters,
  FranchiseSalesStatus,
  FranchiseStockStatus,
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

const STOCK_STATUS_LABELS: Record<FranchiseStockStatus, string> = {
  all: "Todos",
  pending: "Con stock en tienda",
  settled: "Vendido completo",
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

const getStockStatusLabel = (
  status: FranchiseStockStatus | undefined,
): string => {
  if (!status) return "Sin filtro";
  return STOCK_STATUS_LABELS[status];
};

const roundMoney = (value: number): number => Number(value.toFixed(2));

export interface FranchiseProductsExcelData {
  rows: FranchiseProductRow[];
  summary: FranchiseSummary;
  filters: FranchiseProductsFilters;
  /**
   * Nombres de lo que en `filters` viaja como ids, para rotular los filtros
   * aplicados con algo legible.
   */
  filterLabels?: {
    franchisees?: string;
    categories?: string;
  };
}

export function generateFranchiseProductsExcel({
  rows,
  summary,
  filters,
  filterLabels,
}: FranchiseProductsExcelData): void {
  const filterRows = [
    ["Filtros aplicados"],
    ["Franquiciado", filterLabels?.franchisees || "Todos"],
    ["Fecha de venta desde", formatFilterDate(filters.date_from)],
    ["Fecha de venta hasta", formatFilterDate(filters.date_to)],
    ["Estado de pago", getPaymentStatusesLabel(filters.payment_statuses)],
    ["Estado de venta", getSalesStatusLabel(filters.sales_status)],
    ["Stock en tienda", getStockStatusLabel(filters.stock_status)],
    ["N° de orden", filters.order_id ? `#${filters.order_id}` : "Todas"],
    ["Categoría", filterLabels?.categories || "Todas"],
    [],
  ];

  // Con filtro de fecha, "vendido" es lo del rango y "pagado"/"por pagar"
  // siguen siendo acumulados de la línea: se rotula igual que en la pantalla.
  const summaryRows = [
    ["Montos"],
    ["Total enviado", roundMoney(summary.totalSent)],
    [
      summary.dateFilterActive ? "Total vendido (en el rango)" : "Total vendido",
      roundMoney(summary.totalSold),
    ],
    [
      summary.dateFilterActive ? "Total pagado (acumulado)" : "Total pagado",
      roundMoney(summary.totalPaid),
    ],
    [
      summary.dateFilterActive
        ? "Total por pagar (acumulado)"
        : "Total por pagar",
      roundMoney(summary.totalPending),
    ],
    ["Dscto. promociones", roundMoney(summary.totalPromoDiscount)],
    [],
  ];

  // Mismo criterio que el bloque de montos: lo vendido se recorta al rango y
  // lo pagado/por pagar no, así que se rotula para que no se lean como pares.
  const headerRow = [
    "Nombre del producto",
    "Id orden (overtake)",
    "ID orden (franquiciado)",
    summary.dateFilterActive
      ? "Vendido por franquiciado (en el rango)"
      : "Vendido por franquiciado",
    "Precio de venta",
    summary.dateFilterActive ? "Descuento (en el rango)" : "Descuento",
    summary.dateFilterActive ? "Total (en el rango)" : "Total",
    summary.dateFilterActive ? "Pagado (acumulado)" : "Pagado",
    summary.dateFilterActive ? "Por pagar (acumulado)" : "Por pagar",
    "Franquiciado",
  ];

  const dataRows = rows.map((item) => {
    const sold = item.soldByFranchise ?? 0;
    const paid = item.paidByFranchise ?? 0;
    // Neto de promociones de consignación, sobre lo vendido del rango (o el
    // acumulado si no hay filtro de fecha).
    const total = item.productPrice * sold - item.franchiseDiscount;
    // Los pagos se registran por orden, no por línea ni por fecha: el pendiente
    // es siempre el acumulado de la línea. Así la columna suma exactamente el
    // "Total por pagar" del bloque de montos.
    const pending =
      item.productPrice * item.soldByFranchiseTotal -
      item.franchiseDiscountTotal -
      paid;

    return [
      item.productName,
      item.orderId,
      // Una línea puede tener varias ventas reportadas por el franquiciado.
      item.franchiseOrderIds.join(", ") || "-",
      sold,
      roundMoney(item.productPrice),
      roundMoney(item.franchiseDiscount),
      roundMoney(total),
      roundMoney(paid),
      roundMoney(pending),
      item.franchiseName ?? "-",
    ];
  });

  const wsData = [...filterRows, ...summaryRows, headerRow, ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws["!cols"] = [
    { wch: 36 },
    { wch: 18 },
    { wch: 22 },
    { wch: 26 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 28 },
  ];

  const range = XLSX.utils.decode_range(ws["!ref"] ?? "A1:J1");
  for (let row = range.s.r; row <= range.e.r; row += 1) {
    for (let col = range.s.c; col <= range.e.c; col += 1) {
      const cell = ws[XLSX.utils.encode_cell({ r: row, c: col })];
      if (!cell || typeof cell.v !== "number") continue;

      // Las filas de filtros son todas texto: solo se formatean los montos.
      if (row >= filterRows.length + 1 && row <= filterRows.length + 5 && col === 1) {
        cell.z = '"S/ "#,##0.00';
      }

      if (row > filterRows.length + summaryRows.length) {
        // Precio de venta, Descuento, Total, Pagado y Por pagar.
        if ([4, 5, 6, 7, 8].includes(col)) cell.z = '"S/ "#,##0.00';
        // Vendido por franquiciado.
        if (col === 3) cell.z = "#,##0.##";
      }
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Ventas Franquiciados");

  const today = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `ventas-franquiciados-${today}.xlsx`);
}
