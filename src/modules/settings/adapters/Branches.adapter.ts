import { PaginationState } from "@/shared/components/pagination/Pagination";
import { BranchesApiResponse, BranchView } from '../types/Branches.types';

export const BranchesAdapter = (response: BranchesApiResponse) => {
    // Deduplicate by ID to prevent React "same key" warning
    const uniqueMap = new Map();
    response.branchesdata.data.forEach(item => {
        if (!uniqueMap.has(item.id)) {
            uniqueMap.set(item.id, item);
        }
    });

    const formattedBranches: BranchView[] = Array.from(uniqueMap.values()).map(
        (item: any) => ({
            id: item.id,
            name: item.name,
            warehouse: item.warehouse,
            countries: item.countries,
            states: item.states,
            cities: item.cities,
            neighborhoods: item.neighborhoods,
            address: item.address,
            address_reference: item.address_reference,
        })
    );

    const pagination: PaginationState = {
        p_page: response.branchesdata.page.page,
        p_size: response.branchesdata.page.size,
        total: response.branchesdata.page.total,
    };

    return { data: formattedBranches, pagination };
};
