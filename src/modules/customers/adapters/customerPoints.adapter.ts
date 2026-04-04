import { PaginationState } from "@/shared/components/pagination/Pagination";
import {
  CustomerPoint,
  CustomerPointsApiResponse,
  CustomerPointsMovement,
  CustomerPointsMovementApiRow,
} from "../types/customerPoints.types";

const buildFullName = (parts: (string | null | undefined)[]): string =>
  parts.filter(Boolean).join(" ") || "—";

export const customerPointsAdapter = (response: CustomerPointsApiResponse) => {
  const data: CustomerPoint[] = response.data.map((row) => ({
    id: row.id,
    points: row.points,
    ordersQuantity: row.orders_quantity ?? 0,
    fullName: buildFullName([row.name, row.middle_name, row.last_name, row.last_name2]),
    documentNumber: row.document_number ?? "—",
    documentType: row.document_type_name ?? "—",
    customerSince: row.created_at ?? "",
    email: row.email ?? null,
  }));

  const pagination: PaginationState = {
    p_page: response.page.page,
    p_size: response.page.size,
    total: response.page.total,
  };

  return { data, pagination };
};

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
