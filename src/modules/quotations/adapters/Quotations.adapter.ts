import { QuotationListItemApi, QuotationListItem } from "../types/Quotations.types";

export const quotationListAdapter = (items: QuotationListItemApi[]): QuotationListItem[] => {
  return items.map((item) => ({
    id: item.id,
    code: item.code ?? null,
    situationCode: item.situation_code ?? null,
    situationName: item.situation_name ?? null,
    description: item.subject,
    quantity: item.quantity,
    price: item.price,
    createdAt: item.created_at,
    supplierName: item.supplier_name?.trim() || "—",
    statusName: item.status_name ?? null,
    statusCode: item.status_code ?? null,
    payable: Number(item.payable ?? 0),
    paid: Number(item.paid ?? 0),
    paymentStatus: item.payment_status ?? null,
  }));
};
