import { ProductionOrderPurchase } from "../types/productionOrderPurchases.types";

const num = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const textOrNull = (value: unknown): string | null => {
  if (value === undefined || value === null || value === "") return null;
  return String(value);
};

export const toProductionOrderPurchases = (
  rows: unknown,
): ProductionOrderPurchase[] =>
  (Array.isArray(rows) ? rows : []).map((row: Record<string, unknown>) => ({
    quotationId: num(row.quotation_id),
    quotationCode: textOrNull(row.quotation_code),
    quotationDescription: String(row.quotation_description ?? ""),
    quotationNotes: textOrNull(row.quotation_notes),
    // Lo pactado: rige los importes de la Orden de Compra.
    currency: textOrNull(row.currency),
    paymentTerms: textOrNull(row.payment_terms),
    supplierId: num(row.supplier_id),
    supplierName: String(row.supplier_name ?? ""),
    lines: num(row.lines),
    total: num(row.total),
    createdAt: String(row.created_at ?? ""),
  }));
