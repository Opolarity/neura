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
    business_account_id: number;
    name: string;
    active: boolean;
    is_active: boolean;
    code: string | null;
}

export interface PaymentMethodsFilters {
    page: number;
    size: number;
    search?: string;
}

export interface PaymentMethodPayload {
    id?: number;
    name: string;
    // Opcional: en edición no viaja (la cuenta no se cambia desde el listado).
    business_account_id?: number | null;
    active: boolean;
}
