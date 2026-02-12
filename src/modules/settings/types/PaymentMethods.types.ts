export interface PaymentMethodsApiResponse {
    page: {
        page: number;
        size: number;
        total: number;
    };
    data: PaymentMethod[];
}

export interface PaymentMethod {
    id: number;
    business_account_id: string;
    name: string;
    active: boolean;
}

export interface PaymentMethodsFilters {
    page: number;
    size: number;
    search?: string;
}
