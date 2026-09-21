import { QuotationListItemApi, QuotationListItem } from "../types/Quotations.types";

export const quotationListAdapter = (items: QuotationListItemApi[]): QuotationListItem[] => {
  return items.map((item) => ({
    id: item.id,
    description: item.subject,
    quantity: item.quantity,
    price: item.price,
    createdAt: item.created_at,
    supplierName: item.supplier_name?.trim() || "—",
    statusName: item.status_name ?? null,
  }));
};
