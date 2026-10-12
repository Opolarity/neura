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
    // HTML del WysiwygEditor; las filas antiguas pueden traer texto plano.
    description?: string | null;
    // URL pública del bucket `payment-methods` (o externa en filas antiguas).
    image_url?: string | null;
    requires_voucher?: boolean;
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
    description?: string;
    // "" limpia la imagen; undefined la deja como está.
    image_url?: string;
    requires_voucher?: boolean;
    // Archivo nuevo elegido en el formulario: el hook lo sube antes de guardar.
    image?: File | null;
}
