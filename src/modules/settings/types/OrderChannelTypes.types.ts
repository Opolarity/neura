export interface OrderChannelType {
  id: number;
  name: string;
  code: string | null;
  tax_serie_id: number;
  business_acount_id: number | null;
  pos_sale_type: boolean;
  is_active: boolean;
  created_at?: string;
}

export interface OrderChannelTypesFilters {
  page: number;
  size: number;
  search?: string;
}

export interface CreateOrderChannelPayload {
  name: string;
  code: string;
  tax_serie_id: number;
  business_acount_id?: number | null;
  pos_sale_type: boolean;
  is_active: boolean;
  paymentMethods?: number[];
}

export interface UpdateOrderChannelPayload extends CreateOrderChannelPayload {
  id: number;
}
