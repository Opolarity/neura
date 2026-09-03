import { buildEndpoint } from "@/shared/utils/query";
import { PaginationState } from "@/shared/components/pagination/Pagination";
import { invokeFunction } from "@/integrations/supabase/invokeFunction";

export type FranchiseProductRow = {
  id: number;
  productName: string;
  orderId: number;
  quantity: number;
  soldByFranchise: number | null;
  productPrice: number;
  paidByFranchise: number | null;
  // Pagado atribuido a las ventas del rango (FIFO en el SP). Solo tiene
  // sentido con filtro de fecha activo; sin filtro el pagado de la fila es
  // paidByFranchise.
  paidInRange: number;
  // Descuento acumulado por promociones de consignación (order_discounts
  // FCH-PROMO-%) sobre las unidades ya vendidas de esta línea.
  franchiseDiscount: number;
  soldAmount: number;
  // Ids de las órdenes del sistema del franquiciado que cubren esta línea; con
  // filtro de fecha activo, solo las del rango.
  franchiseOrderIds: string[];
  // Promociones de consignación que originaron franchiseDiscount.
  promoNames: string[];
  total: number;
  franchiseName: string | null;
  isFranchisee: boolean;
};

export type FranchiseProductsFilters = {
  page: number;
  size: number;
  search?: string;
  franchisee_only?: boolean;
  date_from?: string;
  date_to?: string;
  payment_statuses?: FranchisePaymentStatus[];
  sales_status?: FranchiseSalesStatus;
  account_ids?: number[];
  stock_status?: FranchiseStockStatus;
  order_id?: number;
  category_ids?: number[];
};

export type FranchisePaymentStatus = "paid" | "unpaid" | "partial";
export type FranchiseSalesStatus = "all" | "with_sales" | "without_sales";
/** pending = quedan unidades en la tienda del franquiciado; settled = ya vendió todo. */
export type FranchiseStockStatus = "all" | "pending" | "settled";

/**
 * Cuenta con consignaciones; alimenta el selector de franquiciado. El SP la
 * calcula sobre el universo completo (sin aplicar los filtros de la consulta)
 * para que la lista no cambie al filtrar.
 */
export type FranchiseeOption = {
  id: number;
  name: string;
  isFranchisee: boolean;
};

export type FranchiseSummary = {
  totalSent: number;
  // Neto: el SP ya descuenta las promociones de consignación. Cuando hay filtro
  // de fecha activo es lo vendido DENTRO del rango; si no, el acumulado.
  totalSold: number;
  // Con filtro de fecha activo, `totalPaid` y `totalPending` son la deuda
  // GLOBAL del franquiciado, no la del rango: los pagos no se pueden atribuir a
  // una venta concreta (el payload de pago no dice qué venta paga), así que
  // recortarlos por fecha daría un número sin significado. La pantalla los
  // rotula como globales.
  totalPaid: number;
  totalPending: number;
  totalPromoDiscount: number;
  // El rango filtra por fecha de venta y recorta las cantidades de cada fila,
  // pero los pagos no se pueden atribuir a una línea y una fecha
  // (order_payment guarda order_id, no order_product_id). Con esto la pantalla
  // sabe que debe rotular "pagado" y "por pagar" como acumulados.
  dateFilterActive: boolean;
};

export type FranchiseProductsResponse = {
  data: FranchiseProductRow[];
  pagination: PaginationState;
  summary: FranchiseSummary;
  franchisees: FranchiseeOption[];
};

type RawFranchiseProduct = {
  id: number;
  order_id: number;
  product_name: string;
  product_price: number | string | null;
  quantity: number | string | null;
  sold_by_franchise: number | string | null;
  paid_by_franchise: number | string | null;
  paid_in_range: number | string | null;
  franchise_discount: number | string | null;
  sold_amount: number | string | null;
  franchise_order_ids: string[] | null;
  promo_names: string[] | null;
  franchise_name: string | null;
  is_franchisee: boolean;
};

type RawFranchiseeOption = {
  id: number;
  name: string | null;
  is_franchisee: boolean;
};

const toNumber = (value: number | string | null | undefined): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const toNullableNumber = (
  value: number | string | null | undefined,
): number | null => {
  if (value === null || value === undefined || String(value).trim() === "")
    return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

/**
 * El SP devuelve arrays de text sin orden garantizado (p.ej. `{154,153}`): se
 * limpian y se ordenan numérico-aware para que el reporte salga estable.
 */
const toSortedList = (value: string[] | null | undefined): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item).trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
};

