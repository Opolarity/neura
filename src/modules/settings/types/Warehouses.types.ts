export interface WarehousesApiResponse {
    warehousesdata: {
        data: Array<{
            id: number;
            name: string;
            branches: number;
            countries: number;
            states: number;
            cities: number | null;
            neighborhoods: number | null;

        }>;
        page: {
            page: number;
            size: number;
            total: number;
        };
    };
}

export interface Warehouses {
    id: number;
    name: string;
    countries: number;
    states: number;
    cities: number | null;
    neighborhoods: number | null;
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


