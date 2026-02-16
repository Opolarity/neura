export interface OrderChannelTypesApiResponse {
  productsdata: {
    data: Array<{
      id: number;
      name: string;
      code: string;
      module_id?: number;
      module_code?: string;
      created_at?: string;
    }>;
    page: {
      page: number;
      size: number;
      total: number;
    };
  };
}
//eliminar este comentario
export interface OrderChannelTypesFilters {
  page: number;
  size: number;
  search?: string;
}

export interface CreateOrderChannelPayload {
  name: string;
  code: string;
  moduleID: number;
  moduleCode: string;
}
