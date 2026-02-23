import { StockTypeApiResponse } from "../types/StockType.types";

export function getStockTypesAdapter(response: StockTypeApiResponse) {
  const formatted = response.data.map((item) => ({
    id: item.id,
    name: item.name,
  }));

  const page = {
    p_page: response.page.page,
    p_size: response.page.size,
    total: response.page.total,
  };

  return { data: formatted, pagination: page };
}
