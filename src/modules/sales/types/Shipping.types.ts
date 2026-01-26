
interface ShippingData {
   data: Array<{
    id: number;
    name_shipping: string;
    cost: number | null;
    zones: string | null;
  }>;
  page: {
    page: number;
    size: number;
    total: number;
  };
}

export interface ShippingApiResponse {
  shippingMethods: ShippingData;
}

export interface ShippingFilters {
  mincost?: number;
  maxcost?: number;
  countrie?: number;
  state?: number;
  city?: number;
  neighborhood?: number;
  order?: string;
  search?: string;
  page?: number;
  size?: number;
}

export interface Shipping {
    id: number;
    name: string;
    cost: number;
    zones: string;
}

export interface PaginationState {
  p_page: number | null;
  p_size: number | null;
  total: number | null;
}