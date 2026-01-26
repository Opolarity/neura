import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { PaginationState } from "@/shared/components/pagination/Pagination";
import { Account, AccountsFilters, AccountType } from '../types/accounts.types';
import { accountsAdapter } from '../adapters/accounts.adapter';
import { accountsApi, accountsTypesApi } from '../services/Account.services';


export const useAccounts = () => {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [pagination, setPagination] = useState<PaginationState>({
        p_page: 1,
        p_size: 20,
        total: 0,
    });
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [order, setOrder] = useState<string | null>(null);
    const [filters, setFilters] = useState<AccountsFilters>(
        {
            show: null,
            account_type: null,
            search: '',
            page: 1,
            size: 20,
        }
    );
    const [accountTypes, setAccountTypes] = useState<AccountType[]>([]);

    const fetchAccounts = useCallback(async () => {
        try {
            setLoading(true);
            const response = await accountsApi({
                ...filters,
                page: pagination.p_page,
                size: pagination.p_size,
            });

            console.log(response)

            const list = accountsAdapter(response);
            setAccounts(list.data);
            setPagination(list.pagination);
        } catch (error: any) {
            console.error(error);
            toast.error('Error al cargar cuentas');
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.p_page, pagination.p_size]);

    useEffect(() => {
        fetchAccounts();
    }, [fetchAccounts]);

    useEffect(() => {
        const fetchAccountTypes = async () => {
            try {
                const response = await accountsTypesApi();
                const allTypes: AccountType[] = [];

                response.forEach(item => {
                    if (Array.isArray(item.types)) {
                        allTypes.push(...item.types);
                    } else if (item.types) {
                        allTypes.push(item.types);
                    }
                });

                // Filter out any duplicates or types without ID
                const uniqueTypes = allTypes.filter((type, index, self) =>
                    type && type.id && self.findIndex(t => t.id === type.id) === index
                );

                setAccountTypes(uniqueTypes);
            } catch (error) {
                console.error('Error fetching account types:', error);
            }
        };
        fetchAccountTypes();
    }, []);

    const handleOrderChange = (value: string) => {
        const newFilters = { ...filters, order: value };
        setFilters(newFilters);
        setOrder(value);
    };
    const handleSearchChange = (value: string) => {
        setSearch(value);
        setFilters(prev => ({ ...prev, search: value, page: 1 }));
        setPagination(prev => ({ ...prev, p_page: 1 }));
    };

    const handlePageChange = (page: number) => {
        setPagination(prev => ({ ...prev, p_page: page }));
    };

    const handlePageSizeChange = (size: number) => {
        setPagination(prev => ({ ...prev, p_size: size, p_page: 1 }));
    };

    const handleFiltersChange = (newFilters: AccountsFilters) => {
        setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
        setPagination(prev => ({ ...prev, p_page: 1 }));
    };

    const clearFilters = () => {
        setFilters(
            {
                show: null,
                account_type: null,
                search: '',
                page: 1,
                size: 20,
            }
        );
        setSearch("");
        setPagination(prev => ({ ...prev, p_page: 1 }));
    };

    const hasActiveFilters =
        filters.show !== undefined && filters.show !== null ||
        filters.account_type !== undefined && filters.account_type !== null;

    return {
        accounts,
        pagination,
        loading,
        search,
        order,
        filters,
        hasActiveFilters,
        handleOrderChange,
        handleSearchChange,
        handleFiltersChange,
        handlePageChange,
        handlePageSizeChange,
        clearFilters,
        accountTypes,
        reload: fetchAccounts,
    };
};
