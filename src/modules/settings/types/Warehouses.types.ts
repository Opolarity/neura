export interface WarehousesApiResponse {
    warehousesdata: {
        data: Array<WarehouseView>;
        page: {
            page: number;
            size: number;
            total: number;
        };
    };
}

// Interface for the List View (data comes joined with names)
export interface WarehouseView {
    id: number;
    name: string;
    branches: { id: number; name: string }[];
    countries: string; // Changed to string as per SQL query result (co.name)
    states: string;    // Changed to string (st.name)
    cities: string | null; // Changed to string (ci.name)
    neighborhoods: string | null; // Changed to string (ne.name)
    address?: string;
    address_reference?: string;
    web?: boolean;
}

// Interface for Creating/Editing (using IDs)
export interface Warehouses {
    id: number;
    name: string;
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


