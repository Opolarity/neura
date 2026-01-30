import { PaginationState } from "@/shared/components/pagination/Pagination";
import {
  Movements,
  MovementsApiResponse,
  MovementsTypes,
  MovementsTypesApiResponse,
} from "../types/Movements.types";
import {
  CMovementsProductsApiResponse,
  UserSummaryApiResponse,
} from "../types/CreateMovements.types";

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

export const cMovementsUserWarehouseAdapter = (
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

export const cMovementsProductsAdapter = (
  response: CMovementsProductsApiResponse,
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
