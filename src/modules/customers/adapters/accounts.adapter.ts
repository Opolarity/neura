import { PaginationState } from "@/shared/components/pagination/Pagination";
import { Account, AccountsApiResponse } from '../types/accounts.types';

export const accountsAdapter = (response: AccountsApiResponse) => {
    const formattedAccounts: Account[] = response.accountsdata.data.map((item): Account => {
        const nameParts = [
            item.name,
            item.middle_name,
            item.last_name,
            item.last_name2,
        ].filter(Boolean);

        return {
            id: item.id,
            fullName: nameParts.join(' '),
            documentNumber: item.document_number,
            typeName: item.types_name,
            show: item.show,
            documentTypeId: item.document_type_id,
            totalPurchases: item.total_purchases || 0,
            totalSpent: item.total_spent || 0,
        };
    });

    const pagination: PaginationState = {
        p_page: response.accountsdata.page.page,
        p_size: response.accountsdata.page.size,
        total: response.accountsdata.page.total,
    };

    return { data: formattedAccounts, pagination };
};
