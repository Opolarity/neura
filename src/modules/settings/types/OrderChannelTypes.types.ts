export interface OrderChannelType {
    id: number;
    name: string;
    code: string;
    module_id?: number;
    module_code?: string;
    created_at?: string;
}

export interface OrderChannelTypesApiResponse {
    productsdata: {
        data: OrderChannelType[];
        page: {
            page: number;
            size: number;
            total: number;
        };
    };
}

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
