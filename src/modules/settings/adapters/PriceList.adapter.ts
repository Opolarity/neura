import { PriceListApiResponse } from "../types/PriceList.types";

export function getPriceListsAdapter(response: PriceListApiResponse) {
  const formated = response.productsdata.data.map((item) => ({
    id: item?.id,
    name: item?.name,
    code: item?.code,
    location: item?.location,
    isWeb: item?.web,
  }));

  const page = {
    p_page: response?.productsdata?.page?.page,
    p_size: response?.productsdata?.page?.size,
    total: response?.productsdata?.page?.total,
  };

  return { data: formated, pagination: page };
}
