interface ShippingData {
  data: Array<{
    id: number;
    name_shipping: string;
    min_cost: number | null;
    max_cost: number | null;
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
  minCost: number;
  maxCost: number;
  zones: string;
}

//LOCATION
export interface Countrie {
  id: number;
  name: string;
}

export interface State {
  id: number;
  name: string;
  country_id?: number;
}

export interface City {
  id: number;
  name: string;
  country_id?: number;
  state_id?: number;
}

export interface Neighborhood {
  id: number;
  name: string;
  country_id?: number;
  state_id?: number;
  city_id?: number;
}

//SHIPING CREATE
export interface ShippingCost {
  id: number;
  name: string;
  cost: number | "";
  country_id: number | null;
  state_id: number | null;
  city_id: number | null;
  neighborhood_id: number | null;
  states?: State[];
  cities?: City[];
  neighborhoods?: Neighborhood[];
}

export interface ShippingPayload {
  name: string;
  code: string;
  cost: Array<{
    name: string;
    cost: number;
    country_id: number | null;
    state_id: number | null;
    city_id: number | null;
    neighborhood_id: number | null;
  }>;
}

export interface ShippingEdit {
  id: number;
  name: string;
  code: string;
  costs: Array<{
    name: string;
    cost: number;
    country_id: number | null;
    state_id: number | null;
    city_id: number | null;
    neighborhood_id: number | null;
  }>;
}

export interface ShippingDetailsApiResponse {
  shipping_method: {
    id: number;
    name: string;
    code: string;
    shipping_costs: Array<{
      id: number;
      name: string;
      country_id: number | null;
      state_id: number | null;
      city_id: number | null;
      neighborhood_id: number | null;
      cost: number;
    }>;
  };
}

export interface ShippingDetails {
  id: number;
  name: string;
  code: string;
  costs: Array<{
    id: number;
    name: string;
    country_id: number | null;
    state_id: number | null;
    city_id: number | null;
    neighborhood_id: number | null;
    cost: number;
  }>;
}
