export interface PriceListItem {
  id: number;
  name: string;
  code: string | null;
  location: number;
  web: boolean;
  created_at: string | null;
}

export interface PriceListApiResponse {
  productsdata: {
    data: Array<{
      id: number;
      web: boolean;
      code: string;
      name: string;
      location: number;
    }>;
    page: {
      page: number;
      size: number;
      total: number;
    };
  };
}

export interface PriceList {
  id: number;
  isWeb: boolean;
  code: string;
  name: string;
  location: number;
}

export interface PriceListFilters {
  page?: number;
  size?: number;
}

export interface PriceListPayload {
  id?: number;
  name: string;
  code: string;
  location?: string;
  web?: boolean;
}
