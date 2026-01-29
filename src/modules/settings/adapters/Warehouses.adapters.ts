import { PaginationState } from "@/shared/components/pagination/Pagination";
import { WarehousesApiResponse, Warehouses, WarehousesFilters } from '../types/Warehouses.types'
export const WarehousesAdapter = (response: WarehousesApiResponse) => {
    const formattedWarehouses: Warehouses[] = response.warehousesdata.data.map(
        (item) => ({
            id: item.id,
            name: item.name,
            branches: item.branches,
            countries: item.countries,
            states: item.states,
            cities: item.cities,
            neighborhoods: item.neighborhoods,
        })
    );

    const pagination: PaginationState = {
        p_page: response.warehousesdata.page.page,
        p_size: response.warehousesdata.page.size,
        total: response.warehousesdata.page.total,
    };

    return { data: formattedWarehouses, pagination };
};