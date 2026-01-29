import { PaginationState } from "@/shared/components/pagination/Pagination";
import { BranchesApiResponse, Branch, BranchView } from '../types/Branches.types';

export type BranchListItem = Branch;
export const BranchesAdapter = (response: BranchesApiResponse) => {
    const formattedBranches: BranchView[] = response.branchesdata.data.map(
        (item) => ({
            id: item.id,
            name: item.name,
            warehouse: item.warehouse,
            countries: item.countries,
            states: item.states,
            cities: item.cities,
            neighborhoods: item.neighborhoods,
            address: item.address,
            address_reference: item.address_reference,
            is_active: item.is_active,
        })
    );

    const pagination: PaginationState = {
        p_page: response.branchesdata.page.page,
        p_size: response.branchesdata.page.size,
        total: response.branchesdata.page.total,
    };

    return { data: formattedBranches, pagination };
};
