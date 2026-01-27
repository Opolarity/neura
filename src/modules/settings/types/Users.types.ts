export interface UsersApiResponse {
    usersdata: {
        data: Array<{
            id: number;
            name: string;
            role: string;
            show: boolean;
            role_id: number;
            branches: string;
            last_name: string;
            warehouse: string;
            created_at: string;
            last_name2: string;
            branches_id: number;
            middle_name: string;
            profiles_id: string;
            warehouse_id: number;
            document_number: string;
            document_type_id: number;
            type_name: string;
        }>;
        page: {
            page: number;
            size: number;
            total: number;
        }
    }
}

export interface Users {
    id: number;
    name: string;
    document_number: string;
    warehouse: string;
    branches: string;
    role: string;
    created_at: string;
    profiles_id: string;
}

export interface UsersFilters {
    person_type?: number | null;
    show?: number | null;
    role?: number | null;
    warehouses?: number | null;
    branches?: number;
    order?: string;
    search?: string | null;
    page?: number;
    size?: number;
}

export interface UsersFilterDraft {
    person_type?: number | null;
    show?: number | null;
    role?: number | null;
    warehouses?: number | null;
    branches?: number;
    order?: string;
}

export interface FilterOption {
    id: number;
    name: string;
    warehouse_id?: number;
}

export interface DocumentLookupPayload {
    documentType: string;
    documentNumber: string;
}

export interface DocumentLookupResponse {
    found: boolean;
    nombres: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    razonSocial?: string;
    error?: string;
}