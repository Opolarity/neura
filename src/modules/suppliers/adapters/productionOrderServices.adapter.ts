import { LinkedService } from "../types/productionOrderServices.types";

const toTextOrNull = (value: unknown): string | null => {
  if (value === undefined || value === null || value === "") return null;
  return String(value);
};

/** Los numéricos de Postgres llegan como string por JSON. */
const toNumberOrNull = (value: unknown): number | null => {
  if (value === undefined || value === null || value === "") return null;
  return Number(value);
};

/** Bloque `services` de sp_get_production_order_by_id → modelo de UI. */
export const toLinkedService = (row: any): LinkedService => ({
  id: row.id,
  code: toTextOrNull(row.code),
  description: row.description ?? "",
  quotationId: row.quotation_id,
  quotationCode: toTextOrNull(row.quotation_code),
  quotationDescription: row.quotation_description ?? "",
  supplierName: row.supplier_name || "—",
  promisedDate: toTextOrNull(row.promised_date),
  situationId: toNumberOrNull(row.situation_id),
  situationName: toTextOrNull(row.situation_name),
  situationCode: toTextOrNull(row.situation_code),
  price: toNumberOrNull(row.price),
  canUnlink: Boolean(row.can_unlink),
});
