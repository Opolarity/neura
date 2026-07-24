import { PaginationState } from "@/shared/components/pagination/Pagination";
import {
  Movements,
  MovementsApiResponse,
  MovementsTypes,
  MovementsTypesApiResponse,
  ProductSalesApiResponse,
  StockMovementDetail,
  StockMovementDetailApiResponse,
  UserSummaryApiResponse
} from "../types/Movements.types";

export const movementsAdapter = (response: MovementsApiResponse) => {
  const formattedMovements: Movements[] = response.movementsstock.data.map(
    (item) => ({
      movements_id: item.movements_id,
      movement_type: item.movement_type,
      date: item.date,
      user: item.user,
      vinc_id: item.vinc_id,
      stock_type: item.stock_type,
      warehouse: item.warehouse,
      quantity: item.quantity,
      variation: item.variation,
      vinc_warehouse: item.vinc_warehouse,
      vinc_stock_type: item.vinc_stock_type,
      product: item.product,
    }),
  );

  const pagination: PaginationState = {
    p_page: response.movementsstock.page.page,
    p_size: response.movementsstock.page.size,
    total: response.movementsstock.page.total,
  };

  return {
    data: formattedMovements,
    pagination,
  };
};

export const stockMovementDetailAdapter = (
  response: StockMovementDetailApiResponse,
): StockMovementDetail => {
  const { movement } = response;

  // La variación se muestra como "Talla L, Denim" — mismo criterio que sp_get_stock_movements
  const terms = (movement.variation?.variation_terms ?? [])
    .map((vt) => vt.term?.name)
    .filter((name): name is string => Boolean(name));

  const account = movement.created_by_profile?.account;
  const fullName = [account?.name, account?.last_name, account?.last_name2]
    .filter(Boolean)
    .join(" ")
    .trim();

  return {
    id: movement.id,
    quantity: movement.quantity,
    createdAt: movement.created_at,
    vinculatedMovementId: movement.vinculated_movement_id,
    movementType: movement.movement_type?.name ?? "—",
    stockType: movement.stock_type?.name ?? "—",
    warehouse: movement.warehouse?.name ?? "—",
    productTitle: movement.variation?.product?.title ?? "—",
    variationLabel: terms.length > 0 ? terms.join(", ") : "sin variación",
    sku: movement.variation?.sku ?? "—",
    user: fullName || movement.created_by_profile?.user_name || "—",
    links: response.links,
  };
};

export const movementsTypesAdapter = (
  response: MovementsTypesApiResponse[],
): MovementsTypes[] => {
  const first = response[0]; // el primer elemento del array
  const types = first.types.map((item) => ({
    id: item.id,
    name: item.name,
    code: item.code,
  }));
  return types;
};


// CREATE MOVEMENT 
export const getUserWarehouseAdapter = (
  response: UserSummaryApiResponse,
) => {
  return {
    warehouse_id: response.warehouse_id,
    warehouse_name: response.warehouses.name,
    account_name: response.accounts.name,
    account_last_name: response.accounts.last_name,
    account_last_name2: response.accounts.last_name2,
  };
};

export const getProductSalesAdapter = (
  response: ProductSalesApiResponse,
) => {
  const formattedProducts = response.data.map((item) => ({
    sku: item.sku,
    stock: item.stock,
    terms: item.terms,
    imageUrl: item.imageUrl,
    productId: item.productId,
    variationId: item.variationId,
    productTitle: item.productTitle,
  }));

  const pagination: PaginationState = {
    p_page: response.page.page,
    p_size: response.page.size,
    total: response.page.total,
  };
  return {
    data: formattedProducts,
    pagination,
  };
};
