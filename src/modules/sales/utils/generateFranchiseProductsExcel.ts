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

/** Celda de la hoja; `null` deja el hueco sin celda (fila de totales). */
type SheetCell = string | number | null;

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

  // "Total de venta (inicial)" es todo lo enviado en consignación valorizado al
  // precio de la orden de Overtake, antes de descuentos. Pagado y por pagar son
  // acumulados de la línea aunque haya filtro de fecha: los pagos se registran
  // por orden (order_payment.order_id) y no se pueden recortar a un rango.
  const summaryRows = [
    ["Montos"],
    ["Total de venta (inicial)", roundMoney(summary.totalSent)],
    ["Dscto. promociones", roundMoney(summary.totalPromoDiscount)],
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
    [],
    [],
  ];

  const headerRow = [
    "Nombre del producto",
    "Id orden (overtake)",
    "ID orden (franquiciado)",
    "Vendido por franquiciado",
    "Precio unitario",
    "Descuento",
    "Monto Desc.",
    "Total (por pagar)",
    "Franquiciado",
  ];

  let totalDiscount = 0;
  let totalDue = 0;

  const dataRows: SheetCell[][] = rows.map((item) => {
    const sold = item.soldByFranchise ?? 0;
    // Lo que el franquiciado debe por esta línea: lo vendido a precio de la
    // orden de Overtake, neto de la promoción de consignación.
    const due = item.productPrice * sold - item.franchiseDiscount;
    totalDiscount += item.franchiseDiscount;
    totalDue += due;

    return [
      item.productName,
      item.orderId,
      // Una línea puede tener varias ventas reportadas por el franquiciado.
      item.franchiseOrderIds.join(", ") || "-",
      sold,
      roundMoney(item.productPrice),
      item.promoNames.join(", ") || null,
      roundMoney(item.franchiseDiscount),
      roundMoney(due),
      item.franchiseName ?? "-",
    ];
  });

  // El export pide todas las páginas de una, así que estos totales son los del
  // reporte completo y cuadran con el bloque de montos.
  const totalRow: SheetCell[] = [
    "TOTAL",
    null,
    null,
    null,
    null,
    null,
    roundMoney(totalDiscount),
    roundMoney(totalDue),
    null,
  ];

  const wsData: SheetCell[][] = [
    ...filterRows,
    ...summaryRows,
    headerRow,
    ...dataRows,
    totalRow,
  ];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws["!cols"] = [
    { wch: 36 },
    { wch: 18 },
    { wch: 22 },
    { wch: 22.5 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
    { wch: 28 },
  ];

  const range = XLSX.utils.decode_range(ws["!ref"] ?? "A1:I1");
  for (let row = range.s.r; row <= range.e.r; row += 1) {
    for (let col = range.s.c; col <= range.e.c; col += 1) {
      const cell = ws[XLSX.utils.encode_cell({ r: row, c: col })];
      if (!cell || typeof cell.v !== "number") continue;

      // Las filas de filtros son todas texto: solo se formatean los montos.
      if (row >= filterRows.length + 1 && row <= filterRows.length + 4 && col === 1) {
        cell.z = '"S/ "#,##0.00';
      }

      if (row > filterRows.length + summaryRows.length) {
        // Precio unitario, Monto Desc. y Total (por pagar).
        if ([4, 6, 7].includes(col)) cell.z = '"S/ "#,##0.00';
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
