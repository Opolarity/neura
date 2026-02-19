export interface OrderChannelType {
  id: number;
  name: string;
  code: string | null;
  factura_serie_id: number;
  boleta_serie_id: number;
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
  factura_serie_id: number;
  boleta_serie_id: number;
  business_acount_id?: number | null;
  pos_sale_type: boolean;
  is_active: boolean;
  paymentMethods?: number[];
  warehouses?: number[];
}

export interface UpdateOrderChannelPayload extends CreateOrderChannelPayload {
  id: number;
}