export const fetchFranchiseProducts = async (
  filters: FranchiseProductsFilters,
): Promise<FranchiseProductsResponse> => {
  const endpoint = buildEndpoint("get-franchise-products-list", {
    page: filters.page,
    size: filters.size,
    ...(filters.search ? { search: filters.search } : {}),
    ...(filters.franchisee_only ? { franchisee_only: true } : {}),
    ...(filters.date_from ? { date_from: filters.date_from } : {}),
    ...(filters.date_to ? { date_to: filters.date_to } : {}),
    ...(filters.payment_statuses?.length
      ? { payment_statuses: filters.payment_statuses.join(",") }
      : {}),
    ...(filters.sales_status ? { sales_status: filters.sales_status } : {}),
    ...(filters.account_ids?.length
      ? { account_ids: filters.account_ids.join(",") }
      : {}),
    ...(filters.stock_status ? { stock_status: filters.stock_status } : {}),
    ...(filters.order_id ? { order_id: filters.order_id } : {}),
    ...(filters.category_ids?.length
      ? { category_ids: filters.category_ids.join(",") }
      : {}),
  });

  const data = await invokeFunction(endpoint, {
    method: "GET",
  });

  const rows: FranchiseProductRow[] = ((data?.data ?? []) as RawFranchiseProduct[]).map(
    (item) => {
      const quantity = toNumber(item.quantity);
      const productPrice = toNumber(item.product_price);
      return {
        id: item.id,
        productName: item.product_name ?? "-",
        orderId: item.order_id,
        quantity,
        soldByFranchise: toNullableNumber(item.sold_by_franchise),
        productPrice,
        paidByFranchise: toNullableNumber(item.paid_by_franchise),
        paidInRange: toNumber(item.paid_in_range),
        franchiseDiscount: toNumber(item.franchise_discount),
        // Monto vendido valorizado por evento (cada venta a su precio). El SP
        // lo calcula; el front NO debe rehacer precio x cantidad, que
        // revalorizaria las ventas viejas al precio vigente de la linea.
        soldAmount: toNumber(item.sold_amount),
        franchiseOrderIds: toSortedList(item.franchise_order_ids),
        promoNames: toSortedList(item.promo_names),
        total: productPrice * quantity,
        franchiseName: item.franchise_name ?? null,
        isFranchisee: item.is_franchisee ?? false,
      };
    },
  );

  const pagination: PaginationState = {
    p_page: data?.page?.p_page ?? filters.page,
    p_size: data?.page?.p_size ?? filters.size,
    total: data?.page?.total ?? 0,
  };

  const totalSent = toNumber(data?.summary?.total_sent);
  // total_sold es SIEMPRE el acumulado de las líneas del resultado; el SP
  // expone aparte lo vendido dentro del rango.
  const totalSold = toNumber(data?.summary?.total_sold);
  const totalSoldRange = toNumber(data?.summary?.total_sold_range);
  const totalPaid = toNumber(data?.summary?.total_paid);
  const dateFilterActive = Boolean(data?.summary?.date_filter_active);
  // Deuda global del franquiciado, sin recorte de fechas.
  const totalSoldGlobal = toNumber(data?.summary?.total_sold_global);
  const totalPaidGlobal = toNumber(data?.summary?.total_paid_global);
  // Pagado atribuido a las ventas del rango (FIFO por línea en el SP): con
  // filtro activo, "por pagar" = vendido del rango - esto, el mismo número
  // que ve el franquiciado en su sistema.
  const totalPaidRange = toNumber(data?.summary?.total_paid_range);
  const totalPromoDiscount = toNumber(
    dateFilterActive
      ? data?.summary?.total_promo_discount_range
      : data?.summary?.total_promo_discount,
  );
  const summary: FranchiseSummary = {
    totalSent,
    totalSold: dateFilterActive ? totalSoldRange : totalSold,
    // Con filtro activo, pagado y por pagar son DEL RANGO: lo vendido en el
    // rango menos el pagado atribuido a esas ventas. Es lo que el usuario
    // espera al filtrar y coincide con la pantalla del franquiciado. (Antes
    // se mostró la deuda global rotulada, y antes de eso un híbrido sin
    // significado; ambos confundían.)
    totalPaid: dateFilterActive ? totalPaidRange : totalPaid,
    totalPending: dateFilterActive
      ? totalSoldRange - totalPaidRange
      : totalSold - totalPaid,
    totalPromoDiscount,
    dateFilterActive,
  };

  const franchisees: FranchiseeOption[] = (
    (data?.filters?.franchisees ?? []) as RawFranchiseeOption[]
  ).map((item) => ({
    id: item.id,
    name: item.name ?? "-",
    isFranchisee: item.is_franchisee ?? false,
  }));

  return { data: rows, pagination, summary, franchisees };
};
