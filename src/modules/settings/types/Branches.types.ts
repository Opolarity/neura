export interface BranchesApiResponse {
    branchesdata: {
        data: Array<BranchView>;
        page: {
            page: number;
            size: number;
            total: number;
        };
    };
}

export interface BranchView {
    id: number;
    name: string;
    warehouse: string;
    countries: string;
    states: string;
    cities: string;
    neighborhoods: string | null;
    address?: string;
    address_reference?: string;
}

export interface Branch {
    id?: number;
    name: string;
    warehouse: number;
    countries: number;
    states: number;
    cities: number;
    neighborhoods?: number | null;
    address?: string;
    address_reference?: string;
}

export interface BranchesFilters {
    country?: number | null;
    state?: number | null;
    city?: number | null;
    neighborhood?: number | null;
    warehouse?: number | null;
    page?: number;
    size?: number;
    search?: string | null;
}

export interface IdNameResponse {
    id: number;
    name: string;
    warehouse_id?: number;
}
