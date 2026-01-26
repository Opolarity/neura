import { PaginationState, Shipping, ShippingApiResponse } from "../types/Shipping.types";


export const shippingAdapter = (response?: ShippingApiResponse) => {
  const shippingdata = response?.shippingMethods;

  const formattedShipping: Shipping[] = (shippingdata?.data ?? [])
    .filter((item) => item.id !== 0) // Filtrar el item con id: 0 que parece ser un placeholder
    .map((item) => ({
      id: item.id,
      name: item.name_shipping,
      cost: item.cost ?? 0,
      zones: item.zones ?? '',
    }));

  const pagination: PaginationState = {
    p_page: shippingdata?.page?.page ?? 1,
    p_size: shippingdata?.page?.size ?? 20,
    total: shippingdata?.page?.total ?? 0,
  };

  return { shippings: formattedShipping, pagination };
};