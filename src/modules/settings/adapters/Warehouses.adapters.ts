import { PaginationState } from "@/shared/components/pagination/Pagination";
import { WarehousesApiResponse, WarehouseView, WarehousesFilters } from '../types/Warehouses.types'
export const WarehousesAdapter = (response: WarehousesApiResponse) => {
    // Deduplicate by ID to prevent React "same key" warning
    const uniqueMap = new Map();
    response.warehousesdata.data.forEach(item => {
        if (item && item.id && !uniqueMap.has(item.id)) {
            uniqueMap.set(item.id, item);
        }
    });

    const formattedWarehouses: WarehouseView[] = Array.from(uniqueMap.values()).map(
        (item: any) => ({
            id: item.id,
            name: item.name,
            branches: item.branches,
            countries: item.countries,
            states: item.states,
            cities: item.cities,
            neighborhoods: item.neighborhoods,
            web: item.web,
        })
    );

    const pagination: PaginationState = {
        p_page: response.warehousesdata.page.page,
        p_size: response.warehousesdata.page.size,
        total: response.warehousesdata.page.total,
    };

    return { data: formattedWarehouses, pagination };
};