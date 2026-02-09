import {
  Shipping,
  ShippingApiResponse,
  ShippingDetails,
  ShippingDetailsApiResponse,
} from "../types/Shipping.types";
import { PaginationState } from "@/shared/components/pagination/Pagination";

export const shippingAdapter = (response?: ShippingApiResponse) => {
  const shippingdata = response?.shippingMethods;

  const formattedShipping: Shipping[] = (shippingdata?.data ?? []).map(
    (item) => ({
      id: item.id,
      name: item.name_shipping,
      cost: item.cost ?? 0,
      zones: item.zones ?? "",
    }),
  );

  const pagination: PaginationState = {
    p_page: shippingdata?.page?.page ?? 1,
    p_size: shippingdata?.page?.size ?? 20,
    total: shippingdata?.page?.total ?? 0,
  };

  return { shippings: formattedShipping, pagination };
};

export const shippingDetailsAdapter = (
  response?: ShippingDetailsApiResponse,
): ShippingDetails => {
  const shipping = response?.shipping_method;

  return {
    id: shipping?.id ?? 0,
    name: shipping?.name ?? "",
    code: shipping?.code ?? "",
    costs: Array.isArray(shipping?.shipping_costs)
      ? shipping!.shipping_costs.map((cost) => ({
          id: cost.id,
          name: cost.name,
          country_id: cost.country_id,
          state_id: cost.state_id,
          city_id: cost.city_id,
          neighborhood_id: cost.neighborhood_id,
          cost: cost.cost,
          states: [],
          cities: [],
          neighborhoods: [],
        }))
      : [],
  };
};
