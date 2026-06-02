import { supabase } from "@/integrations/supabase/client";

type RawOrderProduct = {
  id: number;
  order_id: number;
  product_variation_id: number | null;
  product_name: string | null;
  product_price: number | string | null;
  quantity: number | string | null;
  received_by_franchise: number | string | null;
  sold_by_franchise: number | string | null;
  paid_by_franchise: number | string | null;
  orders:
    | {
        id: number;
        document_type: number | null;
        document_number: string | null;
      }
    | null;
  variations:
    | {
        products: { title: string | null } | null;
        variation_terms:
          | Array<{
              terms: { name: string | null } | null;
            }>
          | null;
      }
    | null;
};

type RawAccount = {
  document_type_id: number;
  document_number: string;
  name: string;
  tenant_reference: string | null;
};

export type FranchiseProductRow = {
  id: number;
  productName: string;
  orderId: number;
  quantity: number;
  soldByFranchise: number | null;
  productPrice: number;
  paidByFranchise: number | null;
  total: number;
  franchiseName: string | null;
  isFranchisee: boolean;
};

const PAGE_SIZE = 1000;
const ACCOUNT_BATCH_SIZE = 200;

const toNumber = (value: number | string | null | undefined): number => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

const toNullableNumber = (
  value: number | string | null | undefined,
): number | null => {
  if (value === null || value === undefined || String(value).trim() === "") {
    return null;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
};

const getAccountKey = (
  documentType: number | null | undefined,
  documentNumber: string | null | undefined,
): string | null => {
  const normalizedDocument = documentNumber?.trim();
  if (!documentType || !normalizedDocument) return null;

  return `${documentType}:${normalizedDocument}`;
};

const buildProductName = (item: RawOrderProduct): string => {
  const productTitle = item.variations?.products?.title?.trim();
  if (!productTitle) return item.product_name?.trim() || "-";

  const terms =
    item.variations?.variation_terms
      ?.map((variationTerm) => variationTerm.terms?.name?.trim())
      .filter((term): term is string => Boolean(term)) ?? [];

  if (!terms.length) return productTitle;

  return `${productTitle} (${terms.join(" - ")})`;
};

const fetchAllReceivedOrderProducts = async (): Promise<RawOrderProduct[]> => {
  const rows: RawOrderProduct[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await (supabase as any)
      .from("order_products")
      .select(
        `
          id,
          order_id,
          product_variation_id,
          product_name,
          product_price,
          quantity,
          received_by_franchise,
          sold_by_franchise,
          paid_by_franchise,
          orders!fk_order_products_order_id_orders_id (
            id,
            document_type,
            document_number
          ),
          variations!fk_order_products_product_variation_id_product_variations_id (
            products (
              title
            ),
            variation_terms (
              terms (
                name
              )
            )
          )
        `,
      )
      .not("received_by_franchise", "is", null)
      .order("order_id", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw error;

    const page = (data ?? []) as RawOrderProduct[];
    rows.push(
      ...page.filter(
        (item) => String(item.received_by_franchise ?? "").trim() !== "",
      ),
    );

    if (page.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return rows;
};

type AccountMaps = {
  names: Map<string, string>;
  isFranchisee: Map<string, boolean>;
};

const fetchAccountsByOrders = async (
  orderProducts: RawOrderProduct[],
): Promise<AccountMaps> => {
  const documentTypes = new Set<number>();
  const documentNumbers = new Set<string>();

  orderProducts.forEach((item) => {
    const documentType = item.orders?.document_type;
    const documentNumber = item.orders?.document_number?.trim();

    if (documentType && documentNumber) {
      documentTypes.add(documentType);
      documentNumbers.add(documentNumber);
    }
  });

  if (!documentTypes.size || !documentNumbers.size) {
    return { names: new Map(), isFranchisee: new Map() };
  }

  const accountRows: RawAccount[] = [];
  const documentNumberList = Array.from(documentNumbers);

  for (let i = 0; i < documentNumberList.length; i += ACCOUNT_BATCH_SIZE) {
    const { data, error } = await (supabase as any)
      .from("accounts")
      .select("document_type_id, document_number, name, tenant_reference")
      .in("document_type_id", Array.from(documentTypes))
      .in(
        "document_number",
        documentNumberList.slice(i, i + ACCOUNT_BATCH_SIZE),
      );

    if (error) throw error;
    accountRows.push(...((data ?? []) as RawAccount[]));
  }

  const names = new Map(
    accountRows
      .map((account) => [
        getAccountKey(account.document_type_id, account.document_number),
        account.name,
      ])
      .filter(([key]) => key !== null) as [string, string][],
  );

  const isFranchisee = new Map(
    accountRows
      .map((account) => [
        getAccountKey(account.document_type_id, account.document_number),
        account.tenant_reference != null,
      ])
      .filter(([key]) => key !== null) as [string, boolean][],
  );

  return { names, isFranchisee };
};

export const fetchFranchiseProducts = async (): Promise<
  FranchiseProductRow[]
> => {
  const orderProducts = await fetchAllReceivedOrderProducts();
  const { names: accountNames, isFranchisee: accountIsFranchisee } =
    await fetchAccountsByOrders(orderProducts);

  return orderProducts.map((item) => {
    const quantity = toNumber(item.quantity);
    const productPrice = toNumber(item.product_price);
    const accountKey = getAccountKey(
      item.orders?.document_type,
      item.orders?.document_number,
    );

    return {
      id: item.id,
      productName: buildProductName(item),
      orderId: item.order_id,
      quantity,
      soldByFranchise: toNullableNumber(item.sold_by_franchise),
      productPrice,
      paidByFranchise: toNullableNumber(item.paid_by_franchise),
      total: productPrice * quantity,
      franchiseName: accountKey ? accountNames.get(accountKey) ?? null : null,
      isFranchisee: accountKey
        ? (accountIsFranchisee.get(accountKey) ?? false)
        : false,
    };
  });
};
