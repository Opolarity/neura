export interface WarehousesApiResponse {
    warehousesdata?: {
        data: Array<WarehouseView>;
        page: {
            page: number;
            size: number;
            total: number;
        };
    };
    warehouse?: Warehouses;
}

export interface WarehouseView {
    id: number;
    name: string;
    branches: { id: number; name: string }[];
    country_id?: number | null;
    countries?: string | null;
    states?: string | null;
    state_id?: number | null;
    cities?: string | null;
    city_id?: number | null;
    neighborhoods?: string | null;
    neighborhood_id?: number | null;
    address?: string;
    address_reference?: string;
    web?: boolean;
    is_active?: boolean;
}


export interface Warehouses {
    id: number;
    name: string;
    branches?: number;
    countries: number;
    states: number;
    cities: number | null;
    neighborhoods: number | null;
    address?: string;
    address_reference?: string;
    web?: boolean;
}

export interface WarehousesFilters {
    country?: number | null;
    state?: number | null;
    city?: number | null;
    neighborhoods?: number | null;
    branches?: string | null;
    page?: number;
    size?: number;
    search?: string | null;
}


export interface IdModalResponse {
    id: number,
    name: string,
}


