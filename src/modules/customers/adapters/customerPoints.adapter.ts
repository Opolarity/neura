import {
  CustomerPoint,
  CustomerPointApiRow,
  CustomerPointsMovement,
  CustomerPointsMovementApiRow,
} from "../types/customerPoints.types";

const buildFullName = (parts: (string | null | undefined)[]): string =>
  parts.filter(Boolean).join(" ") || "—";

export const customerPointsAdapter = (
  rows: CustomerPointApiRow[]
): CustomerPoint[] =>
  rows.map((row) => {
    const acc = row.accounts ?? ({} as CustomerPointApiRow["accounts"]);
    return {
      id: row.id,
      points: row.points,
      ordersQuantity: row.orders_quantity ?? 0,
      fullName: buildFullName([
        acc.name,
        acc.middle_name,
        acc.last_name,
        acc.last_name2,
      ]),
      documentNumber: acc.document_number ?? "—",
      documentType: acc.document_types?.name ?? "—",
      customerSince: acc.created_at ?? "",
      email: null,
    };
  });

export const customerPointsMovementsAdapter = (
  rows: CustomerPointsMovementApiRow[]
): CustomerPointsMovement[] =>
  rows.map((row) => {
    const acc = row.accounts ?? ({} as CustomerPointsMovementApiRow["accounts"]);
    return {
      id: row.id,
      quantity: row.quantity ?? 0,
      note: row.note ?? null,
      createdAt: row.created_at ?? "",
      fullName: buildFullName([
        acc.name,
        acc.middle_name,
        acc.last_name,
        acc.last_name2,
      ]),
      documentNumber: acc.document_number ?? "—",
    };
  });
