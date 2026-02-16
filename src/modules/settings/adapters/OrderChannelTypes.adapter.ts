import { PaginationState } from "@/shared/components/pagination/Pagination";
import { OrderChannelTypesApiResponse } from "../types/OrderChannelTypes.types";

export const OrderChannelTypesAdapter = (
  response: OrderChannelTypesApiResponse,
) => {
  const { data, page } = response.productsdata;

  return {
    orderChannelTypes: data || [],
    pagination: {
      p_page: page?.page || 1,
      p_size: page?.size || 20,
      total: page?.total || 0,
    },
  };
};
